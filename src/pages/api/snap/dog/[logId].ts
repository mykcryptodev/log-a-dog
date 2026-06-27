import { type NextApiRequest, type NextApiResponse } from "next";
import { z } from "zod";
import { encodeFunctionData, parseUnits } from "viem";
import { getContract } from "thirdweb";
import { base } from "thirdweb/chains";
import {
  ATTESTATION_MANAGER,
  HOTDOG_TOKEN,
  STAKING,
} from "~/constants/addresses";
import { db } from "~/server/db";
import { client, serverWallet } from "~/server/utils";
import { attestToLogOnBehalf, MINIMUM_ATTESTATION_STAKE, getAttestationPeriod } from "~/thirdweb/84532/0xe8c7efdb27480dafe18d49309f4a5e72bdb917d9";
import { canParticipateInAttestation } from "~/thirdweb/84532/0xe6b5534390596422d0e882453deed2afc74dae25";
import { getAttestationCounts } from "~/thirdweb/84532/0xc470f55c2877848f1acfcf3b656e01dce03e9ec3";
import { env } from "~/env";

const SNAP_CONTENT_TYPE = "application/vnd.farcaster.snap+json";
const CHAIN_ID = base.id; // 8453

// Minimum stake: 300,000 HOTDOG
const MINIMUM_STAKE_AMOUNT = parseUnits("300000", 18);

// ERC20 approve ABI fragment
const ERC20_APPROVE_ABI = {
  name: "approve",
  type: "function",
  inputs: [
    { name: "spender", type: "address" },
    { name: "amount", type: "uint256" },
  ],
} as const;

// HotdogStaking stake ABI fragment
const STAKING_STAKE_ABI = {
  name: "stake",
  type: "function",
  inputs: [{ name: "amount", type: "uint256" }],
} as const;

// Encode approve calldata: approve(stakingContract, MINIMUM_STAKE)
function encodeApproveCalldata(): `0x${string}` {
  return encodeFunctionData({
    abi: [ERC20_APPROVE_ABI],
    functionName: "approve",
    args: [STAKING[CHAIN_ID] as `0x${string}`, MINIMUM_STAKE_AMOUNT],
  });
}

// Encode stake calldata: stake(MINIMUM_STAKE)
function encodeStakeCalldata(): `0x${string}` {
  return encodeFunctionData({
    abi: [STAKING_STAKE_ABI],
    functionName: "stake",
    args: [MINIMUM_STAKE_AMOUNT],
  });
}

// Fetch the user's primary verified ETH address from Neynar by FID
async function resolveAddressFromFid(fid: number): Promise<string | null> {
  try {
    const response = await fetch(
      `https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`,
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": env.NEYNAR_API_KEY,
        },
      }
    );
    if (!response.ok) return null;
    const data = await response.json() as {
      users?: Array<{
        verified_addresses?: { eth_addresses?: string[] };
        custody_address?: string;
      }>;
    };
    const user = data.users?.[0];
    if (!user) return null;
    // Prefer verified addresses, fall back to custody address
    return (
      user.verified_addresses?.eth_addresses?.[0] ??
      user.custody_address ??
      null
    );
  } catch {
    return null;
  }
}

type AttestationPeriod = {
  startTime: string;
  endTime: string;
  status: number;
  totalValidStake: string;
  totalInvalidStake: string;
  isValid: boolean;
} | undefined;

// Resolve attestation period for a logId
async function fetchAttestationPeriod(logId: string): Promise<AttestationPeriod> {
  try {
    const attestationContract = getContract({
      address: ATTESTATION_MANAGER[CHAIN_ID]!,
      client,
      chain: base,
    });
    const period = await getAttestationPeriod({
      contract: attestationContract,
      logId: BigInt(logId),
    });
    return {
      startTime: period[0].toString(),
      endTime: period[1].toString(),
      status: Number(period[2]),
      totalValidStake: period[3].toString(),
      totalInvalidStake: period[4].toString(),
      isValid: Boolean(period[5]),
    };
  } catch {
    return undefined;
  }
}

// Fetch attestation counts (valid, invalid)
async function fetchAttestationCounts(logId: string): Promise<{ valid: string; invalid: string }> {
  try {
    const attestationContract = getContract({
      address: ATTESTATION_MANAGER[CHAIN_ID]!,
      client,
      chain: base,
    });
    const counts = await getAttestationCounts({
      contract: attestationContract,
      logIds: [BigInt(logId)],
    });
    return {
      valid: (counts[0]?.[0] ?? 0n).toString(),
      invalid: (counts[1]?.[0] ?? 0n).toString(),
    };
  } catch {
    return { valid: "0", invalid: "0" };
  }
}


type SnapElement = {
  type: string;
  props?: Record<string, unknown>;
  children?: string[];
  on?: Record<string, unknown>;
};

type SnapResponse = {
  version: "2.0";
  theme?: { accent: string };
  ui: {
    root: string;
    elements: Record<string, SnapElement>;
  };
};

// Force the www host. The apex (logadog.xyz) issues a Vercel platform 308 → www,
// and a redirect on the snap path breaks snap delivery (the snap server must be
// reached directly). Serving the snap + its in-snap POST/open_url targets from
// www avoids the 308 entirely. No-op on vercel.app / localhost.
const APP_URL = env.NEXT_PUBLIC_APP_URL.replace("://logadog.xyz", "://www.logadog.xyz");

function buildResolvedSnap(
  imageUri: string,
  logId: string,
  period: NonNullable<AttestationPeriod>
): SnapResponse {
  const verdict = period.isValid ? "✅ Valid Dog" : "❌ Not a Dog";
  const validNum = Number(BigInt(period.totalValidStake) / BigInt(1e18));
  const invalidNum = Number(BigInt(period.totalInvalidStake) / BigInt(1e18));
  const total = validNum + invalidNum || 1;

  return {
    version: "2.0",
    theme: { accent: "amber" },
    ui: {
      root: "page",
      elements: {
        page: {
          type: "stack",
          props: { direction: "vertical", gap: "sm" },
          children: ["dog_image", "verdict_badge", "vote_chart", "view_btn"],
        },
        dog_image: {
          type: "image",
          props: {
            url: imageUri,
            aspect: "1:1",
            alt: "Logged dog",
          },
        },
        verdict_badge: {
          type: "badge",
          props: {
            label: verdict,
            variant: "default",
            color: period.isValid ? "green" : "red",
          },
        },
        vote_chart: {
          type: "bar_chart",
          props: {
            bars: [
              { label: "Valid", value: (validNum / total) * 100, color: "green" },
              { label: "Not a dog", value: (invalidNum / total) * 100, color: "red" },
            ],
            max: 100,
          },
        },
        view_btn: {
          type: "button",
          props: { label: "View on Log a Dog", variant: "secondary" },
          on: {
            press: {
              action: "open_url",
              params: { target: `${APP_URL}/dog/${logId}` },
            },
          },
        },
      },
    },
  };
}

function buildVotingSnap(
  imageUri: string,
  logId: string,
  validCount: string,
  invalidCount: string,
  alreadyVoted?: boolean,
  userVote?: boolean
): SnapResponse {
  const validNum = Number(validCount);
  const invalidNum = Number(invalidCount);
  const total = validNum + invalidNum || 1;

  const statusText = alreadyVoted
    ? `You voted: ${userVote ? "✅ Valid" : "❌ Not a Dog"}`
    : "Vote on this dog!";

  return {
    version: "2.0",
    theme: { accent: "amber" },
    ui: {
      root: "page",
      elements: {
        page: {
          type: "stack",
          props: { direction: "vertical", gap: "sm" },
          children: ["dog_image", "status_text", "vote_chart", "vote_row"],
        },
        dog_image: {
          type: "image",
          props: {
            url: imageUri,
            aspect: "1:1",
            alt: "Logged dog",
          },
        },
        status_text: {
          type: "text",
          props: { content: statusText, weight: "bold", align: "center" },
        },
        vote_chart: {
          type: "bar_chart",
          props: {
            bars: [
              { label: `Valid (${validNum})`, value: (validNum / total) * 100, color: "green" },
              { label: `Not a dog (${invalidNum})`, value: (invalidNum / total) * 100, color: "red" },
            ],
            max: 100,
          },
        },
        vote_row: {
          type: "stack",
          props: { direction: "horizontal", gap: "sm", justify: "center" },
          children: ["valid_btn", "invalid_btn"],
        },
        valid_btn: {
          type: "button",
          props: { label: "✅ Valid Dog", variant: "primary" },
          on: {
            press: {
              action: "submit",
              params: { target: `${APP_URL}/api/snap/dog/${logId}?vote=valid` },
            },
          },
        },
        invalid_btn: {
          type: "button",
          props: { label: "❌ Not a Dog", variant: "secondary" },
          on: {
            press: {
              action: "submit",
              params: { target: `${APP_URL}/api/snap/dog/${logId}?vote=invalid` },
            },
          },
        },
      },
    },
  };
}

function buildNeedStakeSnap(logId: string): SnapResponse {
  const approveCalldata = encodeApproveCalldata();
  const stakeCalldata = encodeStakeCalldata();
  const hotdogAddress = HOTDOG_TOKEN[CHAIN_ID]!;
  const stakingAddress = STAKING[CHAIN_ID]!;

  return {
    version: "2.0",
    theme: { accent: "amber" },
    ui: {
      root: "pager",
      elements: {
        pager: {
          type: "paginator",
          props: {
            initialPage: 0,
            showIndicators: true,
            showControls: true,
            controlsPosition: "bottom",
            transition: "slide",
          },
          children: ["step0", "step1", "step2"],
        },

        // Step 0 — get HOTDOG
        step0: {
          type: "stack",
          props: { direction: "vertical", gap: "md" },
          children: ["step0_title", "step0_body", "get_hotdog_btn", "step0_next"],
        },
        step0_title: {
          type: "text",
          props: { content: "You need staked $HOTDOG to vote", weight: "bold", align: "center" },
        },
        step0_body: {
          type: "text",
          props: {
            content: "Minimum: 300,000 HOTDOG staked. Step 1 of 3: swap ETH for HOTDOG.",
            size: "sm",
            align: "center",
          },
        },
        get_hotdog_btn: {
          type: "button",
          props: { label: "🌭 Get HOTDOG", variant: "primary" },
          on: {
            press: {
              action: "swap_token",
              params: {
                sellToken: "eip155:8453/slip44:60",
                buyToken: `eip155:8453/erc20:${hotdogAddress}`,
              },
            },
          },
        },
        step0_next: {
          type: "button",
          props: { label: "I have HOTDOG →", variant: "secondary" },
          on: { press: { action: "paginator_next", params: {} } },
        },

        // Step 1 — approve
        step1: {
          type: "stack",
          props: { direction: "vertical", gap: "md" },
          children: ["step1_title", "step1_body", "approve_btn", "step1_next"],
        },
        step1_title: {
          type: "text",
          props: { content: "Step 2: Approve HOTDOG spending", weight: "bold", align: "center" },
        },
        step1_body: {
          type: "text",
          props: {
            content: "Allow the staking contract to receive your HOTDOG.",
            size: "sm",
            align: "center",
          },
        },
        approve_btn: {
          type: "button",
          props: { label: "Approve 300K HOTDOG", variant: "primary" },
          on: {
            press: {
              action: "send_transaction",
              params: {
                chainId: "eip155:8453",
                address: hotdogAddress,
                data: approveCalldata,
                value: "0x0",
              },
            },
          },
        },
        step1_next: {
          type: "button",
          props: { label: "Approved →", variant: "secondary" },
          on: { press: { action: "paginator_next", params: {} } },
        },

        // Step 2 — stake
        step2: {
          type: "stack",
          props: { direction: "vertical", gap: "md" },
          children: ["step2_title", "step2_body", "stake_btn", "back_to_vote_btn"],
        },
        step2_title: {
          type: "text",
          props: { content: "Step 3: Stake HOTDOG", weight: "bold", align: "center" },
        },
        step2_body: {
          type: "text",
          props: {
            content: "Stake 300,000 HOTDOG to unlock voting. You can unstake after 1 hour.",
            size: "sm",
            align: "center",
          },
        },
        stake_btn: {
          type: "button",
          props: { label: "Stake 300K HOTDOG", variant: "primary" },
          on: {
            press: {
              action: "send_transaction",
              params: {
                chainId: "eip155:8453",
                address: stakingAddress,
                data: stakeCalldata,
                value: "0x0",
              },
            },
          },
        },
        back_to_vote_btn: {
          type: "button",
          props: { label: "← Back to dog", variant: "secondary" },
          on: {
            press: {
              action: "open_url",
              params: { target: `${APP_URL}/dog/${logId}` },
            },
          },
        },
      },
    },
  };
}

function buildConfirmationSnap(
  imageUri: string,
  logId: string,
  isValid: boolean,
  validCount: string,
  invalidCount: string
): SnapResponse {
  const validNum = Number(validCount);
  const invalidNum = Number(invalidCount);
  const total = validNum + invalidNum || 1;

  return {
    version: "2.0",
    theme: { accent: "green" },
    ui: {
      root: "page",
      elements: {
        page: {
          type: "stack",
          props: { direction: "vertical", gap: "sm" },
          children: ["dog_image", "confirm_text", "vote_chart", "view_btn"],
        },
        dog_image: {
          type: "image",
          props: { url: imageUri, aspect: "1:1", alt: "Logged dog" },
        },
        confirm_text: {
          type: "text",
          props: {
            content: isValid ? "✅ Voted: Valid Dog!" : "❌ Voted: Not a Dog!",
            weight: "bold",
            align: "center",
          },
        },
        vote_chart: {
          type: "bar_chart",
          props: {
            bars: [
              { label: `Valid (${validNum})`, value: (validNum / total) * 100, color: "green" },
              { label: `Not a dog (${invalidNum})`, value: (invalidNum / total) * 100, color: "red" },
            ],
            max: 100,
          },
        },
        view_btn: {
          type: "button",
          props: { label: "View on Log a Dog", variant: "secondary" },
          on: {
            press: {
              action: "open_url",
              params: { target: `${APP_URL}/dog/${logId}` },
            },
          },
        },
      },
    },
  };
}

function buildPendingVerdictSnap(
  imageUri: string,
  logId: string,
  validCount: string,
  invalidCount: string
): SnapResponse {
  const validNum = Number(validCount);
  const invalidNum = Number(invalidCount);
  const total = validNum + invalidNum || 1;

  return {
    version: "2.0",
    theme: { accent: "amber" },
    ui: {
      root: "page",
      elements: {
        page: {
          type: "stack",
          props: { direction: "vertical", gap: "sm" },
          children: ["dog_image", "pending_text", "vote_chart", "view_btn"],
        },
        dog_image: {
          type: "image",
          props: { url: imageUri, aspect: "1:1", alt: "Logged dog" },
        },
        pending_text: {
          type: "text",
          props: {
            content: "⏳ Voting ended — verdict pending resolution",
            weight: "bold",
            align: "center",
          },
        },
        vote_chart: {
          type: "bar_chart",
          props: {
            bars: [
              { label: `Valid (${validNum})`, value: (validNum / total) * 100, color: "green" },
              { label: `Not a dog (${invalidNum})`, value: (invalidNum / total) * 100, color: "red" },
            ],
            max: 100,
          },
        },
        view_btn: {
          type: "button",
          props: { label: "View on Log a Dog", variant: "secondary" },
          on: {
            press: {
              action: "open_url",
              params: { target: `${APP_URL}/dog/${logId}` },
            },
          },
        },
      },
    },
  };
}

const logIdSchema = z.string().regex(/^\d+$/);

// Next's res.json() forces Content-Type: application/json, which a snap client
// does not recognize — the spec requires application/vnd.farcaster.snap+json.
// Serialize manually so the snap media type sticks on the response.
function sendSnap(res: NextApiResponse, snap: SnapResponse) {
  res.setHeader("Content-Type", SNAP_CONTENT_TYPE);
  res.setHeader("Vary", "Accept");
  res.setHeader("Access-Control-Allow-Origin", "*");
  return res.status(200).send(JSON.stringify(snap));
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const logIdParse = logIdSchema.safeParse(req.query.logId);
  if (!logIdParse.success) {
    return res.status(400).json({ error: "Invalid logId" });
  }
  const logId = logIdParse.data;

  // Serve the snap JSON on every GET — including plain (non-snap-Accept)
  // requests. Farcaster's cast scraper hits this endpoint WITHOUT the snap
  // Accept header (it followed our old 308 and got the 406), so it decides the
  // embed type from this plain-GET response. Per spec, a snap URL "must be
  // discoverable on a plain GET" and a client receiving Content-Type
  // application/vnd.farcaster.snap+json MUST render it as a snap. Redirecting
  // here (to the dog page's fc:frame) is what made it render as a Mini App.
  // All snap responses go through sendSnap(), which sets the snap media type.

  // Load dog from DB
  const dogEvent = await db.dogEvent.findFirst({
    where: { logId, chainId: CHAIN_ID.toString() },
  });

  if (!dogEvent) {
    return res.status(404).json({ error: "Dog not found" });
  }

  const imageUri = dogEvent.imageUri;

  const [period, counts] = await Promise.all([
    fetchAttestationPeriod(logId),
    fetchAttestationCounts(logId),
  ]);

  const now = Math.floor(Date.now() / 1000);

  // Branch 1: Resolved
  if (period && period.status !== 0) {
    return sendSnap(res, buildResolvedSnap(imageUri, logId, period));
  }

  // Branch 2/3: Voting period open or closed but unresolved
  const votingEnded = period && Number(period.endTime) > 0 && Number(period.endTime) < now;
  if (votingEnded) {
    return sendSnap(res, buildPendingVerdictSnap(imageUri, logId, counts.valid, counts.invalid));
  }

  // ---- POST: handle a vote submission ----
  if (req.method === "POST") {
    const voteParam = req.query.vote as string | undefined;
    const isValid = voteParam === "valid";

    // Parse FID from the snap POST body
    const body = req.body as {
      fid?: number;
      user?: { fid?: number };
    };
    const fid = body?.user?.fid ?? body?.fid;

    if (!fid) {
      // Anonymous — show need-stake guide as fallback
      return sendSnap(res, buildNeedStakeSnap(logId));
    }

    const userAddress = await resolveAddressFromFid(fid);
    if (!userAddress) {
      return sendSnap(res, buildNeedStakeSnap(logId));
    }

    // Check stake eligibility
    const attestationContract = getContract({
      address: ATTESTATION_MANAGER[CHAIN_ID]!,
      client,
      chain: base,
    });
    const minimumStake = await MINIMUM_ATTESTATION_STAKE({ contract: attestationContract });

    const canVote = await canParticipateInAttestation({
      contract: getContract({
        address: STAKING[CHAIN_ID]!,
        client,
        chain: base,
      }),
      user: userAddress,
      requiredStake: minimumStake,
    });

    if (!canVote) {
      return sendSnap(res, buildNeedStakeSnap(logId));
    }

    // Submit vote via server wallet (same path as hotdog.judge)
    try {
      const transaction = attestToLogOnBehalf({
        contract: attestationContract,
        logId: BigInt(logId),
        attestor: userAddress,
        isValid,
        stakeAmount: minimumStake,
      });
      await serverWallet.enqueueTransaction({ transaction });
    } catch (err) {
      console.error("Snap vote error:", err);
      // Still return confirmation — the tx may be in flight
    }

    // Optimistically show updated counts
    const updatedValid = isValid
      ? (Number(counts.valid) + 1).toString()
      : counts.valid;
    const updatedInvalid = !isValid
      ? (Number(counts.invalid) + 1).toString()
      : counts.invalid;

    return sendSnap(res, buildConfirmationSnap(imageUri, logId, isValid, updatedValid, updatedInvalid));
  }

  // GET — voting is open, show vote buttons (stake check happens on POST)
  return sendSnap(res, buildVotingSnap(imageUri, logId, counts.valid, counts.invalid));
}

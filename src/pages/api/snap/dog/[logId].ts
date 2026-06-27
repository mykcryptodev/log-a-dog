import { type NextApiRequest, type NextApiResponse } from "next";
import { z } from "zod";
import { parseRequest } from "@farcaster/snap/server";
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
import { getAttestationCounts, hasUserAttested, userAttestationChoices } from "~/thirdweb/84532/0xc470f55c2877848f1acfcf3b656e01dce03e9ec3";
import { env } from "~/env";

const SNAP_CONTENT_TYPE = "application/vnd.farcaster.snap+json";
const CHAIN_ID = base.id; // 8453

// Fetch ALL of the user's ETH addresses (verified + custody) from Neynar by FID.
// The user may have staked from any of them, so eligibility is checked across
// all, not just the first verified address.
async function resolveAddressesFromFid(fid: number): Promise<string[]> {
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
    if (!response.ok) return [];
    const data = await response.json() as {
      users?: Array<{
        verified_addresses?: { eth_addresses?: string[] };
        custody_address?: string;
      }>;
    };
    const user = data.users?.[0];
    if (!user) return [];
    const addrs = [
      ...(user.verified_addresses?.eth_addresses ?? []),
      ...(user.custody_address ? [user.custody_address] : []),
    ].map((a) => a.toLowerCase());
    return [...new Set(addrs)];
  } catch {
    return [];
  }
}

// Read the raw POST body (bodyParser is disabled so the JFS envelope arrives intact).
async function readRawBody(req: NextApiRequest): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : (chunk as Buffer));
  }
  return Buffer.concat(chunks).toString("utf8");
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
              action: "open_mini_app",
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
  _validCount: string,
  _invalidCount: string,
  alreadyVoted?: boolean,
  userVote?: boolean
): SnapResponse {
  // Vote counts are hidden while voting is open — revealed only after it ends.
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
          children: ["dog_image", "status_text", "vote_row"],
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
  const hotdogAddress = HOTDOG_TOKEN[CHAIN_ID]!;

  // Snaps support swap_token in-feed, but NOT arbitrary contract calls — there
  // is no send_transaction action, so ERC20 approve + stake() cannot run in the
  // feed. The "Get HOTDOG" swap works inline; approve + stake happen in the
  // mini app (full wallet) via open_mini_app → /earn.
  return {
    version: "2.0",
    theme: { accent: "amber" },
    ui: {
      root: "page",
      elements: {
        page: {
          type: "stack",
          props: { direction: "vertical", gap: "md" },
          children: ["title", "body", "get_hotdog_btn", "stake_btn", "back_to_vote_btn"],
        },
        title: {
          type: "text",
          props: { content: "You need staked $HOTDOG to vote", weight: "bold", align: "center" },
        },
        body: {
          type: "text",
          props: {
            content: "Voting requires 300,000 HOTDOG staked. Get HOTDOG below, then stake in the app to unlock voting.",
            size: "sm",
            align: "center",
          },
        },
        get_hotdog_btn: {
          type: "button",
          props: { label: "🌭 Get HOTDOG", variant: "secondary" },
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
        stake_btn: {
          type: "button",
          props: { label: "Stake to vote →", variant: "primary" },
          on: {
            press: {
              action: "open_mini_app",
              params: { target: `${APP_URL}/earn` },
            },
          },
        },
        back_to_vote_btn: {
          type: "button",
          props: { label: "← Back to dog", variant: "secondary" },
          on: {
            press: {
              action: "open_mini_app",
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
  _validCount: string,
  _invalidCount: string
): SnapResponse {
  // Vote counts are hidden while voting is open — revealed only after it ends.
  return {
    version: "2.0",
    theme: { accent: "green" },
    ui: {
      root: "page",
      elements: {
        page: {
          type: "stack",
          props: { direction: "vertical", gap: "sm" },
          children: ["dog_image", "confirm_text", "hidden_note", "view_btn"],
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
        hidden_note: {
          type: "text",
          props: {
            content: "Results are hidden until voting ends.",
            size: "sm",
            align: "center",
          },
        },
        view_btn: {
          type: "button",
          props: { label: "View on Log a Dog", variant: "secondary" },
          on: {
            press: {
              action: "open_mini_app",
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
  _validCount: string,
  _invalidCount: string
): SnapResponse {
  // Counts still hidden while awaiting on-chain resolution.
  return {
    version: "2.0",
    theme: { accent: "amber" },
    ui: {
      root: "page",
      elements: {
        page: {
          type: "stack",
          props: { direction: "vertical", gap: "sm" },
          children: ["dog_image", "pending_text", "view_btn"],
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
        view_btn: {
          type: "button",
          props: { label: "View on Log a Dog", variant: "secondary" },
          on: {
            press: {
              action: "open_mini_app",
              params: { target: `${APP_URL}/dog/${logId}` },
            },
          },
        },
      },
    },
  };
}

const logIdSchema = z.string().regex(/^\d+$/);

// Disable Next's body parser so POST receives the raw JFS envelope (a signed
// header.payload.signature string), not parsed/mangled JSON.
export const config = { api: { bodyParser: false } };

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

  // Snap image elements require an HTTPS url; dog images are stored as ipfs://.
  // Mirror the gateway conversion used by the OG endpoint (src/pages/api/og).
  const imageUri = dogEvent.imageUri.startsWith("ipfs://")
    ? `https://ipfs.io/ipfs/${dogEvent.imageUri.slice("ipfs://".length)}`
    : dogEvent.imageUri;

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

    // Verify the JFS-signed payload before voting. The server wallet casts the
    // vote on the user's behalf, so an unverified FID would be spoofable.
    // parseRequest checks the signature, that the signing key is an active
    // signer for the FID (via Farcaster hub), and the audience + timestamp.
    const rawBody = await readRawBody(req);
    const parsed = await parseRequest(
      new Request(`${APP_URL}/api/snap/dog/${logId}`, {
        method: "POST",
        headers: { "content-type": "text/plain" },
        body: rawBody,
      }),
      { requestOrigin: APP_URL },
    );

    if (!parsed.success) {
      console.warn("Snap vote rejected:", parsed.error.type);
      return sendSnap(res, buildNeedStakeSnap(logId));
    }
    // @farcaster/snap infers action types via zod 4; this repo is on zod 3, so
    // the inferred type degrades to `unknown`. Narrow to the fields we use.
    const action = parsed.action as { type: string; user: { fid: number } };
    if (action.type !== "post") {
      console.warn("Snap vote rejected: unexpected action", action.type);
      return sendSnap(res, buildNeedStakeSnap(logId));
    }

    const fid = action.user.fid;

    // Check stake eligibility across ALL the user's addresses (verified + custody).
    const attestationContract = getContract({
      address: ATTESTATION_MANAGER[CHAIN_ID]!,
      client,
      chain: base,
    });
    const stakingContract = getContract({
      address: STAKING[CHAIN_ID]!,
      client,
      chain: base,
    });
    const minimumStake = await MINIMUM_ATTESTATION_STAKE({ contract: attestationContract });

    const addresses = await resolveAddressesFromFid(fid);
    let eligibleAddress: string | undefined;
    for (const addr of addresses) {
      const canVote = await canParticipateInAttestation({
        contract: stakingContract,
        user: addr,
        requiredStake: minimumStake,
      });
      if (canVote) {
        eligibleAddress = addr;
        break;
      }
    }

    if (!eligibleAddress) {
      console.warn(`Snap vote: fid ${fid} not eligible (${addresses.length} addresses checked)`);
      return sendSnap(res, buildNeedStakeSnap(logId));
    }

    // Check if the user has already voted on this dog.
    // If they have, show their existing vote instead of double-submitting.
    const attestationCountsContract = getContract({
      address: ATTESTATION_MANAGER[CHAIN_ID]!,
      client,
      chain: base,
    });
    // We reuse attestationContract (same address); just import the helpers from 0xc470f55c
    // which shares the same ATTESTATION_MANAGER address.
    const alreadyVoted = await hasUserAttested({
      contract: attestationCountsContract,
      logId: BigInt(logId),
      user: eligibleAddress,
    });

    if (alreadyVoted) {
      const existingChoice = await userAttestationChoices({
        contract: attestationCountsContract,
        arg_0: eligibleAddress,
        arg_1: BigInt(logId),
      });
      console.log(`Snap vote: fid ${fid} already voted (${existingChoice ? 'valid' : 'invalid'}) on logId ${logId}`);
      return sendSnap(res, buildConfirmationSnap(imageUri, logId, existingChoice, counts.valid, counts.invalid));
    }

    // Submit vote via server wallet (same path as hotdog.judge)
    try {
      const transaction = attestToLogOnBehalf({
        contract: attestationContract,
        logId: BigInt(logId),
        attestor: eligibleAddress,
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

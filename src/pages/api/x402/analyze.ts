import { type NextApiRequest, type NextApiResponse } from "next";
import { getContract } from "thirdweb";
import { base } from "thirdweb/chains";
import { transfer } from "thirdweb/extensions/erc20";
import { createWalletAdapter, privateKeyToAccount } from "thirdweb/wallets";
import {
  facilitator,
  settlePayment,
  verifyPayment,
  wrapFetchWithPayment,
} from "thirdweb/x402";
import { z } from "zod";

import {
  ATTESTATION_MANAGER,
  HOTDOG_TOKEN,
  LOG_A_DOG,
  STAKING,
} from "~/constants/addresses";
import {
  SURPLUS_INFERENCE_URL,
  SURPLUS_MODEL,
  X402_ANALYSIS_PRICE_USD,
  X402_INFERENCE_MAX_USDC,
  X402_PAYOUT_MULTIPLIER,
} from "~/constants";
import { env } from "~/env";
import { client, serverWallet } from "~/server/utils";
import {
  computeHotdogPayoutWei,
  getHotdogPrice,
} from "~/server/utils/hotdogPrice";
import { redis } from "~/server/utils/redis";
import { getHotdogLog } from "~/thirdweb/8453/0x6cfb88c8d0d7ffc563155e13c62b4fa17bc25974";
import {
  attestToLogOnBehalf,
  hasUserAttested,
  MINIMUM_ATTESTATION_STAKE,
} from "~/thirdweb/84532/0xe8c7efdb27480dafe18d49309f4a5e72bdb917d9";
import { canParticipateInAttestation } from "~/thirdweb/84532/0xe6b5534390596422d0e882453deed2afc74dae25";

// Only Base mainnet is supported for paid analysis (where $HOTDOG / USDC live).
const ANALYSIS_CHAIN = base;

// Lock TTL: long enough to cover inference + on-chain enqueue, short enough to
// auto-heal if the process dies mid-analysis.
const LOCK_TTL_SECONDS = 180;
// Once a log has been analyzed we remember it so repeat callers are rejected
// immediately (before the on-chain vote has even confirmed).
const ANALYZED_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

const requestSchema = z.object({
  logId: z.string().regex(/^\d+$/, "logId must be a numeric string"),
});

const lockKey = (logId: string) => `x402:analyze:lock:${ANALYSIS_CHAIN.id}:${logId}`;
const analyzedKey = (logId: string) =>
  `x402:analyze:done:${ANALYSIS_CHAIN.id}:${logId}`;

/** First non-array value of a (possibly repeated) header. */
function headerValue(value: string | string[] | undefined): string | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

/** Apply x402 response headers (Next has no Express-style `res.set`). */
function applyHeaders(
  res: NextApiResponse,
  headers: Record<string, string>,
): void {
  Object.entries(headers).forEach(([key, value]) => res.setHeader(key, value));
}

function ipfsToHttp(uri: string): string {
  if (uri.startsWith("ipfs://")) {
    return uri.replace("ipfs://", "https://ipfs.io/ipfs/");
  }
  return uri;
}

// Minimal AsyncStorage shape accepted by `wrapFetchWithPayment`'s `storage`
// option (avoids depending on thirdweb's internal type path).
interface KeyValueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

/** In-memory storage so x402 client signing never touches `localStorage`. */
function memoryStorage(): KeyValueStorage {
  const store = new Map<string, string>();
  return {
    getItem: (key) => Promise.resolve(store.get(key) ?? null),
    setItem: (key, value) => {
      store.set(key, value);
      return Promise.resolve();
    },
    removeItem: (key) => {
      store.delete(key);
      return Promise.resolve();
    },
  };
}

/**
 * Ask "Surplus Intelligence" (paid per-call via x402) whether the image shows a
 * person eating or displaying a hotdog. Returns true for YES, false for NO.
 */
async function askIsHotdog(imageUrl: string): Promise<boolean> {
  const account = privateKeyToAccount({
    client,
    privateKey: env.ADMIN_PRIVATE_KEY,
  });
  const wallet = createWalletAdapter({
    client,
    adaptedAccount: account,
    chain: ANALYSIS_CHAIN,
    onDisconnect: () => {
      /* no-op: ephemeral server-side wallet */
    },
    switchChain: () => {
      /* no-op: single-chain (Base) inference payments */
    },
  });

  const fetchWithPayment = wrapFetchWithPayment(globalThis.fetch, client, wallet, {
    maxValue: X402_INFERENCE_MAX_USDC,
    storage: memoryStorage(),
  });

  const response = await fetchWithPayment(SURPLUS_INFERENCE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: SURPLUS_MODEL,
      max_tokens: 5,
      temperature: 0,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "You are moderating a hotdog-eating contest. Look at the image. Is it a photo of a person eating or displaying a hotdog? Answer with a single word: YES or NO.",
            },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Inference request failed (${response.status}): ${detail.slice(0, 300)}`,
    );
  }

  const body = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const answer = body.choices?.[0]?.message?.content?.trim() ?? "";
  if (!answer) {
    throw new Error("Inference returned an empty answer");
  }
  // YES => valid hotdog; anything else (NO / unclear) => sus.
  return /\byes\b/i.test(answer);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: "Invalid request", issues: parsed.error.issues });
  }
  const { logId } = parsed.data;
  const chainId = ANALYSIS_CHAIN.id;

  const attestationContract = getContract({
    client,
    chain: ANALYSIS_CHAIN,
    address: ATTESTATION_MANAGER[chainId]!,
  });
  // The backend server wallet is the AI judge identity that casts the vote.
  const aiJudge = env.NEXT_PUBLIC_THIRDWEB_SERVER_WALLET_ADDRESS;

  // --- Step 2 (pre-payment): reject locked / already-analyzed logs WITHOUT
  // issuing a 402, so the caller is never asked to pay. ----------------------
  try {
    const [alreadyDoneMarker, alreadyVoted] = await Promise.all([
      redis.get(analyzedKey(logId)),
      hasUserAttested({ contract: attestationContract, logId: BigInt(logId), user: aiJudge }),
    ]);
    if (alreadyDoneMarker || alreadyVoted) {
      return res
        .status(409)
        .json({ error: "This dog has already been analyzed", logId });
    }
    if (await redis.get(lockKey(logId))) {
      return res
        .status(409)
        .json({ error: "An analysis for this dog is already in progress", logId });
    }
  } catch (error) {
    console.error("x402/analyze pre-check failed:", error);
    return res.status(500).json({ error: "Failed to check analysis status" });
  }

  // --- x402: build payment args shared by verify + settle -------------------
  const host = headerValue(req.headers["x-forwarded-host"]) ?? req.headers.host;
  const proto = headerValue(req.headers["x-forwarded-proto"]) ?? "https";
  const resourceUrl = `${proto}://${host}${req.url}`;
  const paymentData =
    headerValue(req.headers["x-payment"]) ??
    headerValue(req.headers["payment-signature"]);

  const thirdwebFacilitator = facilitator({
    client,
    serverWalletAddress: aiJudge,
    vaultAccessToken: env.THIRDWEB_SERVER_WALLET_VAULT_ACCESS_TOKEN,
  });

  const paymentArgs = {
    resourceUrl,
    method: "POST" as const,
    paymentData,
    network: ANALYSIS_CHAIN,
    // USDC paid to the reserve wallet (also the facilitator / payout wallet).
    payTo: aiJudge,
    price: X402_ANALYSIS_PRICE_USD,
    facilitator: thirdwebFacilitator,
    routeConfig: {
      description: "AI analysis + $HOTDOG reward for a Log a Dog entry",
      mimeType: "application/json",
    },
  };

  // --- Step 2/4: verify the payment (no funds move yet) ----------------------
  let verification;
  try {
    verification = await verifyPayment(paymentArgs);
  } catch (error) {
    console.error("x402/analyze verifyPayment failed:", error);
    return res.status(500).json({ error: "Failed to verify payment" });
  }
  if (verification.status !== 200) {
    // 402: no/insufficient payment -> tell the client what's required.
    applyHeaders(res, verification.responseHeaders);
    return res.status(verification.status).json(verification.responseBody);
  }

  const payer = verification.payer;
  if (!payer) {
    return res.status(400).json({ error: "Could not determine payer address" });
  }
  const usdcBaseUnits = BigInt(
    verification.selectedPaymentRequirements.maxAmountRequired,
  );

  // --- Step 3: acquire the lock (only now that a real payment is on offer) ---
  const lockAcquired = await redis.set(lockKey(logId), payer, {
    nx: true,
    ex: LOCK_TTL_SECONDS,
  });
  if (lockAcquired !== "OK") {
    return res
      .status(409)
      .json({ error: "An analysis for this dog is already in progress", logId });
  }

  try {
    // Re-check inside the lock to close the race with a concurrent request.
    const alreadyVoted = await hasUserAttested({
      contract: attestationContract,
      logId: BigInt(logId),
      user: aiJudge,
    });
    if (alreadyVoted || (await redis.get(analyzedKey(logId)))) {
      return res
        .status(409)
        .json({ error: "This dog has already been analyzed", logId });
    }

    // The AI judge must hold enough stake to attest, otherwise the vote would
    // revert on-chain -- fail loudly here BEFORE taking any payment.
    const minimumStake = await MINIMUM_ATTESTATION_STAKE({
      contract: attestationContract,
    });
    const canVote = await canParticipateInAttestation({
      contract: getContract({
        client,
        chain: ANALYSIS_CHAIN,
        address: STAKING[chainId]!,
      }),
      user: aiJudge,
      requiredStake: minimumStake,
    });
    if (!canVote) {
      return res.status(503).json({
        error: "AI judge is not currently able to vote (insufficient stake)",
      });
    }

    // --- Step 5: fetch the dog image (on-chain is the source of truth) ------
    const [log] = await getHotdogLog({
      contract: getContract({
        client,
        chain: ANALYSIS_CHAIN,
        address: LOG_A_DOG[chainId]!,
      }),
      logId: BigInt(logId),
    });
    if (!log?.imageUri) {
      return res.status(404).json({ error: "Dog log not found", logId });
    }
    const imageUrl = ipfsToHttp(log.imageUri);

    // --- Step 4/5: pay for inference via x402 and ask the model ------------
    const isValidHotdog = await askIsHotdog(imageUrl);

    // --- Step 6: cast the vote (VALID if yes, SUS if no) -------------------
    const voteTx = attestToLogOnBehalf({
      contract: attestationContract,
      logId: BigInt(logId),
      attestor: aiJudge,
      isValid: isValidHotdog,
      stakeAmount: minimumStake,
    });
    const { transactionId: voteTransactionId } =
      await serverWallet.enqueueTransaction({ transaction: voteTx });

    // The vote IS the analysis -- record it now so a retry can never trigger a
    // second analysis (and thus never double-charge), even if a later step throws.
    await redis.set(analyzedKey(logId), isValidHotdog ? "valid" : "sus", {
      ex: ANALYZED_TTL_SECONDS,
    });

    // --- Step 2 (settle): now that the analysis is done, take the payment --
    const settlement = await settlePayment(paymentArgs);
    if (settlement.status !== 200) {
      // We did the work but couldn't collect payment. Don't pay out $HOTDOG.
      console.error("x402/analyze settlement failed after analysis", {
        logId,
        payer,
      });
      applyHeaders(res, settlement.responseHeaders);
      return res.status(settlement.status).json(settlement.responseBody);
    }

    // --- Step 7: reward the caller with 2x their spend in $HOTDOG ----------
    const price = await getHotdogPrice(chainId);
    const hotdogPayoutWei = computeHotdogPayoutWei(
      usdcBaseUnits,
      X402_PAYOUT_MULTIPLIER,
      price,
    );
    let payoutTransactionId: string | null = null;
    if (hotdogPayoutWei > 0n) {
      const payoutTx = transfer({
        contract: getContract({
          client,
          chain: ANALYSIS_CHAIN,
          address: HOTDOG_TOKEN[chainId]!,
        }),
        to: payer,
        amountWei: hotdogPayoutWei,
      });
      const enqueued = await serverWallet.enqueueTransaction({
        transaction: payoutTx,
      });
      payoutTransactionId = enqueued.transactionId;
    }

    applyHeaders(res, settlement.responseHeaders);
    res.status(200);
    return res.json({
      logId,
      verdict: isValidHotdog ? "VALID" : "SUS",
      isValidHotdog,
      payer,
      usdcSpent: usdcBaseUnits.toString(),
      hotdogReward: hotdogPayoutWei.toString(),
      hotdogPriceUsd: price.priceUsd,
      voteTransactionId,
      payoutTransactionId,
    });
  } catch (error) {
    console.error("x402/analyze processing failed:", error);
    return res
      .status(502)
      .json({ error: "Analysis failed", detail: (error as Error).message });
  } finally {
    await redis.del(lockKey(logId));
  }
}

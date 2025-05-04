import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { env } from "~/env";

type TransactionStatus = "queued" | "sent" | "mined" | "errored" | "cancelled";
type OnchainStatus = "success" | "reverted" | null;

interface BatchOperation {
  to: string | null;
  data: string | null;
  value: string;
}

interface TransactionResult {
  queueId: string | null;
  status: TransactionStatus;
  chainId: string | null;
  fromAddress: string | null;
  toAddress: string | null;
  data: string | null;
  extension: string | null;
  value: string | null;
  nonce: number | string | null;
  gasLimit: string | null;
  gasPrice: string | null;
  maxFeePerGas: string | null;
  maxPriorityFeePerGas: string | null;
  transactionType: number | null;
  transactionHash: string | null;
  queuedAt: string | null;
  sentAt: string | null;
  minedAt: string | null;
  cancelledAt: string | null;
  deployedContractAddress: string | null;
  deployedContractType: string | null;
  errorMessage: string | null;
  sentAtBlockNumber: number | null;
  blockNumber: number | null;
  retryCount: number;
  retryGasValues: boolean | null;
  retryMaxFeePerGas: string | null;
  retryMaxPriorityFeePerGas: string | null;
  signerAddress: string | null;
  accountAddress: string | null;
  accountSalt: string | null;
  accountFactoryAddress: string | null;
  target: string | null;
  sender: string | null;
  initCode: string | null;
  callData: string | null;
  callGasLimit: string | null;
  verificationGasLimit: string | null;
  preVerificationGas: string | null;
  paymasterAndData: string | null;
  userOpHash: string | null;
  functionName: string | null;
  functionArgs: string | null;
  onChainTxStatus: number | null;
  onchainStatus: OnchainStatus;
  effectiveGasPrice: string | null;
  cumulativeGasUsed: string | null;
  batchOperations: BatchOperation[] | null;
}

interface TransactionResponse {
  result: TransactionResult;
}

export const engineRouter = createTRPCRouter({
  getTransactionStatus: publicProcedure
    .input(z.object({ queueId: z.string() }))
    .query(async ({ input }): Promise<TransactionResponse> => {
      const { queueId } = input;
      const response = await fetch(`${env.THIRDWEB_ENGINE_URL}/transaction/status?queueId=${queueId}`);
      const data = await response.json() as TransactionResponse;
      return data;
    }),
})
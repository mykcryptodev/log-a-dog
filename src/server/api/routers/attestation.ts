import { z } from "zod";
import { ApolloClient, InMemoryCache, HttpLink, gql } from '@apollo/client';
import fetch from 'cross-fetch';
import { EAS, type TransactionSigner } from "@ethereum-attestation-service/eas-sdk";
import { EAS as EAS_ADDRESS, EAS_AFFIMRATION_SCHEMA_ID, EAS_SCHEMA_ID, MODERATION } from "~/constants/addresses";
import { createThirdwebClient, getContract, readContract } from "thirdweb";
import { ethers6Adapter } from "thirdweb/adapters/ethers6";
import { ethers } from "ethers";

import {
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";
import { baseSepolia, sepolia } from "thirdweb/chains";
import { env } from "~/env";
import { SUPPORTED_CHAINS } from "~/constants/chains";

type Endpoints = Record<number, string>;

const graphqlEndpoints = {
  [baseSepolia.id]: 'https://base-sepolia.easscan.org/graphql',
  [sepolia.id]: 'https://sepolia.easscan.org/graphql',
} as Endpoints;

type AttestationData = {
  id: string;
  attester: string;
  timeCreated: number;
  decodedDataJson: string;
};

const graphqlAttestationSchema = z.object({
  data: z.object({
    attestations: z.array(z.object({
      id: z.string(),
      attester: z.string(),
      timeCreated: z.number(),
      decodedDataJson: z.string(),
    })),
  }),
});

export const attestationRouter = createTRPCRouter({
  getById: publicProcedure
    .input(z.object({ 
      chainId: z.number(),
      attestationId: z.string(),
    }))
    .query(async ({ input }) => {
      const { attestationId, chainId } = input;
      const easAddress = EAS_ADDRESS[chainId];
      const chain = SUPPORTED_CHAINS.find((c) => c.id === chainId);
      const moderationAddress = MODERATION[chainId];
      if (!easAddress || !chain || !moderationAddress) {
        throw new Error("Chain not supported");
      }
      const client = createThirdwebClient({
        secretKey: env.THIRDWEB_SECRET_KEY,
      });
      const provider = await ethers6Adapter.provider.toEthers(client, chain) as TransactionSigner;
      const eas = new EAS(easAddress);
      eas.connect(provider);
      const attestation = await eas.getAttestation(attestationId);
      const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
        ["string", "string"],
        attestation.data
      );
      // check if this attestation should be redacted
      const moderation = getContract({
        client,
        address: moderationAddress,
        chain,
      });
      const isRedacted = await readContract({
        contract: moderation,
        method: {
          name: "redactedAttestations",
          type: "function",
          stateMutability: "view",
          inputs: [{ name: "attestationId", type: "bytes32" }],
          outputs: [{ name: "redacted", type: "bool" }],
        },
        params: [attestationId as `0x${string}`],
      });
      const redactedImage = "https://ipfs.io/ipfs/QmXZ8SpvGwRgk3bQroyM9x9dQCvd87c23gwVjiZ5FMeXGs/Image%20(1).png";
      
      let cursor = 0;
      const itemsPerPage = 100;
      let judgements: AttestationData[] = [];
      let hasMore = true;

      while (hasMore) {
        const result = await getAttestationsBySchemaId({
          schemaId: EAS_AFFIMRATION_SCHEMA_ID[chainId]!,
          refUID: attestationId,
          chainId,
          cursor,
          itemsPerPage,
        });

        judgements = [...judgements, ...result.attestations];
        cursor += itemsPerPage;
        hasMore = result.attestations.length === itemsPerPage;
      }

      type JudgementData = {
        name: string;
        type: string;
        signature: string;
        value: {
          name: string;
          type: string;
          value: boolean;
        };
      };

      // Helper function to parse the decodedDataJson and filter by isAffirmed value
      function filterJudgments(data: AttestationData[], isAffirmed: boolean): AttestationData[] {
        return data.filter(judgment => {
          const decodedData: JudgementData[] = JSON.parse(judgment.decodedDataJson) as JudgementData[];
          const affirmedValue = decodedData.find(d => d.name === "isAffirmed")?.value.value;
          return affirmedValue === isAffirmed;
        });
      }

      const affirmations = filterJudgments(judgements, true);
      const refutations = filterJudgments(judgements, false);

      console.log({ affirmations, refutations });

      return {
        attestation,
        decodedAttestaton: {
          address: attestation.recipient,
          imgUri: isRedacted ? redactedImage : decoded[0] as string,
          metadata: decoded[1] as string,
          uid: attestationId,
        },
        affirmations,
        refutations,
      };
    }),
  getBySchemaId: publicProcedure
    .input(z.object({ 
      chainId: z.number(),
      schemaId: z.string(),
      attestors: z.array(z.string()).optional(),
      startDate: z.number().optional(),
      endDate: z.number().optional(),
      cursor: z.number().optional(),
      itemsPerPage: z.number().optional()
    }))
    .query(async ({ input }) => {
      return await getAttestationsBySchemaId(input);
    }),
  getLeaderboard: publicProcedure
    .input(z.object({ 
      chainId: z.number(),
      attestors: z.array(z.string()).optional(),
      startDate: z.number().optional(),
      endDate: z.number().optional(),
      cursor: z.number().optional(),
      itemsPerPage: z.number().optional()
    }))
    .query(async ({ input }) => {
      const { chainId, attestors, startDate, endDate, cursor = 0, itemsPerPage = 10 } = input;
      console.log({ startDate, endDate });
      const endpoint = graphqlEndpoints[chainId];
      if (!endpoint) {
        throw new Error("Chain not supported");
      }
      // Create an instance of ApolloClient
      const client = new ApolloClient({
        link: new HttpLink({
          uri: endpoint,
          fetch,
        }),
        cache: new InMemoryCache(),
      });
      
      const GET_LEADERBOARD = gql`
        query AggregateAttestation($by: [AttestationScalarFieldEnum!]!, $where: AttestationWhereInput, $orderBy: [AttestationOrderByWithAggregationInput!]) {
          groupByAttestation(by: $by, where: $where, orderBy: $orderBy) {
            attester
            _count {
              attester
            }
          }
        }
      `;

      // Define your query variables
      const variables = {
        where: {
          schemaId: {
            equals: EAS_SCHEMA_ID[chainId],
          },
          revoked: {
            equals: false
          },
        ...(attestors && attestors.length > 0 ? { "attester": { "in": attestors } } : {}),
        ...(startDate && endDate ? { "timeCreated": { "gte": startDate, "lte": endDate } } : {})
        },
        by: "attester",
        orderBy: [
          {
            _count: {
              attester: "desc"
            }
          }
        ],
        take: itemsPerPage,
        skip: cursor
      };

      // Execute the query
      const response = await client.query({
        query: GET_LEADERBOARD,
        variables: variables,
      });
      const responseSchema = z.object({
        data: z.object({
          groupByAttestation: z.array(z.object({
            attester: z.string(),
            _count: z.object({
              attester: z.number(),
            }),
          })),
        }),
      });
      const result = responseSchema.parse(response);
      console.log({ result });

      return {
        leaderboard: result.data.groupByAttestation,
      };
    }),
});

async function getAttestationsBySchemaId(input: {
  schemaId: string,
  chainId: number,
  attestors?: string[],
  refUID?: string,
  startDate?: number,
  endDate?: number,
  cursor?: number,
  itemsPerPage?: number
}) {
  const { schemaId, chainId, attestors, refUID, startDate, endDate, cursor = 0, itemsPerPage = 10 } = input;
  const endpoint = graphqlEndpoints[chainId];
  if (!endpoint) {
    throw new Error("Chain not supported");
  }
  // Create an instance of ApolloClient
  const client = new ApolloClient({
    link: new HttpLink({
      uri: endpoint,
      fetch,
    }),
    cache: new InMemoryCache(),
  });
  
  const GET_ATTESTATIONS = gql`
    query AttestationQuery($attestationsWhere2: AttestationWhereInput, $orderBy: [AttestationOrderByWithRelationInput!], $skip: Int, $take: Int) {
      attestations(where: $attestationsWhere2, orderBy: $orderBy, skip: $skip, take: $take) {
        id
        attester
        timeCreated
        decodedDataJson
      }
    }
  `;

  // Define your query variables
  const variables = {
    attestationsWhere2: {
      schemaId: {
        equals: schemaId,
      },
      revoked: {
        equals: false
      },
      ...(refUID ? { "refUID": { "equals": refUID } } : {}),
      ...(attestors && attestors.length > 0 ? { "attester": { "in": attestors } } : {}),
      ...(startDate && endDate ? { "timeCreated": { "gte": startDate, "lte": endDate } } : {})
    },
    orderBy: [{ timeCreated: "desc" }],
    skip: cursor,
    take: itemsPerPage,
  };

  // Execute the query
  const response = await client.query({
    query: GET_ATTESTATIONS,
    variables: variables,
  });
  const result = graphqlAttestationSchema.parse(response);

  return {
    attestations: result.data.attestations,
  };
}

import { z } from "zod";
import { ApolloClient, InMemoryCache, HttpLink, gql } from '@apollo/client';
import fetch from 'cross-fetch';
import { EAS, type TransactionSigner } from "@ethereum-attestation-service/eas-sdk";
import { EAS as EAS_ADDRESS, EAS_SCHEMA_ID, MODERATION } from "~/constants/addresses";
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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const provider = await ethers6Adapter.provider.toEthers(client, chain);
      const eas = new EAS(easAddress);
      eas.connect(provider as TransactionSigner);
      const attestation = await eas.getAttestation(attestationId);
      const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
        ["address", "uint256", "string", "string"],
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
      return {
        attestation,
        decodedAttestaton: {
          address: decoded[0] as string,
          numHotdogs: decoded[1] as number,
          imgUri: isRedacted ? redactedImage : decoded[2] as string,
          metadata: decoded[3] as string,
        }
      };
    }),
  getBySchemaId: publicProcedure
    .input(z.object({ 
      chainId: z.number(),
      schemaId: z.string(),
      cursor: z.number().optional(),
      itemsPerPage: z.number().optional()
    }))
    .query(async ({ input }) => {
      const { schemaId, chainId, cursor = 0, itemsPerPage = 10 } = input;
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
          }
        }
      `;

      // Define your query variables
      const variables = {
        attestationsWhere2: {
          schemaId: {
            equals: schemaId,
          }
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
      const responseSchema = z.object({
        data: z.object({
          attestations: z.array(z.object({
            id: z.string(),
            attester: z.string(),
            timeCreated: z.number(),
          })),
        }),
      });
      const result = responseSchema.parse(response);
      console.log({ result });

      return {
        attestations: result.data.attestations,
      };
    }),
  getLeaderboard: publicProcedure
    .input(z.object({ 
      chainId: z.number(),
      attestors: z.array(z.string()).optional(),
      cursor: z.number().optional(),
      itemsPerPage: z.number().optional()
    }))
    .query(async ({ input }) => {
      const { chainId, attestors, cursor = 0, itemsPerPage = 10 } = input;
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
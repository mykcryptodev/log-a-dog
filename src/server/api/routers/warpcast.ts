import { z } from "zod";
import { env } from "~/env";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const warpcastRouter = createTRPCRouter({
  getCommentsByHotdog: publicProcedure
    .input(
      z.object({
        farcasterHash: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      const { farcasterHash } = input;
      console.log({ farcasterHash });
      if (!farcasterHash) {
        throw new Error("farcasterHash is required");
      }

      const neynarBaseUrl =
        "https://api.neynar.com/v2/farcaster/cast/conversation";
      const params = new URLSearchParams({
        identifier: `https://warpcast.com/${farcasterHash}`,
        type: "url",
        reply_depth: "2",
        include_chronological_parent_casts: "false",
        viewer_fid: "3",
        limit: "20",
      });
      const url = `${neynarBaseUrl}?${params.toString()}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          accept: "application/json",
          api_key: env.NEYNAR_API_KEY,
        },
      });

      if (!response.ok) {
        throw new Error(`Error fetching data: ${response.statusText}`);
      }

      const data = (await response.json()) as WarpcastResponse;

      return data;
    }),
  getRelevantHolders: publicProcedure
    .input(
      z.object({
        contractAddress: z.string(),
        network: z.string(),
        viewerFid: z.number(),
      }),
    )
    .query(async ({ input }) => {
      const { contractAddress, network, viewerFid } = input;
      const params = new URLSearchParams({
        contract_address: contractAddress,
        networks: network,
        viewer_fid: viewerFid.toString(),
      });
      const url = `https://api.neynar.com/v2/farcaster/fungible/owner/relevant?${params.toString()}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          accept: "application/json",
          api_key: env.NEYNAR_API_KEY,
        },
      });

      if (!response.ok) {
        throw new Error(`Error fetching data: ${response.statusText}`);
      }

      const data = (await response.json()) as RelevantOwnersResponse;
      return data;
    }),
});

type WarpcastResponse = {
  conversation: {
    cast: {
      object: string;
      hash: string;
      thread_hash: string;
      parent_hash: string | null;
      parent_url: string;
      root_parent_url: string;
      parent_author: {
        fid: number | null;
      };
      author: {
        object: string;
        fid: number;
        custody_address: string;
        username: string;
        display_name: string;
        pfp_url: string;
        profile: {
          bio: {
            text: string;
          };
        };
        follower_count: number;
        following_count: number;
        verifications: string[];
        verified_addresses: {
          eth_addresses: string[];
          sol_addresses: string[];
        };
        active_status: string;
        power_badge: boolean;
        viewer_context: {
          following: boolean;
          followed_by: boolean;
        };
      };
      text: string;
      timestamp: string;
      embeds: {
        url: string;
      }[];
      reactions: {
        likes_count: number;
        recasts_count: number;
        likes: {
          fid: number;
          fname: string;
        }[];
        recasts: {
          fid: number;
          fname: string;
        }[];
      };
      replies: {
        count: number;
      };
      channel: {
        object: string;
        id: string;
        name: string;
        image_url: string;
      };
      mentioned_profiles: unknown[];
      viewer_context: {
        liked: boolean;
        recasted: boolean;
      };
      direct_replies: {
        object: string;
        hash: string;
        thread_hash: string;
        parent_hash: string;
        parent_url: string | null;
        root_parent_url: string;
        parent_author: {
          fid: number;
        };
        author: {
          object: string;
          fid: number;
          custody_address: string;
          username: string;
          display_name: string;
          pfp_url: string;
          profile: {
            bio: {
              text: string;
            };
          };
          follower_count: number;
          following_count: number;
          verifications: string[];
          verified_addresses: {
            eth_addresses: string[];
            sol_addresses: string[];
          };
          active_status: string;
          power_badge: boolean;
          viewer_context: {
            following: boolean;
            followed_by: boolean;
          };
        };
        text: string;
        timestamp: string;
        embeds: unknown[];
        reactions: {
          likes_count: number;
          recasts_count: number;
          likes: unknown[];
          recasts: unknown[];
        };
        replies: {
          count: number;
        };
        channel: {
          object: string;
          id: string;
          name: string;
          image_url: string;
        };
        mentioned_profiles: unknown[];
        viewer_context: {
          liked: boolean;
          recasted: boolean;
        };
        direct_replies: unknown[];
      }[];
    };
  };
  next: {
    cursor: string | null;
  };
};

type RelevantOwnersResponse = {
  top_relevant_fungible_owners_hydrated: Array<{
    fid: number;
    username: string;
    display_name: string;
    pfp_url: string;
    custody_address: string;
  }>;
  all_relevant_fungible_owners_dehydrated: Array<{
    fid: number;
    username: string;
    display_name: string;
    pfp_url: string;
    custody_address: string;
  }>;
};

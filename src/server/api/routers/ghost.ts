/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/no-inferrable-types */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { env } from "~/env";
import { getOrSetCache, CACHE_DURATION } from "~/server/utils/redis";
import { type UserProfile, fetchUserProfiles } from "~/server/utils/profile";
import { z } from "zod";

interface Vote {
  isValid: boolean;
  logId: string;
  voter: string;
}

interface DogLog {
  id: string;
  isValid: boolean;
  invalidVotes: string;
  validVotes: string;
  status: number;
}



interface JudgeResult {
  voter: string;
  correct: number;
  incorrect: number;
  total: number;
  accuracy: number;
  profile: UserProfile;
}

const QUERY = `query Judges($votesCursor: String, $logsCursor: String) {
  votes(after: $votesCursor, limit: 100) {
    items {
      isValid
      logId
      voter
    }
    pageInfo {
      endCursor
      hasNextPage
    }
  }
  dogLogs(after: $logsCursor, limit: 100, where: {status_not: 0}) {
    items {
      id
      isValid
      invalidVotes
      validVotes
      status
    }
    pageInfo {
      endCursor
      hasNextPage
    }
  }
}`;

const USER_VOTES_QUERY = `query Votes($voter: String!, $cursor: String) {
  votes(where: {voter: $voter}, after: $cursor, limit: 100) {
    items {
      logId
      isValid
    }
    pageInfo {
      endCursor
      hasNextPage
    }
  }
}`;

async function fetchWithExponentialBackoff(
  url: string,
  options: RequestInit,
  maxRetries: number = 3
): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      // If successful, return the response
      if (response.ok) {
        return response;
      }
      
      // If it's a rate limit or server error, retry
      if (response.status >= 500 || response.status === 429) {
        if (attempt === maxRetries) {
          throw new Error(`Ghost API request failed after ${maxRetries + 1} attempts: ${response.statusText}`);
        }
        
        // Exponential backoff: 2s, 4s, 8s, 16s...
        const delay = Math.pow(2, attempt + 1) * 1000;
        console.log(`Ghost API request failed (${response.status}), retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // For other errors (4xx except 429), don't retry
      throw new Error(`Ghost API request failed: ${response.statusText}`);
    } catch (error) {
      // Network errors or other fetch errors
      if (attempt === maxRetries) {
        throw new Error(`Ghost API request failed after ${maxRetries + 1} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      const delay = Math.pow(2, attempt) * 1000;
      console.log(`Ghost API network error, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1}):`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error('Unexpected error in fetchWithExponentialBackoff');
}



export const ghostRouter = createTRPCRouter({
  getJudges: publicProcedure.query(async ({ ctx }) => {
    const cacheKey = "judges:ranking";
    
    return getOrSetCache(
      cacheKey,
      async () => {
        let votesCursor: string | null = null;
        let logsCursor: string | null = null;
        const votes: Vote[] = [];
        const logs: DogLog[] = [];

        // Fetch all votes and logs from Ghost Protocol API
        while (true) {
          const response: Response = await fetchWithExponentialBackoff(
            "https://api.ghostlogs.xyz/gg/pub/7a444b24-49f2-4960-8e2b-18eedc34ea4b/ghostgraph",
            {
              method: "POST",
              headers: {
                "X-GHOST-KEY": env.GHOST_PROTOCOL_API_KEY,
                "content-type": "application/json",
              },
              body: JSON.stringify({
                query: QUERY,
                variables: { votesCursor, logsCursor },
              }),
            }
          );

          const json = await response.json() as any;
          const voteData = json.data?.votes;
          const logData = json.data?.dogLogs;

          if (voteData) {
            votes.push(...(voteData.items as Vote[]));
            votesCursor = voteData.pageInfo.hasNextPage
              ? (voteData.pageInfo.endCursor as string)
              : null;
          }

          if (logData) {
            logs.push(...(logData.items as DogLog[]));
            logsCursor = logData.pageInfo.hasNextPage
              ? (logData.pageInfo.endCursor as string)
              : null;
          }

          if (!votesCursor && !logsCursor) break;
        }

        // Process data to calculate judge rankings
        const logMap = new Map<string, DogLog>();
        for (const log of logs) {
          logMap.set(log.id, log);
        }

        const judgeStats: Record<string, { correct: number; total: number }> = {};
        for (const vote of votes) {
          const log = logMap.get(vote.logId);
          if (!log) continue;
          if (log.status === 0) continue; // still pending
          
          // Initialize judge stats if not exists
          if (!judgeStats[vote.voter]) {
            judgeStats[vote.voter] = { correct: 0, total: 0 };
          }
          
          // Increment total votes
          judgeStats[vote.voter]!.total += 1;
          
          // Check if vote was correct
          const correct =
            (vote.isValid && log.isValid) || (!vote.isValid && !log.isValid);
          if (correct) {
            judgeStats[vote.voter]!.correct += 1;
          }
        }

        // Get unique voter addresses
        const voterAddresses = Object.keys(judgeStats);
        
        // Fetch user profiles for all voters
        const profileMap = await fetchUserProfiles(voterAddresses);
        
        const ranking: JudgeResult[] = Object.entries(judgeStats)
          .map(([voter, stats]) => {
            const correct = stats.correct;
            const total = stats.total;
            const incorrect = total - correct;
            const accuracy = total > 0 ? (correct / total) * 100 : 0;
            
            return {
              voter,
              correct,
              incorrect,
              total,
              accuracy,
              profile: profileMap.get(voter) ?? {
                username: '',
                imgUrl: '',
                metadata: '',
                address: voter,
              }
            };
          })
          .sort((a, b) => b.correct - a.correct);

        return ranking;
      },
      CACHE_DURATION.MEDIUM
    );
  }),
  getUserVotes: publicProcedure
    .input(z.object({ voter: z.string() }))
    .query(async ({ input }) => {
      const voter = input.voter.toLowerCase();
      const cacheKey = `ghost:votes:${voter}`;

      return getOrSetCache(
        cacheKey,
        async () => {
          let cursor: string | null = null;
          const votes: Record<string, boolean> = {};

          while (true) {
            const response = await fetchWithExponentialBackoff(
              "https://api.ghostlogs.xyz/gg/pub/7a444b24-49f2-4960-8e2b-18eedc34ea4b/ghostgraph",
              {
                method: "POST",
                headers: {
                  "X-GHOST-KEY": env.GHOST_PROTOCOL_API_KEY,
                  "content-type": "application/json",
                },
                body: JSON.stringify({
                  query: USER_VOTES_QUERY,
                  variables: { voter, cursor },
                }),
              }
            );

            const json = (await response.json()) as any;
            const voteData = json.data?.votes;

            if (voteData) {
              for (const item of voteData.items as { logId: string; isValid: boolean }[]) {
                votes[item.logId] = item.isValid;
              }
              cursor = voteData.pageInfo.hasNextPage ? (voteData.pageInfo.endCursor as string) : null;
            } else {
              break;
            }

            if (!cursor) break;
          }

          return votes;
        },
        CACHE_DURATION.MEDIUM
      );
    }),
});
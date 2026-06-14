import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { getOrSetCache, CACHE_DURATION } from "~/server/utils/redis";
import { type UserProfile, fetchUserProfiles } from "~/server/utils/profile";
import { CONTEST_END_TIME, CONTEST_START_TIME } from "~/constants";
import { DEFAULT_CHAIN } from "~/constants/chains";
import { db } from "~/server/db";
import { z } from "zod";

interface JudgeResult {
  voter: string;
  correct: number;
  incorrect: number;
  total: number;
  accuracy: number;
  profile: UserProfile;
}

export const ghostRouter = createTRPCRouter({
  getJudges: publicProcedure.query(async () => {
    const chainId = DEFAULT_CHAIN.id.toString();
    const contestStartTimestamp = BigInt(Math.floor(new Date(CONTEST_START_TIME).getTime() / 1000));
    const contestEndTimestamp = BigInt(Math.floor(new Date(CONTEST_END_TIME).getTime() / 1000));
    const cacheKey = `judges:ranking:${chainId}:${CONTEST_START_TIME}`;
    
    return getOrSetCache(
      cacheKey,
      async () => {
        const resolvedLogs = await db.dogEvent.findMany({
          where: {
            chainId,
            timestamp: {
              gte: contestStartTimestamp,
              lte: contestEndTimestamp,
            },
            attestationResolved: true,
            attestationValid: { not: null },
          },
          select: {
            logId: true,
            attestationValid: true,
          },
        });

        const resolvedByLogId = new Map(
          resolvedLogs.map((log) => [log.logId, log.attestationValid]),
        );
        const logIds = [...resolvedByLogId.keys()];

        if (logIds.length === 0) {
          return [];
        }

        const votes = await db.attestationVote.findMany({
          where: {
            chainId,
            logId: { in: logIds },
          },
          select: {
            voter: true,
            logId: true,
            isValid: true,
          },
        });

        const judgeStats: Record<string, { correct: number; total: number }> = {};

        for (const vote of votes) {
          const resolvedValid = resolvedByLogId.get(vote.logId);
          if (resolvedValid === null || resolvedValid === undefined) continue;

          const voter = vote.voter.toLowerCase();
          judgeStats[voter] ??= { correct: 0, total: 0 };
          judgeStats[voter].total += 1;

          if (vote.isValid === resolvedValid) {
            judgeStats[voter].correct += 1;
          }
        }

        const voterAddresses = Object.keys(judgeStats);
        if (voterAddresses.length === 0) {
          return [];
        }
        
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
      const chainId = DEFAULT_CHAIN.id.toString();
      const contestStartTimestamp = BigInt(Math.floor(new Date(CONTEST_START_TIME).getTime() / 1000));
      const contestEndTimestamp = BigInt(Math.floor(new Date(CONTEST_END_TIME).getTime() / 1000));
      const cacheKey = `votes:${chainId}:${voter}:${CONTEST_START_TIME}`;

      return getOrSetCache(
        cacheKey,
        async () => {
          const seasonLogs = await db.dogEvent.findMany({
            where: {
              chainId,
              timestamp: {
                gte: contestStartTimestamp,
                lte: contestEndTimestamp,
              },
            },
            select: {
              logId: true,
            },
          });
          const logIds = seasonLogs.map((log) => log.logId);
          if (logIds.length === 0) {
            return {};
          }

          const rows = await db.attestationVote.findMany({
            where: {
              chainId,
              voter,
              logId: { in: logIds },
            },
            select: {
              logId: true,
              isValid: true,
            },
          });

          return rows.reduce<Record<string, boolean>>((votes, row) => {
            votes[row.logId] = row.isValid;
            return votes;
          }, {});
        },
        CACHE_DURATION.MEDIUM
      );
    }),
});
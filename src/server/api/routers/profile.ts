import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

const profileSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  bio: z.string().optional(),
  twitter: z.string().optional(),
  discord: z.string().optional(),
  instagram: z.string().optional(),
  img: z.string().optional(),
  userId: z.string().optional(),
  banner: z.string().optional(),
});

export const profileRouter = createTRPCRouter({
  // given an inuputted userId, find the profile associated with that user
  get: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(({ ctx, input }) => {
      if (!input.userId) throw new Error("No userId provided");
      return ctx.prisma.profile.findUnique({
        where: {
          userId: input.userId.toLowerCase(),
        },
      });
    }),

  // get all profiles with pagination
  getAll: publicProcedure
    .input(
      z.object({
        skip: z.number().optional(),
        take: z.number().optional(),
        filterNoName: z.boolean().optional(),
        filterNoImg: z.boolean().optional(),
      })
    )
    .query(({ ctx, input }) => {
      return ctx.prisma.profile.findMany({
        skip: input.skip,
        take: input.take,
        where: {
          name: {
            not: input.filterNoName ? "" : undefined,
          },
          img: {
            not: input.filterNoImg ? "" : undefined,
          },
        },
      });
    }),

  // get by address or name
  getByAddressOrName: publicProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      if (!input) throw new Error("No id provided");
      const profile = await ctx.prisma.profile.findUnique({
        where: {
          id: input,
        },
      });
      if (profile) return profile;
      return ctx.prisma.profile.findFirst({
        where: {
          name: {
            equals: input,
          },
        },
      });
    }),

  // given a profile name, find the profile associated with that name
  getByName: publicProcedure
    .input(z.object({ name: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.prisma.profile.findFirst({
        where: {
          name: {
            equals: input.name,
          },
        },
      });
    }),

  // get by Id
  getById: publicProcedure
    .input(z.string())
    .query(({ ctx, input }) => {
      if (!input) throw new Error("No id provided");
      return ctx.prisma.profile.findUnique({
        where: {
          id: input,
        },
      });
    }),

  // get trending profiles
  getTrending: publicProcedure
    .input(
      z.object({
        skip: z.number().optional(),
        take: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const [follows, likes, mostViewed] = await Promise.all([
        await ctx.prisma.profileUserFollows.groupBy({
          by: ["profileId"],
          _count: {
            profileId: true,
          },
          where: {
            createdAt: {
              // only count follows that were made in the past 7 days
              gt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
            },
          },
        }),
        await ctx.prisma.profileUserLike.groupBy({
          by: ["profileId"],
          _count: {
            profileId: true,
          },
          where: {
            createdAt: {
              // only count likes that were made in the past 7 days
              gt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
            },
          },
        }),
        await ctx.prisma.profile.findMany({
          skip: input.skip,
          take: input.take,
          orderBy: {
            views: "desc",
          },
          where: {
            views: {
              gt: 0,
            },
          },
        }),
      ]);

      const followsMap = new Map<string, number>();
      const likesMap = new Map<string, number>();
      const mostViewedMap = new Map<string, number>();

      follows.forEach((follow) => {
        followsMap.set(follow.profileId, follow._count.profileId);
      });

      likes.forEach((like) => {
        likesMap.set(like.profileId, like._count.profileId);
      });

      mostViewed.forEach((view) => {
        mostViewedMap.set(view.id, view.views);
      });

      const profiles = await ctx.prisma.profile.findMany({
        skip: input.skip,
        take: input.take,
        orderBy: {
          views: "desc",
        },
        where: {
          views: {
            gt: 0,
          },
        },
      });

      const profilesWithStats = profiles.map((profile) => {
        return {
          ...profile,
          follows: followsMap.get(profile.id) || 0,
          likes: likesMap.get(profile.id) || 0,
          views: mostViewedMap.get(profile.id) || 0,
        };
      });

      // return profiles with stats sorted by follows, likes, and views
      // follows is 5x multiplier, likes is 2x multiplier
      return profilesWithStats.sort((a, b) => {
        return (
          (b.follows * 5 + b.likes * 2 + b.views) - (a.follows * 5 + a.likes * 2 + a.views)
        );
      });

    }),

  // given an inputted bio, create a new profile with that bio
  create: protectedProcedure
    .input(profileSchema.omit({ id: true }))
    .mutation(({ ctx, input }) => {
      return ctx.prisma.profile.create({
        data: {
          id: ctx.session.user.id,
          userId: ctx.session.user.id,
          name: input.name,
          bio: input.bio,
          img: input.img,
          twitter: input.twitter,
          discord: input.discord,
          instagram: input.instagram,
          banner: input.banner,
        },
      });
    }),

  update: protectedProcedure.input(profileSchema).mutation(({ ctx, input }) => {
    const userIsUpdatingOwnProfile = ctx.session.user.id === input.userId?.toLowerCase();
    const userIsCreatingOwnProfile = !input.id && ctx.session.user.id;
    const userIsAdmin = ctx.session.user.isAdmin;
    if (!userIsUpdatingOwnProfile && !userIsCreatingOwnProfile && !userIsAdmin) {
      throw new Error("You are not authorized to update this profile");
    }
    const profileId = () => {
      if (userIsAdmin) return input.id;
      return ctx.session.user.id;
    }
    // find the profile that needs updating. create it if it does not exist
    return ctx.prisma.profile.upsert({
      where: {
        id: profileId(),
      },
      create: {
        id: profileId(),
        userId: profileId(),
        name: input.name,
        bio: input.bio,
        img: input.img,
        twitter: input.twitter,
        discord: input.discord,
        instagram: input.instagram,
        banner: input.banner,
      },
      update: {
        name: input.name,
        bio: input.bio,
        img: input.img,
        twitter: input.twitter,
        discord: input.discord,
        instagram: input.instagram,
        banner: input.banner,
      },
    });
  }),

  // given an array of userIds (addresses), find all profiles associated with those ids
  getManyByAddress: publicProcedure
    .input(z.array(z.string()))
    .query(({ ctx, input }) => {
      return ctx.prisma.profile.findMany({
        where: {
          userId: {
            in: input,
          },
        },
      });
    }),

  like: protectedProcedure
    .input(
      z.object({
        address: z.string(),
      })
    )
    .mutation(({ ctx, input }) => {
      return ctx.prisma.profileUserLike.create({
        data: {
          profile: {
            connectOrCreate: {
              where: {
                id: input.address.toLowerCase(),
              },
              create: {
                user: {
                  connectOrCreate: {
                    where: {
                      id: input.address.toLowerCase(),
                    },
                    create: {
                      id: input.address.toLowerCase(),
                      address: input.address.toLowerCase(),
                    },
                  },
                },
                id: input.address.toLowerCase(),
              },
            },
          },
          user: {
            connect: {
              id: ctx.session.user.id,
            },
          },
        },
      });
    }),

  unlike: protectedProcedure
    .input(
      z.object({
        address: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const like = await ctx.prisma.profileUserLike.findFirst({
        where: {
          profileId: input.address.toLowerCase(),
          userId: ctx.session.user.id.toLowerCase(),
        },
      });
      if (!like) throw new Error("Not liked");
      return ctx.prisma.profileUserLike.delete({
        where: {
          id: like.id,
        },
      });
    }),

  isLikedByUser: publicProcedure
    .input(
      z.object({
        address: z.string(),
        userId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const like = await ctx.prisma.profileUserLike.findFirst({
        where: {
          profileId: input.address.toLowerCase(),
          userId: input.userId.toLowerCase(),
        },
      });
      return !!like;
    }),

  getLikesByUser: publicProcedure
    .input(
      z.object({
        userId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await ctx.prisma.profileUserLike.findMany({
        where: {
          userId: input.userId.toLowerCase(),
        },
      });
    }),

  getLikesCount: publicProcedure
    .input(
      z.object({
        address: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await ctx.prisma.profileUserLike.count({
        where: {
          profileId: input.address.toLowerCase(),
        },
      });
    }),

  follow: protectedProcedure
    .input(
      z.object({
        address: z.string(),
      })
    )
    .mutation(({ ctx, input }) => {
      return ctx.prisma.profileUserFollows.create({
        data: {
          profile: {
            connectOrCreate: {
              where: {
                id: input.address.toLowerCase(),
              },
              create: {
                user: {
                  connectOrCreate: {
                    where: {
                      id: input.address.toLowerCase(),
                    },
                    create: {
                      id: input.address.toLowerCase(),
                      address: input.address.toLowerCase(),
                    },
                  },
                },
                id: input.address.toLowerCase(),
              },
            },
          },
          user: {
            connect: {
              id: ctx.session.user.id,
            },
          },
        },
      });
    }),

  unfollow: protectedProcedure
    .input(
      z.object({
        address: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const follow = await ctx.prisma.profileUserFollows.findFirst({
        where: {
          profileId: input.address.toLowerCase(),
          userId: ctx.session.user.id.toLowerCase(),
        },
      });
      if (!follow) throw new Error("Not followed");
      return ctx.prisma.profileUserFollows.delete({
        where: {
          id: follow.id,
        },
      });
    }),

  isFollowedByUser: publicProcedure
    .input(
      z.object({
        address: z.string(),
        userId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const follow = await ctx.prisma.profileUserFollows.findFirst({
        where: {
          profileId: input.address.toLowerCase(),
          userId: input.userId.toLowerCase(),
        },
      });
      return !!follow;
    }),

  getFollowsByUser: publicProcedure
    .input(
      z.object({
        userId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await ctx.prisma.profileUserFollows.findMany({
        where: {
          userId: input.userId.toLowerCase(),
        },
      });
    }),

  getFollowsCount: publicProcedure
    .input(
      z.object({
        address: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await ctx.prisma.profileUserFollows.count({
        where: {
          profileId: input.address.toLowerCase(),
        },
      });
    }),
  increaseViews: publicProcedure
    .input(
      z.object({
        address: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.profile.update({
        where: {
          id: input.address.toLowerCase(),
        },
        data: {
          views: {
            increment: 1,
          },
        },
      });
    }),

  // censor profile
  censor: protectedProcedure
    .input(z.object({
      id: z.string(),
      isCensored: z.boolean(),
    }))
    .mutation(({ ctx, input }) => {
      if (!ctx.session.user?.isAdmin) throw new Error("Unauthorized");
      return ctx.prisma.profile.update({
        where: {
          id: input.id,
        },
        data: {
          isCensored: input.isCensored,
        },
      });
    }),
});
export type WarpcastResponse = {
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
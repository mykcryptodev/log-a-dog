import { neynarClient } from "~/lib/neynar";
import type { ChannelMember } from "@neynar/nodejs-sdk/build/api/models/channel-member";

async function getMembers(channelId: string): Promise<ChannelMember[]> {
  let cursor: string | undefined;
  const members: ChannelMember[] = [];
  do {
    const response = await neynarClient.fetchChannelMembers({
      channelId,
      limit: 100,
      cursor,
      xNeynarExperimental: true,
    });
    members.push(...response.members);
    cursor = response.next?.cursor;
  } while (cursor);
  return members;
}

interface MemberInfo {
  fid: number;
  username: string;
  ethAddress: string;
}

async function main(): Promise<void> {
  const channels = ["logadog", "glizzy-zone"];
  const unique = new Map<number, MemberInfo>();

  for (const channel of channels) {
    const members = await getMembers(channel);
    for (const member of members) {
      const user = member.user;
      const score = (user as any).score ?? (user as any).experimental?.neynar_user_score ?? 0;
      if (score < 0.75) continue;
      const fid = (user as any).fid as number;
      const username = (user as any).username as string;
      const primary = (user as any).verified_addresses?.primary?.eth_address as string | null;
      const custody = (user as any).custody_address as string;
      const ethAddress = primary ?? custody;
      if (!unique.has(fid)) {
        unique.set(fid, { fid, username, ethAddress });
      }
    }
  }

  console.log(Array.from(unique.values()));
}

main().catch((err) => {
  console.error("Error running script", err);
});

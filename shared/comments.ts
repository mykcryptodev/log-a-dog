/**
 * ECP.eth on-chain comment types and helpers shared by web and mobile.
 */

export interface CommentAuthor {
  address: string;
  ens?: { name?: string; avatarUrl?: string };
  farcaster?: { pfpUrl?: string };
}

export interface CommentItem {
  id: string;
  content: string;
  author: CommentAuthor;
  createdAt: string;
  targetUri?: string;
  txHash?: string;
}

export interface CommentsPage {
  results: CommentItem[];
  pagination?: {
    totalCount: number;
    hasNext: boolean;
    endCursor: string;
  };
}

/** Canonical target URI for ECP comments on a dog log. */
export function dogCommentTargetUri(logId: string, baseUrl = "https://logadog.xyz"): string {
  return `${baseUrl}/dog/${logId}`;
}

export function commentCreatedAtToUnixSeconds(iso: string): string {
  return String(Math.floor(new Date(iso).getTime() / 1000));
}

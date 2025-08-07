import { type NextApiRequest, type NextApiResponse } from "next";
import { EMPTY_PARENT_ID } from "@ecp.eth/sdk";

interface GraphQLResponse {
  data: {
    comments: {
      totalCount: number;
      pageInfo: {
        endCursor: string;
        startCursor: string;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
      };
      items: {
        moderationClassifierScore: number;
        id: string;
        createdAt: string;
        commentType: number;
        content: string;
        author: string;
        txHash: string;
        targetUri: string;
        parentId: string | null;
        replies: {
          items: {
            id: string;
            createdAt: string;
            content: string;
            author: string;
            txHash: string;
            targetUri: string;
            moderationClassifierScore: number;
          }[];
        };
      }[];
    };
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { targetUri, limit = 50, cursor } = req.query;

  if (!targetUri || typeof targetUri !== "string") {
    return res.status(400).json({ error: "targetUri is required" });
  }

  try {
    // Build the GraphQL query
    const query = `
      query Comments($targetUri: String!, $limit: Int, $after: String) {
        comments(
          where: { targetUri: $targetUri }
          limit: $limit
          after: $after
          orderDirection: "desc"
          orderBy: "createdAt"
        ) {
          totalCount
          items {
            replies {
              items {
                id
                createdAt
                content
                author
                txHash
                targetUri
                moderationClassifierScore
              }
            }
            moderationClassifierScore
            id
            createdAt
            commentType
            content
            author
            txHash
            targetUri
            parentId
          }
          pageInfo {
            endCursor
            startCursor
            hasNextPage
            hasPreviousPage
          }
        }
      }
    `;

    const variables = {
      targetUri,
      limit: parseInt(limit as string),
      ...(cursor && typeof cursor === "string" ? { after: cursor } : {}),
    };

    const response = await fetch("https://api.ethcomments.xyz/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: "Failed to fetch comments from GraphQL API" 
      });
    }

    const data = await response.json();
    
    // Check if the response has the expected structure
    if (!data.data || !data.data.comments) {
      return res.status(500).json({ 
        error: "Invalid GraphQL response structure",
        details: data.errors ? data.errors : "Missing data.comments in response"
      });
    }

    // Transform the response to match the SDK format
    const validatedData = data as GraphQLResponse;
    
    // Debug: Log all comments with their parentId values
    console.log("All comments with parentId:", validatedData.data.comments.items.map(c => ({
      id: c.id,
      content: c.content.substring(0, 20) + '...',
      parentId: c.parentId,
      isEmptyParent: c.parentId === EMPTY_PARENT_ID
    })));
    
    // Filter out replies from top-level comments (only show comments without parentId)
    const topLevelComments = validatedData.data.comments.items.filter(
      comment => !comment.parentId || comment.parentId === EMPTY_PARENT_ID
    );
    
    console.log("Filtered top-level comments:", topLevelComments.length);
    
    const transformedComments = topLevelComments.map((comment) => ({
      id: comment.id,
      content: comment.content,
      author: {
        address: comment.author,
      },
      createdAt: new Date(parseInt(comment.createdAt)).toISOString(),
      targetUri: comment.targetUri,
      txHash: comment.txHash,
      replies: {
        results: comment.replies.items.map((reply) => ({
          id: reply.id,
          content: reply.content,
          author: {
            address: reply.author,
          },
          createdAt: new Date(parseInt(reply.createdAt)).toISOString(),
          targetUri: reply.targetUri,
          txHash: reply.txHash,
        })),
      },
    }));

    return res.status(200).json({
      results: transformedComments,
      pagination: {
        totalCount: topLevelComments.length, // Use filtered count instead of total
        hasNext: validatedData.data.comments.pageInfo.hasNextPage,
        endCursor: validatedData.data.comments.pageInfo.endCursor,
      },
    });
  } catch (error) {
    return res.status(500).json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

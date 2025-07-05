import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { getUserValidDogEventCount } from '~/server/api/dog-events';

const querySchema = z.object({
  address: z.string(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { address } = querySchema.parse(req.query);
    const count = await getUserValidDogEventCount(address);
    return res.status(200).json({ count });
  } catch (error) {
    console.error('Error fetching user hotdog count:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid query parameters', details: error.errors });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
}

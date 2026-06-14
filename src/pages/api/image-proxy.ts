import { type NextApiRequest, type NextApiResponse } from 'next';
import sharp from 'sharp';

const getDecodedChoiceCdnUrl = (url: string): string | null => {
  try {
    const parsedUrl = new URL(url);
    if (!parsedUrl.hostname.includes('choicecdn.com')) {
      return null;
    }

    const encodedSourceUrl = parsedUrl.pathname.split('/').filter(Boolean).at(-1);
    if (!encodedSourceUrl) {
      return null;
    }

    const paddedBase64 = encodedSourceUrl.padEnd(
      encodedSourceUrl.length + ((4 - (encodedSourceUrl.length % 4)) % 4),
      '='
    );
    const decodedUrl = Buffer.from(paddedBase64, 'base64').toString('utf8');

    if (!decodedUrl.startsWith('http://') && !decodedUrl.startsWith('https://')) {
      return null;
    }

    return decodedUrl;
  } catch {
    return null;
  }
};

const isHeicImage = (url: string, contentType: string | null) => {
  return (
    contentType?.toLowerCase().includes('heic') === true ||
    contentType?.toLowerCase().includes('heif') === true ||
    /\.(heic|heif)(?:$|[?#])/i.test(url)
  );
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.query;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  try {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Referer': 'https://logadog.xyz/',
    };

    // Fetch the image from the external URL. Some ChoiceCDN previews wrap the
    // original media URL and can fail for older HEIC uploads, so fall back to
    // the decoded source URL when available.
    let response = await fetch(url, {
      headers: {
        ...headers,
      },
    });
    let responseUrl = url;

    if (!response.ok) {
      const fallbackUrl = getDecodedChoiceCdnUrl(url);
      if (fallbackUrl) {
        response = await fetch(fallbackUrl, {
          headers: {
            ...headers,
          },
        });
        responseUrl = fallbackUrl;
      }
    }

    if (!response.ok) {
      console.error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      return res.status(response.status).json({ error: 'Failed to fetch image' });
    }

    let contentType = response.headers.get('content-type');
    let buffer: Buffer<ArrayBufferLike> = Buffer.from(await response.arrayBuffer());

    if (isHeicImage(responseUrl, contentType)) {
      buffer = await sharp(buffer).jpeg({ quality: 85 }).toBuffer();
      contentType = 'image/jpeg';
    }

    // Be more permissive with content types - some services return generic types
    if (contentType && !contentType.startsWith('image/') && !contentType.startsWith('application/octet-stream')) {
      console.warn(`Unexpected content type: ${contentType} for URL: ${url}`);
    }

    // Set appropriate headers
    res.setHeader('Content-Type', contentType ?? 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800'); // Cache for 1 day, serve stale for 1 week
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Stream the image data to the response
    res.end(buffer);
  } catch (error) {
    console.error('Error proxying image:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 
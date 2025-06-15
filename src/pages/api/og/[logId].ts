import { ImageResponse } from '@vercel/og';
import type { NextRequest } from 'next/server';
import { DEFAULT_CHAIN } from '~/constants/chains';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: NextRequest) {
  const { searchParams, pathname } = new URL(req.url);
  // logId can be path parameter or query
  const logId = pathname.split('/').pop() ?? searchParams.get('logId');
  if (!logId) {
    return new Response('Missing logId', { status: 400 });
  }

  const base = new URL(req.url).origin;

  const query = {
    chainId: DEFAULT_CHAIN.id,
    user: '0x0000000000000000000000000000000000000000',
    logId,
  };

  const hotdogRes = await fetch(`${base}/api/trpc/hotdog.getById?input=${encodeURIComponent(JSON.stringify(query))}`);
  if (!hotdogRes.ok) {
    return new Response('Failed to fetch log', { status: 500 });
  }
  const hotdogData = (await hotdogRes.json()).result?.data as any;

  if (!hotdogData?.hotdog) {
    return new Response('Log not found', { status: 404 });
  }
  const hotdog = hotdogData.hotdog;

  const profileRes = await fetch(`${base}/api/trpc/profile.getByAddress?input=${encodeURIComponent(JSON.stringify({ chainId: query.chainId, address: hotdog.eater }))}`);
  const profileData = profileRes.ok ? (await profileRes.json()).result?.data : null;
  const username = profileData?.username ?? hotdog.eater.slice(0,6);
  const avatar = profileData?.imgUrl ?? 'https://logadog.xyz/images/logo.png';

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 48,
          color: 'white',
        }}
      >
        <img src={hotdog.imageUri} style={{ objectFit: 'cover', width: '1200px', height: '630px', position: 'absolute', top:0, left:0 }} />
        <div style={{ position: 'absolute', bottom: 20, left: 20, display:'flex', alignItems:'center', gap:16, background:'rgba(0,0,0,0.5)', padding:'12px 20px', borderRadius:12 }}>
          <img src={avatar} width="64" height="64" style={{ borderRadius: '50%' }} />
          <div style={{ display:'flex', flexDirection:'column' }}>
            <div style={{ fontSize: 36 }}>{username}</div>
            <div style={{ fontSize: 24 }}>Log #{hotdog.logId}</div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}

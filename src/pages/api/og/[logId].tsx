import React from 'react';
import { ImageResponse } from '@vercel/og';
import type { NextRequest } from 'next/server';
import { DEFAULT_CHAIN, SUPPORTED_CHAINS } from '~/constants/chains';
import { createThirdwebClient, getContract } from 'thirdweb';
import { getSocialProfiles } from 'thirdweb/social';
import { env } from '~/env';
import { getHotdogLogsRange } from '~/thirdweb/84532/0x0b04ceb7542cc13e0e483e7b05907c31dbee4d7f';
import { LOG_A_DOG } from '~/constants/addresses';

export const config = {
  runtime: 'edge',
};

// Helper function to convert IPFS URLs to HTTP gateway URLs
function convertIpfsToHttp(ipfsUrl: string): string {
  if (ipfsUrl.startsWith('ipfs://')) {
    // Extract the hash and path from ipfs://QmHash/path
    const ipfsPath = ipfsUrl.replace('ipfs://', '');
    return `https://ipfs.io/ipfs/${ipfsPath}`;
  }
  return ipfsUrl; // Return as-is if not an IPFS URL
}

export default async function handler(req: NextRequest) {
  const { searchParams, pathname } = new URL(req.url);
  // logId can be path parameter or query
  const logId = pathname.split('/').pop() ?? searchParams.get('logId');
  if (!logId) {
    return new Response('Missing logId', { status: 400 });
  }

  const base = new URL(req.url).origin;

  // Directly call the contract instead of using tRPC
  const client = createThirdwebClient({
    secretKey: env.THIRDWEB_SECRET_KEY,
  });
  
  const chain = SUPPORTED_CHAINS.find(chain => chain.id === DEFAULT_CHAIN.id)!;
  const contract = getContract({
    address: LOG_A_DOG[DEFAULT_CHAIN.id]!,
    client,
    chain,
  });

  let hotdog: {
    logId: string;
    imageUri: string;
    metadataUri: string;
    timestamp: string;
    eater: string;
    logger: string;
  };
  let userHotdogCount = 0;
  try {
    const logs = await getHotdogLogsRange({
      contract,
      start: BigInt(logId),
      limit: 1n,
    });

    if (!logs || logs.length === 0) {
      return new Response('Log not found', { status: 404 });
    }

    hotdog = {
      logId: logs[0]!.logId.toString(),
      imageUri: logs[0]!.imageUri,
      metadataUri: logs[0]!.metadataUri,
      timestamp: logs[0]!.timestamp.toString(),
      eater: logs[0]!.eater,
      logger: logs[0]!.logger,
    };

    // Get all logs for this user to count their total hotdogs
    try {
      // Get a large range to find all user's logs (starting from log 0 to current log + some buffer)
      const allLogs = await getHotdogLogsRange({
        contract,
        start: 0n,
        limit: BigInt(parseInt(logId) + 100), // Get logs up to current + buffer
      });
      
      // Count logs where the eater matches this user
      userHotdogCount = allLogs.filter(log => log.eater.toLowerCase() === hotdog.eater.toLowerCase()).length;
    } catch (countError) {
      console.error('Error counting user hotdogs:', countError);
      userHotdogCount = 1; // Fallback to 1 since we know they have at least this log
    }
  } catch (error) {
    console.error('Error fetching hotdog log:', error);
    return new Response('Failed to fetch log', { status: 500 });
  }

  // Use thirdweb's social identity SDK to get user profiles
  let username = hotdog.eater.slice(0,6);
  let avatar = 'https://logadog.xyz/images/logo.png';
  
  try {
    const profiles = await getSocialProfiles({
      client,
      address: hotdog.eater,
    });

    if (profiles && profiles.length > 0) {
      // Prioritize profiles: Farcaster -> ENS -> Lens
      const farcasterProfile = profiles.find(p => p.type === 'farcaster');
      const ensProfile = profiles.find(p => p.type === 'ens');
      const lensProfile = profiles.find(p => p.type === 'lens');
      
      const profile = farcasterProfile ?? ensProfile ?? lensProfile ?? profiles[0];
      
      if (profile?.name) {
        username = profile.name;
      }
      if (profile?.avatar) {
        avatar = profile.avatar;
      }
    }
  } catch (error) {
    console.error('Error fetching social profiles:', error);
    // Fall back to shortened address
  }

  // Load Segment font
  const segmentFont = await fetch(new URL('/fonts/Segment/Segment-Bold.otf', base)).then(res => res.arrayBuffer());

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '800px',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 48,
          color: 'white',
          fontFamily: 'Segment',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={convertIpfsToHttp(hotdog.imageUri)} style={{ objectFit: 'cover', width: '1200px', height: '800px', position: 'absolute', top:0, left:0 }} alt="Hotdog image" />
        
        {/* Log a Dog title in upper left */}
        <div style={{ position: 'absolute', top: 20, left: 20, display:'flex', alignItems:'center', gap:12, background:'rgba(0,0,0,0.5)', padding:'12px 20px', borderRadius:12 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${base}/images/logo.png`} width="40" height="40" style={{ borderRadius: '4px' }} alt="Log a Dog logo" />
          <div style={{ fontSize: 36, display: 'flex', fontFamily: 'Segment' }}>Log a Dog</div>
        </div>

        {/* Username in bottom right */}
        <div style={{ position: 'absolute', bottom: 20, right: 20, display:'flex', alignItems:'center', gap:16, background:'rgba(0,0,0,0.5)', padding:'12px 20px', borderRadius:12 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={convertIpfsToHttp(avatar)} width="64" height="64" style={{ borderRadius: '50%' }} alt={`${username} avatar`} />
          <div style={{ display:'flex', flexDirection:'column' }}>
            <div style={{ fontSize: 36, display: 'flex', fontFamily: 'Segment' }}>{username}</div>
            <div style={{ fontSize: 24, display: 'flex', fontFamily: 'Segment' }}>{userHotdogCount} dog{userHotdogCount !== 1 ? 's' : ''} logged!</div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 800,
      fonts: [
        {
          name: 'Segment',
          data: segmentFont,
          style: 'normal',
          weight: 700,
        },
      ],
    }
  );
} 
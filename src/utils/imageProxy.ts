// Helper function to check if a URL needs to be proxied due to CORS issues
export const shouldProxyUrl = (url: string): boolean => {
  if (!url) return false;
  
  try {
    const urlObj = new URL(url);
    // List of domains that commonly have CORS issues
    const corsProblematicDomains = [
      'scontent-iad4-1.choicecdn.com',
      'scontent.choicecdn.com',
      'choicecdn.com',
      'pbs.twimg.com',
      'neynar.com',
      'magic.decentralized-content.com',
      // Add more domains as needed
    ];
    
    return corsProblematicDomains.some(domain => urlObj.hostname.includes(domain));
  } catch {
    return false;
  }
};

// Helper function to get the proxied URL
export const getProxiedUrl = (url: string): string => {
  if (!url) return url;
  
  if (shouldProxyUrl(url)) {
    return `/api/image-proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
}; 
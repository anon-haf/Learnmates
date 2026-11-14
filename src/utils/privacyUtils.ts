/**
 * Privacy utility functions for handling third-party links and embeds
 * Helps protect user privacy when interacting with Google Drive, YouTube, and other external services
 */

/**
 * Detects if a URL is from a known third-party service
 */
export const detectThirdPartyService = (url: string): string | null => {
  if (!url) return null;
  
  const patterns = {
    youtube: /(?:youtube\.com|youtu\.be)/i,
    googledrive: /drive\.google\.com/i,
    dropbox: /dropbox\.com/i,
    onedrive: /(?:onedrive\.live\.com|1drv\.ms)/i,
    googlesheets: /docs\.google\.com\/spreadsheets/i,
    googledocs: /docs\.google\.com\/document/i,
    googleforms: /forms\.google\.com/i,
    vimeo: /vimeo\.com/i,
  };

  for (const [service, pattern] of Object.entries(patterns)) {
    if (pattern.test(url)) {
      return service;
    }
  }
  
  return null;
};

/**
 * Strips tracking parameters from URLs to reduce privacy invasion
 */
export const stripTrackingParams = (url: string): string => {
  if (!url) return url;
  
  try {
    const urlObj = new URL(url);
    
    // Common tracking parameters to remove
    const trackingParams = [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_content',
      'utm_term',
      'fbclid',
      'gclid',
      'msclkid',
      'kwid',
      'mc_cid',
      'mc_eid',
      'uslt',
      'feature',
      'app',
      'SI',
    ];
    
    trackingParams.forEach(param => {
      urlObj.searchParams.delete(param);
    });
    
    return urlObj.toString();
  } catch {
    return url;
  }
};

/**
 * Extracts video ID from various YouTube URL formats
 */
export const extractYouTubeVideoId = (url: string): string | null => {
  if (!url) return null;
  
  try {
    const urlObj = new URL(url);
    
    // Check for v parameter in youtube.com URLs
    if (urlObj.hostname.includes('youtube.com')) {
      const videoId = urlObj.searchParams.get('v');
      if (videoId) return videoId;
    }
    
    // Check for youtu.be short URLs
    if (urlObj.hostname.includes('youtu.be')) {
      const videoId = urlObj.pathname.slice(1).split('?')[0].split('#')[0];
      if (videoId) return videoId;
    }
    
    // Check for embed URLs
    if (urlObj.hostname.includes('youtube')) {
      const pathMatch = urlObj.pathname.match(/\/embed\/([a-zA-Z0-9_-]+)/);
      if (pathMatch) return pathMatch[1];
    }
  } catch (e) {
    // URL parsing failed, try regex fallback
  }
  
  // Fallback to regex patterns if URL parsing fails
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]+)/,
    /youtube-nocookie\.com\/embed\/([a-zA-Z0-9_-]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  return null;
};

/**
 * Gets a human-readable description of the third-party service
 */
export const getServiceDescription = (service: string): string => {
  const descriptions: Record<string, string> = {
    youtube: 'YouTube - Video Hosting',
    googledrive: 'Google Drive - Document Hosting',
    dropbox: 'Dropbox - File Storage',
    onedrive: 'OneDrive - File Storage',
    googlesheets: 'Google Sheets - Spreadsheet',
    googledocs: 'Google Docs - Document Editor',
    googleforms: 'Google Forms - Survey Tool',
    vimeo: 'Vimeo - Video Hosting',
  };
  
  return descriptions[service] || service;
};

/**
 * Checks if user has consented to specific third-party service
 */
export const hasServiceConsent = (service: string): boolean => {
  try {
    const consent = localStorage.getItem(`consent_${service}`);
    return consent === 'true';
  } catch {
    return false;
  }
};

/**
 * Sets consent for specific third-party service
 */
export const setServiceConsent = (service: string, consent: boolean): void => {
  try {
    localStorage.setItem(`consent_${service}`, consent ? 'true' : 'false');
  } catch {
    console.warn(`Could not save consent for ${service}`);
  }
};

/**
 * Gets privacy warnings and tips for a given URL
 */
export const getPrivacyTips = (url: string): string[] => {
  const service = detectThirdPartyService(url);
  const tips: string[] = [];
  
  if (!service) return tips;
  
  tips.push(`This link will take you to ${getServiceDescription(service)}`);
  
  switch (service) {
    case 'youtube':
      tips.push('YouTube may track your viewing history and engagement');
      tips.push('Consider using a VPN if you want to remain anonymous');
      break;
    case 'googledrive':
    case 'googlesheets':
    case 'googledocs':
      tips.push('Google will know you accessed this document');
      tips.push('Your activity may be linked to your Google account');
      break;
    case 'dropbox':
      tips.push('Dropbox may track document access');
      break;
    case 'onedrive':
      tips.push('Microsoft may track your access to this content');
      break;
    case 'vimeo':
      tips.push('Vimeo may track your viewing behavior');
      break;
  }
  
  tips.push('You are about to leave this website');
  
  return tips;
};

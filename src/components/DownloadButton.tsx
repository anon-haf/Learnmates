import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { triggerXPNotification } from './XPRewardNotification';

interface DownloadButtonProps {
  resourceId: string;
  resourceType: 'file' | 'paper';
  resourceName: string;
}

export function DownloadButton({ resourceId, resourceType, resourceName }: DownloadButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('You must be logged in to download.');
        return;
      }

      // Fire XP request with keepalive BEFORE download — survives page navigation
      fetch('/api/xp/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        keepalive: true,
        body: JSON.stringify({ resourceId, resourceName, resourceType })
      }).then(async (response) => {
        if (response.ok) {
          const data = await response.json();
          if (data.xpAwarded > 0) {
            triggerXPNotification(
              data.xpAwarded, 
              resourceType === 'paper' ? 'paper_download' : 'download'
            );
          }
        }
      }).catch((error) => {
        console.error('Download XP error:', error);
      });

      // Proceed with the actual download
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('An error occurred during download.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white transition-colors bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Downloading...
        </span>
      ) : (
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
          </svg>
          Download {resourceName}
        </span>
      )}
    </button>
  );
}

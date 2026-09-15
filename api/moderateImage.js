import { createServerClient } from './lib/supabase-server.js';

function applyCors(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );
}

/**
 * POST /api/moderateImage
 * Body: { imageUrl: string }
 *
 * Checks an uploaded avatar image for NSFW content using the NSFWCheckers API.
 * If the image is flagged, it is deleted from Supabase Storage and an error is returned.
 */
export default async function handler(req, res) {
  applyCors(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authenticate the user
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    const supabase = createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { imageUrl, storagePath } = req.body;

    if (!imageUrl || !storagePath) {
      return res.status(400).json({ error: 'imageUrl and storagePath are required' });
    }

    // Verify the storage path belongs to this user
    if (!storagePath.startsWith(`${user.id}/`)) {
      return res.status(403).json({ error: 'Forbidden: path does not belong to user' });
    }

    // Call NSFWCheckers API to moderate the image
    let isNsfw = false;
    try {
      const moderationRes = await fetch('https://api.nsfwcheckers.com/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: imageUrl }),
      });

      if (moderationRes.ok) {
        const result = await moderationRes.json();
        // NSFWCheckers returns classifications — check for unsafe categories
        // The API typically returns { nsfw: boolean, ... } or a score
        if (result.nsfw === true || result.is_nsfw === true) {
          isNsfw = true;
        }
        // Also check if there's a score-based response
        if (typeof result.score === 'number' && result.score > 0.6) {
          isNsfw = true;
        }
        // Check classifications array if present
        if (result.classifications) {
          const unsafeLabels = ['nsfw', 'porn', 'sexy', 'hentai'];
          for (const cls of result.classifications) {
            if (unsafeLabels.includes(cls.label?.toLowerCase()) && cls.score > 0.5) {
              isNsfw = true;
              break;
            }
          }
        }
      } else {
        // If the moderation API is down, allow the upload but log the issue
        console.warn('NSFWCheckers API returned non-OK status:', moderationRes.status);
      }
    } catch (moderationError) {
      // If moderation API fails entirely, allow the upload but log it
      console.warn('NSFWCheckers API call failed:', moderationError.message);
    }

    if (isNsfw) {
      // Delete the uploaded image from storage
      const { error: deleteError } = await supabase.storage
        .from('avatars')
        .remove([storagePath]);

      if (deleteError) {
        console.error('Failed to delete flagged avatar:', deleteError);
      }

      // Clear avatar_url from profile
      await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', user.id);

      return res.status(400).json({
        error: 'Image flagged as inappropriate',
        message: 'Your profile picture was flagged as inappropriate and has been removed. Please upload a different image.',
      });
    }

    return res.status(200).json({ safe: true });
  } catch (error) {
    console.error('Image moderation error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

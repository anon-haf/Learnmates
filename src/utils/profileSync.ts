import { FavoriteSubject, saveFavoriteSubjects } from './favoriteSubjects';
import { supabase } from '../lib/supabaseClient';

export type UserProfile = {
  username: string | null;
  name: string | null;
  email?: string | null;
  study_level: string | null;
  boards: string[] | null;
  exam_session: string | null;
  profile_complete: boolean;
  avatar_url: string | null;
  is_private: boolean;
};

/** Max avatar file size: 2 MB */
const MAX_AVATAR_SIZE = 2 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export async function loadFavoriteSubjectsForUser(userId: string): Promise<FavoriteSubject[]> {
  const { data, error } = await supabase
    .from('user_favorite_subjects')
    .select('subject, level, board')
    .eq('user_id', userId);

  if (error) {
    console.error('Failed to load favorite subjects:', error.message);
    return [];
  }

  const subjects = (data ?? []).map((row) => ({
    subject: row.subject,
    level: row.level,
    board: row.board as FavoriteSubject['board'],
  }));

  if (subjects.length > 0) {
    saveFavoriteSubjects(subjects);
  }

  return subjects;
}

export async function saveFavoriteSubjectsForUser(
  userId: string,
  subjects: FavoriteSubject[]
): Promise<{ error: string | null }> {
  const { error: deleteError } = await supabase
    .from('user_favorite_subjects')
    .delete()
    .eq('user_id', userId);

  if (deleteError) {
    return { error: deleteError.message };
  }

  if (subjects.length === 0) {
    return { error: null };
  }

  const rows = subjects.map((item) => ({
    user_id: userId,
    subject: item.subject,
    level: item.level,
    board: item.board,
  }));

  const { error } = await supabase.from('user_favorite_subjects').insert(rows);

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

export async function syncFavoriteSubjectsToDb(
  userId: string,
  subjects: FavoriteSubject[]
): Promise<void> {
  const { error } = await saveFavoriteSubjectsForUser(userId, subjects);
  if (error) {
    console.error('Failed to sync favorite subjects:', error);
  }
}

export async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('username, name, email, study_level, boards, exam_session, profile_complete, avatar_url, is_private')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Failed to fetch profile:', error.message);
    return null;
  }

  return data;
}

export async function updateProfile(
  userId: string,
  updates: Partial<Pick<UserProfile, 'name' | 'study_level' | 'boards' | 'exam_session' | 'avatar_url' | 'is_private'>>
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);

  if (error) {
    console.error('Failed to update profile:', error.message);
    return { error: error.message };
  }

  return { error: null };
}

/**
 * Upload an avatar image for the user.
 * 1. Validates file type and size
 * 2. Uploads to Supabase Storage (avatars bucket)
 * 3. Calls the server-side NSFW moderation endpoint
 * 4. If safe → updates profile.avatar_url
 * 5. If unsafe → the server deletes the file and returns an error
 */
export async function uploadAvatar(
  userId: string,
  file: File
): Promise<{ url: string | null; error: string | null }> {
  // Client-side validation
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { url: null, error: 'Please upload a JPEG, PNG, WebP, or GIF image.' };
  }

  if (file.size > MAX_AVATAR_SIZE) {
    return { url: null, error: 'Image must be smaller than 2 MB.' };
  }

  // Build storage path: avatars/{userId}/avatar.{ext}
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const storagePath = `${userId}/avatar.${ext}`;

  // Upload to Supabase Storage (upsert to replace any existing avatar)
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type,
    });

  if (uploadError) {
    console.error('Avatar upload failed:', uploadError);
    return { url: null, error: 'Failed to upload image. Please try again.' };
  }

  // Get the public URL
  const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(storagePath);
  const publicUrl = urlData.publicUrl;

  // Call server-side NSFW moderation
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const res = await fetch('/api/moderateImage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ imageUrl: publicUrl, storagePath }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (res.status === 400 && body.message) {
          // Image was flagged — server already deleted it
          return { url: null, error: body.message };
        }
        // Other error — file is already uploaded, continue
        console.warn('Moderation check failed with status:', res.status);
      }
    }
  } catch (moderationErr) {
    // If moderation endpoint is unreachable, allow the upload
    console.warn('Moderation endpoint unreachable:', moderationErr);
  }

  // Update the profile with the new avatar URL (add cache-buster)
  const avatarUrl = `${publicUrl}?t=${Date.now()}`;
  const { error: profileError } = await updateProfile(userId, { avatar_url: avatarUrl });

  if (profileError) {
    return { url: null, error: 'Image uploaded but failed to update profile.' };
  }

  return { url: avatarUrl, error: null };
}

/**
 * Delete the user's current avatar from storage and clear avatar_url.
 */
export async function deleteAvatar(userId: string): Promise<{ error: string | null }> {
  // List files in the user's avatar folder and delete them
  const { data: files } = await supabase.storage.from('avatars').list(userId);

  if (files && files.length > 0) {
    const paths = files.map((f) => `${userId}/${f.name}`);
    await supabase.storage.from('avatars').remove(paths);
  }

  // Clear avatar_url in profile
  const { error } = await updateProfile(userId, { avatar_url: null });
  return { error };
}

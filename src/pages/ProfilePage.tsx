import { useEffect, useState, useRef, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import {
  BookOpen,
  Calendar,
  Building2,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Shield,
  Pencil,
  X,
  Check,
  Loader2,
  Lock,
  HeartHandshake,
  AlertTriangle,
  Trash2,
  Camera,
  Upload,
  Eye,
  EyeOff,
} from "lucide-react";
import { type BoardKey } from "../utils/curriculumData";
import { useAuth } from "../context/AuthContext";
import { useUser } from "../context/UserContext";
import {
  fetchProfile,
  loadFavoriteSubjectsForUser,
  type UserProfile,
  updateProfile,
  uploadAvatar,
  deleteAvatar,
} from "../utils/profileSync";
import { supabase } from '../lib/supabaseClient';
import type { FavoriteSubject } from "../utils/favoriteSubjects";
import { Link, useNavigate } from "react-router-dom";

const MATE_LEVELS = [
  { name: "Curious Mate", threshold: 0 },
  { name: "Seeking Mate", threshold: 150 },
  { name: "Discovering Mate", threshold: 350 },
  { name: "Learning Mate", threshold: 650 },
  { name: "Applying Mate", threshold: 1000 },
  { name: "Mastering Mate", threshold: 1500 },
  { name: "Absolute Mate", threshold: 2500 },
];

const ALL_BOARDS: BoardKey[] = ["cambridge", "edexcel"];

const LEVEL_OPTIONS = ["IGCSE", "A-Level"];

const SESSION_RULES: { value: string; boards: BoardKey[] }[] = [
  { value: "Oct/Nov", boards: ["cambridge", "edexcel"] },
  { value: "Jan", boards: ["edexcel"] },
  { value: "Feb/Mar", boards: ["cambridge"] },
  { value: "May/Jun", boards: ["cambridge", "edexcel"] },
];

const ProfilePageSkeleton = () => (
  <div className="space-y-6">
    <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-xl shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-800/80">
      <div className="relative px-5 pt-5 pb-6 sm:px-7">
        <div className="mt-3 grid w-full max-w-[520px] grid-cols-[4rem_1fr] gap-x-3 gap-y-3">
          <div className="row-span-2 h-16 w-16 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-700" />
          <div className="flex flex-col justify-start gap-2">
            <div className="h-8 w-40 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-4 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
          </div>
          <div className="flex flex-col justify-end gap-2">
            <div className="h-3 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-2 w-full animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-700 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="px-6 py-4">
            <div className="mb-2 h-3 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-4 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
          </div>
        ))}
      </div>
    </div>

    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-blue-200 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-5 w-5 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-5 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700"
          >
            <div className="flex-1 space-y-2 pr-4">
              <div className="h-4 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
              <div className="h-3 w-48 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            </div>
            <div className="h-5 w-5 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

const ProfilePage = () => {
  const { user: authUser } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [favoriteSubjects, setFavoriteSubjects] = useState<FavoriteSubject[]>(
    [],
  );
  const [displayName, setDisplayName] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [selectedBoards, setSelectedBoards] = useState<BoardKey[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [showAllSubjects, setShowAllSubjects] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Edit view state
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftLevel, setDraftLevel] = useState("");
  const [draftBoards, setDraftBoards] = useState<BoardKey[]>([]);
  const [draftSession, setDraftSession] = useState("");
  const [draftPrivate, setDraftPrivate] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authUser) return;

    const load = async () => {
      setIsLoadingProfile(true);
      try {
        const [profileData, subjects] = await Promise.all([
          fetchProfile(authUser.id),
          loadFavoriteSubjectsForUser(authUser.id),
        ]);

        setProfile(profileData);
        setFavoriteSubjects(subjects);
        setDisplayName(profileData?.name || user?.name || "");
        setSelectedLevel(profileData?.study_level ?? null);
        setSelectedBoards((profileData?.boards ?? []) as BoardKey[]);
        setSelectedSession(profileData?.exam_session ?? null);
        setAvatarUrl(profileData?.avatar_url ?? null);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    load();
  }, [authUser, user?.name]);

  const [matePoints, setMatePoints] = useState(0);
  const [isLoadingXP, setIsLoadingXP] = useState(true);

  useEffect(() => {
    async function fetchXP() {
      setIsLoadingXP(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data, error } = await supabase
          .from('user_xp')
          .select('total_xp')
          .eq('user_id', session.user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Failed to fetch XP data from Supabase:', error);
        }

        setMatePoints(data?.total_xp || 0);
      } catch (error) {
        console.error('Failed to fetch XP data', error);
      } finally {
        setIsLoadingXP(false);
      }
    }

    if (authUser) {
      fetchXP();
    }
  }, [authUser]);
  const currentMateLevelIndex = MATE_LEVELS.reduce(
    (acc, lvl, i) => (matePoints >= lvl.threshold ? i : acc),
    0,
  );
  const currentMateLevel = MATE_LEVELS[currentMateLevelIndex];
  const nextMateLevel = MATE_LEVELS[currentMateLevelIndex + 1];
  const mateProgressPercent = nextMateLevel
    ? Math.min(
      100,
      Math.max(
        0,
        ((matePoints - currentMateLevel.threshold) /
          (nextMateLevel.threshold - currentMateLevel.threshold)) *
        100,
      ),
    )
    : 100;

  const openEditView = () => {
    setDraftName(displayName);
    setDraftLevel(selectedLevel ?? "");
    setDraftBoards(selectedBoards);
    setDraftSession(selectedSession ?? "");
    setDraftPrivate(profile?.is_private ?? false);
    setAvatarError(null);
    setIsEditing(true);
  };

  const handleAvatarChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !authUser) return;

    setIsUploadingAvatar(true);
    setAvatarError(null);

    try {
      const { url, error } = await uploadAvatar(authUser.id, file);
      if (error) {
        setAvatarError(error);
      } else if (url) {
        setAvatarUrl(url);
      }
    } catch (err) {
      setAvatarError('An unexpected error occurred.');
      console.error(err);
    } finally {
      setIsUploadingAvatar(false);
      // Reset file input so same file can be re-selected
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  }, [authUser]);

  const handleDeleteAvatar = useCallback(async () => {
    if (!authUser) return;
    setIsUploadingAvatar(true);
    setAvatarError(null);
    try {
      const { error } = await deleteAvatar(authUser.id);
      if (error) {
        setAvatarError(error);
      } else {
        setAvatarUrl(null);
      }
    } finally {
      setIsUploadingAvatar(false);
    }
  }, [authUser]);

  const toggleDraftBoard = (board: BoardKey) => {
    setDraftBoards((prev) =>
      prev.includes(board) ? prev.filter((b) => b !== board) : [...prev, board],
    );
  };

  // Sessions available for whichever boards are currently selected in the edit form.
  // With no board selected yet, show every session.
  const availableSessions = SESSION_RULES.filter(
    (s) =>
      draftBoards.length === 0 || s.boards.some((b) => draftBoards.includes(b)),
  ).map((s) => s.value);

  useEffect(() => {
    if (
      isEditing &&
      draftSession &&
      !availableSessions.includes(draftSession)
    ) {
      setDraftSession("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftBoards, isEditing]);

  const handleSaveProfile = async () => {
    if (!authUser) return;
    setIsSaving(true);
    try {
      const { error } = await updateProfile(authUser.id, {
        name: draftName,
        study_level: draftLevel || null,
        boards: draftBoards,
        exam_session: draftSession || null,
        is_private: draftPrivate,
      });

      if (error) {
        console.error("Failed to save profile:", error);
      } else {
        setDisplayName(draftName);
        setSelectedLevel(draftLevel || null);
        setSelectedBoards(draftBoards);
        setSelectedSession(draftSession || null);
        if (profile) {
          setProfile({ ...profile, is_private: draftPrivate });
        }
        setIsEditing(false);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const boardDisplayName = (b: BoardKey) => {
    const map: Record<BoardKey, string> = {
      cambridge: "Cambridge",
      edexcel: "Edexcel",
    };
    return map[b] ?? b;
  };
  const boardSummary = selectedBoards.length
    ? selectedBoards.map(boardDisplayName).join(", ")
    : "—";
  const uniqueSubjects = Array.from(
    new Set(favoriteSubjects.map((subject) => subject.subject)),
  );
  const subjectPreview = uniqueSubjects.length
    ? uniqueSubjects.slice(0, 3).join(", ") +
    (uniqueSubjects.length > 3 ? "..." : "")
    : "—";
  const subjectSummary = uniqueSubjects.length
    ? uniqueSubjects.join(", ")
    : "—";

  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");

  const handleDeleteAccount = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase.rpc('delete_user_account');

      if (!error) {
        await supabase.auth.signOut();
        localStorage.clear();
        alert('Account successfully deleted.');
        navigate('/');
      } else {
        console.error('Failed to delete account:', error);
        alert('Failed to delete account. Please try again later.');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('An error occurred while deleting your account.');
    }
  };

  // Edit Mode Component
  const EditMode = () => (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[28px] border border-slate-200 bg-white shadow-xl shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-800/80 p-5 sm:p-7"
    >
      <div className="flex items-center justify-between mb-6">
        <h2
          className="text-2xl font-semibold text-slate-900 dark:text-white"
          style={{ fontFamily: "'Fraunces', serif" }}
        >
          Edit profile
        </h2>
        <button
          type="button"
          onClick={() => setIsEditing(false)}
          className="flex items-center gap-1 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-white transition"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-6 max-w-lg">
        {/* Locked fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Username
            </label>
            <div className="mt-1 flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 px-3 py-2.5 text-sm text-slate-500 dark:text-slate-400">
              <span className="truncate">@{profile?.username || "—"}</span>
              <Lock className="h-3.5 w-3.5 ml-auto shrink-0" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Email
            </label>
            <div className="mt-1 flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 px-3 py-2.5 text-sm text-slate-500 dark:text-slate-400">
              <span className="truncate">
                {profile?.email || authUser?.email || "—"}
              </span>
              <Lock className="h-3.5 w-3.5 ml-auto shrink-0" />
            </div>
          </div>
        </div>
        <p className="-mt-3 text-xs text-slate-400 dark:text-slate-500">
          Your username and email can't be changed.
        </p>

        {/* Avatar upload */}
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Profile picture
          </span>
          <div className="mt-2 flex items-center gap-4">
            <div className="relative group">
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 overflow-hidden transition hover:border-blue-400 dark:hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60"
              >
                {isUploadingAvatar ? (
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                ) : avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <Camera className="h-6 w-6 text-slate-400" />
                )}
              </button>
              {avatarUrl && !isUploadingAvatar && (
                <div className="absolute -top-1 -right-1 flex gap-1">
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm hover:bg-blue-700 transition"
                    title="Change photo"
                  >
                    <Upload className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteAvatar}
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-sm hover:bg-red-600 transition"
                    title="Remove photo"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-60"
              >
                {avatarUrl ? 'Change photo' : 'Upload a photo'}
              </button>
              <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                JPEG, PNG, WebP, or GIF. Max 2 MB.
              </p>
              {avatarError && (
                <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                  {avatarError}
                </p>
              )}
            </div>
          </div>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleAvatarChange}
            className="sr-only"
          />
        </div>

        {/* Editable fields */}
        <div>
          <label
            htmlFor="edit-display-name"
            className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
          >
            Display name
          </label>
          <input
            id="edit-display-name"
            type="text"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Your name"
          />
        </div>

        <div>
          <label
            htmlFor="edit-level"
            className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
          >
            Study level
          </label>
          <div className="relative mt-1">
            <select
              id="edit-level"
              value={draftLevel}
              onChange={(e) => setDraftLevel(e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">Select a level</option>
              {LEVEL_OPTIONS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          </div>
        </div>

        {/* Exam boards — placed before session since session options depend on it */}
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Exam boards
          </span>
          <div className="mt-2 flex flex-wrap gap-2">
            {ALL_BOARDS.map((board) => (
              <label
                key={board}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition ${draftBoards.includes(board)
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                  }`}
              >
                <input
                  type="checkbox"
                  checked={draftBoards.includes(board)}
                  onChange={() => toggleDraftBoard(board)}
                  className="sr-only"
                />
                {board === "cambridge" ? "Cambridge" : "Edexcel"}
              </label>
            ))}
          </div>
        </div>

        {/* Exam session — dynamic based on selected boards */}
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Exam session
          </span>
          <div className="relative mt-1">
            <select
              value={draftSession}
              onChange={(e) => setDraftSession(e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">Select a session</option>
              {availableSessions.map((session) => (
                <option key={session} value={session}>
                  {session}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          </div>
        </div>

        {/* Privacy toggle */}
        <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700/50 px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            {draftPrivate ? (
              <EyeOff className="h-5 w-5 text-slate-400 shrink-0" />
            ) : (
              <Eye className="h-5 w-5 text-slate-400 shrink-0" />
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                Private account
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Your profile won't appear on the leaderboard
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={draftPrivate}
            onClick={() => setDraftPrivate((prev) => !prev)}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-slate-800 ${
              draftPrivate
                ? 'bg-blue-600'
                : 'bg-slate-200 dark:bg-slate-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                draftPrivate ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Save button */}
        <div className="pt-4">
          <button
            type="button"
            onClick={handleSaveProfile}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:opacity-60"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save changes"
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );

  // View Mode Component
  const ViewMode = () => (
    <>
      {/* ID-card style header */}
      <div className="relative rounded-[28px] overflow-hidden shadow-xl shadow-slate-900/10 dark:shadow-black/30">
        {/* Dark mode background */}
        <div
          className="dark:block hidden relative px-5 pt-5 pb-6 sm:px-7"
          style={{
            backgroundColor: "#0C1B3A",
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.07) 1px, transparent 0), radial-gradient(760px circle at 88% -15%, rgba(255,255,255,0.05), transparent 60%)",
            backgroundSize: "18px 18px, auto",
          }}
        >
          <button
            type="button"
            onClick={openEditView}
            className="absolute right-5 top-5 sm:right-7 sm:top-5 flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90 ring-1 ring-white/20 transition hover:bg-white/20"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>

          <div className="mt-3 grid w-full max-w-[520px] grid-cols-[4rem_1fr] gap-x-3 gap-y-3">
            {/* Avatar — top left */}
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName || 'Avatar'}
                className="h-16 w-16 shrink-0 rounded-2xl object-cover ring-1 ring-white/20"
              />
            ) : (
              <div
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-2xl font-semibold text-white ring-1 ring-white/20"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                {(displayName || "S").charAt(0).toUpperCase()}
              </div>
            )}

            {/* Name + badge — top right */}
            <div className="min-w-0 flex items-start flex-col">
              <div className="flex items-center gap-2">
                <p
                  className="text-2xl sm:text-3xl font-semibold text-white truncate"
                  style={{ fontFamily: "'Fraunces', serif" }}
                >
                  {displayName || "Student"}
                </p>
                <span className="flex items-center gap-1 rounded-full bg-blue-900 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-blue-400 border-2 border-purple-800/50 shrink-0">
                  {currentMateLevel.name}
                </span>
              </div>

              {profile?.username && (
                <p className="mt-1 text-blue-200/80 text-sm">
                  @{profile.username}
                </p>
              )}
            </div>

            {/* Progress bar — spans both columns, below avatar and name */}
            <div className="col-span-2">
              {isLoadingXP ? (
                <div className="w-full space-y-2">
                  <div className="flex justify-between">
                    <div className="h-3 w-20 animate-pulse rounded bg-white/10" />
                    <div className="h-3 w-16 animate-pulse rounded bg-white/10" />
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-white/10 animate-pulse" />
                </div>
              ) : (
                <>
                  {/* Progress label: points/total + "Mate Points" */}
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs text-blue-200/70 tabular-nums">
                      {matePoints.toLocaleString()} /{" "}
                      {nextMateLevel
                        ? nextMateLevel.threshold.toLocaleString()
                        : "—"}{" "}
                      XP
                    </span>
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-white/60">
                      Mate Points
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${mateProgressPercent}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full rounded-full bg-blue-500"
                    />
                  </div>
                  <p className="mt-2 text-[10px] text-white/50 text-right leading-tight">
                    *During the beta testing phase, accumulated points are temporary and will be reset prior to official release.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Light mode background */}
        <div
          className="block dark:hidden relative px-5 pt-5 pb-6 sm:px-7"
          style={{
            backgroundColor: "#F1F5F9",
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(15, 23, 42, 0.05) 1px, transparent 0), radial-gradient(760px circle at 88% -15%, rgba(15, 23, 42, 0.03), transparent 60%)",
            backgroundSize: "18px 18px, auto",
          }}
        >
          <button
            type="button"
            onClick={openEditView}
            className="absolute right-5 top-5 sm:right-7 sm:top-5 flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>

          <div className="mt-3 grid w-full max-w-[520px] grid-cols-[4rem_1fr] gap-x-3 gap-y-3">
            {/* Avatar — top left */}
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName || 'Avatar'}
                className="h-16 w-16 shrink-0 rounded-2xl object-cover ring-1 ring-blue-200"
              />
            ) : (
              <div
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-600/10 text-2xl font-semibold text-blue-700 ring-1 ring-blue-200"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                {(displayName || "S").charAt(0).toUpperCase()}
              </div>
            )}

            {/* Name + badge — top right */}
            <div className="min-w-0 flex items-start flex-col">
              <div className="flex items-center gap-2">
                <p
                  className="text-2xl sm:text-3xl font-semibold text-slate-900 truncate"
                  style={{ fontFamily: "'Fraunces', serif" }}
                >
                  {displayName || "Student"}
                </p>
                <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700 border border-amber-300 shrink-0">
                  {currentMateLevel.name}
                </span>
              </div>

              {profile?.username && (
                <p className="mt-1 text-blue-600/80 text-sm">
                  @{profile.username}
                </p>
              )}
            </div>

            {/* Progress bar — spans both columns, below avatar and name */}
            <div className="col-span-2">
              {isLoadingXP ? (
                <div className="w-full space-y-2">
                  <div className="flex justify-between">
                    <div className="h-3 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                    <div className="h-3 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
                </div>
              ) : (
                <>
                  {/* Progress label: points/total + "Mate Points" */}
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs text-slate-500 tabular-nums">
                      {matePoints.toLocaleString()} /{" "}
                      {nextMateLevel
                        ? nextMateLevel.threshold.toLocaleString()
                        : "—"}{" "}
                      XP
                    </span>
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Mate Points
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${mateProgressPercent}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full rounded-full bg-blue-500"
                    />
                  </div>
                  <p className="mt-2 text-[10px] text-slate-400 text-right leading-tight">
                    *During the beta testing phase, accumulated points are temporary and will be reset prior to official release.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* stat strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800/80 rounded-b-[28px]">
          {[
            { icon: BarChart3, label: "Level", value: selectedLevel || "—" },
            { icon: Calendar, label: "Session", value: selectedSession || "—" },
            {
              icon: Building2,
              label: "Boards",
              value: boardSummary,
            },
            {
              icon: BookOpen,
              label: "Subjects",
              value: showAllSubjects ? subjectSummary : subjectPreview,
              isExpandable: uniqueSubjects.length > 3,
            },
          ].map(({ icon: Icon, label, value, isExpandable }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              className="px-6 py-4"
            >
              <div className="flex items-center gap-1.5 text-slate-400 dark:text-gray-500 mb-1">
                <Icon className="h-3.5 w-3.5" />
                <span className="text-[11px] font-semibold uppercase tracking-wide">
                  {label}
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white break-words">
                {value}
              </p>
              {isExpandable && (
                <button
                  type="button"
                  onClick={() => setShowAllSubjects((prev) => !prev)}
                  className="mt-3 inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300 dark:hover:bg-blue-500/20"
                >
                  {showAllSubjects ? (
                    <>
                      Show less <ChevronUp className="h-3.5 w-3.5" />
                    </>
                  ) : (
                    <>
                      Expand <ChevronDown className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Legal section */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-8"
      >
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-blue-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white mb-4">
            <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h3
              className="text-lg font-semibold"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              Legal
            </h3>
          </div>
          <div className="space-y-3">
            <Link
              to="/privacy"
              className="group flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors border border-gray-100 dark:border-gray-700"
            >
              <div className="flex-1 min-w-0 pr-4">
                <p className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Privacy Policy
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  How we collect, use, and protect your data
                </p>
              </div>
              <ChevronDown className="h-5 w-5 text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors flex-shrink-0" />
            </Link>
            <Link
              to="/terms"
              className="group flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors border border-gray-100 dark:border-gray-700"
            >
              <div className="flex-1 min-w-0 pr-4">
                <p className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Terms of Service
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Rules and guidelines for using Learnmates
                </p>
              </div>
              <ChevronDown className="h-5 w-5 text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors flex-shrink-0" />
            </Link>
            <Link
              to="/copyright"
              className="group flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors border border-gray-100 dark:border-gray-700"
            >
              <div className="flex-1 min-w-0 pr-4">
                <p className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Copyright & Attribution
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Content ownership, fair use, and licensing
                </p>
              </div>
              <ChevronDown className="h-5 w-5 text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors flex-shrink-0" />
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Help Us section */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6"
      >
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-rose-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white mb-4">
            <HeartHandshake className="h-5 w-5 text-rose-500 dark:text-rose-400" />
            <h3
              className="text-lg font-semibold"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              Help Us
            </h3>
          </div>
          <div className="space-y-3">
            <Link
              to="/contribute"
              className="group flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors border border-gray-100 dark:border-gray-700"
            >
              <div className="flex-1 min-w-0 pr-4">
                <p className="font-medium text-gray-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                  Contribute
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Help us add more materials and features
                </p>
              </div>
              <ChevronDown className="h-5 w-5 text-gray-400 group-hover:text-rose-500 dark:group-hover:text-rose-400 transition-colors flex-shrink-0 -rotate-90" />
            </Link>
            <Link
              to="/donate"
              className="group flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors border border-gray-100 dark:border-gray-700"
            >
              <div className="flex-1 min-w-0 pr-4">
                <p className="font-medium text-gray-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                  Donate
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Support the platform's running costs
                </p>
              </div>
              <ChevronDown className="h-5 w-5 text-gray-400 group-hover:text-rose-500 dark:group-hover:text-rose-400 transition-colors flex-shrink-0 -rotate-90" />
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Danger Zone */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-6"
      >
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-red-200 dark:border-red-900/50">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-4">
            <AlertTriangle className="h-5 w-5" />
            <h3
              className="text-lg font-semibold"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              Danger Zone
            </h3>
          </div>
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="font-medium text-red-900 dark:text-red-400">
                  Delete Account
                </p>
                <p className="text-sm text-red-700/70 dark:text-red-400/70 mt-0.5 max-w-md">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
              </div>
              {!isConfirmingDelete ? (
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(true)}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 font-medium transition-colors select-none shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Account
                </button>
              ) : (
                <div className="flex flex-col gap-3 sm:items-end w-full sm:w-auto">
                  <div className="flex flex-col gap-1 w-full sm:w-64">
                    <label className="text-xs font-medium text-red-700 dark:text-red-400">
                      Type "delete" to confirm:
                    </label>
                    <input
                      type="text"
                      value={deleteConfirmationText}
                      onChange={(e) => setDeleteConfirmationText(e.target.value)}
                      placeholder="delete"
                      className="w-full rounded-lg border border-red-200 dark:border-red-800 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    />
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setIsConfirmingDelete(false);
                        setDeleteConfirmationText("");
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteAccount}
                      disabled={deleteConfirmationText.toLowerCase() !== 'delete'}
                      className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors disabled:opacity-50 text-sm disabled:cursor-not-allowed"
                    >
                      <Trash2 className="h-4 w-4" />
                      Confirm Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );

  return (
    <div>
      <Helmet>
        <title>Learnmates | Profile</title>
        <meta
          name="description"
          content="Manage your Learnmates profile and study preferences."
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </Helmet>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto space-y-6"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-blue-500 dark:text-blue-400 mb-1">
            Learnmates
          </p>
          <h1
            className="text-4xl font-semibold text-slate-900 dark:text-white"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            My profile
          </h1>
        </div>

        {isLoadingProfile ? (
          <ProfilePageSkeleton />
        ) : isEditing ? (
          EditMode()
        ) : (
          ViewMode()
        )}
      </motion.div>
    </div>
  );
};

export default ProfilePage;

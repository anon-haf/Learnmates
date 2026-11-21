import { BoardKey } from './curriculumData';
import { topicalConfigs } from '../pages/topicalpagesdata';
import { withBase } from './routeBase';

export interface FavoriteSubject {
  subject: string;
  level: string;
  board: BoardKey;
}

export const FAVORITE_SUBJECTS_KEY = 'favoriteSubjects';

export function loadFavoriteSubjects(): FavoriteSubject[] {
  try {
    const stored = localStorage.getItem(FAVORITE_SUBJECTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveFavoriteSubjects(subjects: FavoriteSubject[]): void {
  localStorage.setItem(FAVORITE_SUBJECTS_KEY, JSON.stringify(subjects));
  window.dispatchEvent(new CustomEvent('favoriteSubjectsUpdated'));
}

export const getLevelKey = (level: string) => (level.toLowerCase() === 'a-level' ? 'a-level' : 'igcse');

export function getSubjectPaths(subject: FavoriteSubject, base = '') {
  const levelKey = getLevelKey(subject.level);
  const pathBase = `${levelKey}/${subject.board}/${subject.subject}`;
  return {
    resources: withBase(base, `/curriculum/${pathBase}`),
    topicals: withBase(base, `/topicals/${pathBase}`),
    pastpapers: withBase(base, `/pastpapers/${pathBase}`),

  };
}

export function hasTopicalsForSubject(subject: FavoriteSubject): boolean {
  const levelKey = getLevelKey(subject.level);
  return topicalConfigs.some(
    (c) => c.level === levelKey && c.board === subject.board && c.subject === subject.subject
  );
}

// Normalises a topic/subtopic title for comparison: lowercases, drops a leading
// enumeration like "1 " / "1.1 " / "3A ", and collapses punctuation to spaces.
const normalizeTopicName = (value: string) =>
  value
    .toLowerCase()
    .replace(/^\s*\d+(?:\.\d+)*[.)]?\s*/, '')
    .replace(/^\s*[a-z]?\d+[a-z]?\s+/, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const tokenizeTopicName = (value: string) => normalizeTopicName(value).split(' ').filter(Boolean);

// Token-overlap similarity between a curriculum topic and a config topic.
// `score` is the better of Jaccard and containment so that both a superset with
// extra words ("Waves" -> "3 Waves") and an exact match score 1.
const scoreTopicMatch = (targetTokens: string[], candidateTokens: string[]) => {
  if (targetTokens.length === 0 || candidateTokens.length === 0) {
    return { score: 0, jaccard: 0 };
  }
  const candidateSet = new Set(candidateTokens);
  const targetSet = new Set(targetTokens);
  let intersection = 0;
  targetSet.forEach((token) => {
    if (candidateSet.has(token)) intersection++;
  });
  const union = new Set([...targetTokens, ...candidateTokens]).size;
  const jaccard = intersection / union;
  const containment = intersection / targetSet.size;
  return { score: Math.max(jaccard, containment), jaccard };
};

// Minimum similarity before we trust a match; below this we prefer no
// preselection over a misleading one.
const MIN_TOPIC_MATCH_SCORE = 0.34;

/**
 * Best-effort mapping from a curriculum topic title (e.g. "States of matter")
 * to the closest-matching topic in the topical-page config for the given
 * subject. Returns the simplified `unit||name;;unit||name` selection string
 * understood by TopicalPages' `topics` query param, or null when nothing is
 * close enough.
 */
export function getTopicalSelectionQuery(subject: FavoriteSubject, topicTitle: string): string | null {
  const levelKey = getLevelKey(subject.level);
  const cfg = topicalConfigs.find(
    (c) => c.level === levelKey && c.board === subject.board && c.subject === subject.subject
  );
  if (!cfg) return null;

  const targetTokens = tokenizeTopicName(topicTitle);
  if (targetTokens.length === 0) return null;

  let best: { unit: string; names: string[]; score: number; jaccard: number; size: number } | null = null;

  for (const unit of cfg.units) {
    for (const topic of unit.topics) {
      const candidateTokens = tokenizeTopicName(topic.topic);
      const { score, jaccard } = scoreTopicMatch(targetTokens, candidateTokens);

      const isBetter =
        !best ||
        score > best.score ||
        (score === best.score &&
          (jaccard > best.jaccard ||
            (jaccard === best.jaccard && candidateTokens.length < best.size)));

      if (isBetter) {
        best = {
          unit: unit.unit,
          names: topic.subtopics && topic.subtopics.length > 0
            ? topic.subtopics.map((sub) => sub.subtopic)
            : [topic.topic],
          score,
          jaccard,
          size: candidateTokens.length,
        };
      }
    }
  }

  if (!best || best.score < MIN_TOPIC_MATCH_SCORE) return null;

  const { unit, names } = best;
  return names.map((name) => `${unit}||${name}`).join(';;');
}

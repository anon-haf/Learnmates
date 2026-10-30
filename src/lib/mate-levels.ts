export const MATE_LEVELS = [
  { name: "Beginner", threshold: 0 },
  { name: "Explorer", threshold: 150 },
  { name: "Learner", threshold: 350 },
  { name: "Scholar", threshold: 650 },
  { name: "Practitioner", threshold: 1000 },
  { name: "Expert", threshold: 1500 },
  { name: "Master", threshold: 2500 },
] as const;

export function getMateLevel(xp: number) {
  let currentLevel = MATE_LEVELS[0];
  for (const level of MATE_LEVELS) {
    if (xp < level.threshold) break;
    currentLevel = level;
  }
  return currentLevel;
}

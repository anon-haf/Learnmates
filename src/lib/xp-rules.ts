export const XP_RULES = {
  active_time: {
    amountPerTenMinutes: 25,
    dailyCap: 100,
    checkInterval: 600000, // 10 minutes
    requireTabVisible: true,
    requireMouseMoving: true
  },
  question_view: {
    amountPerView: 5,
    dailyCap: 100,
    minViewDuration: 25, // seconds
    requireSawQuestion: true,
    requireSawMS: true
  },
  download: {
    amount: 25,
    dailyCap: 75
  },
  paper_download: {
    amount: 30,
    dailyCap: 60
  },
  topical_paper_download: {
    amount: 30,
    dailyCap: 60
  },
  streak_visit: {
    baseAmount: 10, // streak * 10
    dailyCap: 100
  }
};

export function calculateLevel(xp: number): number {
  return Math.floor(xp / 100) + 1;
}

export function calculateNextLevelXP(xp: number): number {
  const level = Math.floor(xp / 100) + 1;
  return level * 100;
}

export function calculateProgress(xp: number): number {
  const currentLevel = Math.floor(xp / 100);
  const currentLevelXP = currentLevel * 100;
  const nextLevelXP = (currentLevel + 1) * 100;
  return ((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
}

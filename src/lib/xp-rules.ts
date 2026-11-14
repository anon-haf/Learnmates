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


export const DOWNLOAD_XP_RULES = {
  download: {
    amount: 25,
    dailyCap: 75,
  },
  paper_download: {
    amount: 30,
    dailyCap: 60,
  },
  topical_paper_download: {
    amount: 30,
    dailyCap: 60,
  },
};

export function downloadActionForResourceType(resourceType) {
  if (resourceType === 'paper') return 'paper_download';
  if (resourceType === 'topical_paper') return 'topical_paper_download';
  return 'download';
}

export function downloadXpParamsForResourceType(resourceType) {
  const action = downloadActionForResourceType(resourceType);
  const rules = DOWNLOAD_XP_RULES[action];
  return { action, amount: rules.amount, dailyCap: rules.dailyCap };
}

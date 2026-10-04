import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  downloadActionForResourceType,
  downloadXpParamsForResourceType,
  DOWNLOAD_XP_RULES,
} from './download-xp-rules.js';

describe('download XP rules', () => {
  it('maps resource types to existing actions and amounts', () => {
    assert.equal(downloadActionForResourceType('file'), 'download');
    assert.equal(downloadActionForResourceType('paper'), 'paper_download');
    assert.equal(downloadActionForResourceType('topical_paper'), 'topical_paper_download');

    assert.deepEqual(downloadXpParamsForResourceType('file'), {
      action: 'download',
      amount: DOWNLOAD_XP_RULES.download.amount,
      dailyCap: DOWNLOAD_XP_RULES.download.dailyCap,
    });
    assert.deepEqual(downloadXpParamsForResourceType('paper'), {
      action: 'paper_download',
      amount: 30,
      dailyCap: 60,
    });
    assert.deepEqual(downloadXpParamsForResourceType('topical_paper'), {
      action: 'topical_paper_download',
      amount: 30,
      dailyCap: 60,
    });
  });
});

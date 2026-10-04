import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { awardCappedXP } from './award-xp.js';

describe('awardCappedXP', () => {
  it('returns 0 for non-positive amounts without calling RPC', async () => {
    const rpc = mock.fn(async () => ({ data: 25, error: null }));
    const supabase = { rpc };
    assert.equal(await awardCappedXP(supabase, {
      userId: 'u1',
      action: 'download',
      amount: 0,
      dailyCap: 75,
    }), 0);
    assert.equal(rpc.mock.calls.length, 0);
  });

  it('delegates to fn_award_capped_xp and returns awarded xp', async () => {
    const rpc = mock.fn(async () => ({ data: 25, error: null }));
    const supabase = { rpc };
    const awarded = await awardCappedXP(supabase, {
      userId: 'user-uuid',
      action: 'download',
      refId: 'resource-1',
      amount: 25,
      dailyCap: 75,
      metadata: { file_name: 'notes.pdf' },
    });
    assert.equal(awarded, 25);
    assert.equal(rpc.mock.calls.length, 1);
    assert.deepEqual(rpc.mock.calls[0].arguments[0], 'fn_award_capped_xp');
    assert.equal(rpc.mock.calls[0].arguments[1].p_ref_id, 'resource-1');
  });

  it('throws when RPC fails (no partial user_xp update)', async () => {
    const rpc = mock.fn(async () => ({
      data: null,
      error: { code: '42883', message: 'function does not exist' },
    }));
    const supabase = { rpc };
    await assert.rejects(
      () => awardCappedXP(supabase, {
        userId: 'user-uuid',
        action: 'download',
        refId: 'resource-1',
        amount: 25,
        dailyCap: 75,
      }),
      (err) => err?.message?.includes('function does not exist')
    );
  });

  it('treats duplicate/idempotent RPC zero as success', async () => {
    const rpc = mock.fn(async () => ({ data: 0, error: null }));
    const supabase = { rpc };
    assert.equal(await awardCappedXP(supabase, {
      userId: 'user-uuid',
      action: 'paper_download',
      refId: 'same-ref',
      amount: 30,
      dailyCap: 60,
    }), 0);
  });
});

import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { awardCappedXP } from './award-xp.js';
import { awardCappedXPFallback } from './award-xp-fallback.js';

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

  it('does not retry through the fallback when the RPC returns an uncertain error', async () => {
    const rpc = mock.fn(async () => ({
      data: null,
      error: { code: '08006', message: 'Connection lost' },
    }));
    const from = mock.fn(() => {
      throw new Error('Fallback must not run after an uncertain RPC result');
    });
    const supabase = { rpc, from };

    assert.equal(await awardCappedXP(supabase, {
      userId: 'user-uuid',
      action: 'active_time',
      amount: 25,
      dailyCap: 100,
    }), 0);
    assert.equal(rpc.mock.calls.length, 1);
    assert.equal(from.mock.calls.length, 0);
  });

  it('does not award streak XP twice for the same daily reference', async () => {
    const dailyEventsQuery = {
      eq() { return this; },
      gte: async () => ({ data: [], error: null }),
    };
    const duplicateQuery = {
      eq() { return this; },
      maybeSingle: async () => ({ data: { id: 'existing-event' }, error: null }),
    };
    const insert = mock.fn(async () => {
      throw new Error('Duplicate streak event should not be inserted');
    });
    const supabase = {
      from: mock.fn(() => ({
        select(column) {
          return column === 'xp_awarded' ? dailyEventsQuery : duplicateQuery;
        },
        insert,
      })),
    };

    const awarded = await awardCappedXPFallback(supabase, {
      userId: 'user-uuid',
      action: 'streak_visit',
      refId: '2026-10-20',
      amount: 10,
      dailyCap: 100,
    });

    assert.equal(awarded, 0);
    assert.equal(insert.mock.calls.length, 0);
    assert.equal(supabase.from.mock.calls.length, 2);
  });

  it('does not award a question-view event twice for the same daily reference', async () => {
    const dailyEventsQuery = {
      eq() { return this; },
      gte: async () => ({ data: [], error: null }),
    };
    const duplicateQuery = {
      eq() { return this; },
      maybeSingle: async () => ({ data: { id: 'existing-event' }, error: null }),
    };
    const insert = mock.fn(async () => {
      throw new Error('Duplicate question event should not be inserted');
    });
    const supabase = {
      from: mock.fn(() => ({
        select(column) {
          return column === 'xp_awarded' ? dailyEventsQuery : duplicateQuery;
        },
        insert,
      })),
    };

    const awarded = await awardCappedXPFallback(supabase, {
      userId: 'user-uuid',
      action: 'question_view',
      refId: '2026-10-20:question-1',
      amount: 5,
      dailyCap: 100,
    });

    assert.equal(awarded, 0);
    assert.equal(insert.mock.calls.length, 0);
    assert.equal(supabase.from.mock.calls.length, 2);
  });
});

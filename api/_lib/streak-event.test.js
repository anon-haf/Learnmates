import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { hasStreakEventOnUtcDay } from './streak-event.js';

function createSupabaseQuery(data, error = null) {
  const filters = [];
  const query = {
    from(table) {
      assert.equal(table, 'xp_events');
      return this;
    },
    select(columns) {
      assert.equal(columns, 'id');
      return this;
    },
    eq(column, value) {
      filters.push(['eq', column, value]);
      return this;
    },
    gte(column, value) {
      filters.push(['gte', column, value]);
      return this;
    },
    lt(column, value) {
      filters.push(['lt', column, value]);
      return this;
    },
    limit(value) {
      assert.equal(value, 1);
      return this;
    },
    async maybeSingle() {
      return { data, error };
    },
  };

  return { query, filters };
}

describe('hasStreakEventOnUtcDay', () => {
  it('finds a streak event within the requested UTC day', async () => {
    const { query, filters } = createSupabaseQuery({ id: 'event-1' });

    assert.equal(
      await hasStreakEventOnUtcDay(query, 'user-1', new Date('2026-10-26T19:00:00Z')),
      true
    );
    assert.deepEqual(filters, [
      ['eq', 'user_id', 'user-1'],
      ['eq', 'action', 'streak_visit'],
      ['gte', 'created_at', '2026-10-26T00:00:00.000Z'],
      ['lt', 'created_at', '2026-10-27T00:00:00.000Z'],
    ]);
  });

  it('returns false when no streak event exists that day', async () => {
    const { query } = createSupabaseQuery(null);

    assert.equal(
      await hasStreakEventOnUtcDay(query, 'user-1', new Date('2026-10-26T19:00:00Z')),
      false
    );
  });

  it('throws if the event lookup fails', async () => {
    const lookupError = new Error('Database unavailable');
    const { query } = createSupabaseQuery(null, lookupError);

    await assert.rejects(
      hasStreakEventOnUtcDay(query, 'user-1', new Date('2026-10-26T19:00:00Z')),
      lookupError
    );
  });
});

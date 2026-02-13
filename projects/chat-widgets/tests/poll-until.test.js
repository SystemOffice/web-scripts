import { pollUntil } from '../poll-until.js';

test('test_pollUntil_immediatelyTrue_resolvesWithValue', async () => {
  const result = await pollUntil(() => 'found', { interval: 10, maxWait: 500 });

  expect(result).toBe('found');
});

test('test_pollUntil_becomesTrue_resolvesWhenReady', async () => {
  let count = 0;

  const result = await pollUntil(() => {
    count++;
    return count >= 3 ? 'ready' : null;
  }, { interval: 10, maxWait: 1000 });

  expect(result).toBe('ready');
  expect(count).toBeGreaterThanOrEqual(3);
});

test('test_pollUntil_neverTrue_rejectsAfterMaxWait', async () => {
  await expect(
    pollUntil(() => null, { interval: 10, maxWait: 80 })
  ).rejects.toThrow('pollUntil timed out after 80ms');
});

test('test_pollUntil_returnsFalsyThenTruthy_resolvesWithTruthyValue', async () => {
  let callCount = 0;

  const result = await pollUntil(() => {
    callCount++;
    if (callCount < 5) return false;
    return { element: 'div' };
  }, { interval: 10, maxWait: 1000 });

  expect(result).toEqual({ element: 'div' });
});

test('test_pollUntil_defaultOptions_usesReasonableDefaults', async () => {
  const result = await pollUntil(() => 'immediate');

  expect(result).toBe('immediate');
});

test('test_pollUntil_resolvesBeforeMaxWait_doesNotWaitFull', async () => {
  const start = Date.now();

  await pollUntil(() => {
    return Date.now() - start >= 30 ? 'ready' : null;
  }, { interval: 10, maxWait: 5000 });

  const elapsed = Date.now() - start;
  expect(elapsed).toBeLessThan(200);
});

import { WidgetConfig } from '../config.js';

// WidgetConfig constructor tests
test('test_constructor_noOverrides_usesDefaults', () => {
  const config = new WidgetConfig();
  expect(config.get('ui.position.bottom')).toBe('32px');
  expect(config.get('ui.position.right')).toBe('32px');
  expect(config.get('timing.firstActivationDelay')).toBe(1500);
});

test('test_constructor_withOverrides_mergesCorrectly', () => {
  const config = new WidgetConfig({ timing: { firstActivationDelay: 500 } });
  expect(config.get('timing.firstActivationDelay')).toBe(500);
  expect(config.get('timing.subsequentActivationDelay')).toBe(300);
});

test('test_constructor_negativeActivationDelay_throwsError', () => {
  expect(() => {
    new WidgetConfig({ timing: { firstActivationDelay: -1 } });
  }).toThrow('Activation delays must be non-negative');
});

test('test_constructor_backoffBaseLessThanOne_throwsError', () => {
  expect(() => {
    new WidgetConfig({ retry: { exponentialBackoffBase: 0.5 } });
  }).toThrow('Exponential backoff base must be greater than 1');
});

// WidgetConfig.get tests
test('test_get_validDotNotationPath_returnsValue', () => {
  const config = new WidgetConfig();
  expect(config.get('retry.invokeMaxRetries')).toBe(50);
});

test('test_get_unknownPath_returnsUndefined', () => {
  const config = new WidgetConfig();
  expect(config.get('nonexistent.path')).toBeUndefined();
});

// WidgetConfig.set tests
test('test_set_validDotNotationPath_updatesValue', () => {
  const config = new WidgetConfig();
  config.set('ui.position.bottom', '64px');
  expect(config.get('ui.position.bottom')).toBe('64px');
});

// WidgetConfig.calculateBackoffDelay tests
test('test_calculateBackoffDelay_attemptZero_returnsBaseDelay', () => {
  const config = new WidgetConfig();
  const delay = config.calculateBackoffDelay(0);
  expect(delay).toBe(200);
});

test('test_calculateBackoffDelay_largeAttempt_capsAtMaxDelay', () => {
  const config = new WidgetConfig();
  const delay = config.calculateBackoffDelay(100);
  expect(delay).toBeLessThanOrEqual(2000);
});

// WidgetConfig.getTimingConfig tests
test('test_getTimingConfig_noWidgetId_returnsGlobalTiming', () => {
  const config = new WidgetConfig();
  const timing = config.getTimingConfig();
  expect(timing.firstActivationDelay).toBe(1500);
});

test('test_getTimingConfig_unknownWidgetId_returnsGlobalTiming', () => {
  const config = new WidgetConfig();
  const timing = config.getTimingConfig('unknown-widget');
  expect(timing.firstActivationDelay).toBe(1500);
});

// WidgetConfig.getRetryConfig tests
test('test_getRetryConfig_noWidgetId_returnsGlobalRetry', () => {
  const config = new WidgetConfig();
  const retryConfig = config.getRetryConfig();
  expect(retryConfig.invokeMaxRetries).toBe(50);
});

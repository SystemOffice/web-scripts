import { jest } from '@jest/globals';

// Set up browser globals before logger.js is imported, as its module-level
// code calls `new WidgetLogger()` which accesses performance.
globalThis.performance = { now: () => 0 };

const { WidgetLogger } = await import('../logger.js');

beforeEach(() => {
  jest.spyOn(console, 'debug').mockImplementation(() => {});
  jest.spyOn(console, 'info').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

// WidgetLogger.shouldLog tests
test('test_shouldLog_sameLevel_returnsTrue', () => {
  const logger = new WidgetLogger();
  expect(logger.shouldLog('warn')).toBe(true);
});

test('test_shouldLog_higherLevel_returnsTrue', () => {
  const logger = new WidgetLogger();
  expect(logger.shouldLog('error')).toBe(true);
});

test('test_shouldLog_lowerLevel_returnsFalse', () => {
  const logger = new WidgetLogger();
  expect(logger.shouldLog('debug')).toBe(false);
});

// WidgetLogger.format tests
test('test_format_withWidgetId_includesWidgetId', () => {
  const logger = new WidgetLogger();
  expect(logger.format('zoom', 'test message')).toBe('[zoom] test message');
});

test('test_format_noWidgetId_usesSYSTEM', () => {
  const logger = new WidgetLogger();
  expect(logger.format(null, 'test message')).toBe('[SYSTEM] test message');
});

// WidgetLogger console output tests
test('test_warn_aboveConfigLevel_callsConsoleWarn', () => {
  const logger = new WidgetLogger();
  logger.warn('something wrong', {}, 'zoom');
  expect(console.warn).toHaveBeenCalledWith('[zoom] something wrong', {});
});

test('test_error_alwaysCallsConsoleError', () => {
  const logger = new WidgetLogger();
  logger.error('something failed', {}, 'zoom');
  expect(console.error).toHaveBeenCalledWith('[zoom] something failed', {});
});

test('test_debug_belowConfigLevel_doesNotCallConsoleDebug', () => {
  const logger = new WidgetLogger();
  logger.debug('verbose message', {}, 'zoom');
  expect(console.debug).not.toHaveBeenCalled();
});

// WidgetLogger.logScriptLoad tests
test('test_logScriptLoad_success_routesToInfo', () => {
  const logger = new WidgetLogger();
  jest.spyOn(logger, 'info');
  logger.logScriptLoad('zoom', 'https://example.com/sdk.js', true, 120);
  expect(logger.info).toHaveBeenCalled();
});

test('test_logScriptLoad_failure_routesToError', () => {
  const logger = new WidgetLogger();
  jest.spyOn(logger, 'error');
  const error = new Error('load failed');
  logger.logScriptLoad('zoom', 'https://example.com/sdk.js', false, null, error);
  expect(logger.error).toHaveBeenCalled();
});

// WidgetLogger.startTimer tests
test('test_startTimer_stop_returnsDuration', () => {
  let callCount = 0;
  globalThis.performance = { now: () => callCount++ * 100 };

  const logger = new WidgetLogger();
  const timer = logger.startTimer('mount', 'zoom');
  const duration = timer.stop();

  expect(typeof duration).toBe('number');
});

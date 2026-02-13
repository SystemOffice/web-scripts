import { jest } from '@jest/globals';
import { mountAllWidgets } from '../mount-widgets.js';

function createMockWidget(id, mountFn) {
  return { id, mount: jest.fn(mountFn || (() => Promise.resolve())) };
}

function createMockLogger() {
  return { error: jest.fn() };
}

test('test_mountAllWidgets_multipleWidgets_mountsInParallel', async () => {
  const callOrder = [];

  const slow = createMockWidget('slow', () => new Promise(resolve => {
    callOrder.push('slow-start');
    setTimeout(() => { callOrder.push('slow-end'); resolve(); }, 50);
  }));

  const fast = createMockWidget('fast', () => new Promise(resolve => {
    callOrder.push('fast-start');
    setTimeout(() => { callOrder.push('fast-end'); resolve(); }, 10);
  }));

  await mountAllWidgets([slow, fast], createMockLogger());

  expect(callOrder[0]).toBe('slow-start');
  expect(callOrder[1]).toBe('fast-start');
  expect(callOrder[2]).toBe('fast-end');
  expect(callOrder[3]).toBe('slow-end');
});

test('test_mountAllWidgets_oneFails_otherStillMounts', async () => {
  const failing = createMockWidget('broken', () => Promise.reject(new Error('load failed')));
  const healthy = createMockWidget('healthy');
  const logger = createMockLogger();

  await mountAllWidgets([failing, healthy], logger);

  expect(healthy.mount).toHaveBeenCalledTimes(1);
  expect(logger.error).toHaveBeenCalledTimes(1);
  expect(logger.error).toHaveBeenCalledWith(
    'Failed to mount widget broken',
    { error: 'load failed' }
  );
});

test('test_mountAllWidgets_allFail_logsAllErrors', async () => {
  const widgetA = createMockWidget('a', () => Promise.reject(new Error('error a')));
  const widgetB = createMockWidget('b', () => Promise.reject(new Error('error b')));
  const logger = createMockLogger();

  await mountAllWidgets([widgetA, widgetB], logger);

  expect(logger.error).toHaveBeenCalledTimes(2);
});

test('test_mountAllWidgets_emptyArray_resolvesImmediately', async () => {
  const logger = createMockLogger();

  await mountAllWidgets([], logger);

  expect(logger.error).not.toHaveBeenCalled();
});

test('test_mountAllWidgets_callsMountOnEveryWidget', async () => {
  const widgets = [
    createMockWidget('zoom'),
    createMockWidget('chatbot'),
    createMockWidget('anthology'),
  ];

  await mountAllWidgets(widgets, createMockLogger());

  widgets.forEach(w => expect(w.mount).toHaveBeenCalledTimes(1));
});

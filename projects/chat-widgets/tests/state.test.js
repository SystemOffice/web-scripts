import { jest } from '@jest/globals';
import { ChatWidgetState } from '../state.js';

function createMockWidget(id, active = false) {
  return {
    id,
    state: { active },
    activate: jest.fn(),
    deactivate: jest.fn(),
    hide: jest.fn()
  };
}

// ChatWidgetState constructor tests
test('test_constructor_withWidgets_setsInitialState', () => {
  const widgets = [createMockWidget('zoom')];
  const state = new ChatWidgetState(widgets);

  expect(state.widgets).toBe(widgets);
  expect(state.activeWidgetId).toBeNull();
  expect(state.onDeactivateCallback).toBeNull();
});

// ChatWidgetState.activateWidget tests
test('test_activateWidget_matchingId_callsActivateOnTargetWidget', () => {
  const zoom = createMockWidget('zoom');
  const anthology = createMockWidget('anthology');
  const state = new ChatWidgetState([zoom, anthology]);

  state.activateWidget('zoom', () => {});

  expect(zoom.activate).toHaveBeenCalledTimes(1);
});

test('test_activateWidget_nonMatchingId_callsDeactivateOnActiveWidgets', () => {
  const zoom = createMockWidget('zoom');
  const anthology = createMockWidget('anthology', true);
  const state = new ChatWidgetState([zoom, anthology]);

  state.activateWidget('zoom', () => {});

  expect(anthology.deactivate).toHaveBeenCalledTimes(1);
  expect(zoom.deactivate).not.toHaveBeenCalled();
});

test('test_activateWidget_validId_setsActiveWidgetId', () => {
  const zoom = createMockWidget('zoom');
  const state = new ChatWidgetState([zoom]);

  state.activateWidget('zoom', () => {});

  expect(state.activeWidgetId).toBe('zoom');
});

test('test_activateWidget_onDeactivateCallback_storedCorrectly', () => {
  const zoom = createMockWidget('zoom');
  const state = new ChatWidgetState([zoom]);
  const onDeactivate = jest.fn();

  state.activateWidget('zoom', onDeactivate);

  expect(state.onDeactivateCallback).toBe(onDeactivate);
});

test('test_activateWidget_widgetDeactivatesItself_resetsActiveWidgetId', () => {
  let capturedCallback;
  const zoom = createMockWidget('zoom');
  zoom.activate.mockImplementation((callback) => { capturedCallback = callback; });

  const state = new ChatWidgetState([zoom]);
  state.activateWidget('zoom', () => {});

  capturedCallback();

  expect(state.activeWidgetId).toBeNull();
});

test('test_activateWidget_widgetDeactivatesItself_callsOnDeactivateCallback', () => {
  let capturedCallback;
  const zoom = createMockWidget('zoom');
  zoom.activate.mockImplementation((callback) => { capturedCallback = callback; });

  const onDeactivate = jest.fn();
  const state = new ChatWidgetState([zoom]);
  state.activateWidget('zoom', onDeactivate);

  capturedCallback();

  expect(onDeactivate).toHaveBeenCalledTimes(1);
});

// ChatWidgetState.hideAll tests
test('test_hideAll_callsHideOnAllWidgets', () => {
  const zoom = createMockWidget('zoom');
  const anthology = createMockWidget('anthology');
  const state = new ChatWidgetState([zoom, anthology]);

  state.hideAll();

  expect(zoom.hide).toHaveBeenCalledTimes(1);
  expect(anthology.hide).toHaveBeenCalledTimes(1);
});

test('test_hideAll_resetsActiveWidgetId', () => {
  const zoom = createMockWidget('zoom');
  const state = new ChatWidgetState([zoom]);
  state.activeWidgetId = 'zoom';

  state.hideAll();

  expect(state.activeWidgetId).toBeNull();
});

// Skip-inactive deactivation guard
test('test_activateWidget_inactiveWidget_skipsDeactivate', () => {
  const zoom = createMockWidget('zoom');
  const anthology = createMockWidget('anthology', false);
  const state = new ChatWidgetState([zoom, anthology]);

  state.activateWidget('zoom', () => {});

  expect(anthology.deactivate).not.toHaveBeenCalled();
});

// Activation counter tests
test('test_constructor_activationCounter_startsAtZero', () => {
  const state = new ChatWidgetState([]);

  expect(state.activationCounter).toBe(0);
});

test('test_activateWidget_activationCounter_increments', () => {
  const zoom = createMockWidget('zoom');
  const state = new ChatWidgetState([zoom]);

  state.activateWidget('zoom', () => {});
  expect(state.activationCounter).toBe(1);

  state.activateWidget('zoom', () => {});
  expect(state.activationCounter).toBe(2);
});

test('test_activateWidget_staleCallback_doesNotFire', () => {
  let capturedCallback;
  const zoom = createMockWidget('zoom');
  const chatbot = createMockWidget('chatbot');
  zoom.activate.mockImplementation((cb) => { capturedCallback = cb; });

  const firstDeactivate = jest.fn();
  const secondDeactivate = jest.fn();
  const state = new ChatWidgetState([zoom, chatbot]);

  // First activation captures a callback
  state.activateWidget('zoom', firstDeactivate);
  const staleCallback = capturedCallback;

  // Second activation overwrites the callback
  state.activateWidget('chatbot', secondDeactivate);

  // Fire the stale callback from the first activation
  staleCallback();

  expect(firstDeactivate).not.toHaveBeenCalled();
  expect(secondDeactivate).not.toHaveBeenCalled();
  expect(state.activeWidgetId).toBe('chatbot');
});

test('test_activateWidget_currentCallback_fires', () => {
  let capturedCallback;
  const chatbot = createMockWidget('chatbot');
  chatbot.activate.mockImplementation((cb) => { capturedCallback = cb; });

  const onDeactivate = jest.fn();
  const state = new ChatWidgetState([chatbot]);

  state.activateWidget('chatbot', onDeactivate);
  capturedCallback();

  expect(onDeactivate).toHaveBeenCalledTimes(1);
  expect(state.activeWidgetId).toBeNull();
});

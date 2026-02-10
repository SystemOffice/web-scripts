import { jest } from '@jest/globals';
import { ChatWidgetState } from '../state.js';

function createMockWidget(id) {
  return {
    id,
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

test('test_activateWidget_nonMatchingId_callsDeactivateOnOtherWidgets', () => {
  const zoom = createMockWidget('zoom');
  const anthology = createMockWidget('anthology');
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

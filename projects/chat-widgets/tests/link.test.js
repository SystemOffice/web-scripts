import { jest } from '@jest/globals';
import { LinkWidget } from '../widgets/link.js';

// LinkWidget constructor tests

test('test_constructor_withConfig_setsDisplayName', () => {
  const widget = new LinkWidget({ displayName: 'Help Center', url: 'https://example.com/help', order: 2 });
  expect(widget.displayName).toBe('Help Center');
});

test('test_constructor_withConfig_setsUrl', () => {
  const widget = new LinkWidget({ displayName: 'Help Center', url: 'https://example.com/help', order: 2 });
  expect(widget.url).toBe('https://example.com/help');
});

test('test_constructor_withConfig_setsOrderInConfig', () => {
  const widget = new LinkWidget({ displayName: 'Help Center', url: 'https://example.com/help', order: 2 });
  expect(widget.config.order).toBe(2);
});

test('test_constructor_withDisplayName_generatesSlugId', () => {
  const widget = new LinkWidget({ displayName: 'Help Center', url: 'https://example.com/help', order: 2 });
  expect(widget.id).toBe('link-help-center');
});

test('test_constructor_withSpecialChars_sanitizesId', () => {
  const widget = new LinkWidget({ displayName: 'FAQ & Support!', url: 'https://example.com/faq', order: 3 });
  expect(widget.id).toBe('link-faq-support-');
});

// LinkWidget.open tests

test('test_open_always_callsWindowOpenWithCorrectArgs', () => {
  const widget = new LinkWidget({ displayName: 'Help', url: 'https://example.com/help', order: 1 });
  const mockOpen = jest.fn();
  globalThis.window = { open: mockOpen };

  widget.open();

  expect(mockOpen).toHaveBeenCalledWith('https://example.com/help', '_blank', 'noopener');
});

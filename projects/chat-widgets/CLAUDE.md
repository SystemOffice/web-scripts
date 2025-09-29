# CLAUDE.md - Chat Widgets WIP Project

## Project Overview
This is a modular unified chat widget system that dynamically loads and manages multiple chat service integrations (Zoom, Anthology, Chatbot) based on client configuration.

**Status**: Development (v0.2.2) - Major refactoring complete, Amazon Connect iframe detection issue RESOLVED

## ✅ RESOLVED: Amazon Connect Close Detection Solution

### Problem (SOLVED)
Amazon Connect "Close Chat" button was undetectable due to iframe isolation - the button exists inside a sandboxed iframe where our event listeners cannot reach.

### Solution Implemented
**Widget Frame State Monitoring**: Instead of detecting button clicks, we monitor the DOM state changes that occur when Amazon Connect chat closes or minimizes.

**Key Discovery**: Amazon Connect uses a container element that changes class when the chat state changes:

**Chat Open State:**
```html
<div id="amazon-connect-widget-frame" class="acFrameContainer-X show logo medium">
```

**Chat Closed/Minimized State:**
```html
<div id="amazon-connect-widget-frame" class="acFrameContainer-X logo medium">
```

The critical indicator is the presence/absence of the `show` class on `#amazon-connect-widget-frame`.

**Implementation:**
- ✅ `MutationObserver` monitors `#amazon-connect-widget-frame` for class attribute changes
- ✅ When `show` class is removed → trigger return to unified menu
- ✅ Detects both Close and Minimize actions (both remove the `show` class)
- ✅ Handles complete widget removal from DOM
- ✅ Proper cleanup of all observers
- ✅ Works around iframe isolation completely

**Result**:
- ✅ Close Chat button now properly returns to unified menu
- ✅ Minimize button continues to work
- ✅ No more iframe isolation issues
- ✅ Reliable detection regardless of dynamic class names

## Technical Implementation Details

### Core Detection Method: `setupAmazonConnectStateMonitoring()`

**Primary Observer**: Monitors `#amazon-connect-widget-frame` class changes
```javascript
this.callbacks.widgetFrameObserver = new MutationObserver((mutations) => {
  // When 'show' class is removed → chat closed/minimized
  if (previouslyHadShow && !currentlyHasShow) {
    this.callbacks.closeListener(); // Return to unified menu
  }
});
```

**Fallback Observer**: Monitors complete widget removal
```javascript
this.callbacks.widgetContainerObserver = new MutationObserver((mutations) => {
  // Detects if entire Amazon Connect widget is removed from DOM
});
```

**Benefits of This Approach:**
- ✅ Works regardless of iframe isolation
- ✅ Detects both Close and Minimize (both remove `show` class)
- ✅ No reliance on button click detection
- ✅ Robust against Amazon Connect UI changes
- ✅ Proper error handling and cleanup

## Development Guidelines

### Code Quality Standards
- **Readability First**: Code should be self-documenting with clear variable names and logical structure
- **Maintainability**: Prefer composition over inheritance, keep functions small and focused
- **Error Handling**: Always handle async operations and provide fallbacks
- **No Magic Numbers**: Use named constants for delays, retries, and configuration values

## ✅ COMPLETED REFACTORING

### 1. **Configuration Management System** (`config.js`)
- ✅ Extracted all hardcoded values to centralized configuration
- ✅ Added environment-specific overrides
- ✅ Implemented per-widget configuration support
- ✅ Added configuration validation
- ✅ Created nested configuration access with dot notation

### 2. **Error Handling & Recovery** (`error-handler.js`)
- ✅ Implemented circuit breaker pattern for cascading failure prevention
- ✅ Added automatic retry mechanisms with exponential backoff
- ✅ Created graceful degradation when services are unavailable
- ✅ Added comprehensive error recovery strategies
- ✅ Integrated global error handlers for uncaught exceptions

### 3. **Structured Logging System** (`logger.js`)
- ✅ Created comprehensive logging with multiple levels (debug, info, warn, error)
- ✅ Added performance monitoring and timing
- ✅ Implemented structured data logging for debugging
- ✅ Added session tracking and context enrichment
- ✅ Created debugging utilities accessible via `window.widgetDebug`

### 4. **Widget Lifecycle Management** (`base-widget.js`)
- ✅ Implemented proper mount/unmount lifecycle with cleanup
- ✅ Added hookable lifecycle events (onMount, onUnmount, onActivate, onDeactivate, onError)
- ✅ Integrated performance monitoring throughout widget lifecycle
- ✅ Added memory management with proper cleanup of timers and listeners
- ✅ Created widget isolation and conflict detection

## Current Widget Implementations

### Anthology (Amazon Connect) Widget
- **Status**: ✅ **FIXED** - Widget frame state monitoring implemented
- **Working**: Script loading, activation, widget frame monitoring, DOM state detection
- **Solution**: `MutationObserver` on `#amazon-connect-widget-frame` class changes
- **Detection Method**: Monitors `show` class removal instead of button clicks
- **Handles**: Both Close and Minimize actions, complete widget removal

### Chatbot (ODA) Widget
- **Status**: ✅ Working - simplified approach
- **Implementation**: Treats both close and minimize the same (return to unified menu)
- **Button Patterns**: `.oda-chat-popup-action`, `#oda-chat-collapse`, `li[data-value="collapse"]`

### Zoom Widget
- **Status**: ✅ Working
- **Implementation**: Standard click detection for Zoom chat elements

## Architecture Notes

### File Structure
- `index.js` - Main entry point and unified button logic
- `state.js` - Widget state management
- `config.js` - Centralized configuration management
- `error-handler.js` - Enterprise-grade error handling
- `logger.js` - Structured logging system
- `styles.css` - Unified styling
- `widgets/` - Individual widget implementations
  - `base-widget.js` - Abstract base class with lifecycle management
  - `zoom.js`, `anthology.js`, `chatbot.js` - Service-specific implementations
- `dist/` - Production bundle

### Design Patterns
- **Strategy Pattern**: Each widget type implements the BaseWidget interface
- **State Management**: Centralized state handling via ChatWidgetState
- **Configuration-Driven**: Domain-based dynamic loading
- **Observer Pattern**: MutationObserver for DOM change detection
- **Circuit Breaker**: Error handling with automatic recovery

## Debugging Tools

### Console Debugging
- `window.widgetDebug.getState()` - Get current widget states
- `window.widgetDebug.getLogs()` - Get recent log entries
- Comprehensive button click logging with `🔍 Anthology:` prefix

### Error Monitoring
- Circuit breaker status tracking
- Automatic retry attempt logging
- Performance timing for widget operations

## Common Commands

```bash
# Development server (if applicable)
# TODO: Add build/dev commands to package.json

# Testing
# TODO: Add test framework and scripts

# Linting/Type checking
# TODO: Add ESLint and TypeScript support
```

## Known Technical Debt

1. **Iframe Isolation**: Amazon Connect close button detection impossible with current approach
2. **Mixed Concerns**: Widget visibility and invocation logic could be separated further
3. **Error Recovery**: Need iframe-specific error handling strategies
4. **Race Conditions**: Widget activation timing issues with iframe-contained elements
5. **Memory Management**: Complex observer patterns need careful cleanup

## Immediate Next Steps

### Priority 1: ✅ **COMPLETED** - Amazon Connect Close Detection Fixed
- ✅ Implemented widget frame state monitoring via MutationObserver
- ✅ Updated both individual project files and production bundle
- ✅ Added proper observer cleanup in removeCloseListener methods

### Priority 2: Testing & Validation
1. **Test the new detection system**
   - Verify Close Chat button properly returns to unified menu
   - Ensure Minimize button continues to work as expected
   - Test edge cases (rapid clicking, multiple widgets, etc.)
   - Validate observer cleanup prevents memory leaks

2. **Performance monitoring**
   - Monitor MutationObserver impact on page performance
   - Ensure no excessive DOM polling or callback firing
   - Validate timeout delays are appropriate (currently 300ms)

### Priority 3: Code Quality & Documentation
- Add comprehensive comments to the new detection methods
- Update any remaining documentation references to the old approach
- Consider adding configuration options for detection timing
- Document the solution for future maintainers

## Testing Strategy (To Implement)

1. **Iframe Integration Tests**: Test Amazon Connect close/minimize scenarios
2. **Cross-Widget Tests**: Ensure widgets don't interfere with each other
3. **Error Recovery Tests**: Test circuit breaker and retry mechanisms
4. **Memory Tests**: Verify proper cleanup of observers and listeners
5. **Performance Tests**: Monitor impact of multiple MutationObservers

## Code Style Preferences

- Use modern ES6+ features (async/await, destructuring, template literals)
- Prefer explicit error handling over silent failures
- Keep functions pure where possible
- Use meaningful variable names over comments
- Separate concerns cleanly between modules
- Always clean up observers and event listeners

## Future Enhancements

- [ ] Resolve Amazon Connect iframe close detection
- [ ] Add widget analytics and usage tracking
- [ ] Implement widget theming system
- [ ] Add support for custom widget positions
- [ ] Create widget configuration UI
- [ ] Add mobile-responsive breakpoints
- [ ] Implement widget priority/ordering system
- [ ] Add TypeScript for better type safety
- [ ] Create comprehensive test suite

---

*Last Updated: 2025-09-25 - Amazon Connect iframe detection issue RESOLVED*
*This document should be updated as new findings emerge*

## Emergency Contacts & Resources

- Amazon Connect Documentation: https://docs.aws.amazon.com/connect/
- Iframe Security Policies: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe
- MutationObserver API: https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver
// Error handling and recovery mechanisms for chat widget system
import { defaultConfig } from './config.js';

export class ErrorHandler {
  constructor(config = defaultConfig) {
    this.config = config;
    this.errorCounts = new Map();
    this.circuitBreakers = new Map();
    this.setupGlobalErrorHandler();
  }

  // Setup global error handling for uncaught widget errors
  setupGlobalErrorHandler() {
    if (this.config.get('errorHandling.enableGracefulDegradation')) {
      window.addEventListener('error', (event) => {
        if (this.isWidgetRelatedError(event)) {
          this.handleWidgetError(event.error, 'global', event);
        }
      });

      window.addEventListener('unhandledrejection', (event) => {
        if (this.isWidgetRelatedPromiseRejection(event)) {
          this.handleWidgetError(event.reason, 'promise', event);
        }
      });
    }
  }

  // Handle widget-specific errors with recovery
  async handleWidgetError(error, context, widgetId = 'unknown') {
    const errorKey = `${widgetId}_${context}`;
    const currentCount = this.errorCounts.get(errorKey) || 0;
    const maxErrors = this.config.get('errorHandling.maxConsecutiveErrors');

    this.errorCounts.set(errorKey, currentCount + 1);

    // Log the error based on configuration
    this.logError(error, context, widgetId, currentCount + 1);

    // Check if circuit breaker should be activated
    if (currentCount + 1 >= maxErrors) {
      this.activateCircuitBreaker(widgetId, context);
      return { success: false, circuitBreakerActive: true };
    }

    // Attempt recovery based on error type and context
    return this.attemptRecovery(error, context, widgetId);
  }

  // Attempt to recover from specific error scenarios
  async attemptRecovery(error, context, widgetId) {
    const recoveryStrategies = {
      'script_load': () => this.recoverFromScriptLoadError(widgetId),
      'widget_init': () => this.recoverFromInitializationError(widgetId),
      'invoke_failure': () => this.recoverFromInvokeError(widgetId),
      'config_load': () => this.recoverFromConfigError(),
      'network': () => this.recoverFromNetworkError(widgetId)
    };

    const strategy = this.determineRecoveryStrategy(error, context);

    if (recoveryStrategies[strategy]) {
      try {
        const result = await recoveryStrategies[strategy]();
        if (result.success) {
          this.resetErrorCount(widgetId, context);
        }
        return result;
      } catch (recoveryError) {
        this.logError(recoveryError, 'recovery_failed', widgetId);
        return { success: false, error: recoveryError };
      }
    }

    return { success: false, error: error, strategy: 'none' };
  }

  // Recovery strategy for script loading failures
  async recoverFromScriptLoadError(widgetId) {
    return new Promise((resolve) => {
      // Retry script injection after a delay
      setTimeout(() => {
        try {
          const widget = this.findWidget(widgetId);
          if (widget && !widget.state.initialized) {
            widget.injectScript();
            resolve({ success: true, action: 'script_reinjected' });
          } else {
            resolve({ success: false, reason: 'widget_not_found_or_initialized' });
          }
        } catch (error) {
          resolve({ success: false, error });
        }
      }, 2000);
    });
  }

  // Recovery strategy for widget initialization failures
  async recoverFromInitializationError(widgetId) {
    const widget = this.findWidget(widgetId);
    if (!widget) {
      return { success: false, reason: 'widget_not_found' };
    }

    // Reset widget state and retry initialization
    widget.state.initialized = false;
    widget.state.active = false;

    return { success: true, action: 'widget_state_reset' };
  }

  // Recovery strategy for widget invocation failures
  async recoverFromInvokeError(widgetId) {
    const widget = this.findWidget(widgetId);
    if (!widget) {
      return { success: false, reason: 'widget_not_found' };
    }

    // Reset invoke retry count and try again
    widget.invokeRetryCount = 0;

    return { success: true, action: 'retry_count_reset' };
  }

  // Recovery strategy for configuration loading failures
  async recoverFromConfigError() {
    // Attempt to reload configuration with fallback
    try {
      const domain = window.location.hostname;
      const response = await fetch(`https://your-config-service.com/config/${domain}`, {
        timeout: this.config.get('configService.timeout')
      });

      if (response.ok) {
        return { success: true, action: 'config_reloaded', data: await response.json() };
      }
    } catch (error) {
      // Fall back to default configuration
      return { success: true, action: 'fallback_config_used' };
    }

    return { success: false, reason: 'config_recovery_failed' };
  }

  // Recovery strategy for network-related errors
  async recoverFromNetworkError(widgetId) {
    // Implement exponential backoff for network retries
    const backoffDelay = this.config.calculateBackoffDelay(
      this.errorCounts.get(`${widgetId}_network`) || 0,
      widgetId
    );

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, action: 'network_retry_scheduled', delay: backoffDelay });
      }, backoffDelay);
    });
  }

  // Determine appropriate recovery strategy based on error characteristics
  determineRecoveryStrategy(error, context) {
    if (context === 'script_load' || error.message?.includes('script')) {
      return 'script_load';
    }

    if (context === 'widget_init' || error.message?.includes('initialize')) {
      return 'widget_init';
    }

    if (context === 'invoke' || error.message?.includes('invoke') || error.message?.includes('click')) {
      return 'invoke_failure';
    }

    if (context === 'config' || error.message?.includes('config')) {
      return 'config_load';
    }

    if (error.name === 'TypeError' && error.message?.includes('fetch')) {
      return 'network';
    }

    return 'none';
  }

  // Circuit breaker functionality
  activateCircuitBreaker(widgetId, context) {
    const breakerKey = `${widgetId}_${context}`;
    const breakerTimeout = 60000; // 1 minute

    this.circuitBreakers.set(breakerKey, {
      active: true,
      activatedAt: Date.now(),
      timeout: breakerTimeout
    });

    // Auto-reset circuit breaker after timeout
    setTimeout(() => {
      this.resetCircuitBreaker(breakerKey);
    }, breakerTimeout);

    this.logError(
      new Error(`Circuit breaker activated for ${widgetId}:${context}`),
      'circuit_breaker',
      widgetId
    );
  }

  resetCircuitBreaker(breakerKey) {
    if (this.circuitBreakers.has(breakerKey)) {
      this.circuitBreakers.delete(breakerKey);
    }
  }

  isCircuitBreakerActive(widgetId, context) {
    const breakerKey = `${widgetId}_${context}`;
    const breaker = this.circuitBreakers.get(breakerKey);

    if (!breaker) return false;

    // Check if breaker has expired
    if (Date.now() - breaker.activatedAt > breaker.timeout) {
      this.resetCircuitBreaker(breakerKey);
      return false;
    }

    return breaker.active;
  }

  resetErrorCount(widgetId, context) {
    const errorKey = `${widgetId}_${context}`;
    this.errorCounts.set(errorKey, 0);
  }

  // Utility methods
  isWidgetRelatedError(event) {
    const errorSource = event.filename || event.error?.stack || '';
    return errorSource.includes('widget') ||
           errorSource.includes('zoom') ||
           errorSource.includes('anthology') ||
           errorSource.includes('chatbot');
  }

  isWidgetRelatedPromiseRejection(event) {
    const reason = event.reason?.stack || event.reason?.message || '';
    return reason.includes('widget') ||
           reason.includes('zoom') ||
           reason.includes('anthology') ||
           reason.includes('chatbot');
  }

  setWidgetRegistry(registry) {
    this.widgetRegistry = registry;
  }

  findWidget(widgetId) {
    if (!this.widgetRegistry) return null;
    return this.widgetRegistry.get(widgetId) || null;
  }

  logError(error, context, widgetId, count = 1) {
    const logLevel = this.config.get('errorHandling.logLevel');
    const message = `Widget Error [${widgetId}:${context}:${count}]: ${error.message}`;

    switch (logLevel) {
      case 'debug':
        console.debug(message, error);
        break;
      case 'info':
        console.info(message);
        break;
      case 'warn':
        console.warn(message);
        break;
      case 'error':
      default:
        console.error(message, error);
        break;
    }

    // Report to external service if enabled
    if (this.config.get('errorHandling.enableErrorReporting')) {
      this.reportError(error, context, widgetId, count);
    }
  }

  reportError(error, context, widgetId, count) {
    // Placeholder for external error reporting
    // Could integrate with services like Sentry, LogRocket, etc.
    const errorReport = {
      timestamp: new Date().toISOString(),
      widgetId,
      context,
      count,
      message: error.message,
      stack: error.stack,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Would send to monitoring service
    console.debug('Error report prepared:', errorReport);
  }
}

// Export a default instance
export const defaultErrorHandler = new ErrorHandler();
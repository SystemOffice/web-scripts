import { defaultConfig } from './config.js';

export class ErrorHandler {
  constructor(config = defaultConfig) {
    this.config = config;
    this.errorCounts = new Map();
    this.circuitBreakers = new Map();
    this.setupGlobalErrorHandler();
  }

  setupGlobalErrorHandler() {
    if (this.config.get('errorHandling.enableGracefulDegradation')) {
      window.addEventListener('error', (event) => {
        if (this.isWidgetRelatedError(event)) {
          this.handleWidgetError(event.error, 'global');
        }
      });

      window.addEventListener('unhandledrejection', (event) => {
        if (this.isWidgetRelatedPromiseRejection(event)) {
          this.handleWidgetError(event.reason, 'promise');
        }
      });
    }
  }

  handleWidgetError(error, context, widgetId = 'unknown') {
    const errorKey = `${widgetId}_${context}`;
    const currentCount = (this.errorCounts.get(errorKey) || 0) + 1;
    const maxErrors = this.config.get('errorHandling.maxConsecutiveErrors');

    this.errorCounts.set(errorKey, currentCount);
    this.logError(error, context, widgetId, currentCount);

    if (currentCount >= maxErrors) {
      this.activateCircuitBreaker(widgetId, context);
      return { success: false, circuitBreakerActive: true };
    }

    return { success: false, error };
  }

  activateCircuitBreaker(widgetId, context) {
    const breakerKey = `${widgetId}_${context}`;
    const breakerTimeout = 60000;

    this.circuitBreakers.set(breakerKey, {
      active: true,
      activatedAt: Date.now(),
      timeout: breakerTimeout
    });

    setTimeout(() => this.resetCircuitBreaker(breakerKey), breakerTimeout);
  }

  resetCircuitBreaker(breakerKey) {
    this.circuitBreakers.delete(breakerKey);
  }

  isCircuitBreakerActive(widgetId, context) {
    const breakerKey = `${widgetId}_${context}`;
    const breaker = this.circuitBreakers.get(breakerKey);

    if (!breaker) return false;

    if (Date.now() - breaker.activatedAt > breaker.timeout) {
      this.resetCircuitBreaker(breakerKey);
      return false;
    }

    return breaker.active;
  }

  resetErrorCount(widgetId, context) {
    this.errorCounts.set(`${widgetId}_${context}`, 0);
  }

  setWidgetRegistry(registry) {
    this.widgetRegistry = registry;
  }

  findWidget(widgetId) {
    if (!this.widgetRegistry) return null;
    return this.widgetRegistry.get(widgetId) || null;
  }

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

  logError(error, context, widgetId, count = 1) {
    const logLevel = this.config.get('errorHandling.logLevel');
    const message = `Widget Error [${widgetId}:${context}:${count}]: ${error.message}`;

    if (logLevel === 'warn') {
      console.warn(message);
    } else {
      console.error(message, error);
    }
  }
}

export const defaultErrorHandler = new ErrorHandler();

import { defaultConfig } from './config.js';

export class WidgetLogger {
  constructor(config = defaultConfig) {
    this.config = config;
  }

  debug(message, data = {}, widgetId = null) {
    if (this.shouldLog('debug')) {
      console.debug(this.format(widgetId, message), data);
    }
  }

  info(message, data = {}, widgetId = null) {
    if (this.shouldLog('info')) {
      console.info(this.format(widgetId, message), data);
    }
  }

  warn(message, data = {}, widgetId = null) {
    if (this.shouldLog('warn')) {
      console.warn(this.format(widgetId, message), data);
    }
  }

  error(message, data = {}, widgetId = null) {
    console.error(this.format(widgetId, message), data);
  }

  shouldLog(level) {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    const configLevel = this.config.get('errorHandling.logLevel');
    return levels[level] >= levels[configLevel];
  }

  format(widgetId, message) {
    return `[${widgetId || 'SYSTEM'}] ${message}`;
  }

  startTimer(name, widgetId = null) {
    const startTime = performance.now();
    return {
      stop: () => performance.now() - startTime
    };
  }

  logWidgetLifecycle(event, widgetId, data = {}) {
    this.info(`Widget ${event}`, data, widgetId);
  }

  logWidgetActivation(widgetId, duration = null) {
    this.info('Widget activated', { activation_duration_ms: duration }, widgetId);
  }

  logWidgetDeactivation(widgetId, duration = null) {
    this.info('Widget deactivated', { deactivation_duration_ms: duration }, widgetId);
  }

  logScriptLoad(widgetId, src, success, duration = null, error = null) {
    if (success) {
      this.info('Script loaded', { src, duration_ms: duration }, widgetId);
    } else {
      this.error('Script load failed', { src, duration_ms: duration, error: error?.message }, widgetId);
    }
  }

  logPerformance(metric, value, widgetId = null, data = {}) {
    this.debug(`Performance: ${metric}`, { ...data, value }, widgetId);
  }

  logUserInteraction(action, widgetId = null, data = {}) {
    this.debug(`User ${action}`, data, widgetId);
  }

  logNetworkActivity(operation, url, status, duration = null, data = {}) {
    this.debug(`Network: ${operation}`, { url, status, duration_ms: duration, ...data });
  }

  logConfigChange(key, oldValue, newValue, widgetId = null) {
    this.debug(`Config changed: ${key}`, { old_value: oldValue, new_value: newValue }, widgetId);
  }
}

export const defaultLogger = new WidgetLogger();

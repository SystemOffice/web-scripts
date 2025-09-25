// Structured logging system for chat widget debugging and monitoring
import { defaultConfig } from './config.js';

export class WidgetLogger {
  constructor(config = defaultConfig) {
    this.config = config;
    this.sessionId = this.generateSessionId();
    this.logs = [];
    this.maxLogHistory = 1000;
    this.logBuffer = [];
    this.bufferSize = 50;
    this.setupContextEnrichment();
  }

  generateSessionId() {
    return `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  setupContextEnrichment() {
    this.context = {
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      domain: window.location.hostname,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };
  }

  // Core logging methods with structured data
  debug(message, data = {}, widgetId = null) {
    this.log('debug', message, data, widgetId);
  }

  info(message, data = {}, widgetId = null) {
    this.log('info', message, data, widgetId);
  }

  warn(message, data = {}, widgetId = null) {
    this.log('warn', message, data, widgetId);
  }

  error(message, data = {}, widgetId = null) {
    this.log('error', message, data, widgetId);
  }

  // Specialized logging methods for common widget scenarios
  logWidgetLifecycle(event, widgetId, data = {}) {
    this.info(`Widget ${event}`, {
      ...data,
      event_type: 'lifecycle',
      event_name: event,
      widget_id: widgetId
    }, widgetId);
  }

  logPerformance(metric, value, widgetId = null, data = {}) {
    this.info(`Performance: ${metric}`, {
      ...data,
      event_type: 'performance',
      metric_name: metric,
      metric_value: value,
      widget_id: widgetId
    }, widgetId);
  }

  logUserInteraction(action, widgetId = null, data = {}) {
    this.info(`User ${action}`, {
      ...data,
      event_type: 'user_interaction',
      action_name: action,
      widget_id: widgetId
    }, widgetId);
  }

  logConfigChange(key, oldValue, newValue, widgetId = null) {
    this.info(`Config changed: ${key}`, {
      event_type: 'config_change',
      config_key: key,
      old_value: oldValue,
      new_value: newValue,
      widget_id: widgetId
    }, widgetId);
  }

  logNetworkActivity(operation, url, status, duration = null, data = {}) {
    this.info(`Network: ${operation}`, {
      ...data,
      event_type: 'network',
      operation,
      url,
      status,
      duration_ms: duration
    });
  }

  // Core logging implementation
  log(level, message, data = {}, widgetId = null) {
    const configLogLevel = this.config.get('errorHandling.logLevel');

    // Check if this log level should be processed
    if (!this.shouldLog(level, configLogLevel)) {
      return;
    }

    const logEntry = this.createLogEntry(level, message, data, widgetId);

    // Add to internal history
    this.addToHistory(logEntry);

    // Output to console
    this.outputToConsole(logEntry);

    // Buffer for potential batch sending
    this.addToBuffer(logEntry);

    // Send to external services if configured
    if (this.shouldSendExternal(level)) {
      this.sendToExternalService(logEntry);
    }
  }

  shouldLog(level, configLevel) {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    return levels[level] >= levels[configLevel];
  }

  createLogEntry(level, message, data, widgetId) {
    return {
      id: `${this.sessionId}-${this.logs.length}`,
      timestamp: new Date().toISOString(),
      level,
      message,
      widget_id: widgetId,
      data: { ...data },
      context: { ...this.context },
      performance: this.getPerformanceMetrics(),
      stack: level === 'error' && data.error ? data.error.stack : null
    };
  }

  getPerformanceMetrics() {
    if ('performance' in window) {
      return {
        navigation_start: performance.timeOrigin,
        current_time: performance.now(),
        memory_used: performance.memory ? performance.memory.usedJSHeapSize : null,
        memory_total: performance.memory ? performance.memory.totalJSHeapSize : null
      };
    }
    return null;
  }

  addToHistory(logEntry) {
    this.logs.push(logEntry);

    // Keep only recent logs to prevent memory issues
    if (this.logs.length > this.maxLogHistory) {
      this.logs = this.logs.slice(-this.maxLogHistory);
    }
  }

  outputToConsole(logEntry) {
    const consoleMethod = console[logEntry.level] || console.log;
    const prefix = `[${logEntry.timestamp}] [${logEntry.widget_id || 'SYSTEM'}]`;

    if (logEntry.data && Object.keys(logEntry.data).length > 0) {
      consoleMethod(`${prefix} ${logEntry.message}`, logEntry.data);
    } else {
      consoleMethod(`${prefix} ${logEntry.message}`);
    }
  }

  addToBuffer(logEntry) {
    this.logBuffer.push(logEntry);

    // Auto-flush buffer when full
    if (this.logBuffer.length >= this.bufferSize) {
      this.flushBuffer();
    }
  }

  shouldSendExternal(level) {
    return this.config.get('errorHandling.enableErrorReporting') &&
           (level === 'error' || level === 'warn');
  }

  sendToExternalService(logEntry) {
    // Placeholder for external logging service integration
    // Could integrate with services like Logtail, DataDog, etc.

    if (typeof window.externalLogger !== 'undefined') {
      window.externalLogger.send(logEntry);
    } else {
      // Store for later sending when service becomes available
      this.pendingExternalLogs = this.pendingExternalLogs || [];
      this.pendingExternalLogs.push(logEntry);
    }
  }

  // Buffer management
  flushBuffer() {
    if (this.logBuffer.length === 0) return;

    const batch = [...this.logBuffer];
    this.logBuffer = [];

    // Send batch to external service
    if (this.config.get('errorHandling.enableErrorReporting')) {
      this.sendBatchToExternalService(batch);
    }
  }

  sendBatchToExternalService(batch) {
    // Batch sending implementation
    if (typeof window.externalLogger !== 'undefined') {
      window.externalLogger.sendBatch(batch);
    }
  }

  // Performance monitoring helpers
  startTimer(name, widgetId = null) {
    const timerId = `${name}_${widgetId || 'system'}_${Date.now()}`;
    const startTime = performance.now();

    return {
      timerId,
      stop: () => {
        const duration = performance.now() - startTime;
        this.logPerformance(name, duration, widgetId, { timer_id: timerId });
        return duration;
      }
    };
  }

  // Widget-specific logging helpers
  logWidgetActivation(widgetId, duration = null) {
    this.logWidgetLifecycle('activated', widgetId, {
      activation_duration_ms: duration
    });
  }

  logWidgetDeactivation(widgetId, duration = null) {
    this.logWidgetLifecycle('deactivated', widgetId, {
      deactivation_duration_ms: duration
    });
  }

  logScriptLoad(widgetId, src, success, duration = null, error = null) {
    this.logPerformance('script_load', duration, widgetId, {
      script_src: src,
      success,
      error_message: error?.message
    });
  }

  // Debugging helpers
  exportLogs() {
    return {
      session_id: this.sessionId,
      total_logs: this.logs.length,
      context: this.context,
      logs: this.logs
    };
  }

  searchLogs(query, widgetId = null) {
    return this.logs.filter(log => {
      const matchesWidget = !widgetId || log.widget_id === widgetId;
      const matchesQuery = log.message.toLowerCase().includes(query.toLowerCase()) ||
                          JSON.stringify(log.data).toLowerCase().includes(query.toLowerCase());
      return matchesWidget && matchesQuery;
    });
  }

  getRecentErrors(count = 10, widgetId = null) {
    return this.logs
      .filter(log => log.level === 'error' && (!widgetId || log.widget_id === widgetId))
      .slice(-count);
  }

  getWidgetStats(widgetId) {
    const widgetLogs = this.logs.filter(log => log.widget_id === widgetId);

    return {
      total_logs: widgetLogs.length,
      errors: widgetLogs.filter(log => log.level === 'error').length,
      warnings: widgetLogs.filter(log => log.level === 'warn').length,
      lifecycle_events: widgetLogs.filter(log =>
        log.data.event_type === 'lifecycle'
      ).map(log => log.data.event_name),
      performance_metrics: widgetLogs
        .filter(log => log.data.event_type === 'performance')
        .map(log => ({
          metric: log.data.metric_name,
          value: log.data.metric_value
        }))
    };
  }

  // Cleanup
  clearLogs() {
    this.logs = [];
    this.logBuffer = [];
  }

  // Integration with development tools
  attachToWindow() {
    if (typeof window !== 'undefined') {
      window.widgetLogger = this;
      window.widgetDebug = {
        exportLogs: () => this.exportLogs(),
        searchLogs: (query, widgetId) => this.searchLogs(query, widgetId),
        getErrors: (count, widgetId) => this.getRecentErrors(count, widgetId),
        getStats: (widgetId) => this.getWidgetStats(widgetId),
        clearLogs: () => this.clearLogs()
      };
    }
  }
}

// Export default instance
export const defaultLogger = new WidgetLogger();

// Attach to window for debugging in development
if (process.env.NODE_ENV === 'development') {
  defaultLogger.attachToWindow();
}
// State manager for unified chat widget
export class ChatWidgetState {
  constructor(widgets) {
    this.widgets = widgets;
    this.activeWidgetId = null;
    this.onDeactivateCallback = null;
  }

  activateWidget(widgetId, onDeactivate) {
    this.onDeactivateCallback = onDeactivate;
    this.widgets.forEach(widget => {
      if (widget.id === widgetId) {
        widget.activate(() => {
          this.activeWidgetId = null;
          if (typeof this.onDeactivateCallback === 'function') {
            this.onDeactivateCallback();
          }
        });
        this.activeWidgetId = widgetId;
      } else {
        widget.deactivate();
      }
    });
  }

  hideAll() {
    this.widgets.forEach(widget => widget.hide());
    this.activeWidgetId = null;
  }
} 
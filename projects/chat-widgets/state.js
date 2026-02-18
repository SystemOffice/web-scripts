// State manager for unified chat widget
export class ChatWidgetState {
  constructor(widgets) {
    this.widgets = widgets;
    this.activeWidgetId = null;
    this.onDeactivateCallback = null;
    this.activationCounter = 0;
  }

  activateWidget(widgetId, onDeactivate) {
    const activationToken = ++this.activationCounter;
    this.onDeactivateCallback = onDeactivate;

    this.widgets.forEach(widget => {
      if (widget.id === widgetId) {
        widget.activate(() => {
          if (this.activationCounter !== activationToken) return;

          this.activeWidgetId = null;
          if (typeof this.onDeactivateCallback === 'function') {
            this.onDeactivateCallback();
          }
        });
        this.activeWidgetId = widgetId;
      } else if (widget.state?.active) {
        widget.deactivate();
      }
    });
  }

  hideAll() {
    this.widgets.forEach(widget => widget.hide?.());
    this.activeWidgetId = null;
  }
} 
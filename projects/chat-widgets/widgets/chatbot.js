// Chatbot widget integration
import { BaseWidget } from './base-widget.js';
import { pollUntil } from '../poll-until.js';

export class ChatbotWidget extends BaseWidget {
  constructor(config = {}) {
    super({
      id: 'chatbot',
      displayName: config.displayName || 'Student Support Bot',
      order: config.order,
      scriptId: config.scriptId || 'IS_CV_PUBLIC_HOOK',
      src: config.src || 'https://vccs-ws.iuc.intrasee.com/vccsoda/IS_CV_PUBLIC_HOOK.js',
      attributes: {
        'data-org': config.org || 'DEMO_ORG',
        'type': 'text/javascript'
      },
      launcherId: config.launcherId || 'idalogin',
      invokeSelector: '#idalogin',
      closeSelector: '.oda-chat-popup-action.oda-chat-filled.oda-chat-flex',
      elementSelectors: ['[class*="oda-chat"]', '[id*="oda"]', '[class*="isCV"]', '[id*="isChat"]', '#isChatWelcomeBubble', '#isChatIconWrapper']
    });

    // Validate required config
    if (!config.org || config.org === 'DEMO_ORG') {
      console.warn('Chatbot: Organization not configured. Please add your organization ID to the configuration.');
    }
  }

  async activate(onDeactivate) {
    this.state.active = true;
    this.callbacks.onDeactivate = onDeactivate;

    try {
      // Inject script on first activation (deferred from construction)
      if (!this.state.initialized) {
        await this.injectScript();
      }

      const maxWait = this.firstActivation ? 5000 : 2000;

      try {
        await pollUntil(
          () => document.querySelector(this.config.invokeSelector),
          { interval: 50, maxWait }
        );
      } catch {
        console.log('🔍 Chatbot: Invoke selector not found within timeout, proceeding with retry');
      }

      if (this.state.active) {
        this.invokeRetryCount = 0;
        this.invokeWidget();
        this.toggleVisibility(true);
        this.attachCloseListener();
        this.firstActivation = false;
      }
    } catch (error) {
      console.warn(`Chatbot: Activation failed — ${error.message}`);
      this.deactivate(this.callbacks.onDeactivate);
    }
  }

  getElementsToToggle() {
    // Get all matching elements but exclude the main launcher button from hiding
    // This ensures the chat button remains visible when minimized
    const launcherButton = document.getElementById(this.config.launcherId);

    const allElements = this.config.elementSelectors.flatMap(selector =>
      Array.from(document.querySelectorAll(selector))
    );

    // Filter out the launcher button - we don't want to hide it
    // because it needs to remain visible when chat is minimized
    return allElements.filter(element => element !== launcherButton);
  }

  attachCloseListener() {
    if (!this.state.active) return;

    this.callbacks.closeListener = () => {
      setTimeout(() => {
        if (this.state.active) {
          this.deactivate(this.callbacks.onDeactivate);
        }
      }, 100);
    };

    // Document-level click listener for both close AND minimize buttons
    // Since minimize actually closes the chat anyway, treat both the same way
    this.callbacks.documentClickListener = (event) => {
      const target = event.target;

      const isEndConversationConfirm = target.tagName === 'BUTTON' &&
                                       target.textContent?.trim() === 'Yes' &&
                                       target.closest('#isChatAlertPopup');

      const isCloseOrMinimizeButton = isEndConversationConfirm ||
                                      target.matches('.oda-chat-popup-action.oda-chat-filled.oda-chat-flex') ||
                                      target.matches('#oda-chat-collapse') ||
                                      target.matches('li[data-value="collapse"]') ||
                                      target.closest('.oda-chat-popup-action.oda-chat-filled.oda-chat-flex') ||
                                      target.closest('#oda-chat-collapse') ||
                                      target.closest('li[data-value="collapse"]') ||
                                      (target.textContent && target.textContent.includes('Minimize conversation'));

      if (isCloseOrMinimizeButton && this.state.active) {
        console.log('🔍 Chatbot: Close or minimize button clicked - returning to unified menu');
        this.callbacks.closeListener();
      }
    };

    document.addEventListener('click', this.callbacks.documentClickListener, true);
  }

  removeCloseListener() {
    if (!this.callbacks.closeListener) return;

    // Remove document-level listener
    if (this.callbacks.documentClickListener) {
      document.removeEventListener('click', this.callbacks.documentClickListener, true);
      this.callbacks.documentClickListener = null;
    }

    this.callbacks.closeListener = null;
  }
}
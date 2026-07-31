// ---------------------------------------------------------------------------------------
// IS_CV_PUBLIC_HOOK - v23.01 (Refactored)
//
// Copyright 2022 Gideon Taylor - Use and modification subject to terms of license.
// Reuse or Redistribution of this source code with or without modification is strictly prohibited.
//
// NOTE: This uses the Oracle SDK.
// --------------------------------------------------------------------------------------

(function() {
    'use strict';

  // CAPTURE CURRENT SCRIPT IMMEDIATELY before it becomes null
    const CURRENT_SCRIPT = document.currentScript;

    // Initialize namespace
    if (typeof window.IS === 'undefined') {
        window.IS = {};
    }

    if (typeof IS.PubCV === 'undefined') {
        IS.PubCV = {};
    }

    // Constants
    const CONSTANTS = {
        ENV: 'PUBLIC',
        DRAG_THRESHOLD: 5,
        ICON_OFFSET: 75,
        COOKIE_NAME: 'idaHideLauncher',
        COOKIE_VALUE: 'Y',
        COOKIE_OPTIONS: 'path=/; Secure; SameSite=Strict',
        SESSION_KEYS: {
            CHAT_LEFT: 'ischatPositionLeft',
            CHAT_TOP: 'ischatPositionTop',
            CHAT2_LEFT: 'ischat2PositionLeft',
            CHAT2_TOP: 'ischat2PositionTop',
            WRAPPER_LEFT: 'iswrapperPositionLeft',
            WRAPPER_TOP: 'iswrapperPositionTop'
        }
    };

    // Configuration
    IS.PubCV.Config = {
        debugEnabled: false,
        jsType: 'text/javascript',
        jsLanguage: 'javascript',
        jsIncludes: [
            'IS_CORE_CONFIG_JS',
            'is_core_lite',
            'IS_CV_OB_SETTINGS_SDK',
            'IS_CV_OB_WIDGET_SDK',
            'web-sdk',
            'IS_CV_ENV_CONFIG',
            'IS_CV_OUTAGE_SETTING'
        ],
        cssType: 'text/css',
        cssRel: 'stylesheet',
        cssIncludes: [
            'IS_CV_THEME_BASE',
            'IS_CV_OB_STYLES_SDK',
            'CLIENT_CV_OB_REMOTE_STYLES',
        ],
        botID: 'See env config',
        botDescr: 'Chat with Ida',
        loginHeaderText: 'I am a ...',
        forceAuth: false,
        forceMultiLogin: false,
        GuestOnly: true,
        loginOptions: [
            { ID: 'GUEST_STUDENT', Descr: 'Student' },
            { ID: 'GUEST_FACULTY', Descr: 'Faculty Member' },
            { ID: 'GUEST_STAFF', Descr: 'Staff Member' },
            { ID: 'GUEST_APPLICANT', Descr: 'Prospective Student' },
            { ID: 'GUEST_CHAT_USER', Descr: 'Guest Chat User' }
        ],
        org: {},
        dataAttributes: {}
    };

 /* JDL 5/1/26 - Update to only apply keyboard movement when icon is focused to prevent interfering with other page navigation add iconFocused */ 
    // State management
    const State = {
        initializeStarted: false,
        headerIncludes: [],
        isDragging: false,
        dragController: null,
        hideLauncher: false,
        offsetX: 0,
        offsetY: 0,
        onclickBackup: null,
        helpLinkObserver: null,
        currentHelpAnchor: null,
        iconFocused: false
    };
    /* JDL 5/1/26 end fix for keyboard movement */

    // Utility functions
    const Utils = {
        debug(...args) {
            if (IS.PubCV.Config.debugEnabled) {
                console.log('[IS.PubCV]', ...args);
            }
        },

        safeQuerySelector(selector, parent = document) {
            try {
                return parent.querySelector(selector);
            } catch (error) {
                Utils.debug('Query selector error:', error);
                return null;
            }
        },

        safeQuerySelectorAll(selector, parent = document) {
            try {
                return parent.querySelectorAll(selector);
            } catch (error) {
                Utils.debug('Query selector all error:', error);
                return [];
            }
        },

        createElement(tag, attributes = {}, innerHTML = '') {
            const element = document.createElement(tag);
            
            Object.entries(attributes).forEach(([key, value]) => {
                if (key === 'class') {
                    element.className = value;
                } else if (key === 'style' && typeof value === 'object') {
                    Object.assign(element.style, value);
                } else {
                    element.setAttribute(key, value);
                }
            });

            if (innerHTML) {
                element.innerHTML = this.sanitizeHTML(innerHTML);
            }

            return element;
        },

        sanitizeHTML(html) {
            const temp = document.createElement('div');
            temp.textContent = html;
            return temp.innerHTML;
        },

        getCookie(name) {
            try {
                const value = `; ${document.cookie}`;
                const parts = value.split(`; ${name}=`);
                if (parts.length === 2) {
                    return parts.pop().split(';').shift();
                }
            } catch (error) {
                Utils.debug('Error getting cookie:', error);
            }
            return null;
        },

        setCookie(name, value, options = CONSTANTS.COOKIE_OPTIONS) {
            try {
                document.cookie = `${name}=${value}; ${options}`;
                return true;
            } catch (error) {
                Utils.debug('Error setting cookie:', error);
                return false;
            }
        },

        deleteCookie(name) {
            return this.setCookie(name, '', 'path=/; Max-Age=-99');
        },

        getSessionStorage(key) {
            try {
                return sessionStorage.getItem(key);
            } catch (error) {
                Utils.debug('Error reading session storage:', error);
                return null;
            }
        },

        setSessionStorage(key, value) {
            try {
                sessionStorage.setItem(key, value);
                return true;
            } catch (error) {
                Utils.debug('Error writing session storage:', error);
                return false;
            }
        },

        throttle(func, delay) {
            let lastCall = 0;
            return function(...args) {
                const now = Date.now();
                if (now - lastCall >= delay) {
                    lastCall = now;
                    return func.apply(this, args);
                }
            };
        },

        debounce(func, delay) {
            let timeoutId;
            return function(...args) {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => func.apply(this, args), delay);
            };
        }
    };

    // PeopleSoft detection
    const PSDetection = {
        inPS() {
            try {
                // Check for HTML comments
                const htmlComments = document.documentElement.childNodes;
                for (let i = 0; i < htmlComments.length; i++) {
                    if (htmlComments[i].nodeType === 8) {
                        const comment = htmlComments[i].nodeValue;
                        if (comment.indexOf('ToolsRel') >= 0) {
                            return true;
                        }
                    }
                }

                // Check for PS environment info
                if (document.getElementById('pt_envinfo')) {
                    return true;
                }

                // Check pathname
                if (window.location.pathname.match(/EMPLOYEE/)) {
                    return true;
                }
            } catch (error) {
                Utils.debug('Error detecting PeopleSoft:', error);
            }

            return false;
        },

        shouldShowChatIcon() {
            if (!this.inPS()) {
                return true;
            }

            Utils.debug('In PeopleSoft environment');

            // Don't show on Guest page
            if (window.location.href.indexOf('GUEST') > 0) {
                return false;
            }

            // Check for custom components
            const componentsToCheck = typeof IS_CV_SHOW_CHAT_CUST !== 'undefined' 
                ? IS_CV_SHOW_CHAT_CUST.split(',')
                : typeof IS_CV_CHAT_COMPONENTS !== 'undefined' && IS_CV_CHAT_COMPONENTS === 'ALL'
                    ? null
                    : typeof IS_CV_CHAT_COMPONENTS !== 'undefined'
                        ? IS_CV_CHAT_COMPONENTS.split(',')
                        : [];

            if (componentsToCheck === null) {
                return true;
            }

            for (const component of componentsToCheck) {
                const trimmedComponent = component.trim();
                
                // Check at form level (Fluid)
                if (document.getElementById(trimmedComponent)) {
                    Utils.debug('Component found:', trimmedComponent);
                    return true;
                }

                // Check at component level
                try {
                    const pageInfo = Utils.safeQuerySelector("[id^='pt_pageinfo']");
                    if (pageInfo && pageInfo.getAttribute('component') === trimmedComponent) {
                        return true;
                    }
                } catch (error) {
                    Utils.debug('Error checking component:', error);
                }
            }

            return false;
        }
    };

    const PSContext = {
        parseDataAttributes(callingTag) {
            if (!callingTag) {
                return;
            }

            if (typeof IS.PubCV.Config.dataAttributes === 'undefined') {
                IS.PubCV.Config.dataAttributes = {};
            }

            for (const attribute in callingTag.attributes) {
                if (callingTag.attributes[attribute] && callingTag.attributes[attribute].name) {
                    const attrName = callingTag.attributes[attribute].name;
                    if (/^data-[a-zA-Z0-9\-_]+$/.test(attrName)) {
                        const key = attrName.replace(/^data-/, '');
                        const value = callingTag.attributes[attribute].value;
                        if (value && value.length < 500 && /^[a-zA-Z0-9\s\-_.,!@#$%^&*()+={}[\]:;"'<>?/|\\`~]*$/.test(value)) {
                            IS.PubCV.Config.dataAttributes[key] = value;
                            Utils.debug('Added data attribute:', key, '=', value);
                        } else {
                            Utils.debug('Rejected invalid data attribute value for:', key);
                        }
                    }
                }
            }
        },

        getActiveDocument() {
            let activeDoc = null;

            const targetFrame = Utils.safeQuerySelector('.ps_target-iframe');
            if (targetFrame) {
                try {
                    activeDoc = targetFrame.contentDocument || targetFrame.contentWindow.document;
                } catch (error) {
                    activeDoc = null;
                }
            }

            if (!activeDoc) {
                const iframe = document.getElementById('ptifrmtgtframe');
                if (iframe) {
                    try {
                        activeDoc = iframe.contentDocument || iframe.contentWindow.document;
                    } catch (error) {
                        activeDoc = null;
                    }
                }
            }

            return activeDoc || document;
        },

        getComponent() {
            try {
                const extractComponentFromAction = (action) => {
                    if (!action) {
                        return 'NONE';
                    }

                    let url;
                    try {
                        url = new URL(action, window.location.origin);
                    } catch (error) {
                        return 'NONE';
                    }

                    const componentMatch = url.pathname.match(/\/c\/([^\/]+)\.([^\/]+)\.([^\/]+)/);
                    if (componentMatch && componentMatch[2]) {
                        return componentMatch[2];
                    }

                    return 'NONE';
                };

                const getTitle = (form) => {
                    if (form && form.getAttribute('aria-label')) {
                        return form.getAttribute('aria-label');
                    }

                    const topDoc = window.top.document;
                    const titleSpan = topDoc.querySelector('span.ptcp_pagetitle_spantext');
                    if (titleSpan && titleSpan.innerText) {
                        return titleSpan.innerText.trim();
                    }

                    return topDoc.title || '';
                };

                const activeDoc = this.getActiveDocument();
                const formElement = activeDoc ? activeDoc.querySelector('.PSForm') : null;
                let componentId = 'NONE';
                let title = '';

                if (formElement && formElement.action) {
                    componentId = extractComponentFromAction(formElement.action);
                }

                title = getTitle(formElement);

                if (typeof IS.PubCV.Config.AvoidComps !== 'undefined') {
                    const avoidComps = IS.PubCV.Config.AvoidComps.split(',');
                    if (avoidComps.includes(componentId)) {
                        componentId = 'NONE';
                        title = 'NONE';
                    }
                }

                return [componentId, title];
            } catch (error) {
                console.error('Error in GetComponent:', error);
                return ['NONE', ''];
            }
        },

        setupAssistant() {
            const componentInfo = this.getComponent();
            const component = componentInfo[0];

            if (component !== 'NONE' && typeof IS_CV_PS_ASSISTANT !== 'undefined') {
                IS.AjaxRequest('get', IS_CV_PS_ASSISTANT, (o) => {
                    const response = o.responseText;
                    const cogDiv = document.createElement('div');
                    cogDiv.id = 'PSAsstcogWrapper';
                    cogDiv.innerHTML = response.trim();
                    document.body.appendChild(cogDiv);

                    const assistCog = document.getElementById('isPSAssist');
                    if (typeof assistCog !== 'undefined' && typeof IS.PubCV.Config.PSAIUCURL !== 'undefined') {
                        const fullUrl = IS.PubCV.Config.PSAIUCURL + component + '&IS_CV_CMP_DESCR=' + componentInfo[1];
                        assistCog.href = encodeURI(fullUrl);
                    }
                });
            }
        },

        initAssistant() {
            if (typeof IS.AddOnFullLoad !== 'undefined') {
                IS.AddOnFullLoad(() => {
                    PSContext.setupAssistant();
                });
            } else {
                setTimeout(() => PSContext.initAssistant(), 100);
            }
        },

        getHelpLinkInfo() {
            try {
                const activeDoc = this.getActiveDocument();
                const helpAnchor = activeDoc.querySelector('a#HELP.PSHYPERLINK') ||
                    activeDoc.querySelector('a#HELP') ||
                    activeDoc.querySelector('a.PSHYPERLINK[name="HELP"]');

                if (!helpAnchor) {
                    return { url: 'NONE', anchor: null, doc: activeDoc };
                }

                const hrefAttr = helpAnchor.getAttribute('href') || '';
                if (!hrefAttr) {
                    return { url: 'NONE', anchor: null, doc: activeDoc };
                }

                let url = 'NONE';

                if (/^https?:\/\//i.test(hrefAttr)) {
                    url = hrefAttr;
                } else {
                    const match = hrefAttr.match(/window\.open\(\s*['"]([^'"]+)['"]/i);
                    if (match && match[1]) {
                        url = match[1];
                    } else {
                        const httpIndex = hrefAttr.indexOf('http');
                        if (httpIndex >= 0) {
                            const substring = hrefAttr.slice(httpIndex);
                            const endMatch = substring.match(/^([^'"\)\s;]+)/);
                            url = (endMatch && endMatch[1]) ? endMatch[1] : substring;
                        }
                    }
                }

                return { url, anchor: helpAnchor, doc: activeDoc };
            } catch (error) {
                console.error('Error in _getHelpLinkInfo:', error);
                return { url: 'NONE', anchor: null, doc: null };
            }
        },

        getPSHelpLink() {
            return this.getHelpLinkInfo().url;
        },

        watchPSHelpLink(callback) {
            if (State.helpLinkObserver) {
                State.helpLinkObserver.disconnect();
                State.helpLinkObserver = null;
            }

            const info = this.getHelpLinkInfo();
            State.currentHelpAnchor = info.anchor;

            if (callback) {
                callback(info.url, info.anchor);
            }

            if (info.doc && info.doc.body) {
                State.helpLinkObserver = new MutationObserver(() => {
                    const newInfo = PSContext.getHelpLinkInfo();
                    if (newInfo.anchor !== State.currentHelpAnchor) {
                        State.currentHelpAnchor = newInfo.anchor;
                        if (callback) {
                            callback(newInfo.url, newInfo.anchor);
                        }
                    }
                });

                State.helpLinkObserver.observe(info.doc.body, {
                    childList: true,
                    subtree: true
                });
            }

            return State.helpLinkObserver;
        },

        stopWatchingPSHelpLink() {
            if (State.helpLinkObserver) {
                State.helpLinkObserver.disconnect();
                State.helpLinkObserver = null;
                State.currentHelpAnchor = null;
            }
        },

        updateHelpLinkProfile(url) {
            IS.PubCV.Config.dataAttributes.ps_help_link = url;

            if (
                typeof ida !== 'undefined' &&
                ida.chatSettings &&
                ida.chatSettings.initUserProfile &&
                ida.chatSettings.initUserProfile.profile &&
                ida.chatSettings.initUserProfile.profile.properties &&
                ida.chatSettings.initUserProfile.profile.properties.dataAttributes
            ) {
                ida.chatSettings.initUserProfile.profile.properties.dataAttributes.ps_help_link = url;
                if (ida.Bots && typeof ida.Bots.updateUser === 'function') {
                    ida.Bots.updateUser(ida.chatSettings.initUserProfile);
                }
            }
        }
    };

    // Resource loader
    const ResourceLoader = {
        scriptExists(scriptName) {
            const scripts = document.getElementsByTagName('script');
            for (let i = 0; i < scripts.length; i++) {
                if (scripts[i].src.includes(scriptName)) {
                    return true;
                }
                // Don't load UI Kit Lite if standard UI Kit is loaded
                if (scriptName === 'is_core_lite' && scripts[i].src.includes('IS_CORE_JS')) {
                    return true;
                }
            }
            return false;
        },

        cssExists(cssName) {
            const links = document.getElementsByTagName('link');
            for (let i = 0; i < links.length; i++) {
                if (links[i].href.includes(cssName)) {
                    return true;
                }
            }
            return false;
        },

        createScript(name, path) {
            const script = Utils.createElement('script', {
                id: name,
                type: IS.PubCV.Config.jsType,
                language: IS.PubCV.Config.jsLanguage,
                async: false
            });

            if (name === 'IS_CV_OB_WIDGET') {
                window._babelPolyfill = false;
                Utils.debug('Set babelPolyfill = false');
            }

            script.src = name !== 'IS_CV_ENV_CONFIG'
                ? `${path}scripts/${name}.js`
                : `${path}${name}.js`;

            script.onload = () => ResourceLoader.appendToHeader();

            return script;
        },

        createStylesheet(name, path) {
            const link = Utils.createElement('link', {
                id: name,
                type: IS.PubCV.Config.cssType,
                rel: IS.PubCV.Config.cssRel,
                async: false
            });

            link.href = `${path}styles/${name}.css`;
            link.onload = () => ResourceLoader.appendToHeader();

            return link;
        },

        loadResources(path, orgId) {
            // Load JavaScript files
            IS.PubCV.Config.jsIncludes.forEach(scriptName => {
                Utils.debug('Loading:', scriptName);
                if (!this.scriptExists(scriptName)) {
                    Utils.debug('Adding script:', scriptName);
                    State.headerIncludes.push(this.createScript(scriptName, path));
                }
            });

            // Load CSS files
            IS.PubCV.Config.cssIncludes.forEach(cssName => {
                if (!this.cssExists(cssName)) {
                    State.headerIncludes.push(this.createStylesheet(cssName, path));
                }
            });

            // Load draggable button CSS if enabled
            if (window.IS.enableDraggableButton === true) {
                const draggableLink = this.createStylesheet('IS_IDA_DRAGGABLE', path);
                State.headerIncludes.push(draggableLink);
            }

            // Load organization-specific CSS
            if (orgId !== 'NONE') {
                const orgLink = Utils.createElement('link', {
                    id: orgId,
                    type: IS.PubCV.Config.cssType,
                    rel: IS.PubCV.Config.cssRel,
                    async: false
                });
                orgLink.href = `${path}${orgId}.css`;
                orgLink.onload = () => ResourceLoader.appendToHeader();
            }
        },

        appendToHeader() {
            if (State.headerIncludes.length > 0) {
                const element = State.headerIncludes.shift();
                
                if (!element.id || !document.getElementById(element.id)) {
                    document.head.appendChild(element);
                } else {
                    ResourceLoader.appendToHeader();
                }
            } else {
                // All resources loaded, create chat container
                const chatContainer = ChatUI.createPublicChatContainer();
                if (chatContainer) {
                    document.body.appendChild(chatContainer);
                }
            }
        }
    };

    // Chat UI components
    const ChatUI = {
        createPublicChatContainer() {
            try {
                const chatDiv = Utils.createElement('div', {
                    class: 'isCV_PublicChat',
                    'role': 'region',
                    'aria-label': 'chat window'
                });

                const customHold = Utils.createElement('div', {
                    id: 'ida-custom-hold',
                    class: 'hide'
                });
                
                const voiceButton = Utils.createElement('button', {
                    id: 'idaSelectVoices',
                    class: 'ida-select-voice'
                });
                voiceButton.textContent = 'Select Voices';
                voiceButton.onclick = () => {
                    if (typeof ida !== 'undefined' && ida.OpenVoices) {
                        ida.OpenVoices();
                    }
                };
                customHold.appendChild(voiceButton);

                chatDiv.appendChild(customHold);
                chatDiv.appendChild(this.createLoginDialog());
                chatDiv.appendChild(this.createChatIcon());

                return chatDiv;
            } catch (error) {
                Utils.debug('Error creating chat container:', error);
                return null;
            }
        },

        createLoginDialog() {
            const loginDiv = Utils.createElement('div', {
                id: 'IS_CV_PUBLIC_LOGIN',
                class: 'isCV_PublicLogin hide'
            });

            const header = Utils.createElement('span');
            header.textContent = IS.PubCV.Config.loginHeaderText;
            loginDiv.appendChild(header);

            IS.PubCV.Config.loginOptions.forEach(option => {
                loginDiv.appendChild(this.createLoginButton(option));
            });

            return loginDiv;
        },

        createLoginButton(userConfig) {
            const button = Utils.createElement('a', {
                class: 'isCV_PublicLoginButton',
                href: 'javascript:void(0);'
            });

            button.textContent = userConfig.Descr;
            button.onclick = () => {
                ChatActions.createPublicChat(userConfig.ID);
                const loginDialog = document.getElementById('IS_CV_PUBLIC_LOGIN');
                if (loginDialog && typeof IS !== 'undefined' && IS.ToggleClass) {
                    IS.ToggleClass(loginDialog, 'hide');
                }
            };

            return button;
        },

        createChatIcon() {
            // Initialize SDK
            if (typeof ida !== 'undefined' && ida.InitSDK) {
                ida.InitSDK('ida.Bots');
            }

            const iconWrapper = Utils.createElement('div', {
                id: 'isChatIconWrapper'
            });

            // Add notification badge
            const badge = Utils.createElement('div', {
                id: 'isChatBadge',
                class: 'hide'
            });
            badge.textContent = '!';
            iconWrapper.appendChild(badge);

            // Add alert popup
            iconWrapper.appendChild(this.createAlertPopup());

            // Load alerts if configured
            if (IS.PubCV.Config.GetAlerts) {
                const script = Utils.createElement('script', {
                    type: 'text/javascript',
                    language: 'javascript'
                });
                script.textContent = 'IS.PubCV.IconBadge();';
                iconWrapper.appendChild(script);
            }

            // Add welcome bubble if configured
            if (IS.PubCV.Config.WelcomeTransistionActive && !IS.PubCV.Config.GetAlerts) {
                iconWrapper.appendChild(this.createWelcomeBubble());
            }

            return iconWrapper;
        },

        createAlertPopup() {
            const popup = Utils.createElement('div', {
                id: 'isChatAlertPopup',
                class: 'hide'
            });

            const text = Utils.createElement('div');
            text.textContent = 'I have items awaiting your attention, would you like view them?';
            popup.appendChild(text);

            const yesButton = Utils.createElement('button');
            yesButton.textContent = 'Yes';
            yesButton.addEventListener('click', () => {
                if (typeof chatWidgetWebSettings !== 'undefined') {
                    chatWidgetWebSettings.greetingMessage = 'Please give me a moment...';
                }
                if (typeof CreateOracleChat !== 'undefined') {
                    CreateOracleChat(
                        IS.PubCV.Config.botID,
                        IS.PubCV.Config.botDescr,
                        null,
                        Alerts.resetWelcomeText,
                        'What is on my worklist?',
                        false
                    );
                }
                Alerts.hideAlertPopup();
            });

            const noButton = Utils.createElement('button');
            noButton.textContent = 'No';
            noButton.addEventListener('click', () => Alerts.hideAlertPopup());

            popup.appendChild(yesButton);
            popup.appendChild(noButton);

            return popup;
        },

        createWelcomeBubble() {
            const bubble = Utils.createElement('div', {
                id: 'isChatWelcomeBubble',
                'role': 'region',
                'aria-live': 'polite',
                'aria-atomic': 'true',
                'aria-label': IS.PubCV.Config.AriaLbl || 'Welcome message',
                'aria-hidden': 'true'
            });

            const text = Utils.createElement('p', {
                id: 'isChatWelcomeText'
            });
            text.textContent = IS.PubCV.Config.WelcomeText || 'How can I help you?';

            bubble.appendChild(text);
            bubble.onclick = () => ChatActions.handleIconClick();

            return bubble;
        }
    };

    // Chat actions
    const ChatActions = {
        createPublicChat(userID) {
            if (typeof CreateOracleChat !== 'undefined') {
				if(userID === false) {
					CreateOracleChat(
						IS.PubCV.Config.botID,
						IS.PubCV.Config.botDescr,
						null,
						null,
						null,
						false
					);
				} else {
					CreateOracleChat(
						IS.PubCV.Config.botID,
						IS.PubCV.Config.botDescr,
						null,
						null,
						null,
						true,
						userID
					);
				}
            }
        },

        async handleIconClick() {
            // Pre-chat function check
            if (IS.PubCV.Config.PreChatFunc && 
                IS.PubCV.Config.PreChatFunc !== 'none' && 
                typeof IS.PubCV.Config.PreChatFunc === 'function') {
                IS.PubCV.Config.CanOpenChat = await IS.PubCV.Config.PreChatFunc();
            }

            if (IS.PubCV.Config.CanOpenChat === false) {
                this.handleUnavailableChat();
                return;
            }
            
            /* Reprocess data- attributes on script tag for eFA support. */
            const callingTag = document.getElementById('IS_CV_PUBLIC_HOOK');
            const orgId = callingTag?.getAttribute('data-org') || 'NONE';
            IS.PubCV.Config.org.id = orgId;
            PSContext.parseDataAttributes(callingTag); 

            if (IS.PubCV.Config.forceMultiLogin) {
                this.showLoginDialog();
            } else {
                this.launchChat();
				
            }

            this.hideWelcomeBubble();
        },

        showLoginDialog() {
            const loginDialog = document.getElementById('IS_CV_PUBLIC_LOGIN');
            if (loginDialog && typeof IS !== 'undefined' && IS.ToggleClass) {
                IS.ToggleClass(loginDialog, 'hide');
            }
        },

        launchChat() {
            const isGuest = !IS.PubCV.Config.forceAuth && 
                           (!PSDetection.inPS() || IS.PubCV.Config.GuestOnly === true);

            if (isGuest) {
                Utils.debug('Launch Guest Chat');
                this.createPublicChat('GUEST_CHAT_USER');
            } else {
                Utils.debug('Launch User Chat - No Token');
                
                const badge = document.getElementById('isChatBadge');
                if (badge && typeof IS !== 'undefined' && IS.HasClass && IS.HasClass(badge, 'open')) {
                    Alerts.hideAlertBadge();
                    if (typeof ida !== 'undefined' && ida.chatSettings) {
                        ida.chatSettings.i18n = IS.MergeJSON(
                            ida.chatSettings.i18n,
                            ida.chatSettings.ida.alertsGreetingMessage
                        );
                    }
                    if (typeof CreateOracleChat !== 'undefined') {
                        CreateOracleChat(
                            IS.PubCV.Config.botID,
                            IS.PubCV.Config.botDescr,
                            null,
                            Alerts.resetWelcomeText,
                            'View my alerts',
                            false
                        );
                    }
                } else {
					/* JDL 2/11/26 fix error with non-guest chat 
					this.createPublicChat(null); */ 
                    this.createPublicChat(false); 
				  
                }
            }
        },

        handleUnavailableChat() {
            if (typeof ida === 'undefined' || !ida.Bots) {
                if (typeof ida !== 'undefined' && ida.InitSDK) {
                    ida.InitSDK('ida.Bots');
                }
                
                if (ida.Bots && ida.Bots.openChat) {
                    ida.Bots.openChat();
                    window.ChatUIOpen = true;

                    ida.Bots.on(WebSDK.EVENT.WIDGET_OPENED, () => {
                        if (ida.CreateWebContainer) {
                            ida.CreateWebContainer();
                        }

                        Utils.debug('Digital Assistant outage.');
                        
                        if (ida.DisplayWebContainer) {
                            ida.DisplayWebContainer(
                                '<div id="IS_CV_NO_ACCESS">'+ ida.defaultSettings.ida.chatbotOutageMessage +'</div>',
                                '',
                                false
                            );
                        }

                        const closeButton = document.getElementById('oda-chat-end-conversation');
                        if (closeButton) {
                            closeButton.removeAttribute('disabled');
                            closeButton.addEventListener('click', this.destroyBot);
                        }

                        const webCloseButton = document.getElementById('IS_CV_WEB_CLOSE_BTN');
                        if (webCloseButton) {
                            webCloseButton.addEventListener('click', this.destroyBot);
                        }
                    });
                }
            }
        },

        destroyBot() {
            if (typeof ida !== 'undefined' && ida.Bots && ida.Bots.destroy) {
                ida.Bots.destroy();
                if (ida.InitSDK) {
                    ida.InitSDK('ida.Bots');
                }
            }
        },

        hideWelcomeBubble() {
            const welcomeBubble = document.getElementById('isChatWelcomeBubble');
            if (welcomeBubble && typeof IS !== 'undefined' && IS.AddClass) {
                IS.AddClass(welcomeBubble, 'hide');
                welcomeBubble.setAttribute('aria-hidden', 'true');
            }
        }
    };

    // Alerts management
    const Alerts = {
        iconBadge() {
            const inPS = PSDetection.inPS();
            const isGuest = IS.PubCV.Config.GuestOnly === false;

            if (inPS && !isGuest) {
                this.loadPSAlerts();
            } else if (!inPS && typeof IDA_ALERTS_USER_ID !== 'undefined') {
                this.getAlertCount(IDA_ALERTS_USER_ID, '');
            } else {
                this.checkLocalStorageAlerts();
            }
        },

        loadPSAlerts() {
            if (typeof ORACLEUSERRESOLVE === 'undefined') {
                return;
            }

            const script = Utils.createElement('script');
            script.src = ORACLEUSERRESOLVE;
            script.onload = () => {
                if (typeof CurrentToken !== 'undefined' && CurrentToken !== null) {
                    this.getAlertCount('', CurrentToken);
                }
            };
            document.head.appendChild(script);
        },

        checkLocalStorageAlerts() {
            try {
                const alertCount = JSON.parse(localStorage.getItem('IDA_ALERTS')) ? 1 : 0;
                this.showBadgeForCount(alertCount);
            } catch (error) {
                Utils.debug('Error checking local storage alerts:', error);
            }
        },

        createUUID() {
            const hexDigits = '0123456789abcdef';
            const s = [];
            
            for (let i = 0; i < 36; i++) {
                s[i] = hexDigits.charAt(Math.floor(Math.random() * 0x10));
            }
            
            s[14] = '4';
            s[19] = hexDigits.charAt((s[19] & 0x3) | 0x8);
            s[8] = s[13] = s[18] = s[23] = '-';
            
            return s.join('');
        },

        getAlertCount(userid, token) {
            if (!IS.PubCV.Config.AlertsSocket) {
                return;
            }

            try {
                const socket = new WebSocket(
                    `${IS.PubCV.Config.AlertsSocket}&userId=${this.createUUID()}`
                );

                socket.onopen = () => {
                    Utils.debug('WebSocket connection established.');
                    
                    const profileData = {
                        profile: {
                            properties: { userid, token }
                        }
                    };
                    socket.send(JSON.stringify(profileData));
                    Utils.debug('Sent profile info to alerts socket');

                    const utteranceData = {
                        source: 'USER',
                        messagePayload: {
                            type: 'text',
                            text: 'Get Alerts Count'
                        }
                    };
                    socket.send(JSON.stringify(utteranceData));
                    Utils.debug('Sent utterance to alerts socket');
                };

                socket.onmessage = (event) => {
                    try {
                        const response = JSON.parse(event.data);
                        Utils.debug('Received message:', event.data);
                        this.showBadgeForCount(parseInt(response.messagePayload.text, 10));
                        socket.close();
                    } catch (error) {
                        Utils.debug('Error parsing socket message:', error);
                    }
                };

                socket.onclose = () => {
                    Utils.debug('WebSocket connection closed.');
                };

                socket.onerror = (error) => {
                    Utils.debug('WebSocket error:', error);
                };
            } catch (error) {
                Utils.debug('Error creating WebSocket:', error);
            }
        },

        showBadgeForCount(count) {
            if (count > 0) {
                this.showAlertBadge();
            }
        },

        showAlertBadge() {
            const badge = document.getElementById('isChatBadge');
            if (badge && typeof IS !== 'undefined') {
                if (IS.AddClass) IS.AddClass(badge, 'open');
                if (IS.RemoveClass) IS.RemoveClass(badge, 'hide');
            }
        },

        hideAlertBadge() {
            const badge = document.getElementById('isChatBadge');
            if (badge && typeof IS !== 'undefined') {
                if (IS.AddClass) IS.AddClass(badge, 'hide');
                if (IS.RemoveClass) IS.RemoveClass(badge, 'open');
            }
        },

        hideAlertPopup() {
            const popup = document.getElementById('isChatAlertPopup');
            if (popup && typeof IS !== 'undefined' && IS.AddClass) {
                IS.AddClass(popup, 'hide');
            }
        },

        resetWelcomeText() {
            if (typeof ida !== 'undefined' && 
                ida.chatSettings && 
                ida.defaultSettings && 
                typeof IS !== 'undefined' && 
                IS.MergeJSON) {
                ida.chatSettings.i18n = IS.MergeJSON(
                    ida.chatSettings.i18n,
                    ida.defaultSettings.i18n
                );
            }
        }
    };

        // Dragging functionality
    const DragManager = {
        init() {
            if (!ida.defaultSettings.enableDraggableButton) {
                return;
            }

            const icon = document.getElementById('idalogin');
            if (!icon) {
                Utils.debug('Chat icon not found for dragging');
                return;
            }

            State.dragController = new AbortController();

            this.restoreSavedPosition(icon);
            this.attachEventListeners(icon);
        },

        restoreSavedPosition(icon) {
            try {
                const savedLeft = Utils.getSessionStorage(CONSTANTS.SESSION_KEYS.CHAT_LEFT);
                const savedTop = Utils.getSessionStorage(CONSTANTS.SESSION_KEYS.CHAT_TOP);

                if (savedLeft && savedTop && icon) {
                    const wrapper = Utils.safeQuerySelector('.oda-chat-wrapper');
                    const sdkButtons = document.getElementsByClassName('oda-chat-button');
                    const icon2 = sdkButtons[0]?.id === '' ? sdkButtons[0] : sdkButtons[1];

                    if (wrapper && typeof IS !== 'undefined' && IS.AddClass) {
                        IS.AddClass(wrapper, 'oda-chat-drag');
                        IS.AddClass(icon, 'oda-chat-drag');
                        if (icon2) IS.AddClass(icon2, 'oda-chat-drag');
                    }

                    icon.style.left = savedLeft;
                    icon.style.top = savedTop;
                    icon.style.transform = 'unset';

                    if (icon2) {
                        const saved2Left = Utils.getSessionStorage(CONSTANTS.SESSION_KEYS.CHAT2_LEFT);
                        const saved2Top = Utils.getSessionStorage(CONSTANTS.SESSION_KEYS.CHAT2_TOP);
                        icon2.style.transform = `translate3d(${saved2Left}, ${saved2Top}, 0px)`;
                    }

                    const icon3 = document.getElementById('isChatWelcomeBubble');
                    if (icon3) {
                        const saved3Left = Utils.getSessionStorage(CONSTANTS.SESSION_KEYS.WRAPPER_LEFT);
                        const saved3Top = Utils.getSessionStorage(CONSTANTS.SESSION_KEYS.WRAPPER_TOP);
                        icon3.style.left = saved3Left;
                        icon3.style.top = saved3Top;
                    }
                }
            } catch (error) {
                Utils.debug('Error restoring position:', error);
            }
        },

        attachEventListeners(icon) {
            const options = { signal: State.dragController.signal };

            // Track drag state
            let dragStartX = 0;
            let dragStartY = 0;
            let hasDragged = false;

            // Mouse events
            icon.addEventListener('mousedown', (e) => {
                dragStartX = e.clientX;
                dragStartY = e.clientY;
                hasDragged = false;
                this.handleDragStart(e, icon);
            }, options);

            document.addEventListener('mousemove', Utils.throttle((e) => {
                if (State.isDragging) {
                    const deltaX = Math.abs(e.clientX - dragStartX);
                    const deltaY = Math.abs(e.clientY - dragStartY);
                    
                    // Check if actually dragged beyond threshold
                    if (deltaX > CONSTANTS.DRAG_THRESHOLD || deltaY > CONSTANTS.DRAG_THRESHOLD) {
                        hasDragged = true;
                        document.body.classList.add('ida-is-dragging');
                    }
                    
                    this.handleDragMove(e, icon);
                }
            }, 16), options);

            document.addEventListener('mouseup', () => {
                this.handleDragEnd(icon, hasDragged);
                hasDragged = false;
            }, options);

            // Touch events
            icon.addEventListener('touchstart', (e) => {
                const touch = e.touches[0];
                dragStartX = touch.clientX;
                dragStartY = touch.clientY;
                hasDragged = false;
                this.handleDragStart(e, icon);
            }, options);

            document.addEventListener('touchmove', Utils.throttle((e) => {
                if (State.isDragging && e.touches[0]) {
                    const touch = e.touches[0];
                    const deltaX = Math.abs(touch.clientX - dragStartX);
                    const deltaY = Math.abs(touch.clientY - dragStartY);
                    
                    // Check if actually dragged beyond threshold
                    if (deltaX > CONSTANTS.DRAG_THRESHOLD || deltaY > CONSTANTS.DRAG_THRESHOLD) {
                        hasDragged = true;
                        document.body.classList.add('ida-is-dragging');
                    }
                    
                    this.handleDragMove(e, icon);
                }
            }, 16), options);

            document.addEventListener('touchend', () => {
                this.handleDragEnd(icon, hasDragged);
                hasDragged = false;
            }, options);

            // Keyboard events
            /* JDL 5/1/26 - Update to only apply keyboard movement when icon is focused to prevent interfering with other page navigation */ 
  /*          document.addEventListener('keydown', (e) => this.handleKeyboardMove(e, icon), options); */
            /* Keyboard movement — only fires when #idalogin has focus */
            icon.setAttribute('tabindex', icon.getAttribute('tabindex') ?? '0');

            icon.addEventListener('focus', () => {
                State.iconFocused = true;
            }, options);

            icon.addEventListener('blur', () => {
                State.iconFocused = false;
            }, options);

            document.addEventListener('keydown', (e) => {
                if (!State.iconFocused) return;
                this.handleKeyboardMove(e, icon);
            }, options);
            /* JDL 5/1/26 - End keyboard movement update */

            // Click handling for secondary icon
            const sdkButtons = document.getElementsByClassName('oda-chat-button');
            const icon2 = sdkButtons[0]?.id === '' ? sdkButtons[0] : sdkButtons[1];
            if (icon2) {
                icon2.addEventListener('mousedown', () => {
                    State.isDragging = true;
                    /*document.body.classList.add('ida-is-dragging'); */
                }, options);
                icon2.addEventListener('touchstart', () => {
                    State.isDragging = true;
                    /*document.body.classList.add('ida-is-dragging'); */
                }, options);
            }
        },

        handleDragStart(event, icon) {
            State.isDragging = true;
            /*document.body.classList.add('ida-is-dragging'); */

            const clientX = event.clientX || (event.touches && event.touches[0]?.clientX) || 0;
            const clientY = event.clientY || (event.touches && event.touches[0]?.clientY) || 0;

            State.offsetX = clientX - icon.offsetLeft;
            State.offsetY = clientY - icon.offsetTop;
            
            // Store the original onclick handler
            State.onclickBackup = icon.onclick;
        },

        handleDragMove(event, icon) {
            if (!State.isDragging) return;

            const clientX = event.clientX || (event.touches && event.touches[0]?.clientX) || 0;
            const clientY = event.clientY || (event.touches && event.touches[0]?.clientY) || 0;

            this.updatePosition(icon, clientX, clientY);
        },

        handleDragEnd(icon, hasDragged) {
            if (State.isDragging) {
                // If the user actually dragged, prevent click
                if (hasDragged) {
                    // Temporarily disable the onclick
                    const originalOnclick = icon.onclick;
                    icon.onclick = null;
                    
                    // Re-enable onclick after a short delay
                    setTimeout(() => {
                        icon.onclick = originalOnclick || State.onclickBackup;
                    }, 100);
                } else {
                    // It was just a click, restore onclick immediately
                    icon.onclick = State.onclickBackup;
                }
                
                this.savePosition();
            }
            
            State.isDragging = false;
            setTimeout(function() {document.body.classList.remove('ida-is-dragging');}, 500);
            
        },

        handleKeyboardMove(event, icon) {
            const movements = {
                'ArrowLeft': { x: -1, y: 0 },
                'ArrowUp': { x: 0, y: -1 },
                'ArrowRight': { x: 1, y: 0 },
                'ArrowDown': { x: 0, y: 1 }
            };

            const movement = movements[event.key];
            if (!movement) return;

            event.preventDefault();

            const currentX = icon.offsetLeft + movement.x;
            const currentY = icon.offsetTop + movement.y;

            this.updatePosition(icon, currentX + State.offsetX, currentY + State.offsetY);
            this.savePosition();
        },

        updatePosition(icon, clientX, clientY) {
            const newLeft = clientX - State.offsetX;
            const newTop = clientY - State.offsetY;

            icon.style.left = `${newLeft}px`;
            icon.style.top = `${newTop}px`;

            const wrapper = Utils.safeQuerySelector('.oda-chat-wrapper');
            if (wrapper && typeof IS !== 'undefined' && IS.AddClass) {
                IS.AddClass(wrapper, 'oda-chat-drag');
            }

            // Update secondary icon
            const sdkButtons = document.getElementsByClassName('oda-chat-button');
            const icon2 = sdkButtons[0]?.id === '' ? sdkButtons[0] : sdkButtons[1];
            if (icon2) {
                icon2.style.transform = `translate3d(${newLeft + CONSTANTS.ICON_OFFSET}px, ${newTop + CONSTANTS.ICON_OFFSET}px, 0px)`;
            }

            // Update welcome bubble
            const icon3 = document.getElementById('isChatWelcomeBubble');
            if (icon3) {
                icon3.style.left = `${newLeft + CONSTANTS.ICON_OFFSET}px`;
                icon3.style.top = `${newTop}px`;
            }
        },

        savePosition() {
            const icon = document.getElementById('idalogin');
            if (!icon) return;

            const left = icon.offsetLeft;
            const top = icon.offsetTop;

            Utils.setSessionStorage(CONSTANTS.SESSION_KEYS.CHAT_LEFT, `${left}px`);
            Utils.setSessionStorage(CONSTANTS.SESSION_KEYS.CHAT_TOP, `${top}px`);
            Utils.setSessionStorage(CONSTANTS.SESSION_KEYS.CHAT2_LEFT, `${left + CONSTANTS.ICON_OFFSET}px`);
            Utils.setSessionStorage(CONSTANTS.SESSION_KEYS.CHAT2_TOP, `${top + CONSTANTS.ICON_OFFSET}px`);
            Utils.setSessionStorage(CONSTANTS.SESSION_KEYS.WRAPPER_LEFT, `${left + CONSTANTS.ICON_OFFSET}px`);
            Utils.setSessionStorage(CONSTANTS.SESSION_KEYS.WRAPPER_TOP, `${top}px`);
        },

        cleanup() {
            if (State.dragController) {
                State.dragController.abort();
                State.dragController = null;
            }
        }
    };

    // Session management
    const SessionManager = {
        destroyChat() {
            try {
                if (typeof ida !== 'undefined' && ida.destroy) {
                    ida.destroy();
                }
                PSContext.stopWatchingPSHelpLink();
            } catch (error) {
                Utils.debug('Error during chat cleanup:', error);
            }
        },

        destroySession(event) {
            const element = event.target;
            Utils.debug('In destroy session function');

            const shouldDestroy = 
                element.id === 'IS_CV_CLOSE_CHAT_BUTTON' ||
                element.parentNode?.id === 'oda-chat-end-conversation' ||
                element.id === 'oda-chat-end-conversation';

            if (shouldDestroy) {
                this.destroyChat();

                if (!PSDetection.inPS() && IS.PubCV.Config.logoutSrc) {
                    const script = Utils.createElement('script');
                    script.src = IS.PubCV.Config.logoutSrc;
                    document.head.appendChild(script);
                }
            }
        },

        destroyPSSession() {
            // Restore draggable position
            if (ida?.defaultSettings?.enableDraggableButton) {
                const savedLeft = Utils.getSessionStorage(CONSTANTS.SESSION_KEYS.CHAT_LEFT);
                if (savedLeft) {
                    const wrapper = Utils.safeQuerySelector('.oda-chat-wrapper');
                    if (wrapper && typeof IS !== 'undefined' && IS.AddClass) {
                        IS.AddClass(wrapper, 'oda-chat-drag');
                    }

                    const sdkButtons = document.getElementsByClassName('oda-chat-button');
                    const sdkIcon = sdkButtons[0]?.id === '' ? sdkButtons[0] : sdkButtons[1];
                    
                    if (sdkIcon) {
                        const savedWrapperLeft = Utils.getSessionStorage(CONSTANTS.SESSION_KEYS.WRAPPER_LEFT);
                        const savedWrapperTop = Utils.getSessionStorage(CONSTANTS.SESSION_KEYS.WRAPPER_TOP);
                        sdkIcon.style.transform = `translate3d(${savedWrapperLeft}, ${savedWrapperTop}, 0px)`;
                    }
                }
            }

            if (!PSDetection.inPS() && IS.PubCV.Config.logoutSrc) {
                const script = Utils.createElement('script');
                script.src = IS.PubCV.Config.logoutSrc;
                document.head.appendChild(script);
            }
        }
    };

    // Launcher visibility
    const LauncherManager = {
        init() {
            try {
                State.hideLauncher = Utils.getCookie(CONSTANTS.COOKIE_NAME) === CONSTANTS.COOKIE_VALUE;
                if (State.hideLauncher) {
                    if (typeof IS !== 'undefined' && IS.AddClass) {
                        IS.AddClass(document.body, 'ida-hide-launcher');
                    }
                }
            } catch (error) {
                Utils.debug('Error initializing launcher visibility:', error);
            }
        },

        toggle() {
            if (!State.hideLauncher) {
                Utils.setCookie(CONSTANTS.COOKIE_NAME, CONSTANTS.COOKIE_VALUE);
                State.hideLauncher = true;
                if (typeof IS !== 'undefined' && IS.AddClass) {
                    IS.AddClass(document.body, 'ida-hide-launcher');
                }
            } else {
                Utils.deleteCookie(CONSTANTS.COOKIE_NAME);
                State.hideLauncher = false;
                if (typeof IS !== 'undefined' && IS.RemoveClass) {
                    IS.RemoveClass(document.body, 'ida-hide-launcher');
                }
            }
        }
    };

    // Chat transcript management
    const TranscriptManager = {
        downloadAsFile(content, filename, mimeType = 'text/plain') {
            try {
                const blob = new Blob([content], { type: mimeType });
                const url = URL.createObjectURL(blob);
                const anchor = Utils.createElement('a', {
                    href: url,
                    download: filename
                });

                document.body.appendChild(anchor);
                anchor.click();
                document.body.removeChild(anchor);
                URL.revokeObjectURL(url);
            } catch (error) {
                Utils.debug('Error downloading file:', error);
            }
        },

        getMessagesAsString(noSaveFile = false) {
            const separator = '\n';
            const messageBlocks = Utils.safeQuerySelectorAll(
                '.oda-chat-message-block, .oda-chat-timestamp-header, .oda-chat-hr, .oda-chat-relative-timestamp'
            );

            const formattedMessages = [];

            Array.from(messageBlocks).forEach(block => {
                const text = block.textContent.trim();
                if (!text) return;

                if (block.classList.contains('oda-chat-timestamp-header')) {
                    formattedMessages.push(`\n=== ${text} ===`);
                } else if (block.classList.contains('oda-chat-hr')) {
                    formattedMessages.push(`\n--- ${text} ---`);
                } else if (block.classList.contains('oda-chat-relative-timestamp')) {
                    formattedMessages.push(`(${text})`);
                } else if (block.classList.contains('oda-chat-message-block')) {
                    this.processMessageBlock(block, formattedMessages);
                }
            });

            const transcript = formattedMessages
                .join(separator)
                .replace(/\n{3,}/g, '\n\n')
                .replace(/\n\s+\n/g, '\n\n')
                .trim();

            if (!noSaveFile) {
              
                const fileprefix = IS.PubCV.Config.BotName + 'Chat' || 'MyChat';
                const filename = `${fileprefix}_${new Date().toJSON().slice(0, 16)}.log`;
                this.downloadAsFile(transcript, filename);
            }

            return transcript;
        },

        processMessageBlock(block, formattedMessages) {
            const isUserMessage = block.classList.contains('oda-chat-right');
            const speaker = isUserMessage ? 'User' : (IS.PubCV.Config.BotName || 'Bot');
            const cleanBlock = this.filterElement(block);
            const messages = [];

            const messageElements = cleanBlock.querySelectorAll('.oda-chat-message');

            messageElements.forEach(messageEl => {
                const messageContent = messageEl.querySelector('.oda-chat-message-text');
                
                if (messageContent) {
                    const summaryBlocks = messageContent.querySelectorAll('.cvSummaryBlock');
                    
                    if (summaryBlocks.length > 0) {
                        messages.push(this.extractSummaryData(summaryBlocks));
                    } else {
                        /* JDL 6/23/26 - Fix to include links with the transcript */
                       /* const content = messageContent.textContent
                            .trim() */
                       //     .replace(/^(I say|Skill says)\s*/, ''); 
                        const content = this.extractTextWithLinks(messageContent)
                            .replace(/^(I say|Skill says)\s*/, '');
                        /* end JDL 6/23/26 */
                        if (content) {
                            messages.push(content);
                        }
                    }
                }

                const actionButtons = messageEl.querySelectorAll('.oda-chat-action-postback');
                if (actionButtons.length > 0) {
                    const buttons = Array.from(actionButtons)
                        .map(btn => `[${btn.textContent.trim()}]`)
                        .join(' ');
                    messages.push(`${speaker} (Options): ${buttons}`);
                }
            });

            messages.forEach(msg => {
                if (msg.startsWith(`${speaker} (Options):`)) {
                    formattedMessages.push(msg);
                } else {
                    formattedMessages.push(`${speaker}: ${msg}`);
                }
                    /* JDL 6/23/26 - Fix to separate the transcript */
                    formattedMessages.push(''); // Add a blank line after each message for better readability
                    /* end JDL 6/23/26 */   
            });
        },

        extractSummaryData(summaryBlocks) {
            let content = '';
            
            summaryBlocks.forEach(block => {
                const items = block.querySelectorAll('.cvSummaryItem');
                items.forEach(item => {
                    const nameEl = item.querySelector('.cvSummaryItemName');
                    const valueEl = item.querySelector('.cvSummaryItemValue');
                    
                    if (nameEl && valueEl) {
                        const name = nameEl.textContent.trim().replace(/:\s*$/, '');
                        const value = valueEl.textContent.trim();
                        content += `    ${name}: ${value}\n`;
                    }
                });
                content += '\n';
            });
            
            return content.trim();
        },
        /*
        * Extracts readable text from a message element while preserving
        * any links as "text (URL)". Falls back to plain textContent
        * behavior when there are no anchor tags to worry about.
        */
        extractTextWithLinks(element) {
            const anchors = element.querySelectorAll('a[href]');

            if (anchors.length === 0) {
                return element.textContent.trim();
            }

            const clone = element.cloneNode(true);
            const clonedAnchors = clone.querySelectorAll('a[href]');

            clonedAnchors.forEach(anchor => {
                const href = anchor.getAttribute('href');
                const label = anchor.textContent.trim();

                if (!href) return;

                /* Avoid duplicating the URL if the link text already is the URL */
                const replacementText = (label && label !== href)
                    ? `${label} (${href})`
                    : href;

                anchor.replaceWith(document.createTextNode(replacementText));
            });

            return clone.textContent.trim();
        },

        filterElement(element) {
            const clone = element.cloneNode(true);

            // Remove scripts
            clone.querySelectorAll('script').forEach(el => el.remove());
            
            // Remove feedback containers
            clone.querySelectorAll('.feedback-container').forEach(el => el.remove());
            
            // Remove debug elements
            clone.querySelectorAll('.idaRagDebug').forEach(el => el.remove());

            // Remove "Did I meet your expectations?" elements
            const walker = document.createTreeWalker(
                clone,
                NodeFilter.SHOW_TEXT,
                null,
                false
            );

            const nodesToRemove = [];
            let node;

            while (node = walker.nextNode()) {
                if (node.nodeValue?.trim() === 'Did I meet your expectations?') {
                    const parentElement = node.parentElement;
                    if (parentElement?.parentNode) {
                        nodesToRemove.push(parentElement.parentNode);
                    }
                }
            }

            nodesToRemove.forEach(node => {
                if (node?.parentNode) {
                    node.parentNode.removeChild(node);
                } else if (node) {
                    node.remove();
                }
            });

            return clone;
        }
    };

    // Welcome display manager
    const WelcomeManager = {
        display() {
            if (!IS.PubCV.Config.WelcomeTransistionActive || IS.PubCV.Config.GetAlerts) {
                DragManager.init();
                return;
            }

            const welcomeBubble = document.getElementById('isChatWelcomeBubble');
            const loginIcon = document.getElementById('idalogin');

            if (!welcomeBubble || typeof IS === 'undefined') {
                DragManager.init();
                return;
            }

            // Show welcome bubble
            if (IS.RemoveClass) IS.RemoveClass(welcomeBubble, 'welcomeBubbleHide');
            if (IS.AddClass) IS.AddClass(welcomeBubble, 'welcomeBubbleShow');
            welcomeBubble.setAttribute('aria-hidden', 'false');

            // Fix dragging display
            if (loginIcon) {
                const currentStyle = loginIcon.getAttribute('style') || '';
                loginIcon.setAttribute('style', `${currentStyle}display:block;`);
            }

            // Hide after duration
            const duration = IS.PubCV.Config.WelcomeDuration || 5000;
            setTimeout(() => {
                if (IS.RemoveClass) IS.RemoveClass(welcomeBubble, 'welcomeBubbleShow');
                if (IS.AddClass) IS.AddClass(welcomeBubble, 'welcomeBubbleHide');
                welcomeBubble.setAttribute('aria-hidden', 'true');

                if (loginIcon) {
                    const currentStyle = loginIcon.getAttribute('style') || '';
                    loginIcon.setAttribute('style', currentStyle.replace('display:block;', ''));
                }
            }, duration);

            DragManager.init();
        }
    };

    // Initialization
    const Initializer = {
        initialize() {
            Utils.debug('Initializing');

            if (State.initializeStarted) {
                Utils.debug('Already initialized');
                return;
            }

            State.initializeStarted = true;

            // Get organization ID
            const callingTag = document.getElementById('IS_CV_PUBLIC_HOOK');
            const orgId = callingTag?.getAttribute('data-org') || 'NONE';
            IS.PubCV.Config.org.id = orgId;
            PSContext.parseDataAttributes(callingTag);

            const psComponentInfo = PSContext.getComponent();
            if (psComponentInfo[0] !== 'NONE') {
                IS.PubCV.Config.dataAttributes.ps_component_id = psComponentInfo[0];
                Utils.debug('Added data attribute:', 'ps_component_id', '=', psComponentInfo[0]);
            }

            const psHelpLink = PSContext.getPSHelpLink();
            if (psHelpLink !== 'NONE') {
                IS.PubCV.Config.dataAttributes.ps_help_link = psHelpLink;
                Utils.debug('Added data attribute:', 'ps_help_link', '=', psHelpLink);
            }

            PSContext.watchPSHelpLink((url) => {
                try {
                    PSContext.updateHelpLinkProfile(url);
                } catch (error) {
                    Utils.debug('Error updating help link data attribute:', error);
                }
            });

            // Get script path using captured reference
            let scriptPath = '';
        
            if (CURRENT_SCRIPT) {
                scriptPath = CURRENT_SCRIPT.src;
            } else {
                // Fallback methods...
                const callingTag = document.getElementById('IS_CV_PUBLIC_HOOK');
                if (callingTag) {
                    scriptPath = callingTag.src;
                }
            }
            
            IS.PubCV.Config.path = scriptPath.replace('IS_CV_PUBLIC_HOOK.js', '');


            // Load resources
            ResourceLoader.loadResources(IS.PubCV.Config.path, orgId);
            ResourceLoader.appendToHeader();

            PSContext.initAssistant();

            // Initialize launcher visibility
            LauncherManager.init();
        },

    };

    // Public API
    IS.PubCV.Initialize = () => Initializer.initialize();
    IS.PubCV.Debug = (...args) => Utils.debug(...args);
    IS.PubCV.CreatePublicChat = (userID) => ChatActions.createPublicChat(userID);
    IS.PubCV.OnclickFunction = () => ChatActions.handleIconClick();
    IS.PubCV.DisplayWelcome = () => WelcomeManager.display();
    IS.PubCV.IconBadge = () => Alerts.iconBadge();
    IS.PubCV.HideAlertBadge = () => Alerts.hideAlertBadge();
    IS.PubCV.ShowAlertBadge = () => Alerts.showAlertBadge();
    IS.PubCV.ResetWelcomeText = () => Alerts.resetWelcomeText();
    IS.PubCV.InPS = () => PSDetection.inPS();
    IS.PubCV.ShowChatIcon = () => PSDetection.shouldShowChatIcon();
    IS.PubCV.InitPSAssistant = () => PSContext.initAssistant();
    IS.PubCV.GetComponent = () => PSContext.getComponent();
    IS.PubCV.PSAssistantSetup = () => PSContext.setupAssistant();
    IS.PubCV.GetPSHelpLink = () => PSContext.getPSHelpLink();
    IS.PubCV._getHelpLinkInfo = () => PSContext.getHelpLinkInfo();
    IS.PubCV.WatchPSHelpLink = (callback) => PSContext.watchPSHelpLink(callback);
    IS.PubCV.StopWatchingPSHelpLink = () => PSContext.stopWatchingPSHelpLink();
    IS.PubCV.DestroyChat = () => SessionManager.destroyChat();
    IS.PubCV.toggleLauncher = () => LauncherManager.toggle();
    IS.PubCV.downloadVariableAsFile = (content, filename, mimeType) => 
        TranscriptManager.downloadAsFile(content, filename, mimeType);
    IS.PubCV.getOdaChatMessagesAsString = (noSaveFile) => 
        TranscriptManager.getMessagesAsString(noSaveFile);
    IS.PubCV.DestroyPSSession = () => SessionManager.destroyPSSession();
    IS.PubCV.setupDragging = () => DragManager.init();

    // Global session destroyer
    window.destroySession = (event) => SessionManager.destroySession(event);

    // Auto-initialize if in top window
    if (window === window.top) {
        // Use DOMContentLoaded to ensure DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => IS.PubCV.Initialize());
        } else {
            IS.PubCV.Initialize();
        }
    }

    // Set global environment variable
    window.IS_CV_CHATBOT_ENV = CONSTANTS.ENV;
    window.IS.enableDraggableButton = true;

})();

IS.PubCV.SetChatIconOnclick = function(el) {
	el.onclick = function() {
		IS.PubCV.OnclickFunction();
	};

};

(function () {
    'use strict';

    // Determine the script's base URL so the stylesheet can be loaded relative to the current file.
    var currentScript = document.currentScript || document.scripts[document.scripts.length - 1];
    var baseURL = '';
    if (currentScript && currentScript.src) {
        baseURL = currentScript.src.split('/').slice(0, -1).join('/') + '/';
    }

    // Default configuration used when no options are supplied during initialization.
    // -------------------------------------------------------------------------
    // Configuration
    // -------------------------------------------------------------------------
    var defaultOptions = {
        wrapselector: document,
        targetselector: 'h2,h3',
        adjustment: 10,
        includeTOCHeight: true
    };

    // -------------------------------------------------------------------------
    // DOM Helper Functions
    // -------------------------------------------------------------------------
    /**
     * Add a stylesheet to the page if it has not already been added.
     * @param {string} href - The URL of the stylesheet to load.
     */
    function addStylesheet(href) {
        if (!href) {
            return;
        }
        if (document.head.querySelector('link[href="' + href + '"]')) {
            return;
        }
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.type = 'text/css';
        document.head.appendChild(link);
    }

    /**
     * Convert heading text into a safe ID string.
     * Removes invalid characters, trims whitespace, replaces spaces with hyphens,
     * and ensures the resulting string is lowercase.
     * @param {string} text - The heading text content.
     * @returns {string} A normalized ID candidate.
     */
    function getHeaderName(text) {
        if (!text) {
            return 'section';
        }
        return text.trim()
            .replace(/\s+/g, '-')
            .replace(/[^A-Za-z0-9\-_]/g, '')
            .replace(/^-+|-+$/g, '')
            .toLowerCase() || 'section';
    }

    /**
     * Resolve a selector or element reference into a DOM element.
     * Supports passing an Element instance, the document object, or a CSS selector string.
     * Defaults to document when no match is found.
     * @param {string|Element|Document} selector
     * @returns {Element|Document}
     */
    function resolveElement(selector) {
        if (!selector) {
            return document;
        }
        if (selector === document || selector instanceof Element) {
            return selector;
        }
        if (typeof selector === 'string') {
            return document.querySelector(selector) || document;
        }
        return document;
    }

    /**
     * Scroll the page to a heading with an optional adjustment offset.
     * Uses smooth scrolling and prevents the page from scrolling above 0.
     * @param {Element} heading - The target heading element.
     * @param {number} adjustment - The number of pixels to offset from the top.
     */
    function scrollToHeading(heading, adjustment) {
        if (!heading) {
            return;
        }

        var offset = typeof adjustment === 'number' ? adjustment : 0;
        var top = heading.getBoundingClientRect().top + window.scrollY - offset;
        top = Math.max(0, top);
        heading.scrollIntoView();
        scrollTo(0, top, 'smooth');
    }

    /**
     * Determine which heading is currently active based on scroll position.
     * The active heading is the last heading that appears above the current viewport position.
     * @param {Element[]} headings - Array of heading elements.
     * @param {number} adjustment - Offset applied when computing active heading.
     * @returns {number} Index of the active heading, or -1 if none.
     */
    function findActiveIndex(headings, adjustment) {
        var scrollPosition = window.scrollY + (adjustment || 0) + 20;
        var activeIndex = -1;
        headings.forEach(function (heading, index) {
            var headingTop = heading.getBoundingClientRect().top + window.scrollY;
            if (scrollPosition >= headingTop) {
                activeIndex = index;
            }
        });
        return activeIndex;
    }

    /**
     * Update the TOC state by highlighting the current navigation item.
     * Skips updates when there is no navigation element or when the user is above the parent container.
     * @param {Object} instance - The TOC instance created by createNavigationMenu.
     * @param {Object} settings - Computed settings from defaultOptions and init options.
     */
    function updateCurrentState(instance, settings) {
        if (!instance || !instance.navigation || !instance.headings.length) {
            return;
        }

        var parent = instance.container.parentElement;
        if (parent) {
            var parentTop = parent.getBoundingClientRect().top + window.scrollY;
            if (window.scrollY <= parentTop - settings.adjustment) {
                return;
            }
        }

        var activeIndex = findActiveIndex(Array.from(instance.headings), settings.adjustment);
        if (activeIndex < 0) {
            return;
        }

        instance.listItems.forEach(function (item) {
            item.classList.remove('current');
        });

        var activeItem = instance.navigation.querySelector('li.nav-' + activeIndex);
        if (activeItem) {
            activeItem.classList.add('current');
            // If desired, the active TOC item can smoothly scroll into view.
            // activeItem.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
        }
    }

    /**
     * Build a navigation menu from page headings and insert it into the container.
     * Generates unique IDs for headings, creates anchor links, and preserves the heading text.
     * @param {Element} container - The aside or element that will host the TOC.
     * @param {Element[]} headings - Array of headings to include in the TOC.
     * @param {Object} settings - Active settings for click behavior and scrolling.
     * @returns {Object} Navigation instance used by updateCurrentState.
     */
    // -------------------------------------------------------------------------
    // Navigation Menu Creation
    // -------------------------------------------------------------------------
    function createNavigationMenu(container, headings, settings) {
        var usedIds = new Set();
        var list = document.createElement('ul');

        headings.forEach(function (heading, index) {
            var text = heading.textContent.trim();
            var headerName = getHeaderName(text);
            var uniqueId = headerName || 'section';
            var suffix = 1;

            // Ensure each heading ID is unique on the page.
            while (usedIds.has(uniqueId)) {
                uniqueId = headerName + '-' + suffix;
                suffix += 1;
            }
            usedIds.add(uniqueId);

            heading.id = uniqueId;
            heading.classList.add('js-nav');
            heading.dataset.num = index;

            var hanchor = document.createElement('a');
            hanchor.name = uniqueId;
            heading.before(hanchor);

            var listItem = document.createElement('li');
            listItem.classList.add('nav-' + heading.tagName.toLowerCase(), 'nav-' + index);

            var anchor = document.createElement('a');
            anchor.href = '#' + uniqueId;
            anchor.textContent = text;
            anchor.addEventListener('click', function (event) {
                event.stopPropagation();
                event.stopImmediatePropagation();
                scrollToHeading(heading, settings.adjustment);
                // Update the address bar without adding a new history entry.
                history.replaceState(null, '', '#' + uniqueId);
            }, { capture: true });

            listItem.appendChild(anchor);
            list.appendChild(listItem);
        });

        var navigation = document.createElement('div');
        navigation.id = 'vccsTOC';
        navigation.className = 'vccsTOC';
        navigation.appendChild(list);

        container.innerHTML = '';
        container.appendChild(navigation);

        return {
            container: container,
            navigation: navigation,
            listItems: navigation.querySelectorAll('li'),
            headings: headings
        };
    }

    /**
     * Initialize the sticky TOC inside a container element.
     * Loads the stylesheet, creates the navigation menu, and attaches scroll behavior.
     * @param {Element} container - The aside or wrapper for the TOC.
     * @param {Object} options - Initialization options overriding defaults.
     * @returns {Object|null} The created TOC instance, or null when initialization fails.
     */
    // -------------------------------------------------------------------------
    // Sticky TOC Initialization
    // -------------------------------------------------------------------------
    function initStickyNavigator(container, options) {
        if (!container) {
            return null;
        }

        var settings = Object.assign({}, defaultOptions, options);
        var wrap = resolveElement(settings.wrapselector);
        var headings = Array.from(wrap.querySelectorAll(settings.targetselector));

        if (!headings.length) {
            return null;
        }

        addStylesheet(baseURL + 'tdx-toc.css');
        var instance = createNavigationMenu(container, headings, settings);

        // Position the navigation container beneath the fixed header.
        const relativeTop = document.querySelector('#divMstrHeader').getBoundingClientRect().bottom + settings.adjustment;
        instance.container.style.top = relativeTop + "px";

        // Create a runtime style rule that applies scroll-margin-top to the target headings.
        const styleTag = document.createElement("style");

        var scrollMarginTopValue = instance.container.getBoundingClientRect().height + relativeTop;
        scrollMarginTopValue = scrollMarginTopValue + 50;
        settings.adjustment = scrollMarginTopValue;

        styleTag.textContent = `
                ${settings.targetselector} {
                    scroll-margin-top: ${scrollMarginTopValue}px !important;
                }
        `;

        instance.headings.forEach(function (heading) {
            heading.style.scrollMarginTop = scrollMarginTopValue + "px";
        });

        document.head.appendChild(styleTag);

        // Listen for scroll events and update TOC state as the page moves.
        window.addEventListener('scroll', function () {
            updateCurrentState(instance, settings);
        }, { passive: true });

        updateCurrentState(instance, settings);
        return instance;
    }

    /**
     * A utility wrapper around the native insertBefore operation.
     * Ensures the reference node is valid before attempting insertion.
     * @param {Node} target - The node to insert.
     * @param {Node} reference - The node before which the target should be inserted.
     */
    // -------------------------------------------------------------------------
    // DOM Insertion Utility
    // -------------------------------------------------------------------------
    function insertBefore(target, reference) {
        if (target && reference && reference.parentNode) {
            reference.parentNode.insertBefore(target, reference);
        }
    }

    // -------------------------------------------------------------------------
    // Bootstrap / Initialization
    // -------------------------------------------------------------------------
    /**
     * Find all TOC placeholder aside elements and initialize a sticky toc for each one.
     */
    function init() {
        var tocAsides = document.querySelectorAll('aside[data-target="sticky-navigator"]');
        tocAsides.forEach(function (aside) {
            initStickyNavigator(aside, {
                wrapselector: '#ctl00_ctl00_cpContent_cpContent_divBody',
                targetselector: 'h2'
            });
        });
    }

    // Initialize immediately when the document is already parsed, otherwise wait for DOMContentLoaded.
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();


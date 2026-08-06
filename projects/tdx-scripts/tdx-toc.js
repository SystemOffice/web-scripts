(function () {
    'use strict';

    var currentScript = document.currentScript || document.scripts[document.scripts.length - 1];
    var baseURL = '';
    if (currentScript && currentScript.src) {
        baseURL = currentScript.src.split('/').slice(0, -1).join('/') + '/';
    }

    var defaultOptions = {
        wrapselector: document,
        targetselector: 'h2,h3',
        adjustment: 10,
        includeTOCHeight: true
    };

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
            activeItem.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
        }
    }

    function createNavigationMenu(container, headings, settings) {
        var usedIds = new Set();
        var list = document.createElement('ul');

        headings.forEach(function (heading, index) {
            var text = heading.textContent.trim();
            var headerName = getHeaderName(text);
            var uniqueId = headerName || 'section';
            var suffix = 1;
            while (usedIds.has(uniqueId)) {
                uniqueId = headerName + '-' + suffix;
                suffix += 1;
            }
            usedIds.add(uniqueId);

            heading.id = uniqueId;
            heading.classList.add('js-nav');
            heading.dataset.num = index;

            var listItem = document.createElement('li');
            listItem.classList.add('nav-' + heading.tagName.toLowerCase(), 'nav-' + index);

            var anchor = document.createElement('a');
            anchor.href = '#' + uniqueId;
            anchor.textContent = text;


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

        if (settings.includeTOCHeight) {
            settings.adjustment += instance.container.offsetHeight;
        }

        const relativeTop = instance.container.getBoundingClientRect().top;
        instance.container.style.top = relativeTop + "px";

        // Create the style element
        const styleTag = document.createElement("style");

        const scrollMarginTopValue = settings.adjustment + relativeTop;
        
        // Add your CSS rules using a template literal
        // adjust for the height of the TOC so that the headings are not hidden behind it when scrolled to
        styleTag.textContent = `
                ${settings.targetselector} {
                    scroll-margin-top: ${scrollMarginTopValue}px;
                }
        `;

        // Append it to the head of the document
        document.head.appendChild(styleTag);

        // Add click event listener to the navigation links in order to highlight the current section when clicked
        window.addEventListener('scroll', function () {
            updateCurrentState(instance, settings);
        }, { passive: true }); 

        updateCurrentState(instance, settings);
        return instance;
    }

    function insertBefore(target, reference) {
        if (target && reference && reference.parentNode) {
            reference.parentNode.insertBefore(target, reference);
        }
    }

    function init() {
        var tocAsides = document.querySelectorAll('aside[data-target="sticky-navigator"]');
        tocAsides.forEach(function (aside) {
            initStickyNavigator(aside, {
                wrapselector: '#ctl00_ctl00_cpContent_cpContent_divBody',
                targetselector: 'h2'
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();


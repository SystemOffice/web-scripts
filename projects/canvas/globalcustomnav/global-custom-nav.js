// enscapsulate portal observer and orchestration

/**
// @name        CanvasLMS - Global Custom Navigation
// @namespace   https://github.com/robert-carroll/canvaslms-global-custom-navigation
// @description one global nav tool, maybe?
//
**/


  // continue if curious
  const globalCustomNav = {  
    cfg: {
      context_item: '',
      keeper: null,
      glbl: {
        nav_selector: '#menu',
        tray_portal: '#nav-tray-portal',
        tray_container: 'navigation-tray-container',
        space: 'tray-with-space-for-global-nav',
        menuItemClass: `ic-app-header__menu-list-item`,
        trayActiveClass: `ic-app-header__menu-list-item--active`
      },
      rspv: {
        tray_portal: 'div[role="dialog"]:has(.ic-brand-mobile-global-nav-logo) ul',
        tray_container: 'div[class$="-tray__content"]',
        INSTUI_aodown: `<svg name="IconArrowOpenDown" viewBox="0 0 1920 1920" rotate="0" style="width: 1em; height: 1em;" 
        width="1em" height="1em" aria-hidden="true" role="presentation" focusable="false" class="gcn-tray-rspv-aodown">
        <g role="presentation"><path d="M568.129648 0.0124561278L392 176.142104 1175.86412 960.130789 392 1743.87035 568.129648 1920 1528.24798 960.130789z" 
        fill-rule="evenodd" stroke="none" stroke-width="1" transform="matrix(0 1 1 0 .067 -.067)"></path></g></svg>`
      },
      targets: ['_self', '_blank', '_parent', '_top']
    },
    load: (opts) => {
      if (!document.querySelector(globalCustomNav.cfg.glbl.nav_selector) && !document.querySelector(globalCustomNav.cfg.rspv.tray_portal)) return;

      if (document.querySelector(globalCustomNav.cfg.glbl.nav_selector)) {
        // get the left-to-right or right-to-left direction
        globalCustomNav.dir = document.querySelector('html').getAttribute('dir') ?? 'ltr';
        // accept nav items, or default to empty
        globalCustomNav.nav_items = Array.isArray(opts.nav_items) ? opts.nav_items : opts;
        // accept throwbacks, or default to empty
        globalCustomNav.throwbacks = (typeof opts.throwbacks === 'object') ? opts.throwbacks : {};

        // preserve the nav item to restore active class when a tray is closed
        // handle primary routes, external tools, and custom contexts
        var active_context = document.querySelector(`${globalCustomNav.cfg.glbl.nav_selector} li.${globalCustomNav.cfg.glbl.trayActiveClass} a`);
        if (active_context) {
          globalCustomNav.cfg.context_item = active_context.id || active_context.closest('li').id;
        }
        // update the glbl menu with custom nav items
        globalCustomNav.prepare_nav_items(globalCustomNav.nav_items, false);
      }
      globalCustomNav.menu.portals.detect();
      globalCustomNav.tray_handler();
    },
    menu: {
      portals: {
        detect: () => {
          // a single observer watches the body for both the responsive menu injection and global tray portal
          if (!globalCustomNav.cfg.keeper) {
            globalCustomNav.cfg.keeper = new MutationObserver(globalCustomNav.menu.portals.watch);
            globalCustomNav.cfg.keeper.observe(document.body, { childList: true, subtree: true });
            
            // attach secondary observer config strictly for the global menu's class changes
            const glbl_nav = document.querySelector(globalCustomNav.cfg.glbl.nav_selector);
            if (glbl_nav) {
              globalCustomNav.cfg.keeper.observe(glbl_nav, { attributes: true, attributeFilter: ['class'], subtree: true });
            }
          }
          
          // fire once manually to set initial global active states
          globalCustomNav.menu.portals.watch(); 
        },
        watch: (mtx = []) => {
          const glbl_portal = document.querySelector(globalCustomNav.cfg.glbl.tray_portal);
          globalCustomNav.menu.glbl.ensure_active_class.sync(mtx, glbl_portal);

          // route to global portal processing if relevant
          if (glbl_portal) {
            const check_glbl = mtx.length === 0 || mtx.some(m => {
              let el = m.target.nodeType === 1 ? m.target : m.target.parentElement;
              return el && el.closest(globalCustomNav.cfg.glbl.tray_portal);
            });
            const portal_ready = glbl_portal.classList.contains('glbl-global-custom-nav');

            // only process if mutations happened in the portal or if it hasn't been initialized yet
            if (check_glbl || !portal_ready) {
              globalCustomNav.menu.glbl.on_mtx(mtx, glbl_portal, portal_ready);
            }
          }

          // route to responsive portal processing if new nodes were added
          const has_new_nodes = mtx.length === 0 || mtx.some(m => m.addedNodes.length > 0);
          if (has_new_nodes) {
            const rspv_portal = document.querySelector(globalCustomNav.cfg.rspv.tray_portal);
            if (rspv_portal) {
              globalCustomNav.menu.rspv.on_mtx(rspv_portal);
            }
          }
        }
      },
      glbl: {
        on_mtx: (mtx, glbl_portal, portal_ready) => {
          // fire once when portal is first discovered
          if (!portal_ready) {
            glbl_portal.classList.add('glbl-global-custom-nav');
            // set active class here prevents default from taking it back
            // also reduces visual swap between default and custom item when closing a native tray
            globalCustomNav.menu.glbl.ensure_active_class.set();
          }

          // watch for tray container, handle throwbacks
          const glbl_tray_container = glbl_portal.querySelector(`div.${globalCustomNav.cfg.glbl.tray_container}`);
          if (glbl_tray_container) {
            // get the current open tray slug
            let ui_tray = [...glbl_tray_container.classList].find(c => c.endsWith('-tray'));
            if (ui_tray) {
              ui_tray = ui_tray.replace('-tray', '');
              globalCustomNav.menu.glbl.ensure_active_class.set(`global_nav_${ui_tray}_link`);
              
            // call throwbacks only if supported AND new nodes were actually injected
              if (typeof globalCustomNav.glbl_tray_throwback === 'function') {
                globalCustomNav.glbl_tray_throwback();
              }
            }
          } else if (glbl_portal.children.length === 0) {
            // reset context on tray removal
            // guard against resetting if unrelated deep dom elements were removed while tray is closed
            let portal_cleared = mtx.some(m => m.target === glbl_portal && m.removedNodes.length > 0);
            if (portal_cleared) {
              const expected_id = globalCustomNav.cfg.context_item;
              const is_context_custom = globalCustomNav.nav_items.some(i => i.slug === expected_id);

              if (is_context_custom) {
                // override default activeClass
                globalCustomNav.menu.glbl.ensure_active_class.set(expected_id);
              } else {
                // if context is native, let canvas handle, unless a custom item is stuck on
                const current_active = document.querySelector(`${globalCustomNav.cfg.glbl.nav_selector} li.${globalCustomNav.cfg.glbl.trayActiveClass} a`);
                const is_current_custom = current_active && current_active.id && globalCustomNav.nav_items.some(i => i.slug === current_active.id);
                
                if (!current_active || is_current_custom) {
                  globalCustomNav.menu.glbl.ensure_active_class.set();
                }
              }
            }
          }
        },
        ensure_active_class: {
          set: (context_item = globalCustomNav.cfg.context_item) => {
            const active_class = globalCustomNav.cfg.glbl.trayActiveClass;
            const target_item = document.getElementById(context_item) || document.getElementById(globalCustomNav.cfg.context_item);
            const target_li = target_item ? target_item.closest('li') : null;

            // clear existing active classes and aria attributes to prevent duplicates
            document.querySelectorAll(`${globalCustomNav.cfg.glbl.nav_selector} li.${active_class}`).forEach(el => {
              if (el !== target_li) {
                el.classList.remove(active_class);
                el.removeAttribute('aria-current');
              }
            });

            // add to target ONLY if it is missing the class
            // and prevent MutationObserver infinite loops
            if (target_li && !target_li.classList.contains(active_class)) {
              target_li.classList.add(active_class);
              target_li.setAttribute('aria-current', 'page');
            }
          },
          sync: (mtx, glbl_portal) => {
            // catch native react router attempting to override the active state
            const class_mtx = mtx.some(m => m.type === 'attributes' && m.attributeName === 'class' && m.target.closest('li'));
            if (class_mtx) {
              const custom_tray = document.querySelector('.gcn-instui-tray');
              const native_tray_open = glbl_portal && glbl_portal.children.length > 0 && !custom_tray;

              if (custom_tray) {
                const is_exiting = custom_tray.className.includes('-exiting');
                const tray_slug = custom_tray.parentElement.id.replace('-tray', '');

                if (!is_exiting) {
                  // custom tray is actively opening or fully open, maintain activeClass
                  globalCustomNav.menu.glbl.ensure_active_class.set(tray_slug);
                } else {
                  // custom tray is actively closing. react might try to steal the class early
                  // if custom context is current, maintain it, otherwise let canvas handle it
                  const expected_id = globalCustomNav.cfg.context_item;
                  const is_context_custom = globalCustomNav.nav_items.some(i => i.slug === expected_id);
                  if (is_context_custom) {
                    globalCustomNav.menu.glbl.ensure_active_class.set(expected_id);
                  }
                }
              } else if (native_tray_open) {
                // native tray is currently open or animating closed
                const expected_id = globalCustomNav.cfg.context_item;
                const is_context_custom = globalCustomNav.nav_items.some(i => i.slug === expected_id);
                
                if (is_context_custom) {
                  // check if react is trying to revert the class early while the tray animates closed
                  const glbl_tray_containers = glbl_portal.querySelectorAll(`div.${globalCustomNav.cfg.glbl.tray_container}`);
                  const active_container = glbl_tray_containers[glbl_tray_containers.length - 1];
                  let ui_tray = active_container ? [...active_container.classList].find(c => c.endsWith('-tray')) : null;
                  
                  if (ui_tray) {
                    let expected_native_id = `global_nav_${ui_tray.replace('-tray', '')}_link`;
                    const current_active = document.querySelector(`${globalCustomNav.cfg.glbl.nav_selector} li.${globalCustomNav.cfg.glbl.trayActiveClass} a`);
                    
                    // if the newly highlighted item doesn't match the tray, react is falling back, intercept it
                    if (current_active && current_active.id !== expected_native_id) {
                      globalCustomNav.menu.glbl.ensure_active_class.set(expected_id);
                    }
                  }
                }
              } else if (!native_tray_open) {
                // no tray is actively open (portal is empty), maintain custom context
                const expected_id = globalCustomNav.cfg.context_item;
                const is_context_custom = globalCustomNav.nav_items.some(i => i.slug === expected_id);
                
                if (is_context_custom) {
                  globalCustomNav.menu.glbl.ensure_active_class.set(expected_id);
                }
              }
            }
          }
        }
      },
      rspv: {
        on_mtx: (rspv_portal) => {
          // tag the physical portal (ul) to avoid null misses on deep react renders
          const rspv_tray_portal_complete = rspv_portal.classList.contains('rspv-global-custom-nav');
          
          // portal exists, menu is not yet customized
          if (!rspv_tray_portal_complete) {
            // add custom menu items
            globalCustomNav.prepare_nav_items(globalCustomNav.nav_items, true);
            // mark it complete
            rspv_portal.classList.add('rspv-global-custom-nav');
          } else {
            // hamburger menu is customized and open. call throwbacks if they are supported
            if (typeof globalCustomNav.rspv_tray_throwback === 'function') {
              globalCustomNav.rspv_tray_throwback();
            }
          }
        }
      }
    },
    prepare_nav_items: (items, hamb = true) => {
      items.forEach(item => {
        // if roles for the current item are not set, the user can see it, otherwise
        const user_gets_item = (typeof item.roles === 'undefined') || item.roles();
        if (user_gets_item) {
          globalCustomNav.create_nav_icon(item, hamb);

          if (!!item.high_contrast && item.high_contrast == true) {
            if (ENV.use_high_contrast != true) return;
            globalCustomNav.append_high_contrast(item);
            return;
          }
          
          globalCustomNav.append_item(item, hamb);
        }
      });
    },
    create_nav_icon: (item, hamb = true) => {
      // create a DOM safe string from the title for the id, or replace it with a random string if regex returns an empty string
      item.tidle = item.title.replace(/[\W_]+/g,'') || Math.random().toString(18).slice(2);
      item.slug = `global_nav_${item.tidle}_link`;

      // clone and create the icon, consider c4e
      let icon_to_copy = (ENV.K5_USER == true && hamb == true) ? 'Home' : 'Dashboard';
      if (item.tray) {
        icon_to_copy = 'Courses';
      }
      const nav_icon = hamb ? `${globalCustomNav.cfg.rspv.tray_portal} svg[name="Icon${icon_to_copy}"]` : `#global_nav_${icon_to_copy.toLowerCase()}_link`;
      const nav_icon_li = document.querySelector(nav_icon).closest('li');

      // handle custom high contrast logos
      if (!!item.high_contrast && item.high_contrast == true) {
        // get the text for the cloned nav item, global or hamb
        var dashboard_icon_text = nav_icon_li.querySelector('.menu-item__text') || nav_icon_li.querySelector('span[letter-spacing="normal"]');
        item.dashboard_icon_text = dashboard_icon_text.innerText;
        // done here
        return;  
      }
      // continue for custom nav items

      // replace contents
      const icon = nav_icon_li.cloneNode(true);
      icon.setAttribute('id', (hamb ? 'rspv-' : '') + `${item.slug}-item`);
      icon.querySelector('svg').parentElement.classList.add((hamb ? 'rspv-' : '') + `svg-${item.tidle}-holder`);

      const icon_id = (hamb ? 'rspv-' : '') + item.slug;
      if (hamb && item.tray) {
        // button for resp tray
        icon.querySelector('button').setAttribute('id', icon_id);
        icon.querySelector('button').setAttribute('aria-controls', (hamb ? 'rspv-' : '') + `${item.slug}-tray`);
        icon.querySelector('div div').setAttribute('id', (hamb ? 'rspv-' : '') + `${item.slug}-tray`);
      } else {
        icon.querySelector('a').setAttribute('id', icon_id);
        icon.querySelector('a').href = item.href;
        if (typeof item.target !== 'undefined' && globalCustomNav.cfg.targets.includes(item.target)) {
          icon.querySelector('a').setAttribute('target', item.target);
        }
      }

      // get the text for the cloned nav item, global or hamb
      var icon_text = icon.querySelector('.menu-item__text') || icon.querySelector('span[letter-spacing="normal"]');
      // set the clones text to the item text
      icon_text.textContent = item.title;

      // prepare for svg
      const svg_holder = icon.querySelector((hamb ? '.rspv-svg' : '.svg') + `-${item.tidle}-holder`);
      icon.querySelector('svg').classList.remove('ic-icon-svg--dashboard', 'svg-icon-home');
      let svg_class = [...icon.querySelector('svg').classList];
      if (!hamb) {
        icon.classList.remove(globalCustomNav.cfg.glbl.trayActiveClass);
      }
      // remove cloned svg
      icon.querySelector('svg').remove();

      // import svg
      if (/^icon-[a-z]/.test(item.icon_svg) == true) {
        // instructure icon
        let instuicon = `<div id="${(hamb ? 'rspv-' : '') + `${item.slug}-svg`}" role="presentation">`;
        instuicon += `<i class="icon-line ${item.icon_svg}${hamb ? ' gcn_inst_rspv_icon' : ''} gcn_inst_menu_icon"></i></div>`;
        svg_holder.insertAdjacentHTML('afterbegin', instuicon);

      } else if (/^https/.test(item.icon_svg)) {
        // externally hosted svg, you must handle cors policies yourself
        fetch(item.icon_svg, {
            mode: 'cors',
            method: 'GET',
            headers: {
              'Access-Control-Request-Method': 'GET',
              'Accept': 'text/plain',
              'Content-Type': 'text/plain',
            }
          })
          .then(r => r.text())
          .then(svg => {
            svg_holder.insertAdjacentHTML('afterbegin', svg);
            icon.querySelector('svg').setAttribute('id', (hamb ? 'rspv-' : '') + `${item.slug}-svg`);
            icon.querySelector('svg').classList.add(...svg_class);
          })
          .catch(console.error.bind(console));

      } else if (/^<svg/.test(item.icon_svg)) {
        // inline/script svg
        svg_holder.insertAdjacentHTML('afterbegin', item.icon_svg);
        icon.querySelector('svg').setAttribute('id', (hamb ? 'rspv-' : '') + `${item.slug}-svg`);
        icon.querySelector('svg').classList.add(...svg_class);
      }
      item.icon = icon;
      return;
    },
    append_item: (item, hamb = true) => {
      const target_ul = hamb ? globalCustomNav.cfg.rspv.tray_portal : globalCustomNav.cfg.glbl.nav_selector;
      const target_li = document.querySelector(`${target_ul} li:last-child`);
      const target_el = typeof item.position === 'number' ? document.querySelector(`${target_ul} > li:nth-of-type(${item.position})`) : null;

      if (item.position === 'after') {
        target_li.after(item.icon);
      } else if (target_el) {
        target_el.after(item.icon);
      } else {
        // default fallback for 'before', missing position, invalid strings, or out-of-bounds numbers
        target_li.before(item.icon);
      }

      // check if the current window path matches the item's href
      // to set the active state on load for context items
      const regex = new RegExp(`^${item.href}`);
      if (!hamb && regex.test(window.location.pathname)) {
        if (item.slug != globalCustomNav.cfg.context_item) {
          globalCustomNav.cfg.context_item = item.slug;
          // set active class when the icon is added
          // reduces visual swap between default to custom
          globalCustomNav.menu.glbl.ensure_active_class.set();
        }
      }
    },
    append_high_contrast: item => {
      // create style sheet if not already set
      if (document.querySelectorAll('[data-global-custom-nav-css="set"]').length == 0) {
        let style = document.createElement('style');
        style.setAttribute('data-global-custom-nav-css', 'set');
        document.head.appendChild(style);
      }
      // update style sheet with logomark override
      var style_sheet = document.querySelector('[data-global-custom-nav-css]').sheet;

      // responsive/mobile high contrast logos, single and consortiums
      if (!!item.rspv && !item.rspv.logo_svg) {
        item.rspv.logo_svg = item.rspv.cdn + item.rspv.logos[window.location.host.split('.')[0]];
      }
      style_sheet.insertRule(`.ic-brand-mobile-global-nav-logo { background-image:url(${item.rspv.logo_svg}) !important; }`, style_sheet.cssRules.length);

      // prevent readding when changing view between mobile and desktop - add only once
      if (document.querySelector('.gcn-high-contrast-glbl')) return;

      // global high contrast logos, single and consortiums
      if (!!item.glbl && !item.glbl.logo_svg) {
        item.glbl.logo_svg = item.glbl.cdn 
          + (typeof item.glbl.logos === 'function' ? item.glbl.logos() : item.glbl.logos[window.location.host.split('.')[0]]);
      }
      style_sheet.insertRule(`.ic-app-header__logomark { background-image:url(${item.glbl.logo_svg}) !important; }`, style_sheet.cssRules.length);

      // wrapper for global nav header logo
      var div = document.createElement('div');
      div.setAttribute('style', 'background-color: transparent');
      div.classList.add('ic-app-header__logomark-container', 'gcn-high-contrast-glbl');

      // screenreader dashboard text
      var span = document.createElement('span');
      span.setAttribute('class', 'screenreader-only');
      span.textContent = item.dashboard_icon_text;

      // logo link
      var a = document.createElement('a');
      a.href = 'https://' + window.location.host;
      a.setAttribute('dir', globalCustomNav.dir);
      a.classList.add('ic-app-header__logomark');
      a.appendChild(span);
      div.appendChild(a);
      document.querySelector('div.ic-app-header__main-navigation').prepend(div);
    },
    link: item => {
      var a = document.createElement('a');
      a.textContent = item.title;
      a.href = item.href;
      a.setAttribute('dir', globalCustomNav.dir);
      a.classList.add('gcn-instui-view-link');
      if (typeof item.target !== 'undefined' && globalCustomNav.cfg.targets.includes(item.target)) {
        a.target = item.target;
      }
      return a.outerHTML;
    },
    tray_links: items => {
      var html = `<ul class="gcn-instui-view--block-list" dir="${globalCustomNav.dir}">`;
      items.forEach(item => {
        html += `<li class="gcn-instui-view-listItem" dir="${globalCustomNav.dir}">`;
        html += globalCustomNav.link(item);

        // append link description if set
        html += (!!item.desc && item.desc.length > 1) ? `<div class="gcn-instui-text" wrap="normal" letter-spacing="normal">${item.desc}</div>` : '';
        html += '</li>';
      })
      html += `</ul>`;
      return html;
    },
    rspv_tray_toggle: item => {
      const tray_content = document.querySelector(`#rspv-${item.slug}-tray`);

      // tray content is empty
      if (!tray_content.childElementCount)
        globalCustomNav.rspv_tray_content(item);

      // toggle tray state (expand/collapse)
      tray_content.classList.toggle('gcn-tray-rspv-expand');

      // swap the arrows based on expand/collapse
      document.querySelectorAll(`#rspv-${item.slug} svg[name^="IconArrowOpen"]`).forEach(e => {
        e.classList.toggle('gcn-tray-rspv-closed');
      });
    },
    rspv_tray_content: item => {
      const tray_content = document.querySelector(`#rspv-${item.slug}-tray`),
        tray_icon_id = `#rspv-${item.slug}`;

      // swap the expand/collapse arrow
      if (!document.querySelector(`${tray_icon_id} svg[name="IconArrowOpenDown"]`)) {
        let arrow_end = document.querySelector(`${tray_icon_id} svg[name="IconArrowOpenEnd"]`);
        arrow_end.parentElement.insertAdjacentHTML('afterbegin', globalCustomNav.cfg.rspv.INSTUI_aodown);
        let arrow_down = document.querySelector(`${tray_icon_id} svg[name="IconArrowOpenDown"]`);
        // clone the class list to the added 'open' arrow
        let arrow_class = arrow_end.classList;
        arrow_class.forEach(c => {
          arrow_down.classList.add(c);
        });
        document.querySelector(`${tray_icon_id} svg[name="IconArrowOpenDown"]`).classList.toggle('gcn-tray-rspv-closed');
      }
      // tray links
      if (document.querySelectorAll(`#rspv-${item.slug}-tray a`).length == 0) {
        var tray_html = '';

        // handle links vs callback
        tray_html += globalCustomNav.tray_links_vs_cb(item);

        // add default footer link
        tray_html += `<li>${globalCustomNav.link(item)}</li>`;
        // append
        tray_content.insertAdjacentHTML('afterbegin', tray_html);

        // handle callback
        globalCustomNav.handle_tray_cb(item, `#rspv-${item.slug}-tray .gcn-loading-tray-cb-svg`, 'afterbegin');
      }
    },
    // unified handler with event delegation for custom tray toggling events
    // reconciles interactions between native Canvas trays and custom trays
    // maintains native ui/ux feel and functionality for custom trays
    tray_handler: () => {

      const glbl_tray_close = (slug, restore_focus = true) => {
        const tray_wrapper = document.getElementById(`${slug}-tray`);
        if (!tray_wrapper) return;
        
        const open_tray = tray_wrapper.querySelector('.gcn-instui-tray');
        const direction = globalCustomNav.dir == 'ltr' ? 'left' : 'right';

        // prevent stacking animations if tray is already closing
        if (!open_tray || open_tray.classList.contains(`gcn-instui-tray-slide-${direction}-exiting`)) return;

        // restore focus on nav item when tray closes
        if (restore_focus) {
          const tray_nav_anchor = document.getElementById(slug);
          if (tray_nav_anchor) {
            if (!tray_nav_anchor.hasAttribute('tabindex')) tray_nav_anchor.setAttribute('tabindex', '0');
            tray_nav_anchor.focus();
          }
        }
       
        // trigger tray slide on close
        // re-add the transition so it animates the departure
        open_tray.classList.add(`gcn-instui-tray-slide-${direction}-transitioning`);
        // use a single requestAnimationFrame to ensure the browser registers
        // the transition class BEFORE we change the physical location
        requestAnimationFrame(() => {
          // swap the resting state to the exiting state (moves it off-screen)
          open_tray.classList.replace(`gcn-instui-tray-slide-${direction}-entered`, `gcn-instui-tray-slide-${direction}-exiting`);
          // wait for the exact 300ms animation to finish
          setTimeout(() => {
            // lock it into its final off-screen state
            open_tray.classList.replace(`gcn-instui-tray-slide-${direction}-exiting`, `gcn-instui-tray-slide-${direction}-exited`);
            open_tray.classList.remove(`gcn-instui-tray-slide-${direction}-transitioning`);
            // cleanup: remove it from the DOM
            tray_wrapper.remove();
          }, 300);
        });
      };

      document.addEventListener('click', (e) => {
        const target = e.target;
        // checks if the click is on a global or responsive nav item
        const nav_anchor = target.closest(`${globalCustomNav.cfg.glbl.nav_selector} li a, [id^="rspv-"]`);

        // reconcile custom vs native trays
        if (nav_anchor) {
          const is_rspv = nav_anchor.id.startsWith('rspv-');

          // do nothing for native trays except close any open custom trays
          // native tray nav items (li) do not have an id
          // only run for global nav trays because responsive trays don't use this handler for closing
          if (!is_rspv && nav_anchor.closest('li') && !nav_anchor.closest('li').hasAttribute('id')) {
            const open_tray = document.querySelector('.gcn-instui-tray');
            if (open_tray) {
              const open_slug = open_tray.parentElement.id.replace('-tray', '');
              // pass 'false' to prevent focus stealing from the native tray
              glbl_tray_close(open_slug, false);
            }
            return;
          }

          // slug for the click
          const slug = is_rspv ? nav_anchor.id.replace('rspv-', '') : nav_anchor.id;
          const item = globalCustomNav.nav_items.find(i => i.slug === slug);

          // check if this specific item has custom tray content
          const has_tray = item && item.tray !== undefined;
          const open_tray = document.querySelector('.gcn-instui-tray');

          // handle toggling open/close states for custom trays
          if (has_tray) {
            if (!is_rspv) e.preventDefault();

            if (is_rspv) {
              globalCustomNav.rspv_tray_toggle(item);
            } else {
              const is_open = !!document.getElementById(`${item.slug}-tray`);
              if (!is_open) {
                // close open trays before opening
                if (open_tray) {
                  const open_slug = open_tray.parentElement.id.replace('-tray', '');
                  // pass 'false' because we are opening a NEW custom tray 
                  // and don't want the old nav item to steal focus
                  glbl_tray_close(open_slug, false);
                }
                // generate and append the tray content to tray portal ONLY when opening
                const tray_html = globalCustomNav.tray_links_vs_cb(item, is_rspv);
                if (tray_html !== false) {
                  globalCustomNav.glbl_tray_content(item, tray_html);
                }
              } else {
                // close when reclicking the nav item for the tray
                // uses default (true) to restore focus
                glbl_tray_close(slug);
              }
            }
            return;
          }
        }

        // handle close button
        const open_tray = document.querySelector('.gcn-instui-tray');
        if (open_tray && !nav_anchor) {
          const tray_container = open_tray.parentElement;
          const slug = tray_container.id.replace('-tray', '');
          const item = globalCustomNav.nav_items.find(i => i.slug === slug);
          
          // close tray when focus leaves the tray
          // or user clicks the close button
          // ...a click is only "outside" if it's not the tray 
          // ...and not the nav item that controls the tray
          const is_close_btn = target.closest('[id$="-tray-close"]');
          const is_inside_tray = open_tray.contains(target);

          if (is_close_btn || !is_inside_tray) {
            if (item) {
              glbl_tray_close(slug);
            }
          }
        }
      }, true);

      // close tray with escape key when the tray is open
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          const open_tray = document.querySelector('.gcn-instui-tray');
          if (open_tray) {
            const slug = open_tray.parentElement.id.replace('-tray', '');
            if (slug) glbl_tray_close(slug);
          }
        }
      });

      // clear focus and prevent native nav items from stealing focus
      // when closing a native tray to open a custom tray
      const global_nav = document.querySelector(globalCustomNav.cfg.glbl.nav_selector);
      if (global_nav) {
        global_nav.addEventListener('focus', (e) => {
          const open_tray = document.querySelector('.gcn-instui-tray');
          if (open_tray) {
            const target_anchor = e.target.closest('a');
            const is_custom = target_anchor && target_anchor.id && globalCustomNav.nav_items.some(i => i.slug === target_anchor.id);

            // if the focused element is a native nav item (lacks a custom id) 
            // and a custom tray is actively open, intercept it
            if (target_anchor && !is_custom && typeof e.target.blur === 'function') {
              // clear focus from native item
              e.target.blur();
              // redirect focus back to our custom tray's close button
              const close_btn = document.querySelector('.gcn-instui-tray [class$="-closeButton"] button');
              if (close_btn) close_btn.focus();
            }
          }
        // use capture phase to intercept focus before it resolves
        }, true); 
      }
    },
    glbl_tray_content: item => {
      const tray_content_id = `${item.slug}-tray`;
      const direction = globalCustomNav.dir == 'ltr' ? 'left' : 'right';

      var tray_html = `<span id="${tray_content_id}" dir="${globalCustomNav.dir}">
      <span class="gcn-instui-tray" dir="${globalCustomNav.dir}">
      <div role="dialog" aria-label="${item.title} tray">
      <div class="gcn-instui-tray__content">
      <div class="${globalCustomNav.cfg.glbl.tray_container} ${item.tidle}-tray">`;

      // close button
      tray_html += `<span class="gcn-instui-closeButton">
        <button id="${tray_content_id}-close" dir="${globalCustomNav.dir}" cursor="pointer" type="button" class="gcn-instui-view--inlineBlock-baseButton">
          <span class="gcn-instui-baseButton__content">
            <span class="gcn-instui-baseButton__childrenLayout">
              <span class="gcn-instui-baseButton__iconOnly">
                <span class="gcn-instui-baseButton__iconSVG">
                  <svg name="IconX" viewBox="0 0 1920 1920" rotate="0" style="width: 1em; height: 1em;" width="1em"
                  height="1em" aria-hidden="true" role="presentation" focusable="false"
                  class="gcn-instui-inlineSVG-svgIcon">
                    <g role="presentation">
                      <path
                        d="M797.32 985.882 344.772 1438.43l188.561 188.562 452.549-452.549 452.548 452.549 188.562-188.562-452.549-452.548 452.549-452.549-188.562-188.561L985.882 797.32 533.333 344.772 344.772 533.333z">
                      </path>
                    </g>
                  </svg></span><span
                  class="gcn-instui-screenReaderContent">Close</span>
                </span></span></span></button></span>`;

      // tray content
      tray_html += `<div class="${globalCustomNav.cfg.glbl.space}">
            <div class="gcn-instui-view" dir="${globalCustomNav.dir}">
              <h2 class="gcn-instui-view-heading" dir="${globalCustomNav.dir}">${item.title}</h2>
              <hr role="presentation" class="gcn-cb_content">`;

      // handle links vs callback
      tray_html += globalCustomNav.tray_links_vs_cb(item, false);

      if (item.tray.footer && item.tray.footer.length > 1) {
        tray_html += `
        <ul class="gcn-instui-view--block-list" dir="${globalCustomNav.dir}">
        <li class="gcn-instui-view-listItem" dir="${globalCustomNav.dir}"><hr role="presentation"></li>
        <li class="gcn-instui-view-listItem" dir="${globalCustomNav.dir}">`;
        tray_html += globalCustomNav.link(item);
        tray_html += `</li></ul><br /><div class="gcn-instui-text-footer" wrap="normal" letter-spacing="normal">${item.tray.footer}</div>`;
      }
      tray_html += `</div></div></div></div></div></span></span>`;

      // append tray
      document.getElementById('nav-tray-portal').insertAdjacentHTML('afterbegin', tray_html);

      // slide in tray on open
      const tray = document.querySelector('.gcn-instui-tray');
      tray.classList.add(`gcn-instui-tray-slide-${direction}-exited`);
      // queue the first frame (browser calculates the off-screen layout)
      requestAnimationFrame(() => {
        // queue the second frame (browser has painted, now we trigger the move)
        requestAnimationFrame(() => {
          // moving in
          tray.classList.replace(`gcn-instui-tray-slide-${direction}-exited`, `gcn-instui-tray-slide-${direction}-entering`);
          // add the transition to animate the move
          tray.classList.add(`gcn-instui-tray-slide-${direction}-transitioning`);
          tray.setAttribute('aria-hidden', 'true');
          // duration
          setTimeout(() => {
            tray.classList.replace(`gcn-instui-tray-slide-${direction}-entering`, `gcn-instui-tray-slide-${direction}-entered`);
            tray.classList.remove(`gcn-instui-tray-slide-${direction}-transitioning`);
            tray.removeAttribute('aria-hidden');
          }, 300);
        });
      });

      // focus on close button
      document.querySelector('.gcn-instui-tray [class$="-closeButton"] button')?.focus();

      // handle callback
      globalCustomNav.handle_tray_cb(item, `.${globalCustomNav.cfg.glbl.space} div.gcn-loading-tray-cb-svg`, 'afterbegin', false);
    },
    tray_links_vs_cb: (item, hamb = true) => {
      // handle custom tray choice
      var tray_html = '';
      // append links if set
      if (typeof item.tray.items !== 'undefined') {
        if (Array.isArray(item.tray.items)) {

          tray_html += globalCustomNav.tray_links(item.tray.items);

        } else if (typeof item.tray.items === 'object') {

          if (hamb) {
            var groups = Object.values(item.tray.items);
            tray_html += globalCustomNav.tray_links(groups[0].concat(groups[1]));
          } else {
            Object.keys(item.tray.items).forEach(group => {
              tray_html += `<h3 class="gcn-instui-view-heading">${group}</h3>`;
              tray_html += globalCustomNav.tray_links(item.tray.items[group]);
            })
          }
        }
        // prep for callback
      } else if (typeof item.tray.cb !== 'undefined' && typeof item.tray.cb === 'function') {
        tray_html += `<ul class="gcn-instui-view--block-list gcn-loading-tray-cb" dir="${globalCustomNav.dir}">
        <li class="gcn-instui-view-listItem" dir="${globalCustomNav.dir}">
          <div dir="${globalCustomNav.dir}" class="gcn_tray-view-spinner gcn-loading-tray-cb-svg gcn-instui-text"></div>
        </li>
      </ul>`;
      }
      return tray_html;
    },
    handle_tray_cb: (item, sel, pos, hamb = true) => {
      if (typeof item.tray.cb !== 'undefined' && typeof item.tray.cb === 'function') {
        var loading_svg = `<svg role="img" aria-labelledby="${(hamb ? 'rspv-' : '') + `${item.slug}-tray-loading_svg`}" focusable="false" class="gcn_tray-spinner__circle">
        <title id="${(hamb ? 'rspv-' : '') + `${item.slug}-tray-loading_svg`}">Loading</title>
        <g role="presentation">
          <circle cx="50%" cy="50%" r="1em" class="gcn_tray-spinner__circleTrack"></circle>
          <circle cx="50%" cy="50%" r="1em" class="gcn_tray-spinner__circleSpin"></circle>
        </g>
      </svg>`;
        document.querySelector(sel).insertAdjacentHTML(pos, loading_svg);

        item.tray.cb(item);
      }
    },
    append_cb_content: (item, content) => {
      if (document.querySelector(`.${globalCustomNav.cfg.glbl.space} hr.gcn-cb_content`)) {
        document.querySelector(`.${globalCustomNav.cfg.glbl.space} hr.gcn-cb_content`).insertAdjacentHTML('afterend', content);
        document.querySelector(`.${globalCustomNav.cfg.glbl.space} .gcn-loading-tray-cb`).remove();
      } else if (document.querySelector(`#rspv-${item.slug}-tray`)) {
        document.querySelector(`#rspv-${item.slug}-tray`).insertAdjacentHTML('afterbegin', content);
        document.querySelector(`#rspv-${item.slug}-tray .gcn-loading-tray-cb`).remove();
      }
    },
    glbl_tray_throwback: () => {
      const throwbacks = globalCustomNav.throwbacks;
      if (!throwbacks || Object.keys(throwbacks).length === 0) return;

      const tray_container = document.querySelector(`${globalCustomNav.cfg.glbl.tray_portal} div.${globalCustomNav.cfg.glbl.tray_container}`);
      if (!tray_container) return;

      // extract the tray slug (e.g., 'accounts', 'courses') from the container's classes
      let ui_tray = [...tray_container.classList].find(c => c.endsWith('-tray'))?.replace('-tray', '');
      if (ui_tray && typeof throwbacks[ui_tray] === 'object') {
        let tb = throwbacks[ui_tray];
        let tray_ready = document.querySelector(`${globalCustomNav.cfg.glbl.tray_portal} ${tb.target}`);
        let tray_action_complete = document.querySelector(`${globalCustomNav.cfg.glbl.tray_portal} a.${tb.actions.complete}`);
        if (tray_ready && !tray_action_complete && typeof tb.actions.glbl === 'function') {
          tb.actions.glbl();
        }
      }
    },
    rspv_tray_throwback: () => {
      const throwbacks = globalCustomNav.throwbacks;
      if (!throwbacks || Object.keys(throwbacks).length === 0) return;

      const rspv_portal = document.querySelector(globalCustomNav.cfg.rspv.tray_portal);
      if (!rspv_portal) return;

      // find currently expanded accordions in the responsive menu
      let expanded = document.querySelectorAll(`button[aria-controls^="Expandable"][aria-expanded="true"]`);
      if (expanded.length > 0) {
        // iterate through all configured throwbacks and apply to open tray
        Object.keys(throwbacks).forEach(key => {
          let tb = throwbacks[key];
          let tray_ready = document.querySelector(`div[id^="Expandable"] ${tb.target}`);
          if (tray_ready) {
            let tray_action_complete = document.querySelector(`div[id^="Expandable"] a.${tb.actions.complete}`);
            if (!tray_action_complete && typeof tb.actions.rspv === 'function') {
              tb.actions.rspv();
            }
          }
        });
      }
    }
  };



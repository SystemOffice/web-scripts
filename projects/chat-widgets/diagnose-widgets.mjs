import puppeteer from 'puppeteer';

const URL = 'https://chatbotnonprod.wpengine.com/gcc-newui-dualbuttons/';

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();

const consoleLogs = [];
page.on('console', msg => {
  consoleLogs.push({ time: Date.now(), type: msg.type(), text: msg.text() });
});

console.log('Loading page...');
await page.goto(URL, { waitUntil: 'networkidle2', timeout: 30000 });
await page.waitForSelector('#chat-widget-main-btn', { timeout: 15000 });
console.log('Chat widget button found.\n');

// =================================================================
// TEST 1: ZOOM - Track when invitation appears and if click works
// =================================================================
console.log('='.repeat(60));
console.log('TEST 1: ZOOM - Element appearance and click timing');
console.log('='.repeat(60));

consoleLogs.length = 0;
const zoomStart = Date.now();

// Open menu and click Zoom
await page.click('#chat-widget-main-btn');
await page.waitForSelector('[role="menuitem"]', { visible: true, timeout: 3000 });

const zoomClicked = await page.evaluate(() => {
  const items = [...document.querySelectorAll('[role="menuitem"]')];
  const zoom = items.find(i => i.innerText.includes('Zoom'));
  if (zoom) { zoom.click(); return true; }
  return false;
});
console.log(`Clicked Zoom: ${zoomClicked} at T+0ms`);

// Monitor for .livesdk__invitation appearance
console.log('Polling for .livesdk__invitation element...');
let invitationFoundAt = null;
for (let i = 0; i < 200; i++) { // Up to 20 seconds
  const exists = await page.evaluate(() => !!document.querySelector('.livesdk__invitation'));
  if (exists) {
    invitationFoundAt = Date.now() - zoomStart;
    console.log(`  .livesdk__invitation appeared at T+${invitationFoundAt}ms`);
    break;
  }
  await new Promise(r => setTimeout(r, 100));
}
if (!invitationFoundAt) console.log('  .livesdk__invitation NEVER appeared within 20s');

// Check circuit breaker state
const circuitState = await page.evaluate(() => {
  // Try to access error handler state
  const container = document.getElementById('chat-widget-container');
  return {
    containerDisplay: container?.style.display,
    invitationVisible: (() => {
      const el = document.querySelector('.livesdk__invitation');
      if (!el) return null;
      const style = getComputedStyle(el);
      return { display: style.display, visibility: style.visibility, opacity: style.opacity };
    })()
  };
});
console.log('Widget state:', JSON.stringify(circuitState, null, 2));

// Wait a bit more then try manual click on invitation
console.log('\nWaiting 3s then manually clicking .livesdk__invitation...');
await new Promise(r => setTimeout(r, 3000));

const manualClickResult = await page.evaluate(() => {
  const invitation = document.querySelector('.livesdk__invitation');
  if (!invitation) return { error: 'element not found' };

  // Check for child buttons or interactive elements
  const children = invitation.querySelectorAll('*');
  const clickable = [...children].filter(el =>
    el.tagName === 'BUTTON' || el.tagName === 'A' ||
    el.getAttribute('role') === 'button' || el.onclick
  );

  invitation.click();
  return {
    clicked: true,
    tagName: invitation.tagName,
    childCount: children.length,
    clickableChildren: clickable.map(el => ({
      tag: el.tagName,
      class: el.className?.substring(0, 60),
      role: el.getAttribute('role')
    })),
    invitationHTML: invitation.outerHTML?.substring(0, 500)
  };
});
console.log('Manual click result:', JSON.stringify(manualClickResult, null, 2));

// Check Zoom logs
console.log('\nAll Zoom-related console logs:');
consoleLogs.forEach(log => {
  const t = log.time - zoomStart;
  console.log(`  [T+${t}ms] [${log.type}] ${log.text.substring(0, 250)}`);
});

// Force restore unified button
await page.evaluate(() => {
  const container = document.getElementById('chat-widget-container');
  if (container) container.style.display = 'flex';
  const menu = document.getElementById('chat-widget-menu');
  if (menu) menu.style.display = 'none';
  // Deactivate zoom by hiding its elements
  document.querySelectorAll('[class*="livesdk"]').forEach(el => el.style.display = 'none');
});
await new Promise(r => setTimeout(r, 2000));

// =================================================================
// TEST 2: ANTHOLOGY - Track class changes on widget frame
// =================================================================
console.log('\n' + '='.repeat(60));
console.log('TEST 2: ANTHOLOGY - Frame class transitions');
console.log('='.repeat(60));

consoleLogs.length = 0;

// Inject a detailed class change monitor BEFORE activating
await page.evaluate(() => {
  window.__anthologyClassChanges = [];
  window.__anthologyStartTime = Date.now();

  // Monitor for amazon-connect-widget-frame creation and class changes
  const bodyObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      // Watch for frame element being added
      for (const node of mutation.addedNodes) {
        if (node.nodeType === 1) {
          const frame = node.id === 'amazon-connect-widget-frame' ? node :
                       node.querySelector?.('#amazon-connect-widget-frame');
          if (frame) {
            window.__anthologyClassChanges.push({
              time: Date.now() - window.__anthologyStartTime,
              event: 'frame-added',
              className: frame.className
            });

            // Now watch class changes on the frame
            const frameObserver = new MutationObserver((frameMutations) => {
              for (const fm of frameMutations) {
                if (fm.type === 'attributes' && fm.attributeName === 'class') {
                  window.__anthologyClassChanges.push({
                    time: Date.now() - window.__anthologyStartTime,
                    event: 'class-changed',
                    oldClass: fm.oldValue,
                    newClass: frame.className,
                    hadShow: fm.oldValue?.includes('show') || false,
                    hasShow: frame.className.includes('show')
                  });
                }
              }
            });
            frameObserver.observe(frame, {
              attributes: true,
              attributeFilter: ['class'],
              attributeOldValue: true
            });
          }
        }
      }
    }
  });
  bodyObserver.observe(document.body, { childList: true, subtree: true });
});

const anthStart = Date.now();

// Open menu and click Anthology
await page.click('#chat-widget-main-btn');
await page.waitForSelector('[role="menuitem"]', { visible: true, timeout: 3000 });

const anthClicked = await page.evaluate(() => {
  const items = [...document.querySelectorAll('[role="menuitem"]')];
  const anth = items.find(i => i.innerText.includes('Live Chat'));
  if (anth) { anth.click(); return true; }
  return false;
});
console.log(`Clicked Anthology: ${anthClicked} at T+0ms`);

// Wait and monitor for 20 seconds
console.log('Monitoring for 20s...');
for (let i = 0; i < 20; i++) {
  await new Promise(r => setTimeout(r, 1000));

  const status = await page.evaluate(() => {
    const container = document.getElementById('chat-widget-container');
    const frame = document.getElementById('amazon-connect-widget-frame');
    return {
      containerDisplay: container?.style.display,
      frameExists: !!frame,
      frameClass: frame?.className?.substring(0, 100),
      hasShow: frame?.className?.includes('show') || false
    };
  });

  const t = Date.now() - anthStart;
  if (i < 5 || status.containerDisplay === 'flex' || !status.hasShow) {
    console.log(`  [T+${t}ms] container=${status.containerDisplay} frame=${status.frameExists} show=${status.hasShow} class="${status.frameClass}"`);
  }
}

// Get all class change events
const classChanges = await page.evaluate(() => window.__anthologyClassChanges);
console.log(`\nFrame class change timeline (${classChanges.length} events):`);
classChanges.forEach(c => {
  if (c.event === 'frame-added') {
    console.log(`  [T+${c.time}ms] FRAME ADDED with class: "${c.className}"`);
  } else {
    const showTransition = c.hadShow && !c.hasShow ? ' *** SHOW REMOVED ***' :
                          !c.hadShow && c.hasShow ? ' (show added)' : '';
    console.log(`  [T+${c.time}ms] CLASS CHANGED: "${c.oldClass?.substring(0, 80)}" → "${c.newClass?.substring(0, 80)}"${showTransition}`);
  }
});

// Get Anthology console logs
console.log('\nAnthology console logs:');
consoleLogs.forEach(log => {
  const t = log.time - anthStart;
  if (log.text.includes('Anthology') || log.text.includes('amazon') ||
      log.text.includes('close') || log.text.includes('deactivat') ||
      log.text.includes('activat') || log.text.includes('show') ||
      log.text.includes('removed') || log.text.includes('monitor') ||
      log.text.includes('frame') || log.text.includes('unified') ||
      log.text.includes('return')) {
    console.log(`  [T+${t}ms] [${log.type}] ${log.text.substring(0, 250)}`);
  }
});

await browser.close();

import puppeteer from 'puppeteer';

const URL = 'https://chatbotnonprod.wpengine.com/gcc-newui-dualbuttons/';

const TIMEOUT_FIRST_ACTIVATION = 15000;
const TIMEOUT_SUBSEQUENT = 8000;
const TIMEOUT_MENU_RETURN = 5000;
const POLL_INTERVAL = 100;

// Menu labels as they appear on the test page
const LABEL_ZOOM = 'Zoom Contact Center';
const LABEL_ANTHOLOGY = 'Live Chat Support';
const LABEL_CHATBOT = 'AI Chatbot';

const results = [];

// ─── Helpers ────────────────────────────────────────────────────────

function collectConsoleLogs(page) {
  const logs = [];
  const startTime = Date.now();

  page.on('console', msg => {
    logs.push({
      elapsed: Date.now() - startTime,
      type: msg.type(),
      text: msg.text(),
    });
  });

  return logs;
}

function logResult(name, passed, details = '') {
  const status = passed ? 'PASS' : 'FAIL';
  const icon = passed ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m';
  console.log(`  [${icon}] ${name}${details ? ' — ' + details : ''}`);
  results.push({ name, status, details });
}

async function poll(page, evaluator, timeout) {
  const deadline = Date.now() + timeout;

  while (Date.now() < deadline) {
    const result = await page.evaluate(evaluator);
    if (result) return true;
    await new Promise(r => setTimeout(r, POLL_INTERVAL));
  }

  return false;
}

async function waitForUnifiedButton(page, timeout = TIMEOUT_MENU_RETURN) {
  return poll(
    page,
    () => {
      const container = document.getElementById('chat-widget-container');
      return container && getComputedStyle(container).display === 'flex';
    },
    timeout,
  );
}

async function freshPage(page) {
  await page.reload({ waitUntil: 'networkidle2', timeout: 60000 });
  await page.waitForSelector('#chat-widget-main-btn', { timeout: 15000 });
  await new Promise(r => setTimeout(r, 500));
}

async function clickMenuWidget(page, label) {
  try {
    await page.click('#chat-widget-main-btn');
    await page.waitForSelector('[role="menuitem"]', { visible: true, timeout: 3000 });
  } catch {
    console.log(`    [warn] menu did not open for "${label}"`);
    return false;
  }

  const clicked = await page.evaluate((targetLabel) => {
    const items = [...document.querySelectorAll('[role="menuitem"]')];
    const match = items.find(i => i.innerText.includes(targetLabel));
    if (match) { match.click(); return true; }
    return false;
  }, label);

  if (!clicked) {
    console.log(`    [warn] menu item "${label}" not found`);
  }

  return clicked;
}

async function getWidgetVisibility(page) {
  return page.evaluate(() => {
    const container = document.getElementById('chat-widget-container');
    const invitation = document.querySelector('.livesdk__invitation');
    const frame = document.getElementById('amazon-connect-widget-frame');
    const chatbot = document.querySelector('[class*="oda-chat"]');

    return {
      unifiedButton: container ? getComputedStyle(container).display : 'missing',
      zoomVisible: invitation ? getComputedStyle(invitation).display !== 'none' : false,
      anthologyVisible: frame ? frame.classList.contains('show') : false,
      chatbotVisible: chatbot ? getComputedStyle(chatbot).display !== 'none' : false,
    };
  });
}

// ─── Widget-specific wait/close ─────────────────────────────────────

async function waitForZoom(page, timeout) {
  return poll(
    page,
    () => {
      const el = document.querySelector('.livesdk__invitation');
      return el && getComputedStyle(el).display !== 'none';
    },
    timeout,
  );
}

async function closeZoom(page) {
  // Click the invitation to open the Zoom pre-join dialog
  await page.evaluate(() => {
    document.querySelector('.livesdk__invitation')?.click();
  });

  // Wait for the Leave button to appear
  const leaveAppeared = await poll(
    page,
    () => {
      const button = document.querySelector('button[aria-label="Leave"]')
        || document.querySelector('.css-1u2heh6');
      return !!button;
    },
    10000,
  );

  if (!leaveAppeared) {
    const invState = await page.evaluate(() => {
      const inv = document.querySelector('.livesdk__invitation');
      return inv ? {
        display: getComputedStyle(inv).display,
        style: inv.style.cssText,
        visible: getComputedStyle(inv).visibility,
      } : 'missing';
    });
    console.log('    [debug] Leave button did not appear. Invitation state:', JSON.stringify(invState));
    return false;
  }

  await page.evaluate(() => {
    const button = document.querySelector('button[aria-label="Leave"]')
      || document.querySelector('.css-1u2heh6');
    button?.click();
  });

  // Allow Zoom SDK time to tear down its UI after Leave
  await new Promise(r => setTimeout(r, 1000));

  const menuBack = await waitForUnifiedButton(page);

  if (!menuBack) {
    const vis = await getWidgetVisibility(page);
    console.log('    [debug] Unified button did not return after Leave:', JSON.stringify(vis));
  }

  return menuBack;
}

async function waitForAnthology(page, timeout) {
  return poll(
    page,
    () => {
      const frame = document.getElementById('amazon-connect-widget-frame');
      return frame && frame.classList.contains('show');
    },
    timeout,
  );
}

async function closeAnthology(page) {
  const closeAppeared = await poll(
    page,
    () => !!document.getElementById('amazon-connect-close-widget-button'),
    5000,
  );

  if (!closeAppeared) return false;

  await page.evaluate(() => {
    document.getElementById('amazon-connect-close-widget-button')?.click();
  });

  return waitForUnifiedButton(page);
}

async function waitForChatbot(page, timeout) {
  return poll(
    page,
    () => {
      const el = document.querySelector('[class*="oda-chat"]');
      return el && getComputedStyle(el).display !== 'none';
    },
    timeout,
  );
}

async function closeChatbot(page) {
  // Click the end conversation button (X) to trigger the Yes/No prompt
  const endBtnAppeared = await poll(
    page,
    () => !!document.getElementById('oda-chat-end-conversation'),
    5000,
  );

  if (!endBtnAppeared) return false;

  await page.evaluate(() => {
    document.getElementById('oda-chat-end-conversation')?.click();
  });

  // Wait for the Yes confirmation button inside #isChatAlertPopup
  const yesAppeared = await poll(
    page,
    () => {
      const popup = document.getElementById('isChatAlertPopup');
      if (!popup) return false;
      const buttons = popup.querySelectorAll('button');
      return [...buttons].some(b => b.textContent?.trim() === 'Yes');
    },
    3000,
  );

  if (!yesAppeared) return false;

  await page.evaluate(() => {
    const popup = document.getElementById('isChatAlertPopup');
    const buttons = popup?.querySelectorAll('button') || [];
    [...buttons].find(b => b.textContent?.trim() === 'Yes')?.click();
  });

  return waitForUnifiedButton(page);
}

function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));

  const passCount = results.filter(r => r.status === 'PASS').length;
  const failCount = results.filter(r => r.status === 'FAIL').length;

  for (const r of results) {
    const icon = r.status === 'PASS' ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m';
    console.log(`  [${icon}] ${r.name}`);
  }

  console.log('');
  console.log(`  ${passCount} passed, ${failCount} failed, ${results.length} total`);
  console.log('='.repeat(60));
}

// ─── Widget config ──────────────────────────────────────────────────

const WIDGETS = {
  Zoom:      { label: LABEL_ZOOM,      wait: waitForZoom,      close: closeZoom },
  Anthology: { label: LABEL_ANTHOLOGY, wait: waitForAnthology, close: closeAnthology },
  Chatbot:   { label: LABEL_CHATBOT,   wait: waitForChatbot,   close: closeChatbot },
};

async function activateWidget(page, widgetName, timeout) {
  const widget = WIDGETS[widgetName];
  const clicked = await clickMenuWidget(page, widget.label);
  if (!clicked) return false;
  return widget.wait(page, timeout);
}

async function activateAndClose(page, widgetName, timeout) {
  const appeared = await activateWidget(page, widgetName, timeout);
  if (!appeared) return false;
  return WIDGETS[widgetName].close(page);
}

// ─── Main ───────────────────────────────────────────────────────────

const skipSdkTests = process.argv.includes('--links-only');

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'], protocolTimeout: 60000 });
const page = await browser.newPage();
const consoleLogs = collectConsoleLogs(page);

console.log('Loading page...');
await page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });
await page.waitForSelector('#chat-widget-main-btn', { timeout: 15000 });
console.log('Chat widget button found.\n');

if (skipSdkTests) {
  console.log('Skipping SDK-dependent tests 1–15 (--links-only)\n');
}

// ─── Tests 1–3: Individual widget activation ───────────────────────

if (!skipSdkTests) {

const activationTests = [
  { num: 1, name: 'Zoom: activate and verify',      widget: 'Zoom' },
  { num: 2, name: 'Anthology: activate and verify',  widget: 'Anthology' },
  { num: 3, name: 'Chatbot: activate and verify',    widget: 'Chatbot' },
];

for (const test of activationTests) {
  console.log(`Test ${test.num}: ${test.name}`);
  await freshPage(page);
  const appeared = await activateWidget(page, test.widget, TIMEOUT_FIRST_ACTIVATION);
  logResult(test.name, appeared);
}

// ─── Tests 4–6: Close returns to menu (real close buttons) ─────────

const closeTests = [
  { num: 4, name: 'Zoom: close returns to menu',      widget: 'Zoom' },
  { num: 5, name: 'Anthology: close returns to menu',  widget: 'Anthology' },
  { num: 6, name: 'Chatbot: close returns to menu',    widget: 'Chatbot' },
];

for (const test of closeTests) {
  console.log(`Test ${test.num}: ${test.name}`);
  await freshPage(page);

  const closed = await activateAndClose(page, test.widget, TIMEOUT_FIRST_ACTIVATION);
  logResult(test.name, closed, closed ? '' : `${test.widget} activate or close failed`);
}

// ─── Tests 7–12: Widget switching (close first, then activate second) ──

const switchTests = [
  { num: 7,  first: 'Zoom',      second: 'Chatbot' },
  { num: 8,  first: 'Zoom',      second: 'Anthology' },
  { num: 9,  first: 'Chatbot',   second: 'Zoom' },
  { num: 10, first: 'Chatbot',   second: 'Anthology' },
  { num: 11, first: 'Anthology', second: 'Zoom' },
  { num: 12, first: 'Anthology', second: 'Chatbot' },
];

for (const test of switchTests) {
  const name = `${test.first} -> close -> ${test.second}`;
  console.log(`Test ${test.num}: ${name}`);
  await freshPage(page);

  const closedFirst = await activateAndClose(page, test.first, TIMEOUT_FIRST_ACTIVATION);

  if (!closedFirst) {
    logResult(name, false, `${test.first} activate/close failed`);
    continue;
  }

  const secondAppeared = await activateWidget(page, test.second, TIMEOUT_SUBSEQUENT);
  const visibility = await getWidgetVisibility(page);
  const details = secondAppeared ? '' : `visibility: ${JSON.stringify(visibility)}`;
  logResult(name, secondAppeared, details);
}

// ─── Tests 13–15: Back-to-back switching ────────────────────────────

console.log('Test 13: Back-to-back — Zoom -> Chatbot -> Zoom');
await freshPage(page);
let ok13 = await activateAndClose(page, 'Zoom', TIMEOUT_FIRST_ACTIVATION);
ok13 = ok13 && await activateAndClose(page, 'Chatbot', TIMEOUT_SUBSEQUENT);
ok13 = ok13 && await activateWidget(page, 'Zoom', TIMEOUT_SUBSEQUENT);
const vis13 = await getWidgetVisibility(page);
logResult(
  'Back-to-back: Zoom -> Chatbot -> Zoom',
  ok13 && vis13.zoomVisible,
  `zoom=${vis13.zoomVisible} chatbot=${vis13.chatbotVisible} menu=${vis13.unifiedButton}`,
);

console.log('Test 14: Back-to-back — Chatbot -> Anthology -> Chatbot');
await freshPage(page);
let ok14 = await activateAndClose(page, 'Chatbot', TIMEOUT_FIRST_ACTIVATION);
ok14 = ok14 && await activateAndClose(page, 'Anthology', TIMEOUT_SUBSEQUENT);
ok14 = ok14 && await activateWidget(page, 'Chatbot', TIMEOUT_SUBSEQUENT);
const vis14 = await getWidgetVisibility(page);
logResult(
  'Back-to-back: Chatbot -> Anthology -> Chatbot',
  ok14 && vis14.chatbotVisible,
  `chatbot=${vis14.chatbotVisible} anthology=${vis14.anthologyVisible} menu=${vis14.unifiedButton}`,
);

console.log('Test 15: Triple switch — Zoom -> Anthology -> Chatbot');
await freshPage(page);
let ok15 = await activateAndClose(page, 'Zoom', TIMEOUT_FIRST_ACTIVATION);
ok15 = ok15 && await activateAndClose(page, 'Anthology', TIMEOUT_SUBSEQUENT);
ok15 = ok15 && await activateWidget(page, 'Chatbot', TIMEOUT_SUBSEQUENT);
const triple = await getWidgetVisibility(page);
logResult(
  'Triple switch: Zoom -> Anthology -> Chatbot',
  ok15 && triple.chatbotVisible && !triple.zoomVisible && !triple.anthologyVisible,
  `zoom=${triple.zoomVisible} anthology=${triple.anthologyVisible} chatbot=${triple.chatbotVisible}`,
);

} // end skipSdkTests guard

// ─── Tests 16–18: Menu structure and accessibility ───────────────────

console.log('Test 16: Menu — correct number of menu items');
await freshPage(page);
await page.click('#chat-widget-main-btn');
await page.waitForSelector('[role="menuitem"]', { visible: true, timeout: 3000 });
const menuItemCount = await page.evaluate(() => {
  return document.querySelectorAll('[role="menuitem"]').length;
});
const menuLabels = await page.evaluate(() => {
  return [...document.querySelectorAll('[role="menuitem"]')].map(i => i.innerText);
});
logResult('Menu has 5 items (3 widgets + 2 links)', menuItemCount === 5, `found ${menuItemCount}: [${menuLabels.join(', ')}]`);

console.log('Test 17: Menu — button has correct ARIA attributes');
const ariaAttrs = await page.evaluate(() => {
  const btn = document.getElementById('chat-widget-main-btn');
  return {
    hasPopup: btn?.getAttribute('aria-haspopup'),
    expanded: btn?.getAttribute('aria-expanded'),
    label: btn?.getAttribute('aria-label'),
  };
});
const ariaOk = ariaAttrs.hasPopup === 'true'
  && ariaAttrs.expanded === 'true'
  && ariaAttrs.label !== null;
logResult('Button ARIA attributes', ariaOk, JSON.stringify(ariaAttrs));

console.log('Test 18: Menu — outside click closes menu');
await freshPage(page);
await page.click('#chat-widget-main-btn');
await page.waitForSelector('[role="menuitem"]', { visible: true, timeout: 3000 });
await page.click('body');
await new Promise(r => setTimeout(r, 300));
const menuHidden = await page.evaluate(() => {
  return document.getElementById('chat-widget-menu')?.style.display === 'none';
});
logResult('Outside click closes menu', menuHidden);

// ─── Tests 19–22: Link widgets ──────────────────────────────────────

// Open a new page with injected config that includes link widgets
console.log('\n--- Link widget tests (injected config) ---');

const linkPage = await browser.newPage();
const linkLogs = collectConsoleLogs(linkPage);

// Inject config before page loads — use Object.defineProperty to prevent
// the page's own script from overwriting our config
await linkPage.evaluateOnNewDocument(() => {
  const config = {
    zoom: { enabled: false },
    anthology: { enabled: false },
    chatbot: { enabled: false },
    links: [
      { enabled: true, displayName: 'Help Center', url: 'https://example.com/help', order: 1 },
      { enabled: true, displayName: 'FAQ', url: 'https://example.com/faq', order: 2 },
      { enabled: false, displayName: 'Disabled Link', url: 'https://example.com/disabled', order: 3 },
    ],
  };
  Object.defineProperty(window, 'CHAT_WIDGET_CONFIG', {
    value: config,
    writable: false,
    configurable: false,
  });
});

await linkPage.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });
await linkPage.waitForSelector('#chat-widget-main-btn', { timeout: 15000 });

console.log('Test 19: Link — enabled links appear in menu');
await linkPage.click('#chat-widget-main-btn');
await linkPage.waitForSelector('[role="menuitem"]', { visible: true, timeout: 3000 });
const linkLabels = await linkPage.evaluate(() => {
  const items = [...document.querySelectorAll('[role="menuitem"]')];
  return items.map(i => i.innerText);
});
const hasHelp = linkLabels.includes('Help Center');
const hasFaq = linkLabels.includes('FAQ');
const hasDisabled = linkLabels.includes('Disabled Link');
logResult(
  'Enabled links appear, disabled links hidden',
  hasHelp && hasFaq && !hasDisabled,
  `items: [${linkLabels.join(', ')}]`,
);

console.log('Test 20: Link — only 2 menu items (disabled link excluded)');
logResult('Link menu has 2 items', linkLabels.length === 2, `found ${linkLabels.length}`);

console.log('Test 21: Link — clicking link opens new tab');
// Re-open menu if needed
const menuVisible = await linkPage.evaluate(() => {
  return document.getElementById('chat-widget-menu')?.style.display === 'block';
});
if (!menuVisible) {
  await linkPage.click('#chat-widget-main-btn');
  await linkPage.waitForSelector('[role="menuitem"]', { visible: true, timeout: 3000 });
}

const popupPromise = new Promise(resolve => {
  browser.once('targetcreated', target => resolve(target.url()));
  setTimeout(() => resolve(null), 5000);
});

await linkPage.evaluate(() => {
  const items = [...document.querySelectorAll('[role="menuitem"]')];
  const helpItem = items.find(i => i.innerText === 'Help Center');
  helpItem?.click();
});

const popupUrl = await popupPromise;
logResult(
  'Click opens URL in new tab',
  popupUrl === 'https://example.com/help',
  popupUrl || 'no popup detected',
);

// Close the popup tab so it doesn't interfere with later tests
const pages = await browser.pages();
for (const p of pages) {
  if (p !== linkPage && p !== page) await p.close();
}

console.log('Test 22: Link — unified button stays visible after link click');
const buttonStaysVisible = await linkPage.evaluate(() => {
  const container = document.getElementById('chat-widget-container');
  return container && getComputedStyle(container).display === 'flex';
});
logResult('Unified button stays visible after link click', buttonStaysVisible);

console.log('Test 23: Link — menu closes after link click');
const menuClosedAfterLink = await linkPage.evaluate(() => {
  return document.getElementById('chat-widget-menu')?.style.display === 'none';
});
logResult('Menu closes after link click', menuClosedAfterLink);

console.log('Test 24: Link — items sorted by order');
// Reload to get fresh menu
await linkPage.reload({ waitUntil: 'networkidle2', timeout: 60000 });
await linkPage.waitForSelector('#chat-widget-main-btn', { timeout: 15000 });
await new Promise(r => setTimeout(r, 500));
await linkPage.click('#chat-widget-main-btn');
await linkPage.waitForSelector('[role="menuitem"]', { visible: true, timeout: 3000 });
const orderedLabels = await linkPage.evaluate(() => {
  const items = [...document.querySelectorAll('[role="menuitem"]')];
  return items.map(i => i.innerText);
});
const correctOrder = orderedLabels[0] === 'Help Center' && orderedLabels[1] === 'FAQ';
logResult('Links sorted by order', correctOrder, `order: [${orderedLabels.join(', ')}]`);

await linkPage.close();

// ─── Tests 25–26: Mixed widgets + links ─────────────────────────────

console.log('\n--- Mixed widgets + links tests ---');

const mixedPage = await browser.newPage();
collectConsoleLogs(mixedPage);

// Block third-party SDK scripts so they don't hang the page in headless mode
await mixedPage.setRequestInterception(true);
mixedPage.on('request', (req) => {
  const url = req.url();
  if (url.includes('intrasee.com') || url.includes('zoom.us') || url.includes('amazon-connect')) {
    req.abort();
  } else {
    req.continue();
  }
});

await mixedPage.evaluateOnNewDocument(() => {
  const config = {
    zoom: { enabled: false },
    anthology: { enabled: false },
    chatbot: {
      enabled: true,
      org: 'VCCS_GC',
      scriptId: 'IS_CV_PUBLIC_HOOK',
      src: 'https://vccs-ws.iuc.intrasee.com/vccsoda/IS_CV_PUBLIC_HOOK.js',
      launcherId: 'idalogin',
      displayName: 'AI Chatbot',
      order: 3,
    },
    links: [
      { enabled: true, displayName: 'Help Center', url: 'https://example.com/help', order: 1 },
      { enabled: true, displayName: 'FAQ', url: 'https://example.com/faq', order: 5 },
    ],
  };
  Object.defineProperty(window, 'CHAT_WIDGET_CONFIG', {
    value: config,
    writable: false,
    configurable: false,
  });
});

await mixedPage.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });
await mixedPage.waitForSelector('#chat-widget-main-btn', { timeout: 15000 });
await new Promise(r => setTimeout(r, 3000));

console.log('Test 25: Mixed — links and widgets interleave by order');
await mixedPage.click('#chat-widget-main-btn');
await mixedPage.waitForSelector('[role="menuitem"]', { visible: true, timeout: 3000 });
const mixedLabels = await mixedPage.evaluate(() => {
  const items = [...document.querySelectorAll('[role="menuitem"]')];
  return items.map(i => i.innerText);
});
const expectedOrder = ['Help Center', 'AI Chatbot', 'FAQ'];
const mixedOrderOk = mixedLabels.length === 3
  && mixedLabels[0] === expectedOrder[0]
  && mixedLabels[1] === expectedOrder[1]
  && mixedLabels[2] === expectedOrder[2];
logResult(
  'Mixed: links + widgets sorted by order',
  mixedOrderOk,
  `expected [${expectedOrder.join(', ')}] got [${mixedLabels.join(', ')}]`,
);

console.log('Test 26: Mixed — link click keeps unified button, menu re-opens');
try {
  // Click the Help Center link
  await mixedPage.evaluate(() => {
    const items = [...document.querySelectorAll('[role="menuitem"]')];
    items.find(i => i.innerText === 'Help Center')?.click();
  });
  await new Promise(r => setTimeout(r, 500));

  const mixedButtonVisible = await mixedPage.evaluate(() => {
    const container = document.getElementById('chat-widget-container');
    return container && getComputedStyle(container).display === 'flex';
  });

  // Verify menu can re-open after link click
  let menuReopens = false;
  if (mixedButtonVisible) {
    await mixedPage.click('#chat-widget-main-btn');
    menuReopens = await poll(
      mixedPage,
      () => document.getElementById('chat-widget-menu')?.style.display === 'block',
      3000,
    );
  }

  logResult(
    'Mixed: button visible + menu re-opens after link click',
    mixedButtonVisible && menuReopens,
    `button=${mixedButtonVisible} menuReopens=${menuReopens}`,
  );
} catch (error) {
  logResult(
    'Mixed: button visible + menu re-opens after link click',
    false,
    `error: ${error.message}`,
  );
}

await mixedPage.close().catch(() => {});

// ─── Done ───────────────────────────────────────────────────────────

printSummary();

await browser.close();
process.exit(results.some(r => r.status === 'FAIL') ? 1 : 0);

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

  if (!leaveAppeared) return false;

  await page.evaluate(() => {
    const button = document.querySelector('button[aria-label="Leave"]')
      || document.querySelector('.css-1u2heh6');
    button?.click();
  });

  return waitForUnifiedButton(page);
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
  // Open the options menu first
  const optionsAppeared = await poll(
    page,
    () => !!document.querySelector('.oda-chat-button-show-options'),
    5000,
  );

  if (!optionsAppeared) return false;

  await page.evaluate(() => {
    document.querySelector('.oda-chat-button-show-options')?.click();
  });

  // Wait for the collapse menu item to appear
  const collapseAppeared = await poll(
    page,
    () => {
      const el = document.getElementById('oda-chat-collapse');
      return el && getComputedStyle(el).display !== 'none';
    },
    3000,
  );

  if (!collapseAppeared) return false;

  await page.evaluate(() => {
    document.getElementById('oda-chat-collapse')?.click();
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

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
const consoleLogs = collectConsoleLogs(page);

console.log('Loading page...');
await page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });
await page.waitForSelector('#chat-widget-main-btn', { timeout: 15000 });
console.log('Chat widget button found.\n');

// ─── Tests 1–3: Individual widget activation ───────────────────────

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

// ─── Done ───────────────────────────────────────────────────────────

printSummary();

await browser.close();
process.exit(results.some(r => r.status === 'FAIL') ? 1 : 0);

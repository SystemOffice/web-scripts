import puppeteer from 'puppeteer';

const URL = 'https://chatbotnonprod.wpengine.com/gcc-newui-dualbuttons/';

const TIMEOUT_FIRST_ACTIVATION = 15000;
const TIMEOUT_SUBSEQUENT = 8000;
const TIMEOUT_MENU_RETURN = 5000;
const POLL_INTERVAL = 100;

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

async function forceResetToMenu(page) {
  await page.evaluate(() => {
    const container = document.getElementById('chat-widget-container');
    if (container) container.style.display = 'flex';

    const menu = document.getElementById('chat-widget-menu');
    if (menu) menu.style.display = 'none';

    document.querySelectorAll('[class*="livesdk"]').forEach(el => {
      el.style.display = 'none';
    });

    const frame = document.getElementById('amazon-connect-widget-frame');
    if (frame) frame.classList.remove('show');

    document.querySelectorAll('[class*="oda-chat"]').forEach(el => {
      el.style.display = 'none';
    });
  });

  await new Promise(r => setTimeout(r, 1000));
}

async function clickMenuWidget(page, label) {
  await page.click('#chat-widget-main-btn');
  await page.waitForSelector('[role="menuitem"]', { visible: true, timeout: 3000 });

  const clicked = await page.evaluate((targetLabel) => {
    const items = [...document.querySelectorAll('[role="menuitem"]')];
    const match = items.find(i => i.innerText.includes(targetLabel));
    if (match) { match.click(); return true; }
    return false;
  }, label);

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

async function closeZoom(page) {
  const closed = await page.evaluate(() => {
    const leaveButton = document.querySelector('button[aria-label="Leave"]')
      || document.querySelector('.css-1u2heh6');
    if (leaveButton) { leaveButton.click(); return true; }
    return false;
  });

  if (closed) {
    await waitForUnifiedButton(page);
  }

  return closed;
}

async function closeAnthology(page) {
  const closed = await page.evaluate(() => {
    const closeButton = document.querySelector('button[aria-label="Close chat"]');
    if (closeButton) { closeButton.click(); return true; }
    return false;
  });

  if (closed) {
    await waitForUnifiedButton(page);
  }

  return closed;
}

async function closeChatbot(page) {
  const closed = await page.evaluate(() => {
    const closeButton = document.querySelector(
      '.oda-chat-popup-action.oda-chat-filled.oda-chat-flex'
    );
    if (closeButton) { closeButton.click(); return true; }
    return false;
  });

  if (closed) {
    await waitForUnifiedButton(page);
  }

  return closed;
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

// ─── Main ───────────────────────────────────────────────────────────

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
const consoleLogs = collectConsoleLogs(page);

console.log('Loading page...');
await page.goto(URL, { waitUntil: 'networkidle2', timeout: 30000 });
await page.waitForSelector('#chat-widget-main-btn', { timeout: 15000 });
console.log('Chat widget button found.\n');

// ─── Test 1: Zoom activate ─────────────────────────────────────────

console.log('Test 1: Zoom — activate and verify');
await forceResetToMenu(page);
await clickMenuWidget(page, 'Zoom');
const zoomAppeared = await waitForZoom(page, TIMEOUT_FIRST_ACTIVATION);
logResult('Zoom: activate and verify', zoomAppeared);

// ─── Test 2: Zoom close returns to menu ────────────────────────────

console.log('Test 2: Zoom — close returns to menu');
if (zoomAppeared) {
  const zoomClosed = await closeZoom(page);
  const menuReturned = zoomClosed && await waitForUnifiedButton(page);
  logResult('Zoom: close returns to menu', menuReturned,
    zoomClosed ? '' : 'close button not found');
} else {
  logResult('Zoom: close returns to menu', false, 'skipped — zoom did not activate');
}

// ─── Test 3: Anthology activate ────────────────────────────────────

console.log('Test 3: Anthology — activate and verify');
await forceResetToMenu(page);
await clickMenuWidget(page, 'Live Chat');
const anthologyAppeared = await waitForAnthology(page, TIMEOUT_FIRST_ACTIVATION);
logResult('Anthology: activate and verify', anthologyAppeared);

// ─── Test 4: Anthology close returns to menu ───────────────────────

console.log('Test 4: Anthology — close returns to menu');
if (anthologyAppeared) {
  const anthologyClosed = await closeAnthology(page);
  const menuReturned = anthologyClosed && await waitForUnifiedButton(page);
  logResult('Anthology: close returns to menu', menuReturned,
    anthologyClosed ? '' : 'close button not found');
} else {
  logResult('Anthology: close returns to menu', false, 'skipped — anthology did not activate');
}

// ─── Test 5: Chatbot activate ──────────────────────────────────────

console.log('Test 5: Chatbot — activate and verify');
await forceResetToMenu(page);
await clickMenuWidget(page, 'Bot');
const chatbotAppeared = await waitForChatbot(page, TIMEOUT_FIRST_ACTIVATION);

if (!chatbotAppeared) {
  // Try alternate label
  await forceResetToMenu(page);
  await clickMenuWidget(page, 'Student Support Bot');
  const retryAppeared = await waitForChatbot(page, TIMEOUT_FIRST_ACTIVATION);
  logResult('Chatbot: activate and verify', retryAppeared,
    retryAppeared ? 'matched via "Student Support Bot"' : '');
} else {
  logResult('Chatbot: activate and verify', true);
}

// ─── Test 6: Chatbot close returns to menu ─────────────────────────

console.log('Test 6: Chatbot — close returns to menu');
const chatbotVisible = await page.evaluate(() => {
  const el = document.querySelector('[class*="oda-chat"]');
  return el && getComputedStyle(el).display !== 'none';
});

if (chatbotVisible) {
  const chatbotClosed = await closeChatbot(page);
  const menuReturned = chatbotClosed && await waitForUnifiedButton(page);
  logResult('Chatbot: close returns to menu', menuReturned,
    chatbotClosed ? '' : 'close button not found');
} else {
  logResult('Chatbot: close returns to menu', false, 'skipped — chatbot did not activate');
}

// Determine the working chatbot label for subsequent tests
const chatbotLabel = await (async () => {
  await forceResetToMenu(page);
  await clickMenuWidget(page, 'Bot');
  const found = await waitForChatbot(page, TIMEOUT_SUBSEQUENT);
  await forceResetToMenu(page);
  return found ? 'Bot' : 'Student Support Bot';
})();

// ─── Switching tests helper ────────────────────────────────────────

async function activateAndClose(page, widgetName) {
  const config = {
    'Zoom':      { label: 'Zoom',      wait: waitForZoom,      close: closeZoom },
    'Anthology': { label: 'Live Chat',  wait: waitForAnthology, close: closeAnthology },
    'Chatbot':   { label: chatbotLabel, wait: waitForChatbot,   close: closeChatbot },
  };

  const widget = config[widgetName];
  await clickMenuWidget(page, widget.label);
  const appeared = await widget.wait(page, TIMEOUT_SUBSEQUENT);
  if (!appeared) return false;

  const closed = await widget.close(page);
  if (!closed) return false;

  return waitForUnifiedButton(page);
}

async function activateWidget(page, widgetName) {
  const config = {
    'Zoom':      { label: 'Zoom',      wait: waitForZoom },
    'Anthology': { label: 'Live Chat',  wait: waitForAnthology },
    'Chatbot':   { label: chatbotLabel, wait: waitForChatbot },
  };

  const widget = config[widgetName];
  await clickMenuWidget(page, widget.label);
  return widget.wait(page, TIMEOUT_SUBSEQUENT);
}

// ─── Tests 7–12: Close-then-switch patterns ────────────────────────

const switchTests = [
  { num: 7,  first: 'Zoom',      second: 'Chatbot',   checker: waitForChatbot },
  { num: 8,  first: 'Zoom',      second: 'Anthology',  checker: waitForAnthology },
  { num: 9,  first: 'Chatbot',   second: 'Zoom',       checker: waitForZoom },
  { num: 10, first: 'Chatbot',   second: 'Anthology',  checker: waitForAnthology },
  { num: 11, first: 'Anthology', second: 'Zoom',       checker: waitForZoom },
  { num: 12, first: 'Anthology', second: 'Chatbot',    checker: waitForChatbot },
];

for (const test of switchTests) {
  const name = `${test.first} -> close -> ${test.second}`;
  console.log(`Test ${test.num}: ${name}`);
  await forceResetToMenu(page);

  const closedOk = await activateAndClose(page, test.first);

  if (!closedOk) {
    logResult(name, false, `${test.first} activate/close failed`);
    continue;
  }

  const secondLabel = test.second === 'Zoom' ? 'Zoom'
    : test.second === 'Anthology' ? 'Live Chat'
    : chatbotLabel;

  await clickMenuWidget(page, secondLabel);
  const secondAppeared = await test.checker(page, TIMEOUT_SUBSEQUENT);

  const visibility = await getWidgetVisibility(page);
  const details = secondAppeared ? '' : `visibility: ${JSON.stringify(visibility)}`;
  logResult(name, secondAppeared, details);
}

// ─── Tests 13–14: Rapid switch (no close) ──────────────────────────

console.log('Test 13: Rapid switch — Zoom -> Chatbot (no close)');
await forceResetToMenu(page);
await activateWidget(page, 'Zoom');
await forceResetToMenu(page);
await activateWidget(page, 'Chatbot');

const rapid13 = await getWidgetVisibility(page);
logResult(
  'Rapid switch: Zoom -> Chatbot (no close)',
  rapid13.chatbotVisible && !rapid13.zoomVisible,
  `zoom=${rapid13.zoomVisible} chatbot=${rapid13.chatbotVisible} menu=${rapid13.unifiedButton}`,
);

console.log('Test 14: Rapid switch — Chatbot -> Anthology (no close)');
await forceResetToMenu(page);
await activateWidget(page, 'Chatbot');
await forceResetToMenu(page);
await activateWidget(page, 'Anthology');

const rapid14 = await getWidgetVisibility(page);
logResult(
  'Rapid switch: Chatbot -> Anthology (no close)',
  rapid14.anthologyVisible && !rapid14.chatbotVisible,
  `chatbot=${rapid14.chatbotVisible} anthology=${rapid14.anthologyVisible} menu=${rapid14.unifiedButton}`,
);

// ─── Test 15: Triple switch ────────────────────────────────────────

console.log('Test 15: Triple switch — Zoom -> Anthology -> Chatbot');
await forceResetToMenu(page);
await activateWidget(page, 'Zoom');
await forceResetToMenu(page);
await activateWidget(page, 'Anthology');
await forceResetToMenu(page);
await activateWidget(page, 'Chatbot');

const triple = await getWidgetVisibility(page);
logResult(
  'Triple switch: Zoom -> Anthology -> Chatbot',
  triple.chatbotVisible && !triple.zoomVisible && !triple.anthologyVisible,
  `zoom=${triple.zoomVisible} anthology=${triple.anthologyVisible} chatbot=${triple.chatbotVisible}`,
);

// ─── Done ───────────────────────────────────────────────────────────

printSummary();

await browser.close();
process.exit(results.some(r => r.status === 'FAIL') ? 1 : 0);

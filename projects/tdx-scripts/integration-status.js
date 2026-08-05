/**
* integration-status.js
* Renders a live-ish status dashboard for the 3rd-party tools integrated
* with Canvas (mirrors the "3rd Party Tools in Canvas Status Links" doc).
*
* Each service declares a `type` that maps to a checker function below.
* Every checker returns { state, label } where state is one of:
*   'operational' | 'issue' | 'outage' | 'unknown'
* Checkers must never throw uncaught - callers wrap every check in
* try/catch and fall back to 'unknown' with a link to the status page,
* so one vendor's broken/CORS-blocked API can't break the whole page.
*/

const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

/**
* SERVICES
* type meanings:
*  - 'statuspage'  : Atlassian Statuspage.io - GET {base}/api/v2/status.json
*  - 'instatus'    : Instatus - GET {base}/summary.json
*  - 'google'      : Google Workspace status - GET {base}/incidents.json
*  - 'uptimerobot' : UptimeRobot-hosted page - GET {base}/api/getMonitorList/{pageId}
*                    (best-effort: response shape not fully confirmed, verify live)
*  - 'mcgrawhill'  : McGraw Hill's own /data/*.json feed
*                    (best-effort: response shape not fully confirmed, verify live)
*  - 'betterstack' : BetterStack status page - GET {base}/index.json
*                    (Pressbooks uses BetterStack)
*  - 'link'        : No usable public API found; show a "check manually" tile
*  - 'none'        : No status page identified at all; static/no-link tile
*/
function getIntegrationServices() {
  const services = window.INTEGRATION_STATUS_SERVICES;
  if (!Array.isArray(services)) {
    console.warn('integration-status.js requires integration-services.js to be loaded before integration-status.js.');
    return [];
  }
  return services.slice();
}

const SERVICES = getIntegrationServices();

/** Formats an indicator/status string into Title Case words. */
function formatLabel(value) {
return String(value || '')
.replace(/[_-]+/g, ' ')
.trim()
.split(' ')
.filter(Boolean)
.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
.join(' ') || 'Unknown';
}

/** checkStatuspage(service): Atlassian Statuspage.io v2 status endpoint. */
async function checkStatuspage(service) {
const res = await fetch(`${service.base}/api/v2/status.json`);
if (!res.ok) throw new Error(`HTTP ${res.status}`);
const data = await res.json();
const indicator = data && data.status && data.status.indicator;
const stateMap = { none: 'operational', minor: 'issue', major: 'outage', critical: 'outage' };
const label = (data && data.status && data.status.description) || formatLabel(indicator);
return { state: stateMap[indicator] || 'unknown', label };
}

/** checkInstatus(service): Instatus summary endpoint. */
async function checkInstatus(service) {
const res = await fetch(`${service.base}/summary.json`);
if (!res.ok) throw new Error(`HTTP ${res.status}`);
const data = await res.json();
const status = data && data.page && data.page.status;
const stateMap = { UP: 'operational', HASISSUES: 'issue', UNDERMAINTENANCE: 'issue' };
return { state: stateMap[status] || 'unknown', label: formatLabel(status) };
}

/** checkGoogleWorkspace(service): Google Workspace incidents feed. */
async function checkGoogleWorkspace(service) {
const base = service.base.replace(/\/+$/, '');
const res = await fetch(`${base}/incidents.json`);
if (!res.ok) throw new Error(`HTTP ${res.status}`);
const data = await res.json();
const now = Date.now();
const active = Array.isArray(data) && data.some((incident) => {
const end = incident.end ? new Date(incident.end).getTime() : null;
return !end || end > now;
});
return active
? { state: 'issue', label: 'Active incident reported' }
: { state: 'operational', label: 'No active incidents' };
}

/**
* checkMcGrawHill(service): best-effort parse of McGraw Hill's own status
* feed. NOTE: the exact shape of this JSON hasn't been confirmed against a
* live response - verify and adjust field names once this page is hosted
* and can actually reach it cross-origin.
*/
async function checkMcGrawHill(service) {
const res = await fetch(`${service.base}${service.dataPath}`);
if (!res.ok) throw new Error(`HTTP ${res.status}`);
const data = await res.json();
const list = Array.isArray(data) ? data : (data && data.incidents) || [];
const now = Date.now();
const active = list.some((item) => {
const end = item.end || item.EndDate || item.resolved_at;
return !end || new Date(end).getTime() > now;
});
return active
? { state: 'issue', label: 'Active incident reported (best-effort)' }
: { state: 'operational', label: 'No active incidents (best-effort)' };
}

/**
* checkUptimeRobotPage(service): best-effort parse of an UptimeRobot-hosted
* public status page's internal monitor list API. NOTE: response shape
* assumed from UptimeRobot's known public conventions but not confirmed
* live - verify once hosted.
*/
async function checkUptimeRobotPage(service) {
const res = await fetch(`${service.base}/api/getMonitorList/${service.pageId}?page=1`);
if (!res.ok) throw new Error(`HTTP ${res.status}`);
const data = await res.json();
const monitors = (data && data.psp && data.psp.monitors) || data.monitors || [];
const down = monitors.some((m) => m.status === 9 || m.status === 8);
return down
? { state: 'outage', label: 'Monitor reporting down (best-effort)' }
: { state: 'operational', label: 'Monitors reporting up (best-effort)' };
}

async function checkBetterStack(service) {
const base = service.base.replace(/\/+$/, '');
const res = await fetch(`${base}/index.json`);
if (!res.ok) throw new Error(`HTTP ${res.status}`);
const data = await res.json();
const state = data && data.data && data.data.attributes && data.data.attributes.aggregate_state;
const statusMap = {
operational: 'operational',
degraded: 'issue',
maintenance: 'issue',
partial_outage: 'issue',
major_outage: 'outage',
downtime: 'outage',
};
const label = (data && data.data && data.data.attributes && data.data.attributes.announcement)
  || formatLabel(state)
  || 'Status unavailable';
return { state: statusMap[state] || 'unknown', label };
}

const CHECKERS = {
statuspage: checkStatuspage,
instatus: checkInstatus,
google: checkGoogleWorkspace,
mcgrawhill: checkMcGrawHill,
uptimerobot: checkUptimeRobotPage,
betterstack: checkBetterStack,
};

/**
* checkService(service)
* Runs the appropriate checker (if any) and always resolves - never
* rejects - falling back to an 'unknown' state on any error so a single
* vendor outage/CORS block can't break the rest of the dashboard.
*/
async function checkService(service) {
const checker = CHECKERS[service.type];
if (!checker) {
return { state: service.type === 'none' ? 'none' : 'unknown', label: service.type === 'none' ? 'No public status page' : 'Manual check required' };
}
try {
return await checker(service);
} catch (err) {
console.warn(`Status check failed for ${service.name}:`, err);
return { state: 'unknown', label: 'Unable to verify - view status page' };
}
}

const STATE_ICON = {
  operational: 'fa-solid fa-circle-check',
  issue: 'fa-solid fa-triangle-exclamation',
  outage: 'fa-solid fa-circle-xmark',
  unknown: 'fa-solid fa-circle-question',
  none: 'fa-solid fa-minus',
};

const STATE_ORDER = {
  outage: 0,
  issue: 1,
  operational: 2,
  unknown: 3,
  none: 4,
};

/** getServiceUrl(service): the public status page URL for a service's "View status page" link. */
function getServiceUrl(service) {
  if (service.type === 'uptimerobot' && service.base === 'https://stats.uptimerobot.com') {
    return `${service.base}/${service.pageId}`;
  }
  return service.base;
}

function isAutoUpdated(service) {
  return Boolean(CHECKERS[service.type]);
}

function groupServices(services) {
  const auto = [];
  const manual = [];
  services.forEach((service) => {
    if (isAutoUpdated(service)) {
      auto.push(service);
    } else {
      manual.push(service);
    }
  });
  auto.sort((a, b) => a.name.localeCompare(b.name));
  manual.sort((a, b) => a.name.localeCompare(b.name));
  return { auto, manual };
}

function buildRow(service) {
  const tr = document.createElement('tr');
  tr.className = 'is-service-row is-unknown';
  tr.dataset.serviceName = service.name.toLowerCase();

  const nameCell = document.createElement('td');
  nameCell.className = 'is-name-cell';
  nameCell.textContent = service.name;
  tr.appendChild(nameCell);

  const statusCell = document.createElement('td');
  statusCell.className = 'is-status-cell';
  statusCell.innerHTML = `<i class="is-icon ${STATE_ICON.unknown}"></i><span class="is-label">Checking...</span>`;
  tr.appendChild(statusCell);

  const updatedCell = document.createElement('td');
  updatedCell.className = 'is-updated-cell';
  tr.appendChild(updatedCell);

  const linkCell = document.createElement('td');
  linkCell.className = 'is-link-cell';
  if (service.base) {
    const link = document.createElement('a');
    link.href = getServiceUrl(service);
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = 'View status page \u2197';
    linkCell.appendChild(link);
  } else {
    linkCell.textContent = '\u2014';
  }
  tr.appendChild(linkCell);

  return tr;
}

function updateRow(row, result) {
  row.className = `is-service-row is-${result.state}`;
  row.dataset.state = result.state;
  const icon = row.querySelector('.is-icon');
  icon.className = `is-icon ${STATE_ICON[result.state] || STATE_ICON.unknown}`;
  row.querySelector('.is-label').textContent = result.label;
  row.querySelector('.is-updated-cell').textContent = `Last checked ${new Date().toLocaleTimeString()}`;
}

let rowsByService = new Map();
let tableBodies = [];

function sortTableBody(tbody) {
  const rows = Array.from(tbody.querySelectorAll('tr'));
  rows.sort((a, b) => {
    const aState = a.dataset.state || 'unknown';
    const bState = b.dataset.state || 'unknown';
    const byState = STATE_ORDER[aState] - STATE_ORDER[bState];
    if (byState !== 0) return byState;
    const aName = a.dataset.serviceName || '';
    const bName = b.dataset.serviceName || '';
    return aName.localeCompare(bName);
  });
  rows.forEach((row) => tbody.appendChild(row));
}

function buildTableSection(title, services) {
  const section = document.createElement('section');
  section.className = 'is-table-section';

  const heading = document.createElement('h2');
  heading.textContent = title;
  section.appendChild(heading);

  const wrap = document.createElement('div');
  wrap.className = 'is-table-wrap';

  const table = document.createElement('table');
  table.className = 'is-table';

  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  headRow.innerHTML = '<th class="is-name-cell">Service</th>'
    + '<th>Status</th>'
    + '<th>Last checked</th>'
    + '<th>Status page</th>';
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  services.forEach((service) => {
    const row = buildRow(service);
    tbody.appendChild(row);
    rowsByService.set(service.name, row);
  });
  table.appendChild(tbody);
  tableBodies.push(tbody);

  wrap.appendChild(table);
  section.appendChild(wrap);
  return section;
}

function refreshAll() {
  const metaEl = document.querySelector('#integration-status .is-meta');
  if (metaEl) metaEl.textContent = `Refreshing... (last full refresh ${new Date().toLocaleTimeString()})`;

  Promise.all(SERVICES.map(async (service) => {
    const result = await checkService(service);
    const row = rowsByService.get(service.name);
    if (row) updateRow(row, result);
  })).then(() => {
    tableBodies.forEach(sortTableBody);
    if (metaEl) metaEl.textContent = `Last refreshed ${new Date().toLocaleTimeString()} \u00b7 auto-refreshes every 5 min`;
  });
}

/** initIntegrationStatus(): builds the page shell and starts polling. */
function initIntegrationStatus() {
  const root = document.getElementById('integration-status');
  root.innerHTML = `
<div class="is-header">
<h1>Canvas 3rd-Party Integration Status</h1>
<div>
<button class="is-refresh-btn" type="button">Refresh now</button>
<div class="is-meta">Loading...</div>
</div>
</div>
<div class="is-table-sections"></div>
`;

  const sections = root.querySelector('.is-table-sections');
  rowsByService = new Map();

  const { auto, manual } = groupServices(SERVICES);
  if (auto.length) sections.appendChild(buildTableSection('Automatically updated services', auto));
  if (manual.length) sections.appendChild(buildTableSection('Manual check required', manual));

  root.querySelector('.is-refresh-btn').addEventListener('click', refreshAll);

  refreshAll();
  setInterval(refreshAll, REFRESH_INTERVAL_MS);
}

initIntegrationStatus();

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
*  - 'google'      : Google Workspace status - GET {base}incidents.json
*  - 'uptimerobot' : UptimeRobot-hosted page - GET {base}/api/getMonitorList/{pageId}
*                    (best-effort: response shape not fully confirmed, verify live)
*  - 'mcgrawhill'  : McGraw Hill's own /data/*.json feed
*                    (best-effort: response shape not fully confirmed, verify live)
*  - 'link'        : No usable public API found; show a "check manually" tile
*  - 'none'        : No status page identified at all; static/no-link tile
*/
const SERVICES = [
{ name: 'TurnItIn', base: 'https://turnitin.statuspage.io', type: 'statuspage' },
{ name: 'Respondus', base: 'https://status.respondus.com', type: 'statuspage' },
{ name: 'Zoom', base: 'https://www.zoomstatus.com', type: 'statuspage' },
{ name: 'Honorlock', base: 'https://status.honorlock.com', type: 'statuspage' },
{
name: 'Qwickly', base: 'https://stats.uptimerobot.com', type: 'uptimerobot',
pageId: 'A72WoHZ7gP',
},
{ name: 'Pearson', base: 'https://status.pearson.com', type: 'link' },
{ name: 'Cengage', base: 'https://techcheck.cengage.com', type: 'link' },
{
name: 'McGraw Hill', base: 'https://status.mcgrawhill.com', type: 'mcgrawhill',
dataPath: '/data/incident_overviews.json',
},
{ name: 'Pressbooks', base: 'https://status.pressbooks.com', type: 'link' },
{ name: 'OpenStax', base: 'https://status.openstax.org', type: 'statuspage' },
{ name: 'Instructure (Canvas)', base: 'https://status.instructure.com', type: 'statuspage' },
{ name: 'Lucid', base: 'https://status.lucid.co', type: 'statuspage' },
{ name: 'ZyBooks', base: 'https://status.zybooks.com', type: 'statuspage' },
{ name: 'CompTIA', base: 'https://status.comptia.net', type: 'link' },
{ name: 'Hypothesis', base: 'https://web.hypothes.is/status/', type: 'link' },
{ name: 'Packback', base: 'https://status.packback.co', type: 'link' },
{ name: 'Harmonize', base: 'https://harmonizelearning.instatus.com', type: 'instatus' },
{ name: 'Google Assignments', base: 'https://www.google.com/appsstatus/dashboard/', type: 'google' },
{
name: 'CidiLabs', base: 'https://status.cidilabs.com', type: 'uptimerobot',
pageId: 'qZQijKKCt2',
},
{ name: 'B&N All Access (First Day Complete)', base: '', type: 'none' },
{ name: 'TopHat', base: '', type: 'none' },
{ name: 'EVOLVE', base: '', type: 'none' },
{ name: 'JB Learning', base: '', type: 'none' },
{ name: 'LaunchPad', base: '', type: 'none' },
{ name: 'Infobase Learning', base: '', type: 'none' },
];

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

const CHECKERS = {
statuspage: checkStatuspage,
instatus: checkInstatus,
google: checkGoogleWorkspace,
mcgrawhill: checkMcGrawHill,
uptimerobot: checkUptimeRobotPage,
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

/** getServiceUrl(service): the public status page URL for a service's "View status page" link. */
function getServiceUrl(service) {
if (service.type === 'uptimerobot' && service.base === 'https://stats.uptimerobot.com') {
return `${service.base}/${service.pageId}`;
}
return service.base;
}

/** buildCard(service): the DOM node for one service tile (initial "checking" state). */
function buildCard(service) {
const card = document.createElement('div');
card.className = 'is-card is-unknown';
card.dataset.service = service.name;

const top = document.createElement('div');
top.className = 'is-card-top';
top.innerHTML = `<i class="is-icon ${STATE_ICON.unknown}"></i><span class="is-name">${service.name}</span>`;
card.appendChild(top);

const label = document.createElement('div');
label.className = 'is-label';
label.textContent = 'Checking...';
card.appendChild(label);

const updated = document.createElement('div');
updated.className = 'is-updated';
card.appendChild(updated);

if (service.base) {
const link = document.createElement('a');
link.className = 'is-link';
link.href = getServiceUrl(service);
link.target = '_blank';
link.rel = 'noopener';
link.textContent = 'View status page \u2197';
card.appendChild(link);
}

if (service.note) {
const note = document.createElement('div');
note.className = 'is-note';
note.textContent = service.note;
card.appendChild(note);
}

return card;
}

/** updateCard(card, result): applies a checked state to an existing card. */
function updateCard(card, result) {
card.className = `is-card is-${result.state}`;
const icon = card.querySelector('.is-icon');
icon.className = `is-icon ${STATE_ICON[result.state] || STATE_ICON.unknown}`;
card.querySelector('.is-label').textContent = result.label;
card.querySelector('.is-updated').textContent = `Last checked ${new Date().toLocaleTimeString()}`;
}

let cardsByService = new Map();

/** refreshAll(): re-checks every service in parallel and updates its tile. */
async function refreshAll() {
const metaEl = document.querySelector('#integration-status .is-meta');
if (metaEl) metaEl.textContent = `Refreshing... (last full refresh ${new Date().toLocaleTimeString()})`;

await Promise.all(SERVICES.map(async (service) => {
const result = await checkService(service);
const card = cardsByService.get(service.name);
if (card) updateCard(card, result);
}));

if (metaEl) metaEl.textContent = `Last refreshed ${new Date().toLocaleTimeString()} \u00b7 auto-refreshes every 5 min`;
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
<div class="is-grid"></div>
`;

const grid = root.querySelector('.is-grid');
cardsByService = new Map();
SERVICES.forEach((service) => {
const card = buildCard(service);
grid.appendChild(card);
cardsByService.set(service.name, card);
});

root.querySelector('.is-refresh-btn').addEventListener('click', refreshAll);

refreshAll();
setInterval(refreshAll, REFRESH_INTERVAL_MS);
}

initIntegrationStatus();

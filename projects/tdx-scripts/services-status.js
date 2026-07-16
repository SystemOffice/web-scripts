/**
 * services-status.js
 * Builds a public-facing IT service status page (modeled on
 * https://virginia.service-now.com/its?id=services_status_info) from two
 * TeamDynamix report Flow endpoints:
 *  - SERVICES_REPORT_URL: the system/service catalog (reportID=251486)
 *  - NOTICES_REPORT_URL: scheduled/unscheduled outage notices (reportID=297780)
 * Both endpoints return { Response: { DataRows: [...] } } JSON.
 */

const SERVICES_REPORT_URL = 'https://us1.teamdynamix.com/tdapp/app/flow/api/v1/startdirect/vccs/prod/tdx-get-report?reportID=297939';
const NOTICES_REPORT_URL = 'https://us1.teamdynamix.com/tdapp/app/flow/api/v1/startdirect/vccs/prod/tdx-get-report?reportID=297780';

/**
 * DISRUPTIVE_OUTAGE_TYPES
 * Values of the notice report's "Outage Type" column (123811) that count as
 * a disruption/outage (rendered red). Every other value ("Scheduled
 * Maintenance", "Service Notice") is treated as an informational notice
 * (rendered blue).
 */
const DISRUPTIVE_OUTAGE_TYPES = new Set(['Service Degradation', 'Unscheduled Outage']);

/** Number of days shown in a service's uptime history bar. */
const UPTIME_BAR_DAYS = 90;

/**
 * fetchReportRows(url)
 * Fetches a TDX "get-report" Flow endpoint and returns its DataRows array.
 * - url: the report Flow endpoint to call.
 * Returns an empty array if the response has no rows.
 */
async function fetchReportRows(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load report (${res.status}): ${url}`);
    const json = await res.json();
    const parsedJSON = typeof json === 'string' ? JSON.parse(json) : json;
    return (parsedJSON.Response && parsedJSON.Response.DataRows) || [];
}

/**
 * escapeHtml(str)
 * Minimal HTML-escaping for plain-text values interpolated into innerHTML
 * templates. Not used for notice Description, which TDX authors as rich
 * HTML and which is rendered as-is.
 */
function escapeHtml(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

/**
 * formatDateTime(value)
 * Formats an ISO date string from a report row into a short local date/time.
 * Returns '' when value is missing.
 */
function formatDateTime(value) {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

/**
 * formatDate(date)
 * Formats a Date as a short local date (no time), e.g. "Apr 12, 2026".
 */
function formatDate(date) {
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * isNoticeActive(notice)
 * A notice is considered active/upcoming unless TDX has marked it Completed.
 */
function isNoticeActive(notice) {
    return notice.StatusTypeName !== 'Completed';
}

/**
 * noticeStartEnd(notice)
 * Reads the datetime start/end off a notice row, preferring the
 * "...and Time" columns (123815/123817) over the date-only fallbacks
 * (StartDate/134250).
 */
function noticeStartEnd(notice) {
    return {
        start: notice['123815'] || notice.StartDate || null,
        end: notice['123817'] || notice['134250'] || null,
    };
}

/**
 * noticeOutageType(notice)
 * Reads the "Outage Type" column (123811), e.g. "Scheduled Maintenance",
 * "Service Notice", "Service Degradation", "Unscheduled Outage".
 */
function noticeOutageType(notice) {
    return notice['123811'] || '';
}

/**
 * isDisruptiveNotice(notice)
 * True for outage-type values that represent an actual disruption/outage
 * (rendered red); false for informational/scheduled notices (rendered blue).
 */
function isDisruptiveNotice(notice) {
    return DISRUPTIVE_OUTAGE_TYPES.has(noticeOutageType(notice));
}

/**
 * noticeAffectsService(notice, serviceName)
 * The outage report's "System" column (151945) is an exact match against
 * the service catalog's Name, so services and notices link directly (no
 * text-matching heuristic needed).
 */
function noticeAffectsService(notice, serviceName) {
    return (notice['151945'] || '') === serviceName;
}

/**
 * serviceVendorStatusUrl(service)
 * Reads the service catalog's "Vendor Status URL" column (157626): the base
 * URL of a vendor-hosted Statuspage.io page, or '' when the service has none.
 */
function serviceVendorStatusUrl(service) {
    return (service['157626'] || '').trim().replace(/\/+$/, '');
}

/**
 * vendorIncidentsCache
 * Memoizes in-flight/completed vendor incident fetches by URL so the day
 * cells and the expanded detail panel share a single request per service.
 */
const vendorIncidentsCache = new Map();

/**
 * getVendorIncidents(url)
 * Fetches (and caches) a vendor's public Statuspage.io incident feed
 * (`{url}/api/v2/incidents.json`), returning its incidents array.
 */
function getVendorIncidents(url) {
    if (!vendorIncidentsCache.has(url)) {
        vendorIncidentsCache.set(url, fetch(`${url}/api/v2/incidents.json`)
            .then((res) => {
                if (!res.ok) throw new Error(`Vendor status request failed (${res.status})`);
                return res.json();
            })
            .then((data) => (data && data.incidents) || []));
    }
    return vendorIncidentsCache.get(url);
}

/**
 * vendorStatusLabel(status)
 * Formats a Statuspage.io incident "status" value (e.g. "in_progress") into
 * a readable label (e.g. "In Progress").
 */
function vendorStatusLabel(status) {
    return String(status || '')
        .split('_')
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ') || 'Unknown';
}

/**
 * vendorImpactStatus(impact)
 * Maps a Statuspage.io incident "impact" value onto this page's disruption/
 * notice vocabulary: major or critical impact is a disruption (red), minor
 * impact is a notice (blue), none (or unrecognized) is normal (green).
 */
function vendorImpactStatus(impact) {
    return {
        disruptive: impact === 'major' || impact === 'critical',
        noticeOnly: impact === 'minor',
    };
}

/**
 * vendorImpactPillClass(impact)
 * Maps a Statuspage.io incident "impact" value to a pill color via
 * vendorImpactStatus().
 */
function vendorImpactPillClass(impact) {
    const status = vendorImpactStatus(impact);
    return status.disruptive ? 'sts-pill-red' : status.noticeOnly ? 'sts-pill-blue' : 'sts-pill-green';
}

/**
 * buildVendorIncidentSummary(incident)
 * Renders a single Statuspage.io incident as a compact summary: a
 * disruption/notice/normal icon and pill (by impact), name linked to the
 * vendor's own incident page, and its date window. Update-by-update detail
 * is intentionally left out; the link covers that.
 */
function buildVendorIncidentSummary(incident) {
    const item = document.createElement('div');
    item.className = 'sts-vendor-incident';
    const status = vendorImpactStatus(incident.impact);
    const iconClass = status.disruptive ? 'sts-dot-red fa-exclamation-circle' : status.noticeOnly ? 'sts-dot-blue fa-info-circle' : 'sts-dot-green fa-circle-check';
    const start = incident.started_at || incident.created_at;
    const end = incident.resolved_at || '';
    item.innerHTML = `
        <div class="sts-vendor-incident-head">
            <i class="fa fa-circle ${iconClass}"></i>
            <span class="sts-pill ${vendorImpactPillClass(incident.impact)}">${escapeHtml(vendorStatusLabel(incident.status))}</span>
            <a class="sts-vendor-incident-title" href="${escapeHtml(incident.shortlink || '#')}" target="_blank" rel="noopener noreferrer">${escapeHtml(incident.name)}</a>
        </div>
        <p class="sts-vendor-incident-window">${escapeHtml(formatDateTime(start))}${end ? ` &ndash; ${escapeHtml(formatDateTime(end))}` : ''}</p>
    `;
    return item;
}

/**
 * isVendorIncidentActive(incident)
 * A vendor incident is active unless the vendor has marked it resolved
 * (incidents) or completed (scheduled maintenances).
 */
function isVendorIncidentActive(incident) {
    return incident.status !== 'resolved' && incident.status !== 'completed';
}

/**
 * buildActiveVendorNoticeCard(service, incident)
 * Renders an active vendor incident as a top-level notice card, matching
 * buildNoticeCard's layout: impact icon/pill, the service it affects, the
 * latest update's text (escaped as plain text, unlike TDX's rich-HTML
 * Description), and a link to the vendor's own incident page rather than
 * incorporating every update.
 */
function buildActiveVendorNoticeCard(service, incident) {
    const status = vendorImpactStatus(incident.impact);
    const iconClass = status.disruptive ? 'sts-dot-red fa-exclamation-circle' : status.noticeOnly ? 'sts-dot-blue fa-info-circle' : 'sts-dot-green fa-circle-check';
    const start = incident.started_at || incident.created_at;
    const latestUpdate = (incident.incident_updates && incident.incident_updates[0] && incident.incident_updates[0].body) || '';
    const card = document.createElement('div');
    card.className = 'sts-notice-card';
    card.innerHTML = `
        <div class="sts-notice-head">
            <i class="fa fa-circle ${iconClass}"></i>
            <span class="sts-pill ${vendorImpactPillClass(incident.impact)}">${escapeHtml(vendorStatusLabel(incident.status))}</span>
            <span class="sts-notice-title">${escapeHtml(incident.name)}</span>
        </div>
        <p class="sts-notice-system">${escapeHtml(service.Name)}</p>
        ${latestUpdate ? `<p class="sts-notice-desc">${escapeHtml(latestUpdate)}</p>` : ''}
        <p class="sts-notice-window">${escapeHtml(formatDateTime(start))}</p>
        <a class="sts-vendor-status-link" href="${escapeHtml(incident.shortlink || '#')}" target="_blank" rel="noopener noreferrer">View vendor status details →</a>
    `;
    return card;
}

/**
 * enhanceActiveNoticesWithVendorStatus(noticesSection, services)
 * Asynchronously gathers each vendor-linked service's active incidents
 * (via the shared getVendorIncidents() cache) and, if any are found, adds
 * them to the already-rendered Active Notices section — replacing the
 * "all clear" state if that's what was shown initially.
 */
function enhanceActiveNoticesWithVendorStatus(noticesSection, services) {
    const withUrl = services.filter((s) => serviceVendorStatusUrl(s));
    if (withUrl.length === 0) return;

    Promise.all(withUrl.map((service) => {
        const url = serviceVendorStatusUrl(service);
        return getVendorIncidents(url)
            .then((incidents) => incidents.filter(isVendorIncidentActive).map((incident) => ({ service, incident })))
            .catch((err) => {
                console.warn('Unable to load vendor status for', service.Name, url, err);
                return [];
            });
    })).then((results) => {
        const active = results.flat();
        if (active.length === 0) return;

        if (noticesSection.querySelector('.sts-allclear')) {
            noticesSection.innerHTML = '';
            const h2 = document.createElement('h2');
            h2.textContent = 'Active Notices';
            noticesSection.appendChild(h2);
        }
        active.forEach(({ service, incident }) => noticesSection.appendChild(buildActiveVendorNoticeCard(service, incident)));
    });
}

/**
 * buildVendorStatusSection(service)
 * If the service has a Vendor Status URL, renders a "Vendor Status" panel
 * that asynchronously fetches the vendor's public Statuspage.io incident
 * feed (`{url}/api/v2/incidents.json`) and lists recent incidents as brief
 * summaries linking out to the vendor's own incident page, plus a link to
 * the vendor's full status page. Returns null when the service has no
 * Vendor Status URL.
 */
function buildVendorStatusSection(service) {
    const url = serviceVendorStatusUrl(service);
    if (!url) return null;

    const wrap = document.createElement('div');
    wrap.className = 'sts-vendor-status';

    const heading = document.createElement('h4');
    heading.textContent = 'Vendor Status';
    wrap.appendChild(heading);

    const body = document.createElement('div');
    body.className = 'sts-vendor-status-body';
    body.textContent = 'Loading vendor status…';
    wrap.appendChild(body);

    const link = document.createElement('a');
    link.className = 'sts-vendor-status-link';
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'View full vendor status page →';
    wrap.appendChild(link);

    getVendorIncidents(url)
        .then((incidents) => {
            body.innerHTML = '';
            if (incidents.length === 0) {
                body.textContent = 'No incidents reported.';
                return;
            }
            incidents.slice(0, 5).forEach((incident) => body.appendChild(buildVendorIncidentSummary(incident)));
        })
        .catch((err) => {
            console.warn('Unable to load vendor status for', service.Name, url, err);
            body.textContent = 'Vendor status unavailable right now.';
        });

    return wrap;
}

/**
 * buildNoticeCard(notice)
 * Renders a single notice as a DOM element: its outage-type pill (blue for
 * informational notices, red for disruptions/outages), the system it
 * affects, title, rich-HTML description, and start/end window.
 */
function buildNoticeCard(notice) {
    const { start, end } = noticeStartEnd(notice);
    const disruptive = isDisruptiveNotice(notice);
    const outageType = noticeOutageType(notice);
    const system = notice['151945'] || '';
    const card = document.createElement('div');
    card.className = 'sts-notice-card';
    card.innerHTML = `
        <div class="sts-notice-head">
            <i class="fa fa-circle ${disruptive ? 'sts-dot-red fa-exclamation-circle' : 'sts-dot-blue fa-info-circle'}"></i>
            <span class="sts-pill ${disruptive ? 'sts-pill-red' : 'sts-pill-blue'}">${escapeHtml(outageType || (disruptive ? 'Disruption' : 'Notice'))}</span>
            <span class="sts-notice-title">${escapeHtml(notice.Title)}</span>
        </div>
        ${system ? `<p class="sts-notice-system">${escapeHtml(system)}</p>` : ''}
        ${notice.Description ? `<div class="sts-notice-desc">${notice.Description}</div>` : ''}
        <p class="sts-notice-window">${escapeHtml(formatDateTime(start))} &ndash; ${escapeHtml(formatDateTime(end))}</p>
    `;
    return card;
}

/**
 * getLastNDays(n)
 * Returns the last n calendar days (oldest first, today last) as
 * { date, start, end, isToday } objects, where start/end are the local
 * day's bounds.
 */
function getLastNDays(n) {
    const days = [];
    for (let i = n - 1; i >= 0; i--) {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        start.setDate(start.getDate() - i);
        const end = new Date(start);
        end.setHours(23, 59, 59, 999);
        days.push({ date: start, start, end, isToday: i === 0 });
    }
    return days;
}

/**
 * formatDayLabel(date, isToday)
 * Formats a day column header: "Today" for the current day, otherwise a
 * short weekday + date (e.g. "Mon 7/14").
 */
function formatDayLabel(date, isToday) {
    if (isToday) return 'Today';
    return date.toLocaleDateString(undefined, { weekday: 'short', month: 'numeric', day: 'numeric' });
}

/**
 * noticeOverlapsDay(notice, dayStart, dayEnd)
 * True if a notice's start/end window overlaps the given day bounds. A
 * missing end is treated as still-ongoing; a notice with neither date never
 * overlaps.
 */
function noticeOverlapsDay(notice, dayStart, dayEnd) {
    const { start, end } = noticeStartEnd(notice);
    if (!start && !end) return false;
    const s = start ? new Date(start) : null;
    const e = end ? new Date(end) : null;
    if (s && s > dayEnd) return false;
    if (e && e < dayStart) return false;
    return true;
}

/**
 * serviceDayStatus(service, notices, dayStart, dayEnd)
 * Determines a service's status on a given day: disruptive (red) if any
 * linked notice that overlaps the day is a disruption/outage, notice-only
 * (blue) if only informational notices overlap, otherwise normal (green).
 */
function serviceDayStatus(service, notices, dayStart, dayEnd) {
    const affecting = notices.filter((n) => noticeAffectsService(n, service.Name) && noticeOverlapsDay(n, dayStart, dayEnd));
    const disruptive = affecting.some(isDisruptiveNotice);
    return {
        affecting,
        disruptive,
        noticeOnly: affecting.length > 0 && !disruptive,
    };
}

/**
 * vendorIncidentOverlapsDay(incident, dayStart, dayEnd)
 * True if a vendor incident's started_at/resolved_at window overlaps the
 * given day bounds. A missing resolved_at is treated as still-ongoing.
 */
function vendorIncidentOverlapsDay(incident, dayStart, dayEnd) {
    const start = incident.started_at || incident.created_at;
    if (!start) return false;
    const s = new Date(start);
    const e = incident.resolved_at ? new Date(incident.resolved_at) : null;
    if (s > dayEnd) return false;
    if (e && e < dayStart) return false;
    return true;
}

/**
 * vendorDayStatus(vendorIncidents, dayStart, dayEnd)
 * Determines the vendor-incident status on a given day, using the same
 * disruptive/notice-only vocabulary as serviceDayStatus (mapped from
 * incident impact via vendorImpactStatus()).
 */
function vendorDayStatus(vendorIncidents, dayStart, dayEnd) {
    const affecting = vendorIncidents.filter((i) => vendorIncidentOverlapsDay(i, dayStart, dayEnd));
    const flags = affecting.map((i) => vendorImpactStatus(i.impact));
    const disruptive = flags.some((f) => f.disruptive);
    return {
        vendorIncidents: affecting,
        disruptive,
        noticeOnly: !disruptive && flags.some((f) => f.noticeOnly),
    };
}

/**
 * combineDayStatus(statuses)
 * Combines several day-status objects (e.g. TDX notices + vendor incidents)
 * into one: disruptive wins over notice-only wins over normal. Keeps the
 * TDX notice list and vendor incident list separately for tooltip text.
 */
function combineDayStatus(statuses) {
    const disruptive = statuses.some((s) => s.disruptive);
    const noticeOnly = !disruptive && statuses.some((s) => s.noticeOnly);
    return {
        affecting: statuses.flatMap((s) => s.affecting || []),
        vendorIncidents: statuses.flatMap((s) => s.vendorIncidents || []),
        disruptive,
        noticeOnly,
    };
}

/**
 * dayCellTitle(status)
 * Builds a day cell's tooltip text from its TDX notice titles and any
 * merged vendor incident names, falling back to "Available".
 */
function dayCellTitle(status) {
    const parts = [
        ...(status.affecting || []).map((n) => n.Title).filter(Boolean),
        ...(status.vendorIncidents || []).map((i) => i.name).filter(Boolean),
    ];
    return parts.join(', ') || 'Available';
}

/**
 * dayStatusClass(status, includeIcon)
 * Maps a serviceDayStatus() result to its status-dot modifier class.
 */
function dayStatusClass(status, includeIcon = false) {
    const baseClass = status.disruptive ? 'sts-dot-red' : status.noticeOnly ? 'sts-dot-blue' : 'sts-dot-green';
    if (!includeIcon) return baseClass;

    const iconClass = status.disruptive
        ? 'fa fa-exclamation-circle'
        : status.noticeOnly
            ? 'fa fa-info-circle'
            : 'fa fa-circle-check';

    return `${baseClass} ${iconClass}`;
}

/**
 * renderUptimeSegment(seg, status, date)
 * Fills a single uptime-bar day segment with its status color and tooltip,
 * from a serviceDayStatus()/combineDayStatus() result.
 */
function renderUptimeSegment(seg, status, date) {
    seg.className = `sts-uptime-seg ${dayStatusClass(status)}`;
    const state = status.disruptive ? 'Disruption/outage' : status.noticeOnly ? 'Service notice' : 'Normal';
    seg.title = `${formatDate(date)}: ${state}`;
}

/**
 * buildUptimeBar(service, notices)
 * Renders a horizontal, day-by-day history bar for the last
 * UPTIME_BAR_DAYS days: green segments for normal operation, blue for
 * informational notices, red for disruptions/outages. Segments are drawn
 * immediately from TDX notices, then re-rendered once with vendor incidents
 * merged in, if the service has a Vendor Status URL.
 */
function buildUptimeBar(service, notices) {
    const days = getLastNDays(UPTIME_BAR_DAYS);

    const wrap = document.createElement('div');
    wrap.className = 'sts-uptime';

    const label = document.createElement('div');
    label.className = 'sts-uptime-label';
    label.textContent = `${UPTIME_BAR_DAYS}-day history`;
    wrap.appendChild(label);

    const bar = document.createElement('div');
    bar.className = 'sts-uptime-bar';
    const segments = days.map(({ date, start, end }) => {
        const status = serviceDayStatus(service, notices, start, end);
        const seg = document.createElement('span');
        renderUptimeSegment(seg, status, date);
        bar.appendChild(seg);
        return { seg, date, start, end };
    });
    wrap.appendChild(bar);

    const vendorUrl = serviceVendorStatusUrl(service);
    if (vendorUrl) {
        getVendorIncidents(vendorUrl)
            .then((vendorIncidents) => {
                segments.forEach(({ seg, date, start, end }) => {
                    const base = serviceDayStatus(service, notices, start, end);
                    const vendor = vendorDayStatus(vendorIncidents, start, end);
                    renderUptimeSegment(seg, combineDayStatus([base, vendor]), date);
                });
            })
            .catch((err) => {
                console.warn('Unable to merge vendor status into uptime bar for', service.Name, err);
            });
    }

    const range = document.createElement('div');
    range.className = 'sts-uptime-range';
    range.innerHTML = `<span>${escapeHtml(formatDate(days[0].date))}</span><span>Today</span>`;
    wrap.appendChild(range);

    const legend = document.createElement('div');
    legend.className = 'sts-uptime-legend';
    legend.innerHTML = `
        <span class="sts-legend-item"><span class="sts-dot sts-dot-green fa fa-circle fa-check-circle fa-circle-check"></span>Normal</span>
        <span class="sts-legend-item"><span class="sts-dot sts-dot-blue fa fa-info-circle fa-circle-info"></span>Service notice</span>
        <span class="sts-legend-item"><span class="sts-dot sts-dot-red fa fa-exclamation-circle fa-circle-exclamation"></span>Disruption / outage</span>
    `;
    wrap.appendChild(legend);

    return wrap;
}

/**
 * buildHistoryList(service, notices)
 * Renders every notice linked to a service (newest first) as notice cards.
 */
function buildHistoryList(service, notices) {
    const relevant = notices
        .filter((n) => noticeAffectsService(n, service.Name))
        .sort((a, b) => new Date(noticeStartEnd(b).start || 0) - new Date(noticeStartEnd(a).start || 0));

    const wrap = document.createElement('div');
    wrap.className = 'sts-history';

    const heading = document.createElement('h4');
    heading.textContent = 'Notice History';
    wrap.appendChild(heading);

    if (relevant.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'sts-history-empty';
        empty.textContent = 'No notices on record for this service.';
        wrap.appendChild(empty);
        return wrap;
    }

    relevant.forEach((n) => wrap.appendChild(buildNoticeCard(n)));
    return wrap;
}

/**
 * buildServiceDetail(service, notices)
 * Renders the expanded detail panel for a service: its uptime bar, an
 * optional vendor status summary (when a Vendor Status URL is set), and its
 * full notice history.
 */
function buildServiceDetail(service, notices) {
    const wrap = document.createElement('div');
    wrap.className = 'sts-detail';
    wrap.appendChild(buildUptimeBar(service, notices));
    const vendorSection = buildVendorStatusSection(service);
    if (vendorSection) wrap.appendChild(vendorSection);
    wrap.appendChild(buildHistoryList(service, notices));
    return wrap;
}

/**
 * renderDayCell(td, status)
 * Fills a day cell with its status dot/icon and tooltip, from a
 * serviceDayStatus()/combineDayStatus() result.
 */
function renderDayCell(td, status) {
    td.innerHTML = `<span class="sts-dot ${dayStatusClass(status, true)}" title="${escapeHtml(dayCellTitle(status))}"></span>`;
}

/**
 * buildServiceRow(service, days, notices)
 * Builds a clickable service row (with one status-dot cell per day) and its
 * paired, initially-hidden detail row. Clicking or activating the service
 * row toggles the detail row, lazily building its content (uptime bar +
 * notice history) on first expand. Day cells are rendered immediately from
 * TDX notices, then re-rendered once with vendor incidents merged in, if
 * the service has a Vendor Status URL. Returns [row, detailRow].
 */
function buildServiceRow(service, days, notices) {
    const tr = document.createElement('tr');
    tr.className = 'sts-service-row';
    tr.tabIndex = 0;
    tr.setAttribute('role', 'button');
    tr.setAttribute('aria-expanded', 'false');
    tr.dataset.serviceName = service.Name.toLowerCase();

    const nameCell = document.createElement('td');
    nameCell.className = 'sts-service-name-cell';
    nameCell.innerHTML = '<span class="sts-row-caret" aria-hidden="true"></span>';
    nameCell.appendChild(document.createTextNode(service.Name));
    tr.appendChild(nameCell);

    const dayCells = days.map(({ start, end }) => {
        const status = serviceDayStatus(service, notices, start, end);
        const td = document.createElement('td');
        td.className = 'sts-day-cell';
        renderDayCell(td, status);
        tr.appendChild(td);
        return { td, start, end };
    });

    const vendorUrl = serviceVendorStatusUrl(service);
    if (vendorUrl) {
        getVendorIncidents(vendorUrl)
            .then((vendorIncidents) => {
                dayCells.forEach(({ td, start, end }) => {
                    const base = serviceDayStatus(service, notices, start, end);
                    const vendor = vendorDayStatus(vendorIncidents, start, end);
                    renderDayCell(td, combineDayStatus([base, vendor]));
                });
            })
            .catch((err) => {
                console.warn('Unable to merge vendor status into day cells for', service.Name, err);
            });
    }

    const detailTr = document.createElement('tr');
    detailTr.className = 'sts-detail-row';
    detailTr.hidden = true;
    const detailTd = document.createElement('td');
    detailTd.className = 'sts-detail-cell';
    detailTd.colSpan = days.length + 1;
    detailTr.appendChild(detailTd);

    let built = false;
    const toggle = () => {
        const isOpen = !detailTr.hidden;
        if (isOpen) {
            detailTr.hidden = true;
            tr.setAttribute('aria-expanded', 'false');
            return;
        }
        if (!built) {
            detailTd.appendChild(buildServiceDetail(service, notices));
            built = true;
        }
        detailTr.hidden = false;
        tr.setAttribute('aria-expanded', 'true');
    };
    tr.addEventListener('click', toggle);
    tr.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggle();
        }
    });

    return [tr, detailTr];
}

/**
 * buildServiceTable(services, notices, days)
 * Renders the full, alphabetically-sorted service list as a table with one
 * status-dot column per day in `days`; each row expands into its own
 * history/uptime detail panel when clicked.
 */
function buildServiceTable(services, notices, days) {
    const tableWrap = document.createElement('div');
    tableWrap.className = 'sts-table-wrap';

    const table = document.createElement('table');
    table.className = 'sts-table';

    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    headRow.innerHTML = '<th class="sts-service-name-cell">Service</th>'
        + days.map(({ date, isToday }) => `<th class="sts-day-cell">${escapeHtml(formatDayLabel(date, isToday))}</th>`).join('');
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    services
        .slice()
        .sort((a, b) => a.Name.localeCompare(b.Name))
        .forEach((svc) => {
            const [row, detailRow] = buildServiceRow(svc, days, notices);
            tbody.appendChild(row);
            tbody.appendChild(detailRow);
        });
    table.appendChild(tbody);

    tableWrap.appendChild(table);
    return tableWrap;
}

/**
 * buildServiceSearch(tableWrap)
 * Renders a text input that filters the given service table's rows by name
 * as the user types. Filtered-out rows are hidden (and force-collapsed if
 * their detail panel was open); shows a message when nothing matches.
 */
function buildServiceSearch(tableWrap) {
    const wrap = document.createElement('div');
    wrap.className = 'sts-search';

    const input = document.createElement('input');
    input.type = 'search';
    input.className = 'sts-search-input';
    input.placeholder = 'Filter services by name…';
    input.setAttribute('aria-label', 'Filter services by name');
    wrap.appendChild(input);

    const empty = document.createElement('p');
    empty.className = 'sts-search-empty';
    empty.textContent = 'No services match your search.';
    empty.hidden = true;
    wrap.appendChild(empty);

    const rows = Array.from(tableWrap.querySelectorAll('.sts-service-row'));

    input.addEventListener('input', () => {
        const query = input.value.trim().toLowerCase();
        let visibleCount = 0;
        rows.forEach((row) => {
            const match = !query || row.dataset.serviceName.includes(query);
            row.hidden = !match;
            if (!match) {
                const detailRow = row.nextElementSibling;
                if (detailRow) detailRow.hidden = true;
                row.setAttribute('aria-expanded', 'false');
            }
            if (match) visibleCount += 1;
        });
        empty.hidden = visibleCount !== 0;
    });

    return wrap;
}

/**
 * getStatusContainer()
 * Finds the '#tdx-services-status' element to render into, creating and
 * appending one to <body> if it isn't already present on the page.
 */
function getStatusContainer() {
    let container = document.getElementById('tdx-services-status');
    if (!container) {
        container = document.createElement('div');
        container.id = 'tdx-services-status';
        document.body.appendChild(container);
    }
    return container;
}

/**
 * renderStatusPage(services, notices, options)
 * Renders the full status page: an active-notices section followed by the
 * complete, alphabetical service list.
 * - options.preview: when true, shows a banner noting that sample data is
 *   being displayed instead of live TDX data (see IS_TDX_ORIGIN below).
 */
function renderStatusPage(services, notices, options = {}) {
    const container = getStatusContainer();
    container.innerHTML = '';

    const activeNotices = notices
        .filter(isNoticeActive)
        .sort((a, b) => new Date(noticeStartEnd(a).start || 0) - new Date(noticeStartEnd(b).start || 0));

    const header = document.createElement('div');
    header.className = 'sts-header';
    header.innerHTML = `
        <h1>IT Services Status</h1>
        <p class="sts-updated">Updated ${escapeHtml(new Date().toLocaleString())}</p>
        ${options.preview ? '<p class="sts-preview-banner">Preview mode &mdash; showing sample data. Live TDX data only loads when this page is hosted on a teamdynamix.com domain (the report API\'s CORS policy blocks other origins).</p>' : ''}
    `;
    container.appendChild(header);

    const noticesSection = document.createElement('section');
    noticesSection.className = 'sts-notices';
    if (activeNotices.length === 0) {
        noticesSection.innerHTML = '<div class="sts-allclear"><span class="sts-dot sts-dot-green fa fa-check-circle fa-circle-check"></span> All services are operating normally.</div>';
    } else {
        const h2 = document.createElement('h2');
        h2.textContent = 'Active Notices';
        noticesSection.appendChild(h2);
        activeNotices.forEach((n) => noticesSection.appendChild(buildNoticeCard(n)));
    }
    container.appendChild(noticesSection);
    enhanceActiveNoticesWithVendorStatus(noticesSection, services);

    const catSection = document.createElement('section');
    catSection.className = 'sts-services';
    const catHeading = document.createElement('h2');
    catHeading.textContent = 'All Services';
    catSection.appendChild(catHeading);
    const hint = document.createElement('p');
    hint.className = 'sts-services-hint';
    hint.textContent = 'Click a service to see its notice history and uptime.';
    catSection.appendChild(hint);

    const days = getLastNDays(5);
    const table = buildServiceTable(services, notices, days);
    catSection.appendChild(buildServiceSearch(table));
    catSection.appendChild(table);
    container.appendChild(catSection);
}

/**
 * renderError(message)
 * Renders a plain error message into the status container when either
 * report fails to load.
 */
function renderError(message) {
    const container = getStatusContainer();
    container.innerHTML = `<div class="sts-error">${escapeHtml(message)}</div>`;
}

/**
 * addCss()
 * Adds a CSS link for services-status.css using the current script's base URL.
 */
function addCss() {
    const link = document.createElement('link');
    const baseURL = document.currentScript.src.split('/').slice(0, -1).join('/') + '/';
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('href', baseURL + 'services-status.css');
    link.setAttribute('type', 'text/css');
    document.head.appendChild(link);
}

/**
 * IS_TDX_ORIGIN
 * The report endpoints only send Access-Control-Allow-Origin for
 * *.teamdynamix.com, so a live fetch will always fail with a CORS error when
 * this page is hosted anywhere else (localhost, GitHub Pages, etc.).
 */
const IS_TDX_ORIGIN = /(^|\.)teamdynamix\.com$/i.test(location.hostname);

/**
 * Sample data shown when previewing this page outside teamdynamix.com, so
 * layout/behavior can be checked locally without a live, CORS-permitted
 * fetch. Mirrors the real report schema with placeholder service/notice
 * names.
 */
const SAMPLE_SERVICES = [
    { ID: 1, Name: 'Canvas', '157626': 'https://status.instructure.com' },
    { ID: 2, Name: 'Zoom' },
    { ID: 3, Name: 'myVCCS Portal' },
    { ID: 4, Name: 'Multi-Factor Authentication' },
    { ID: 5, Name: 'Campus Wifi' },
];
const SAMPLE_NOTICES = [
    {
        '123815': '2026-07-20T06:00:00', '123817': '2026-07-20T18:00:00',
        '151945': 'Canvas', '123811': 'Scheduled Maintenance',
        Description: '<p>Canvas will be unavailable during <strong>scheduled maintenance</strong>.</p>',
        Title: 'Canvas Scheduled Maintenance', TicketID: 1001,
        StatusTypeName: 'New',
    },
    {
        '123815': '2026-07-12T08:00:00', '123817': '2026-07-12T11:30:00',
        '151945': 'myVCCS Portal', '123811': 'Service Degradation',
        Description: '<p>Intermittent login failures were reported for the myVCCS Portal.</p>',
        Title: 'myVCCS Portal Login Issues', TicketID: 1000,
        StatusTypeName: 'Completed',
    },
    {
        '123815': '2026-06-02T09:00:00', '123817': '2026-06-02T09:45:00',
        '151945': 'Campus Wifi', '123811': 'Service Notice',
        Description: '<p>Brief wifi authentication delay while a config change rolled out.</p>',
        Title: 'Campus Wifi Auth Delay', TicketID: 998,
        StatusTypeName: 'Completed',
    },
];

/**
 * initServicesStatus()
 * Loads both TDX reports in parallel and renders the status page. Outside
 * a teamdynamix.com origin, falls back to sample data with a preview
 * banner instead of surfacing the expected CORS failure as an error.
 */
async function initServicesStatus() {
    try {
        const [services, notices] = await Promise.all([
            fetchReportRows(SERVICES_REPORT_URL),
            fetchReportRows(NOTICES_REPORT_URL),
        ]);
        renderStatusPage(services, notices);
    } catch (err) {
        if (!IS_TDX_ORIGIN) {
            console.warn('Live TDX reports are unreachable from this origin (expected outside teamdynamix.com). Showing sample data for local preview.', err);
            renderStatusPage(SAMPLE_SERVICES, SAMPLE_NOTICES, { preview: true });
            return;
        }
        console.error(err);
        renderError('Unable to load service status information right now. Please try again later.');
    }
}

addCss();
initServicesStatus();

# gideontaylor-chatbot-wip

A self-hosted, optimized mirror of the Gideon Taylor / IDA chatbot
(`chatui.ida.gideontaylor.com`) used on vpcc.edu, built to fix four mobile
performance problems a Lighthouse audit found:

1. **Blocks the critical path.** The chatbot's hook script loads
   synchronously in `<head>` on some page templates (e.g. `/admissions/apply/`),
   triggering a chain of 4 render-blocking CSS files. On the homepage a
   hand-written deferred loader already prevents this — but it isn't applied
   consistently across templates.
2. **A 135 KiB config file re-downloads on almost every visit** because the
   vendor serves it with `Cache-Control: max-age=60` (1 minute).
3. **The vendor's own hand-authored JS/CSS ships unminified.**
4. **The welcome-bubble greeting animates `width`**, which forces a layout
   recalculation on every frame instead of running on the GPU.

This project mirrors the chatbot's full asset chain into `vendor/`, builds
an optimized copy into `dist/` (minified, with the animation patched to use
`transform`/`opacity`), and ships `dist/` via jsDelivr — which also solves
problem #2 for free, since jsDelivr caches a pinned git tag far longer than
1 minute. `loader-snippet.html` is what actually solves problem #1: the
exact deferred-loading snippet to embed on every page template.

## How the pieces fit together

```
vendor/          Pristine, untouched mirror of the vendor's current files.
                  This is the diffing baseline for check-updates.mjs — never
                  hand-edit these.
patches/          Small, targeted patches applied during build (currently
                  just the welcome-bubble animation fix). Each patch matches
                  an exact verbatim snippet of vendor CSS/JS and throws if
                  that snippet isn't found — see "When the vendor changes
                  something" below.
scripts/          Build tooling (see Commands).
dist/             Build output. This is what actually gets served via
                  jsDelivr once released — see Releasing below.
loader-snippet.html   The <script> block to embed on every VPCC page
                  template, replacing whatever currently loads the chatbot.
```

### Why the vendor's own file layout has to be preserved

`IS_CV_PUBLIC_HOOK.js` figures out where to load the rest of the chain from
by reading its own `<script>` tag's `src` (`document.currentScript.src`),
stripping the filename, and requesting every other file relative to that
same directory — `${path}scripts/${name}.js` for JS (except
`IS_CV_ENV_CONFIG.js`, which lives at `${path}${name}.js`), and
`${path}styles/${name}.css` for CSS. That's why `vendor/` and `dist/` both
mirror the vendor's exact `scripts/`/`styles/` structure: change that
layout and the hook script will 404 trying to load its own dependencies.

## Commands

```sh
npm run fetch-vendor   # (re-)download every vendor file into vendor/, write vendor/manifest.json
npm run check-updates  # compare the live vendor files against vendor/manifest.json without touching vendor/
npm run build          # minify vendor/ (+ apply the animation patch) into dist/
```

## When the vendor changes something

`npm run check-updates` fetches the live files fresh and reports:

- **Content drift** — any file's bytes no longer match what's in
  `vendor/manifest.json`.
- **Structural drift** — `IS_CV_PUBLIC_HOOK.js`'s own `jsIncludes`/
  `cssIncludes` config now lists a different set of files than this project
  expects (i.e. the vendor added or removed a file from the chain), or the
  hardcoded call that loads `IS_IDA_DRAGGABLE.css` (which isn't in
  `cssIncludes` — see `scripts/vendor-files.mjs`) has disappeared or changed.

If it reports changes:

1. Review what changed (the script prints byte-size deltas and list diffs).
2. `npm run fetch-vendor` to pull the new files into `vendor/`.
3. `npm run build`. If `styles/IS_CV_OB_STYLES_SDK.css` changed, this will
   likely throw from `patches/welcome-bubble-animation.mjs` — that's by
   design, not a bug. It means the exact CSS the animation patch targets
   has changed upstream, so the patch's `from`/`to` snippets in that file
   need to be updated to match the new CSS before the build will pass again.
   Don't work around this by skipping the patch; a build that silently drops
   the animation fix defeats half the point of this project.
4. Spot check `dist/` (sizes look reasonable, `node --check` on the JS
   files, brace-balance on the CSS) before releasing.

## Releasing

1. **Remove `CLAUDE.md` before releasing** — the release script only
   excludes `.git`, so anything else present gets copied into the public
   `web-scripts` repo. `CLAUDE.md` is dev-only guidance and shouldn't ship;
   restore it immediately after.
2. Run the normal repo release flow:
   `python scripts/cli.py release gideontaylor-chatbot-wip --create-pr`.
3. **Tag a release in the production repo after merging**, and re-point
   `loader-snippet.html`'s `{{VERSION}}` at that tag (e.g. `v1.0.1`), then
   update the live embed on vpcc.edu to match.

This matters because jsDelivr only gives long, reliable caching to a pinned
tag or commit SHA — pointing at `@main` would put us right back into a
short-cache situation for anyone who visits between releases, which is
exactly the problem fix #2 exists to solve. Bump the tag on every release
that touches `dist/`, even a small one.

## Embedding on vpcc.edu

Replace whatever currently loads the chatbot on **every** page template
(not just the homepage) with `loader-snippet.html`'s contents, with
`{{VERSION}}` filled in. See the comments in that file for what's preserved
from the existing homepage loader and what's deliberately different.

## Known risk to verify before shipping

The welcome-bubble animation patch (`patches/welcome-bubble-animation.mjs`)
was built from careful static analysis of the vendor's CSS/JS — the DOM
structure, the `overflow: hidden` clipping, the exact show/hide widths at
each breakpoint, and the fact the bubble's only child is the greeting text
(the persistent chat icon is a separate Oracle SDK element, unaffected by
this animation) are all confirmed by reading the vendor's actual source.

One thing is *not* independently verified: `transform-origin: right center`,
chosen because the bubble is `float: right`. If that's wrong, the bubble
would visually grow/shrink from the wrong edge. **Look at the welcome
bubble on a staging page (across both desktop and the ≤767px breakpoint)
before this goes live**, and flip `transform-origin` (and swap which edge
each breakpoint's rule anchors from) if it grows from the wrong side.

## Vendor reports referenced in this project's design

The performance audit this project addresses was based on Google Lighthouse
mobile runs against five vpcc.edu pages (homepage, Workforce Programs,
Apply, Admissions, Programs of Study). The chatbot's ~811 KiB fixed
per-page cost, its position as the largest single source of unused
JavaScript on the Apply and Programs of Study pages, and its 9–32% share of
each page's Total Blocking Time all came from that audit; the specific
mechanics described above (cache headers, file sizes, DOM/CSS structure)
were independently confirmed against the live vendor files while building
this project.

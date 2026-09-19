# tdx-scripts-wip

`tdx.js` adds customizations to the TDX Client Portal. It can be included by using a javascript include on the footer of the client portal.
- Parse query string to prefill form elements
- Add css
- Run markdown
- Change searchbox placeholder
- Move details on the right down
- Check images for alt tags
- Copy table column to clipboard
- Sort table
- Collapsible panels
- Bootstrap tabs
- Insert chatbot
- Move buttons when mobile
- Add footer for next refresh date on sandbox
- Add related kb articles above submit button
- Form input validation, e.g. type=email, pattern=^[0-9]{7}$
- HTML element attribute updates - e.g. disabled
- Hide non-approved articles by default when searching
- Article table of contents
- Do not show attachments box if there are none (pure CSS)
- Hide elements from non-technicians within article (pure CSS)

`tdNext.js` adds customization to the TDX Work Management interface. It can be included by using a javascript include in a TDNext HTML module.
- Add "Add to my work" button to tickets and tasks
- Add "Client View" button to tickets
- Collapse Ticket Details
- form input validation, e.g. type=email, pattern=^[0-9]{7}$
- HTML element attribute updates - e.g. disabled
<img width="818" height="185" alt="634946015-d47c04e6-fce0-4e20-b562-283e13fa436f" src="https://github.com/user-attachments/assets/1cfb529d-88b7-4412-b6f1-3a0545228192" />

`services-status.html` demonstrates integrating our own outage notices via an iPaaS report with vendor statuses pulled from their status pages

`integration-status.html` is something similar for key integrations but purely polling vendor status pages

## Testing
Outside of local testing, we can use GitHub Pages urls for validation in advance of the jsDelivr cache being either automatically updated, or via their Purge tool.

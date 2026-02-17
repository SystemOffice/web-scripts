// Lightweight link widget — opens a URL in a new tab, no SDK or lifecycle

export class LinkWidget {
  constructor({ displayName, url, order }) {
    this.displayName = displayName;
    this.url = url;
    this.id = 'link-' + displayName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    this.config = { order };
  }

  open() {
    window.open(this.url, '_blank', 'noopener');
  }
}

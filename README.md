# Ryan J. Chuang, MD, MPhil

Static website for [ryanchuangmd.com](https://ryanchuangmd.com), hosted on GitHub Pages. No WordPress, package install, API credentials, or build step is needed.

## Editing and preview

Edit the HTML directly. All pages use `assets/stylesheets/site.css` and the deferred `assets/site.js`. Keep the header and footer consistent. Navigation intentionally contains only **About** and **Education**, with a single **Schedule Appointment** link at the top right. The footer retains the original SVG profile icons and Terms of Use link.

The homepage splash contains only the name, credentials, and specialization. The blurb below is the original single-line introduction. Avoid adding marketing copy, office descriptions, or repeated appointment links.

From the repository root:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Open `http://127.0.0.1:8000/`. Serve over HTTP rather than double-clicking files: internal links and assets are relative to the site root. Analytics never loads on localhost.

```sh
python3 scripts/check_site.py
node --check assets/site.js
node --test tests/analytics.test.cjs
git diff --check
```

Content, navigation links, and maps remain available without JavaScript. JavaScript adds the original scrolling-header behavior, an accessible mobile menu, publication search/expansion, and automatic analytics. The HTML list in `education/index.html` is the only publication data source; all 30 publications remain readable without JavaScript.

## Maps

Both Google Maps embeds load automatically, in this order:

1. 196 East Main Street, Patchogue, NY 11772.
2. 228-02 Merrick Boulevard, Laurelton, NY 11413.

There are no additional location cards, map-loading buttons, or appointment links beneath the splash. Google supplies the address and directions controls inside each embed. Google labels the Laurelton address as Jamaica; its street number and pin are correct.

The old Maps JavaScript API returned `BillingNotEnabledMapError`. The current embeds use URLs copied from **Google Maps → Share → Embed a map**, with no Cloud API key or billing account. This differs from the developer `/maps/embed/v1/` API. Google's attribution and controls remain intact.

To change a map, replace the iframe's `src` with a new Google-generated shared-map URL, and update its descriptive `title`, on the homepage and retained contact page. Keep `loading="eager"` to preserve automatic loading.

References: [Google's sharing/embed instructions](https://support.google.com/maps/answer/7101463), [developer API billing errors](https://developers.google.com/maps/documentation/javascript/error-messages#billing-not-enabled-map-error). Removing the old API key from the website does not revoke it in Google Cloud; disable it there if no other application uses it.

## Retained pages and indexing

`contact/`, `roboticsurgery/`, and `patienttestimonials/` remain available by direct URL, but no site navigation or page links lead to them. They are excluded from the sitemap and marked `noindex, follow`. This is not access control. The main pages retain canonical URLs, factual metadata, and ordinary crawlable HTML. No hidden promotional claims, invented ratings, or crawler-specific content are used.

`robots.txt` permits crawling and points to the sitemap. Its wildcard rule does not distinguish search crawlers from training crawlers. [Google's AI search guidance](https://developers.google.com/search/docs/appearance/ai-features) explains that ordinary SEO practices apply; no special AI schema or text file is required. Indexing and rankings are not guaranteed.

## Performance, privacy, and security

Unused WordPress scripts/styles, form/recaptcha code, export files, and duplicated publication data were removed. Responsive WebP images have optimized JPEG fallbacks and correct dimensions. The hero WebP files are approximately 22–69 KB, versus the original 1.69 MB image. Shared CSS and JavaScript are small, local files.

The maps connect to Google automatically when a page containing them opens. Google Analytics loads automatically on the production domain, with no banner or settings prompt. Advertising consent is denied, query strings/fragments/referrers are excluded from site-generated page views, and Global Privacy Control/Do Not Track are honored. Review account-side analytics collection/retention settings before publication; do not add patient identifiers or health information.

A meta Content Security Policy restricts scripts, frames, styles, and connections. There are no patient forms or executable inline scripts. Response-only security headers cannot be implemented in a meta tag. A browser request to `http://ryanchuangmd.com/` resolved to HTTPS during verification; GitHub Pages settings and server headers were not changed.

The original biography, training, and publication text is retained. The original Lato typeface, sizing, italics, spacing, curved blue interior headers, transparent-to-white desktop header, and white footer are restored. Four WOFF2 font files are served locally; their SIL Open Font License is in `assets/fonts/OFL.txt`. Existing terms and medical content are retained, with a short factual paragraph in the privacy section describing the current behavior. The older policy still refers to an application and email collection, which the owner should review.

Publishing, Google Cloud account changes, and search-console submissions are separate from these local edits.

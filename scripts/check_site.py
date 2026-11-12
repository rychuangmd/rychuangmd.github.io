"""Check the static site's links, metadata, shared navigation, and map setup.

Run from any directory with Python 3. No third-party packages are required.
"""
from html.parser import HTMLParser
import json
from pathlib import Path
import re
from urllib.parse import unquote, urlsplit
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = "https://ryanchuangmd.com"
PAGES = [ROOT / "index.html", *sorted(ROOT.glob("*/index.html"))]


class Page(HTMLParser):
    def __init__(self, source):
        super().__init__(convert_charrefs=True)
        self.tags = []
        self.nav = []
        self.in_nav = False
        self.feed(source)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        self.tags.append((tag, attrs))
        if tag == "nav" and attrs.get("aria-label") == "Main navigation":
            self.in_nav = True
        if self.in_nav and tag == "a":
            self.nav.append(attrs["href"])

    def handle_endtag(self, tag):
        if tag == "nav":
            self.in_nav = False

    def find(self, tag, **attrs):
        return [a for t, a in self.tags if t == tag and all(a.get(k) == v for k, v in attrs.items())]


parsed = {p: Page(p.read_text()) for p in PAGES}
errors = []


def check(condition, message):
    if not condition:
        errors.append(message)


for path, page in parsed.items():
    name = str(path.relative_to(ROOT))
    source = path.read_text()
    route = "/" if name == "index.html" else "/" + name.removesuffix("index.html")
    prefix = name + ": "
    check(len(page.find("h1")) == 1, prefix + "expected one h1")
    check(len(page.find("main")) == 1, prefix + "expected one main")
    check(page.find("html", lang="en-US"), prefix + "missing language")
    check(page.find("meta", charset="utf-8"), prefix + "missing encoding")
    check(page.find("meta", name="viewport"), prefix + "missing viewport")
    check(page.find("meta", name="description"), prefix + "missing description")
    check(page.find("link", rel="canonical", href=ORIGIN + route), prefix + "wrong canonical")
    check(page.nav == parsed[ROOT / "index.html"].nav, prefix + "navigation differs")
    check(page.nav == ["/about/", "/education/"], prefix + "unexpected menu link")
    appointments = page.find("a", href="https://nyulangone.org/doctors/1881048197/ryan-j-chuang")
    check(len(appointments) == 1 and "appointment-link" in appointments[0].get("class", ""), prefix + "appointment link must appear only in the top bar")
    check(not any(a.get("href") in ["/contact/", "/roboticsurgery/", "/patienttestimonials/"] for a in page.find("a")), prefix + "extra page is linked")
    ids = [a["id"] for _, a in page.tags if "id" in a]
    check(len(ids) == len(set(ids)), prefix + "duplicate IDs")
    check(not re.search(r"wp-content|wp-includes|maps/api/js|AIza|jquery|recaptcha", source, re.I), prefix + "obsolete dependency")
    for tag, attrs in page.tags:
        check(not any(k.startswith("on") for k in attrs), prefix + "inline event handler")
        check("style" not in attrs, prefix + "inline style conflicts with CSP")
        if tag == "img":
            check(all(attrs.get(k) for k in ("alt", "width", "height")), prefix + "image missing description/dimensions")
        for key in ("href", "src"):
            value = attrs.get(key)
            if not value:
                continue
            url = urlsplit(value)
            check(url.scheme != "http", prefix + "insecure HTTP link: " + value)
            if url.scheme or url.netloc:
                continue
            target = ROOT / unquote(url.path).lstrip("/") if url.path.startswith("/") else path.parent / unquote(url.path)
            if not url.path:
                target = path
            if target.is_dir():
                target = target / "index.html"
            check(target.exists(), prefix + "missing local target: " + value)
            if url.fragment and target in parsed:
                check(any(a.get("id") == url.fragment for _, a in parsed[target].tags), prefix + "missing fragment: " + value)
        if "srcset" in attrs:
            for candidate in attrs["srcset"].split(","):
                image_path = candidate.strip().split()[0]
                check((ROOT / image_path.lstrip("/")).is_file(), prefix + "missing srcset image")
        if tag == "iframe":
            check(attrs.get("src", "").startswith("https://www.google.com/maps/embed?pb="), prefix + "not a shared-map embed")
            check("key=" not in attrs["src"], prefix + "map requires API key")
            check(attrs.get("loading") == "eager" and attrs.get("title"), prefix + "map must load automatically and have a title")
    schemas = re.findall(r'<script type="application/ld\+json">(.*?)</script>', source, re.S)
    check(len(schemas) == 1, prefix + "expected one structured-data graph")
    for schema in schemas:
        graph = json.loads(schema)["@graph"]
        check(len({item["@id"] for item in graph}) == len(graph), prefix + "duplicate schema IDs")
        check(not any("aggregateRating" in item or "review" in item for item in graph), prefix + "unexpected review markup")

home = parsed[ROOT / "index.html"]
contact = parsed[ROOT / "contact/index.html"]
maps = lambda p: [a["src"] for a in p.find("iframe")]
check(len(maps(home)) == 2 and maps(home) == maps(contact), "Office maps differ or are missing")
check("196%20E%20Main" in maps(home)[0] and "228-02%20Merrick" in maps(home)[1], "Office order is incorrect")
urls = {e.text for e in ET.parse(ROOT / "sitemap.xml").iter("{http://www.sitemaps.org/schemas/sitemap/0.9}loc")}
canonical_urls = {a["href"] for p in parsed.values() if not p.find("meta", name="robots", content="noindex, follow") for a in p.find("link", rel="canonical")}
check(urls == canonical_urls, "Sitemap does not match public pages")
check("Sitemap: " + ORIGIN + "/sitemap.xml" in (ROOT / "robots.txt").read_text(), "Missing sitemap discovery")
json.loads((ROOT / "site.webmanifest").read_text())
if errors:
    raise SystemExit("\n".join(errors))
print(f"PASS: {len(PAGES)} pages; local links, images, fragments, navigation, metadata, schemas, sitemap, and both key-free maps.")

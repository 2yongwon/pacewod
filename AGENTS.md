# AGENTS.md

## Cursor Cloud specific instructions

PaceWOD is a **static website** (plain HTML, CSS, and vanilla JavaScript) — no build step, no package manager, no backend, and no database. All calculators run entirely client-side in `script.js`.

### Running the site (development)

There are no dependencies to install. Serve the repo root over HTTP from `/workspace`:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080/index.html`. Individual tools live under `tools/`, workouts under `workouts/`, and articles under `blog/`.

- Opening files via `file://` breaks root-absolute asset paths (e.g. `/style.css`, `/script.js`) and inter-page links, so always use an HTTP server rather than opening HTML files directly.
- There is **no hot reload** — refresh the browser after editing HTML/CSS/JS.

### Lint / test / build

- **Build:** none — the repo is deployed as-is (Netlify/Cloudflare Pages style; see `_redirects`).
- **Automated tests:** none exist in the repo.
- **Lint:** no configured linter. `.editorconfig` defines formatting (UTF-8, LF line endings); honor it when editing.

### Notes

- Google Analytics (`gtag.js`) and AdSense (`adsbygoogle.js`) load from CDNs in page `<head>`s. They may fail silently without internet access and are not required for the tools to work.
- `sitemap.xml`, `robots.txt`, `ads.txt`, and the Naver verification file are SEO/hosting artifacts — update `sitemap.xml` when adding new pages.

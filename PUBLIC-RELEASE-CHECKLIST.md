# Kyallan — Public Release Checklist

Use this checklist before announcing the site as a finished public release.

## GitHub Pages setup

1. Upload the project contents to the repository's default branch (`main`), including the hidden `.github/workflows/deploy.yml` file.
2. In **Settings → Pages**, set **Build and deployment → Source** to **GitHub Actions**.
3. In **Settings → Secrets and variables → Actions → Variables**, set `SITE_URL` to the exact deployed HTTPS root, including the repository path and trailing slash. Example only: `https://USERNAME.github.io/REPOSITORY/`.
4. Optional but recommended: register a free NASA API key and save it as the Actions secret `NASA_API_KEY`. Do not commit API keys in source files.
5. Run **Actions → Build, validate & deploy to GitHub Pages** manually once.

## Go/no-go checks

Before promoting from preview to public release:

- The workflow's **Build**, **Validate**, and **Deploy** jobs all finish successfully.
- The `Fetch live data` log is reviewed for `ok` and `warning` lines. Confirm that the APOD, NEO, people-in-space, news, arXiv and launch snapshots are current. If arXiv or launch snapshots are missing, those widgets will show an error/retry state until a successful refresh.
- Open the deployed URL, not a local file, and check the browser console for uncaught errors.
- Test phone, tablet and desktop layouts; the 360–1440px layout and basic interactions have passed local smoke tests, but the live deployed URL still needs a final manual check. The latest Lighthouse follow-up adds WebP `srcset` variants and early route styling; re-run Lighthouse on the deployed URL and compare FCP, LCP, TBT, CLS and Speed Index rather than assuming the score improved.
- Verify that `SITE_URL` generated the correct canonical URL and `sitemap.xml` for the real repository or custom domain.
- Review image/third-party media credits and keep the displayed data-source links. Mission dates and astronomy events can change; re-check their official sources before publishing a new schedule.
- Check the PWA after deployment and after a new build to confirm updated JavaScript/CSS is loaded and not held by an old service-worker cache.

## Important test limitation

Local tests use mock API responses for widget behavior. They do **not** prove that every upstream API is reachable from GitHub Actions or a visitor's network. If an upstream API is down or rate-limited, the website should remain usable and show its error/stale-data messaging; review the Actions log and retry as needed.

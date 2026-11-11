# Kyallan · ကြယ်လမ်း

**A website for learning astronomy in Burmese** — explore the Solar System, NASA missions, astronomy events, and more.

This project is built without external dependencies and can be built and served with Node.js 18+. The public website can be deployed to GitHub Pages or Vercel.

## Project structure

```text
kyallan/
├── src/
│   ├── index.template.html, hero.html, footer.html
│   ├── sections/*.html          # One file per section
│   ├── data/site.json           # Site name, menu, and section order
│   ├── css/*.css
│   ├── js/*.js                  # UI, router, tools, and live data
│   └── assets/                  # Fonts and photos
├── public/                      # Favicon, PWA manifest/icons, service worker
├── scripts/
│   ├── fetch-data.mjs           # Fetch API snapshots and check schemas
│   ├── build.mjs                # Build source files into dist/
│   ├── validate-site.mjs        # Check the generated site
│   └── serve.mjs                # Local preview server
└── .github/workflows/deploy.yml # Refresh, build, validate, and deploy
```

## Run locally

Use Node.js 18 or later. Open a terminal in the project directory and run:

```bash
npm start              # Build and serve at localhost:8080
PORT=3000 npm start     # Use a different port if 8080 is already in use
npm run fetch           # Fetch public API data into data-cache/
npm run build           # Generate dist/
npm run validate        # Check HTML, links, assets, sections, manifest, and data files
npm run start:live       # Fetch API data, then build and preview
```

`npm run start:live` requires an internet connection. Some APIs may be unavailable because of regional restrictions, rate limits, or upstream service issues. In that case, the site can use its existing cached data where available.

## Deploy to GitHub Pages

1. Extract the ZIP and upload all project files (especially the `.github` folder) to the `main` branch of your GitHub repository.
2. Go to **Settings → Pages → Build and deployment → Source** and select **GitHub Actions**.
3. In the repository's **Actions** tab, check whether the **Build, validate & deploy to GitHub Pages** workflow succeeds.
4. Under **Settings → Secrets and variables → Actions → Variables**, add `SITE_URL`. For example: `https://USERNAME.github.io/REPOSITORY/`. If you use a custom domain, use its URL instead.
5. After deployment succeeds, open the website and test it. A successful build and validation do not guarantee that every live API is available.

### NASA API key (optional)

The shared `DEMO_KEY` may reach its rate limit when used for NASA APOD and the Near-Earth Object API. Get a free key at <https://api.nasa.gov/> and add it as the `NASA_API_KEY` environment variable in your deployment settings.

## Live APIs and stale-data protection

Before building the website, GitHub Actions fetches snapshots of the following data:

| Data | Source | Use |
|---|---|---|
| Astronomy Picture of the Day | NASA APOD WordPress API | Daily image, title, and explanation |
| Near-Earth Objects | NASA NeoWs | Asteroid close approaches for the current date |
| People in Space | Corquaid ISS APIs | List of people currently in space |
| Spaceflight News | The Space Devs / Spaceflight News API | Space news — requested directly from the API when a visitor opens it |
| Upcoming launches | Launch Library 2 | Upcoming launches, UTC times, and status |
| arXiv | arXiv Atom API | Latest astro-ph papers |
| ISS position / Earth EPIC / NASA image search | Where the ISS At? / NASA EPIC / NASA Images API | Fetched in the browser when the relevant widget is opened |

The `data-cache/` directory is retained between GitHub Actions runs using the Actions cache, so previously fetched snapshots can be used as a fallback if an API request fails.

Launch Library 2's unauthenticated quota is 15 requests per hour, so the site does not make a launch-data request for every individual visitor. The build workflow refreshes and caches this data instead.

## Offline / PWA

The service worker caches the site shell, fonts, previously loaded same-origin assets, and API snapshots. Some live features still require an internet connection, and cached data may not be current.

## Files to edit

| To change | Edit |
|---|---|
| Image gallery (NASA images) | `<div class="nasa-gallery" data-q="...">` in a section file |
| Footer contact email | `src/footer.html` |
| Space Calendar dates (meteor showers, eclipses, missions) | `src/data/calendar.json` (you only need to edit this file) |
| Section text or images | `src/sections/<id>.html` |
| Menu, section order, and metadata | `src/data/site.json` |
| Responsive appearance | `src/css/base.css`, `src/css/ui.css` |
| Live APIs and API fallbacks | `src/js/live.js` |
| API snapshot fetching and validation | `scripts/fetch-data.mjs` |
| Build, SEO, and generated output | `scripts/build.mjs`, `src/index.template.html` |
| Offline caching | `public/sw.js` |

After making changes, run `npm run build && npm run validate` first. Then push your changes to GitHub and check the Actions workflow.

## Accuracy and sources

Mission schedules and astronomy event dates can change. For Artemis III/IV, check the latest information at <https://www.nasa.gov/missions/artemis/>. Verify dates and mission details with the relevant official source before publishing updates.

## Deploy to Vercel

1. In Vercel, choose **Add New → Project** and select the GitHub repository. The `vercel.json` file already specifies the build command and output directory (`dist`), so the default settings should work.
2. In **Project Settings → Environment Variables**, add `NASA_API_KEY` if you have one. If you use a custom domain, also set `SITE_URL` to its URL (`https://...`).
3. To refresh data every three hours on Vercel as well, create a deploy hook under **Settings → Git → Deploy Hooks** and schedule it with an external cron service.
4. If you deploy to both platforms, set `SITE_URL` to only the primary URL (used as the canonical URL for search engines).

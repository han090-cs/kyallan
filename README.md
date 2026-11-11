# Kyallan · ကြယ်လမ်း

A website to learn about space in Burmese.

This project uses no extra packages. You need Node.js 18 or newer to build and run it.

## Project files

```text
kyallan/
├── src/
│   ├── index.template.html, hero.html, footer.html
│   ├── sections/*.html          # One file for each section
│   ├── data/site.json           # Site name, menu, and section order
│   ├── css/*.css
│   ├── js/*.js                  # Page tools and live data
│   └── assets/                  # Fonts and photos
├── public/                      # Site icons and service worker
├── scripts/
│   ├── fetch-data.mjs           # Get API data and check it
│   ├── build.mjs                # Build the site in dist/
│   ├── validate-site.mjs        # Check the built site
│   └── serve.mjs                # Run a local preview
└── .github/workflows/deploy.yml # Build and deploy the site
```

## Run the site on your computer

Install Node.js 18 or newer. Open a terminal in the project folder and run:

```bash
npm start              # Build and run at localhost:8080
PORT=3000 npm start    # Use port 3000 instead
npm run fetch          # Get public API data
npm run build          # Build the site in dist/
npm run validate       # Check the site files
npm run start:live     # Get API data, build, and run the site
```

`npm run start:live` needs an internet connection. Some APIs may be slow or may not work. They may also limit the number of requests.

## Publish with GitHub Pages

1. Upload all project files to your GitHub repository. Include the `.github` folder.
2. Open **Settings → Pages**. Under **Build and deployment**, choose **GitHub Actions**.
3. Open the **Actions** tab and check the **Build, validate & deploy to GitHub Pages** workflow.
4. Add a `SITE_URL` variable under **Settings → Secrets and variables → Actions → Variables**. For example: `https://USERNAME.github.io/REPOSITORY/`.
5. When deployment is done, open your website and test it.

### NASA API key (optional)

NASA's shared `DEMO_KEY` may reach its request limit. You can get a free API key at <https://api.nasa.gov/>. Add it as `NASA_API_KEY` in your website settings.

## Live data

Before building the site, GitHub Actions saves data from these sources:

| Data | Source | What it shows |
|---|---|---|
| Astronomy Picture of the Day | NASA APOD WordPress API | A daily space picture and its details |
| Near-Earth Objects | NASA NeoWs | Asteroids that pass near Earth |
| People in Space | Corquaid ISS APIs | People who are in space now |
| Spaceflight News | The Space Devs / Spaceflight News API | Space news |
| Upcoming launches | Launch Library 2 | Future launches and times |
| arXiv | arXiv Atom API | New space science papers |
| ISS position / Earth EPIC / NASA image search | Where the ISS At? / NASA EPIC / NASA Images API | Data shown in the related tools |

The `data-cache/` folder keeps saved data between GitHub Actions runs. The site can use this data if an API is not working.

Launch Library 2 allows 15 requests per hour without a login. The site saves launch data when it builds instead of asking the API each time a visitor opens the site.

## Use the site offline

The service worker saves some site files and data. Some features still need an internet connection. Saved data may be old.

## Change the site

| What to change | File |
|---|---|
| NASA image gallery | A section file with `<div class="nasa-gallery" data-q="...">` |
| Footer email | `src/footer.html` |
| Space Calendar dates | `src/data/calendar.json` |
| Section text or images | `src/sections/<id>.html` |
| Menu, section order, and site details | `src/data/site.json` |
| Site design | `src/css/base.css`, `src/css/ui.css` |
| Live API data | `src/js/live.js` |
| How API data is downloaded | `scripts/fetch-data.mjs` |
| How the site is built | `scripts/build.mjs`, `src/index.template.html` |
| Offline files | `public/sw.js` |

After making changes, run:

```bash
npm run build && npm run validate
```

Then upload your changes to GitHub and check the **Actions** tab.

## Check information

Mission and space event dates can change. Check the latest Artemis III/IV information at <https://www.nasa.gov/missions/artemis/>.

## Publish with Vercel

1. In Vercel, choose **Add New → Project** and select your GitHub repository. The `vercel.json` file already sets the build command and output folder (`dist`).
2. Add `NASA_API_KEY` under **Project Settings → Environment Variables** if you have a key. If you use your own domain, also add `SITE_URL`.
3. To update data every three hours, create a deploy hook in **Settings → Git → Deploy Hooks** and use a timer service to run it.
4. If you use both Vercel and GitHub Pages, set `SITE_URL` to your main website address.

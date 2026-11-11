# ကြယ်လမ်း · Kyallan

**မြန်မာဘာသာဖြင့် အာကာသပညာ လေ့လာရန် website** — နေအဖွဲ့အစည်း၊ NASA မစ်ရှင်များ၊ အာကာသသမိုင်း၊ ကောင်းကင်ကြည့်ရှုရေး၊ NASA မီဒီယာ၊ ISS တည်နေရာ၊ NEO၊ အာကာသသတင်း၊ သုတေသနစာတမ်းများနှင့် ဒုံးပျံလွှတ်တင်မှုဇယား။

ဒီ project ကို dependency မလိုအောင် တည်ဆောက်ထားပြီး Node.js 18+ နဲ့ build/serve လုပ်နိုင်ပါတယ်။ Public website အဖြစ် GitHub Pages ပေါ် အခမဲ့ ဖြန့်ချိနိုင်ပါတယ်။ Local images တွေကို WebP responsive variants နဲ့ ထုတ်ပေးပြီး direct section links အတွက် early-route styling၊ local preview မှာ gzip နဲ့ content-versioned caching ပါဝင်ပါတယ်။

## ဖိုင်ဖွဲ့စည်းပုံ

```text
kyallan/
├── src/
│   ├── index.template.html, hero.html, footer.html
│   ├── sections/*.html          # section တစ်ခုကို ဖိုင်တစ်ခု
│   ├── data/site.json           # နာမည်၊ မီနူး၊ section အစီအစဉ်
│   ├── css/*.css
│   ├── js/*.js                  # UI, router, tools, live data
│   └── assets/                  # fonts, photos
├── public/                      # favicon, PWA manifest/icons, service worker
├── scripts/
│   ├── fetch-data.mjs            # API snapshot fetch + schema checks
│   ├── build.mjs                 # source files -> dist/
│   ├── validate-site.mjs         # static output checks
│   └── serve.mjs                 # local preview server
└── .github/workflows/deploy.yml  # refresh, build, validate, deploy
```

## ကိုယ်ပိုင်ကွန်ပျူတာမှာ စမ်းရန်

Node.js 18 နှင့်အထက်ကို အသုံးပြုပါ။ Terminal မှ project folder ထဲဝင်ပြီး—

```bash
npm start              # build ပြီး localhost:8080 မှာ ဖွင့်မယ်
PORT=3000 npm start     # 8080 ကို တခြား program သုံးနေခဲ့ရင် port ပြောင်းဖွင့်မယ်
npm run fetch          # public API data ကို data-cache/ ထဲ ဆွဲမယ်
npm run build          # dist/ ထုတ်မယ်
npm run validate       # HTML၊ link၊ asset၊ section၊ manifest နဲ့ data file စစ်မယ်
npm run start:live     # API data ဆွဲပြီး build/preview လုပ်မယ်
```

`npm run start:live` အတွက် အင်တာနက်လိုပါတယ်။ API တချို့က ကိုယ့်ဒေသ၊ API rate limit သို့မဟုတ် upstream ပြုပြင်မှုကြောင့် ခဏတာ မရနိုင်ပါ။ Fetch မအောင်မြင်ရင် ရှိပြီးသား valid snapshot ကို မဖျက်ဘဲ ထိန်းထားဖို့ ကြိုးစားထားပါတယ်။

## GitHub Pages ပေါ် တင်ရန်

1. ZIP ကို ဖြည်ပြီး ဖိုင်အားလုံး (အထူးသဖြင့် `.github` folder) ကို GitHub repository ရဲ့ `main` branch ထဲ တင်ပါ။
2. Repository → **Settings → Pages → Build and deployment → Source: GitHub Actions** ကို ရွေးပါ။
3. Repository → **Actions** ထဲက **Build, validate & deploy to GitHub Pages** workflow အောင်မြင်/မအောင်မြင် စစ်ပါ။
4. **Settings → Secrets and variables → Actions → Variables** မှာ `SITE_URL` ကို ထည့်ပါ။ ဥပမာ `https://USERNAME.github.io/REPOSITORY/`။ Custom domain သုံးရင် ကိုယ့် HTTPS domain ကို ထည့်ပါ။ (GitHub Pages ပုံမှန် URL ဆိုရင် မထည့်လည်း Actions က အလိုအလျောက် သတ်မှတ်ပေးပါတယ်။) ဒီ variable က canonical URL၊ sitemap နဲ့ robots.txt ထုတ်ဖို့ အသုံးပြုပါတယ်။
5. Deploy အောင်မြင်ပြီး website ကို ဖွင့်စမ်းပါ။ Build/validate အစိမ်းရောင်ဖြစ်တာက live API တစ်ခုချင်းစီ အမြဲရမယ်လို့ အာမမခံပါ—Actions log မှာ `ok` / `warning` စာကြောင်းတွေကိုပါ စစ်ပါ။

### NASA API key (ရွေးချယ်နိုင်)

NASA APOD နဲ့ Near-Earth Object API အတွက် shared `DEMO_KEY` က rate limit ပြည့်နိုင်ပါတယ်။ အခမဲ့ key ကို <https://api.nasa.gov/> မှာ ရယူပြီး Repository → **Settings → Secrets and variables → Actions → Secrets** မှာ `NASA_API_KEY` အမည်နဲ့ ထည့်နိုင်ပါတယ်။ Key ကို source code ထဲ မရေးပါနှင့်။ Website visitor တစ်ယောက်ချင်းစီမှာလည်း Live အပိုင်းအောက်က key field မှ ကိုယ်ပိုင် key ကို browser local storage ထဲ သိမ်းနိုင်ပါတယ်။

## Live API တွေနဲ့ ဒေတာအဟောင်းကို ကာကွယ်ပုံ

Website build မတိုင်ခင် GitHub Actions က ဒီဒေတာတွေကို snapshot အဖြစ် ဆွဲပါတယ်။

| ဒေတာ | ရင်းမြစ် | အသုံးပြုပုံ |
|---|---|---|
| Astronomy Picture of the Day | NASA APOD WordPress API | နေ့စဉ်ပုံ၊ ခေါင်းစဉ်၊ ရှင်းလင်းချက် |
| Near-Earth Objects | NASA NeoWs | လက်ရှိရက်အတွက် ဥက္ကာခဲနီးကပ်ဖြတ်သန်းမှု |
| People in Space | Corquaid ISS APIs | အာကာသထဲရှိ လူစာရင်း |
| Spaceflight News | The Space Devs / Spaceflight News API | အာကာသသတင်း — visitor ဖွင့်တာနဲ့ API ကို တိုက်ရိုက်ခေါ်ပြီး ၅ မိနစ်တစ်ခါ auto-refresh၊ မရရင် snapshot ကို သုံး |
| Upcoming launches | Launch Library 2 | လာမည့် launch များ၊ UTC အချိန်၊ အခြေအနေ |
| arXiv | arXiv Atom API | နောက်ဆုံး astro-ph စာတမ်းများ |
| ISS position / Earth EPIC / NASA image search | Where the ISS At? / NASA EPIC / NASA Images API | သက်ဆိုင်ရာ widget ကို ဖွင့်ကြည့်ချိန် browser က ရယူ |

`data-cache/` ကို GitHub Actions cache ဖြင့် run တစ်ခုနဲ့တစ်ခုကြား ဆက်လက်အသုံးပြုနိုင်အောင် စီစဉ်ထားပါတယ်။ Upstream API တစ်ခု ပျက်သွားရင် ယခင် valid snapshot ကို အသုံးပြုဖို့ ကြိုးစားပြီး၊ frontend က snapshot ဟောင်းနေရင် “ဟောင်းနိုင်သည်” လို့ ဖော်ပြပါတယ်။ Cache အလွတ်ဖြစ်နေတဲ့ ပထမ run မှာ API မရပါက widget တချို့မှာ error/retry state ပေါ်နိုင်ပါတယ်။

Launch Library 2 ရဲ့ unauthenticated quota က တစ်နာရီ ၁၅ request ဖြစ်တာကြောင့် website visitor တစ်ယောက်ချင်းစီက launch API ကို မခေါ်စေဘဲ snapshot အဖြစ်ပဲ ပြသပါတယ်။ Workflow က သုံးနာရီတစ်ခါ အလိုအလျောက် refresh လုပ်ပြီး manual `workflow_dispatch` နဲ့လည်း ခေါ်နိုင်ပါတယ်။

## Offline / PWA

Service worker က site shell၊ font၊ အရင် load လုပ်ထားတဲ့ same-origin asset နဲ့ API snapshot များကို cache လုပ်ပေးပါတယ်။ ပထမဆုံးအကြိမ် ဖွင့်ရာမှာ online လိုပါတယ်။ External API များအားလုံးကို offline မှာ အလုပ်လုပ်နိုင်မည်ဟု မဆိုလိုပါ။ Browser ရဲ့ application settings မှာ install လုပ်နိုင်သည့် site အဖြစ် ပေါ်လာနိုင်ပါတယ်။

## ပြင်ဆင်ရမည့်ဖိုင်များ

| လုပ်ချင်တာ | ပြင်ရမယ့်ဖိုင် |
|---|---|
| ပုံအစု (NASA ပုံများ) | section ဖိုင်ထဲက `<div class="nasa-gallery" data-q="...">` |
| Footer ဆက်သွယ်ရန် email | `src/footer.html` |
| Space Calendar ရက်စွဲ (meteor, eclipse, mission) | `src/data/calendar.json` (ဒီဖိုင်ပဲ ပြင်ရင် ရပါတယ်) |
| Section စာသား/ပုံ | `src/sections/<id>.html` |
| မီနူး၊ section အစီအစဉ်၊ metadata | `src/data/site.json` |
| Responsive appearance | `src/css/base.css`, `src/css/ui.css` |
| Live API / API fallback | `src/js/live.js` |
| API snapshot fetch/validation | `scripts/fetch-data.mjs` |
| Build / SEO / generated output | `scripts/build.mjs`, `src/index.template.html` |
| Offline caching | `public/sw.js` |

ပြင်ပြီးရင် `npm run build && npm run validate` ကို အရင်စမ်းပါ။ အဲဒီနောက် GitHub ပေါ် push လုပ်ပြီး Actions log နဲ့ အမှန်တကယ် browser မျက်နှာပြင်ကို စစ်ပါ။

## အချက်အလက် တိကျမှုနှင့် ရင်းမြစ်

Mission schedule နဲ့ astronomy event ရက်စွဲတွေ ပြောင်းနိုင်ပါတယ်။ Artemis III/IV အတွက် <https://www.nasa.gov/missions/artemis/nasa-shares-plans-to-accelerate-artemis-return-to-moon/>၊ meteor shower အတွက် <https://www.imo.net/calendar/> နဲ့ eclipse visibility အတွက် <https://eclipse.gsfc.nasa.gov/> / <https://www.timeanddate.com/eclipse/> တို့မှာ နောက်ဆုံးကြေညာချက်ကို ပြန်စစ်ပါ။ အချိန်ဇယားမှာ ရည်မှန်း/အစီအစဉ်ဟု ဖော်ပြထားသော ရက်စွဲကို အတည်ပြုပြီးဖြစ်သော ဖြစ်ရပ်နဲ့ မရောထွေးစေရန် ရည်ရွယ်ထားပါတယ်။

## Vercel မှာလည်း တင်ချင်ရင်

1. Vercel → Add New → Project → GitHub repo ကို ရွေးပါ။ `vercel.json` ထဲမှာ build command နဲ့ output (`dist`) ပါပြီးသားမို့ ဘာမှ ပြင်စရာ မလိုပါဘူး။
2. Project Settings → Environment Variables မှာ `NASA_API_KEY` (ရှိရင်) ထည့်ပါ။ Custom domain သုံးရင် `SITE_URL` (https://...) ကိုလည်း ထည့်ပါ။ မထည့်ရင် Vercel production URL ကို အလိုအလျောက် သုံးပါတယ်။
3. ၃ နာရီတစ်ခါ data refresh ကို Vercel မှာလည်း လိုချင်ရင် Settings → Git → Deploy Hooks မှာ hook တစ်ခုဖန်တီးပြီး URL ကို GitHub repo ရဲ့ secret `VERCEL_DEPLOY_HOOK` အဖြစ် ထည့်ပါ။ မထည့်ရင်လည်း သတင်း၊ ISS တို့က browser ကနေ တိုက်ရိုက် ဆွဲလို့ အလုပ်လုပ်ပါတယ်။
4. ဆိုက်နှစ်ခုလုံး တင်ထားရင် `SITE_URL` က အဓိက URL တစ်ခုကိုပဲ ညွှန်ပါ (Google အတွက် canonical တစ်ခုတည်းဖြစ်ရန်)။

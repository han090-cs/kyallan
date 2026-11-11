# ကြယ်လမ်း (Kyallan) — Audit & Update Notes

## v2.2.3 — ပြန်မတင်ရတာ လျော့စေတဲ့ update

- ဂြိုဟ်တွေ မြင်ရမှု လမ်းညွှန်ကို လစဉ် လက်နဲ့ ထည့်ရတဲ့ ဇယား (၂၀၂၇ ဒီဇင်ဘာအထိပဲ ရှိခဲ့) အစား ယနေ့ရက်စွဲနဲ့ အလိုအလျောက် တွက်ထုတ်တဲ့ `src/js/data/ephem.js` ကို ထည့်ထားပါတယ်။ Jupiter (၂၀၂၇ ဖေဖော်ဝါရီ ၁၁)၊ Mars (ဖေဖော်ဝါရီ ၁၉)၊ Saturn (အောက်တိုဘာ ၁၈) opposition ရက်တွေနဲ့ တိုက်စစ်ရာ ကိုက်ညီပါတယ်။ `sky.js` က ရွေးချယ်စရာ အထူးမှတ်ချက်အဖြစ်ပဲ ကျန်ပါတယ်။
- Space Calendar ထဲက ပြီးသွားတဲ့ meteor shower/eclipse အတန်းတွေကို အလိုအလျောက် မှိန်ပြီး "ပြီးဆုံး" လို့ ပြပါတယ်။ ရက်စွဲအားလုံး ကျော်သွားရင် သတိပေးစာ ပေါ်ပါတယ်။
- အာကာသသတင်းကို visitor ဖွင့်တာနဲ့ Spaceflight News API ကို တိုက်ရိုက်ခေါ်ပြီး (အရင် snapshot ကို အရင်သုံးခဲ့) ၅ မိနစ်တစ်ခါ အလိုအလျောက် update လုပ်ပါတယ်။ API မရရင် build snapshot ကို ပြန်သုံးပါတယ်။
- Space Calendar ရက်စွဲအားလုံးကို `src/data/calendar.json` ထဲ ရွှေ့ထားပြီး build လုပ်ချိန် HTML အဖြစ် ထုတ်ပေးပါတယ်။ ရက်စွဲပြင်ချင်ရင် ဒီဖိုင်ပဲ ပြင်ပါ။
- GitHub Actions ပေါ်မှာ `SITE_URL` မထည့်ထားရင် repository နာမည်ကနေ GitHub Pages URL ကို အလိုအလျောက် ယူပြီး canonical/sitemap/robots ထုတ်ပေးပါတယ်။ Custom domain သုံးရင်တော့ `SITE_URL` ထည့်ရပါမယ်။
- `npm run validate` က `calendar.json` ကို စစ်ပါတယ် (ရက်စွဲပုံစံ မှားရင် FAIL၊ လာမယ့်ရက်စွဲ မကျန်တော့ရင် WARN)။
- လပြည့်/လဆန်း အချိန်ကို Meeus နည်းနဲ့ အလိုအလျောက်တွက်တဲ့ `src/js/data/moonphases.js` ထည့်ထားပါတယ် (၂၀၂၆ မတ် ၃၊ ဩဂုတ် ၁၂၊ ၂၀၂၇ ဩဂုတ် ၂၊ ၁၇ ရက်တွေနဲ့ တိုက်စစ်ပြီး မိနစ်အနည်းငယ်အတွင်း ကိုက်ညီ)။ Tonight အပိုင်းမှာ လာမယ့် ၈ ကြိမ်စာ ဇယားပြပြီး meteor shower အတန်းတိုင်းမှာ အထွတ်အထိပ်ည လအလင်း % ကို တွက်ထည့်ပါတယ်။ ဒီနည်းနဲ့ Lyrids ၂၀၂၇ (လပြည့်) လို မှတ်ချက်မပါတဲ့ အခြေအနေတွေလည်း မြင်ရပါပြီ။ Geminids ၂၀၂၆ လအလင်း ~၁၅–၂၀% ကို ~၂၀–၂၅% လို့ ပြင်ထားပါတယ်။
- `.github/dependabot.yml` ထည့်ထားလို့ workflow ထဲက action version ဟောင်းလာရင် လစဉ် pull request ဖွင့်ပေးပါတယ်။
- Footer မှာ အမှားပို့ရန် email လင့်ခ် ထည့်ထားပါတယ်။
- Security: `<meta>` Content-Security-Policy ထည့်ထားပါတယ် — inline script ကို hash နဲ့ပဲ ခွင့်ပြုပြီး (ထိုးထည့်ထားတဲ့ script မပြေးနိုင်)၊ API ခေါ်ခွင့်ကို သုံးနေတဲ့ ၇ host ထဲပဲ ကန့်သတ်၊ iframe ကို youtube-nocookie ပဲ ခွင့်ပြုထားပါတယ်။ `npm run validate` က hash နဲ့ host စာရင် ကိုက်/မကိုက် စစ်ပါတယ်။ Workflow မှာ `actions: write` ကို build job တစ်ခုထဲပဲ ပေးထားပါတယ် (deploy job မရ)။ ရှိပြီးသား code ကိုလည်း စစ်ကြည့်ရာ innerHTML ထဲ အပြင်က စာသား မဝင်ကြောင်း၊ API လင့်ခ်တွေ `https` ပဲ ခွင့်ပြုကြောင်း၊ NASA key ကို `encodeURIComponent` လုပ်ကြောင်း အတည်ပြုပြီးပါပြီ။
- ဇယား ၁၃ ခုလုံးကို ဖုန်း (အကျယ် ၆၄၀px အောက်) မှာ ကတ်ပုံစံ ပြောင်းပါတယ် — ပထမ ကွက်က ခေါင်းစဉ်၊ ကျန်တာတွေက "အမည်: တန်ဖိုး" ပုံစံ။ CSS မှာ "stacked cards" လို့ မှတ်ထားပေမယ့် တကယ် မရေးထားခဲ့တာ အမှားကို ပြင်ထားတာပါ။ Build က `<td>` တိုင်းမှာ `data-label` ကို အလိုအလျောက်ထည့်ပေးလို့ ဇယားအသစ်ထည့်ရင်လည်း `<th>` ခေါင်းစဉ်ရှိရုံနဲ့ အလုပ်လုပ်ပါတယ်။
- ဖုန်းဇယားကတ်ကို ပိုကျစ်လစ်အောင် ပြန်လုပ်ထားပါတယ် — "အမည် | တန်ဖိုး" တစ်ကြောင်းတည်း၊ ကော်လံ ၄ ခုထက်များတဲ့ အတန်း (ဒုံးပျံ၊ ဂြိုဟ်၊ ကြယ်အမျိုးအစား) မှာ ပထမ ၄ ခုပဲပြပြီး "ပိုကြည့်ရန်" ခလုတ်နဲ့ ကျန်တာဖွင့်ပါတယ်။ JS မရှိရင် အကုန်ပြပါတယ်။
- ဖုန်းမှာ ဇယားတစ်ခုချင်းစီက ပထမ ၄ တန်းပဲ ပြပြီး "ကျန် N ခု ကြည့်ရန်" ခလုတ်နဲ့ ကျန်တာဖွင့်ပါတယ်။ ပြက္ခဒိန်ဇယားတွေမှာ ပြီးသွားတဲ့ ရက်စွဲတွေကို ဖုန်းမှာ အရင်ဆုံး ဝှက်ထားပါတယ်။ Tablet/desktop မှာ အကုန်ပြပါတယ်။
- ပုံများ — NASA Image and Video Library ကနေ ပုံအစု ၁၁ ခု (nasa၊ stations၊ telescopes၊ solar၊ moonmars၊ stars၊ deep၊ rockets၊ observe၊ people၊ timeline) ကို အပိုင်းအောက်ဆုံးမှာ ထည့်ထားပါတယ်။ ပုံအစု အသစ်လိုရင် section ဖိုင်ထဲ `<div class="nasa-gallery" data-q="ရှာမယ့်စကားလုံး" data-n="6" data-title="ခေါင်းစဉ်"></div>` တစ်ကြောင်း ထည့်ရုံပါပဲ။ ပုံတွေ နေ့စဉ် အလှည့်ကျ ပြောင်းပြပါတယ်။
- API ခေါ်ပုံ ပိုကောင်းအောင် — `src/js/api.js` ကို အားလုံးက မျှသုံးပါတယ်: timeout၊ network error/5xx ဆိုရင် တစ်ကြိမ် ပြန်ကြိုးစား (back-off)၊ HTTP 429 ဆိုရင် ၅ မိနစ် host ကို ရပ်ထား (ထပ်မခေါ်)၊ တူတဲ့ request တစ်ပြိုင်နက်ဆို တစ်ခါပဲ ခေါ်၊ offline ဆိုရင် ချက်ချင်း မအောင်မြင်ကြောင်းပြ၊ အင်တာနက်ပြန်ရရင် widget တွေ အလိုအလျောက် ပြန်ကြိုးစား။ ပုံအစုတွေက build လုပ်ချိန် `data/gallery.json` ကို အရင်သုံး (ဧည့်သည်က NASA API ကို မခေါ်ရ)၊ မရှိမှ API တိုက်ရိုက် (၁ ပတ် browser cache)။ `fetch-data.mjs` က ၂၀ နာရီအတွင်း ပြန်မခေါ်ဘဲ မအောင်တဲ့ query ရဲ့ ယခင်ရလဒ်ကို ဆက်သိမ်းပါတယ်။
- Facebook/Messenger share preview — `og-share.jpg` (1200×630 JPG၊ SLS ဒုံးပျံပုံ) ကို သီးသန့်ထုတ်ပြီး og:image အပြည့်အစုံ + twitter:card ထည့်ထားပါတယ်။ အရင်သုံးခဲ့တဲ့ ပုံက ၅၈၀×၃၈၄ နဲ့ သေးလွန်းလို့ ပြောင်းထားတာပါ။ Facebook Sharing Debugger မှာ တင်ပြီးစစ်ပါ။
- စာလုံးအရွယ် ခလုတ် "Aa" (header မှာ) — ၉၀/၁၀၀/၁၁၅/၁၃၀% လည်ပတ်ပြောင်းပြီး ဖုန်းမှာ မှတ်ထားပါတယ်။ CSS ထဲက px စာလုံးအရွယ်အားလုံးကို build က `--fs` နဲ့ မြှောက်ပေးတာမို့ စာကြောင်းအားလုံး တူညီစွာ ကြီး/သေးပါတယ်။ Header ကိုတော့ မပြောင်းပါဘူး (ဖုန်းမှာ ကျစ်လစ်နေရန်)။
- `.github/workflows/lighthouse.yml` + `lighthouserc.json` — push/PR တိုင်း mobile Lighthouse ပြေးပါတယ် (deploy ကို မတားပါ)။ Accessibility ၀.၈၅ အောက်ကျရင် error၊ ကျန်တာ warn။ ပထမ run ရလဒ်ကို ကြည့်ပြီး ကိန်းဂဏန်းတွေ ညှိပါ။
- GitHub က repository လှုပ်ရှားမှု ၆၀ ရက်မရှိရင် schedule ကို ရပ်ထားတတ်လို့ workflow ထဲမှာ keep-alive step ထည့်ထားပါတယ်။
- ဒီ AUDIT-NOTES ထဲမှာ မှားပါနေတဲ့ ရုရှား/မွန်ဂိုလီးယား စာလုံးတွေကို မြန်မာစာနဲ့ ပြင်ထားပါတယ်။

## v2.2.2 — Lighthouse performance follow-up

- ရရှိထားတဲ့ mobile Lighthouse baseline (Performance 59, FCP 3.4s, LCP 4.2s, TBT 230ms, CLS 0.148, Speed Index 18.0s) ကို အခြေခံပြီး image delivery၊ route layout shift နဲ့ local-preview compression ကို ဦးစားပေးပြင်ထားပါတယ်။ ဒီတန်ဖိုးတွေက မူလ baseline ဖြစ်ပြီး v2.2.2 ရဲ့ Lighthouse score ကို browser မှာ ပြန်စမ်းသပ်ပြီးမှ သတ်မှတ်နိုင်ပါတယ်။
- Local astronomy images တွေကို max 1200px WebP အဖြစ် ပြောင်းထားပြီး 480px/800px responsive variants ထည့်ထားပါတယ်။ Build output မှ `srcset`/`sizes`, explicit `width`/`height`, `decoding="async"` နဲ့ content-hashed URL များ ထုတ်ပေးပါတယ်။ Mobile ပေါ်မှာ သင့်တော်တဲ့အရွယ်အစားပုံကို browser ရွေးနိုင်ပြီး image-triggered layout shift လျော့စေပါတယ်။
- Direct `#section` link ဖွင့်ချိန်မှာ JavaScript မပြေးခင် CSS က target section ကိုသာ ပြသအောင်လုပ်ထားပါတယ်။ ဒါက page အားလုံးကို ခဏပြပြီး နောက်မှဖျောက်တဲ့ layout jump နဲ့ မလိုအပ်တဲ့ lazy images load ဖြစ်နိုင်မှုကို လျော့စေဖို့ပါ။
- Local preview server မှ HTML/CSS/JS/JSON/SVG ကို gzip လုပ်ပြီး versioned static assets အတွက် long-lived immutable cache header ထည့်ထားပါတယ်။ HTML နဲ့ service worker script ကို no-cache ထားပြီး data snapshots ကို ခဏတာ cache လုပ်ပါတယ်။ GitHub Pages production cache policy ကို local server setting ကနေ ထိန်းချုပ်လို့မရနိုင်ကြောင်း သတိပြုပါ။
- Validator မှ local images တွေ WebP ဖြစ်မှု၊ `srcset` candidate ဖိုင်များရှိမှု၊ image intrinsic dimensions နဲ့ content-hashed URLs ကို စစ်ဆေးပါတယ်။

## v2.2.1 — Public-release preflight update

- Service worker cache name ကို shipped HTML/CSS/JS နှင့် assets များ၏ content hash နဲ့ build တိုင်း ထုတ်ပေးအောင် ပြင်ထားပါတယ်။ App bundle ကို offline shell အတွင်း precache လုပ်ထားပြီး release အသစ်ရောက်လာရင် cache အဟောင်းတွေကို အစားထိုးနိုင်ပါတယ်။
- Validator က service-worker cache version hash နဲ့ app JavaScript precache ကို regression check လုပ်ပါတယ်။

## v2.2 မှာ ပြင်ထားတာ

- NASA APOD ကို legacy `api.nasa.gov/planetary/apod` endpoint အစား NASA ရဲ့ `science.nasa.gov/wp-json/wp/v2/apod-basic/` endpoint သို့ ပြောင်းထားပါတယ်။ NASA ရဲ့ ၂၀၂၆ စက်တင်ဘာ API ပြောင်းလဲမှုနဲ့ ကိုက်ညီစေပြီး legacy endpoint ပိတ်မယ့်ရက်မတိုင်ခင် အစားထိုးထားပါတယ်။
- APOD က `explanation` နဲ့ `copyright` ကို HTML markup အပါအဝင် ပြန်ပေးနိုင်လို့ browser UI မှာ tag စာသားမပေါ်အောင် plain text အဖြစ် သန့်စင်ပြသပါတယ်။
- API တစ်ခုချင်းစီအတွက် timeout, ကန့်သတ် retry, response schema စစ်ဆေးမှုနဲ့ atomic snapshot write ထည့်ထားပါတယ်။ API ပျက်/response မမှန်တဲ့အခါ ရှိပြီးသား valid snapshot ကို မဖျက်ဘဲ ထိန်းထားပါတယ်။
- GitHub-hosted runner တွေက တစ်ကြိမ်ပြီးတစ်ကြိမ် အသစ်ဖြစ်တာကြောင့် `actions/cache@v4` ကနေ `data-cache/` ကို restore/save လုပ်ပြီး run တစ်ခုနဲ့တစ်ခုကြား နောက်ဆုံး valid data ကို ပြန်သုံးနိုင်အောင် ပြင်ထားပါတယ်။
- ISS widget ကို မြင်ကွင်းထဲရှိနေချိန်မှာသာ update လုပ်ပြီး တစ်မိနစ်တစ်ကြိမ်သာ တောင်းဆိုပါတယ်။ API request တွေ ထပ်တူမတက်အောင် overlapping request ကိုလည်း တားထားပါတယ်။
- Launch Library 2 မှ လာမယ့် rocket launch ၅ ခုကို ဖော်ပြတဲ့ widget ထည့်ထားပြီး launch API ကို visitor တစ်ယောက်ချင်းစီက မခေါ်စေဘဲ build-time snapshot ကနေ ပြသပါတယ်။
- Snapshot ဟောင်းနေရင် အရင်ဒေတာကို ပြသနိုင်ပြီး “ဟောင်းနိုင်သည်” ဆိုတဲ့ သတိပေးချက်နဲ့ update timestamp ကို ထည့်ထားပါတယ်။ API မရနိုင်ရင် retry/error state ကို ပြသပါတယ်။
- GitHub Pages build မှာ `SITE_URL` ပေးထားပါက canonical URL, Open Graph URL/image, `sitemap.xml` နဲ့ `robots.txt` ထုတ်ပေးပါတယ်။
- PWA manifest, favicon နဲ့ 192/512px install icons ထည့်ထားပါတယ်။ Service worker က site shell နဲ့ အရင် load လုပ်ထားတဲ့ same-origin snapshots/assets တွေကို cache လုပ်ပေးပါတယ်။
- Artemis II/III/IV အစီအစဉ်နဲ့ ၂၀၂၆–၂၀၂၇ meteor shower ရက်စွဲအချို့ကို NASA/IMO အရင်းအမြစ်တွေနဲ့ တိုက်ပြီး ပြင်ထားပါတယ်။ Mission schedule တွေက ပြောင်းလဲနိုင်တဲ့ planned date တွေဖြစ်ကြောင်း ဖော်ပြထားပါတယ်။
- README ကို local run, GitHub Pages, `SITE_URL`, optional `NASA_API_KEY`, cache/fallback, test နဲ့ API sources ရှင်းလင်းချက်တွေပါအောင် ပြန်ရေးထားပါတယ်။

## အောင်မြင်ခဲ့တဲ့ စမ်းသပ်မှုများ

- `node --check` — project ရဲ့ JavaScript/ES module files အားလုံး syntax check အောင်မြင်ပါတယ်။
- `npm run build` — ၂၀ section ပါတဲ့ site ကို build အောင်မြင်ပါတယ်။
- `npm run validate` — HTML template placeholder, unique IDs, configured sections, local resource links, data JSON wrapper structure, PWA manifest/icons, snapshot cache workflow စစ်ဆေးမှု အောင်မြင်ပါတယ်။
- `SITE_URL=https://example.github.io/kyallan/ npm run build` — canonical link, sitemap နဲ့ robots.txt generation ကို သီးခြားစမ်းသပ်ပြီး အောင်မြင်ပါတယ်။ Final build ကို `SITE_URL` မသတ်မှတ်ဘဲ ပြန်ထုတ်ထားပြီး ကိုယ့် GitHub repo URL ကို သတ်မှတ်ပြီးမှ deployment ထဲမှာ ထည့်ပေးနိုင်ပါတယ်။
- Mock API response နဲ့ fetcher ကို စမ်းသပ်ရာမှာ source ၆ ခုလုံး valid snapshot ထုတ်နိုင်ပါတယ်။ Network failure ကို simulation လုပ်ရာမှာ ယခင် snapshot ၆ ခုလုံး မပြောင်းဘဲ ကျန်ရှိခဲ့ပါတယ်။ **ဒီဟာက mock test ဖြစ်ပြီး live API end-to-end test မဟုတ်ပါ။**
- Browser smoke test မှာ API response အတုများနဲ့ widget ၉ ခုကို render လုပ်နိုင်ခဲ့ပါတယ်။ Menu open/close, theme toggle, section search နဲ့ calculator (row ၁၀ ခု) အောင်မြင်ပြီး 360, 390, 768, 1024, 1440px width များမှာ horizontal overflow မတွေ့၊ JavaScript page error မတွေ့ပါ။ Live external API traffic ကိုတော့ ဒီ test က မစမ်းထားပါ။
- Local preview server ကိုလည်း စမ်းထားပါတယ်—GET `200`, icon asset `200`, unsupported POST `405`, encoded path traversal က parent project file ကို မဖော်ပြဘဲ `404` ပြန်ပါတယ်။ `PORT` နဲ့ port ပြောင်းနိုင်ပါတယ်။
- Source assets ၁၆ ခုလုံးကို source HTML/CSS/JS ထဲမှာ reference ရှိ/မရှိ စစ်ရာမှာ unused asset candidate မတွေ့ပါ။ မလိုအပ်ကြောင်း မသေချာတဲ့ assets ကို မဖျက်ထားပါ။

## Deployment မှာ ထပ်စစ်ရန်

- ဒီ execution environment က DNS/egress ကန့်သတ်ချက်ကြောင့် project runtime ကနေ public API အားလုံးကို တိုက်ရိုက်ခေါ်ပြီး end-to-end အတည်မပြုနိုင်ခဲ့ပါ။ GitHub ပေါ်တင်ပြီးနောက် **Actions → Build, validate & deploy to GitHub Pages** မှာ `Fetch live data` အဆင့်ရဲ့ `ok` / `warning` output ကို စစ်ပါ။ ပထမ run မှာ cache မရှိသေးလို့ upstream API တချို့ မရနိုင်ရင် သက်ဆိုင်ရာ widget မှာ error/retry state ပေါ်နိုင်ပါတယ်။
- Repository → Settings → Pages မှာ **Source: GitHub Actions** ရွေးထားဖို့၊ Settings → Secrets and variables → Actions မှာ ကိုယ့် site URL ကို `SITE_URL` variable အဖြစ် ထည့်ဖို့လိုပါတယ်။ NASA API quota အတွက် အခမဲ့ key ကို `NASA_API_KEY` secret အဖြစ် ထည့်နိုင်ပါတယ်။
- Browser QA မှာ mock response အသုံးပြုထားတာကြောင့် တကယ့် URL ကို Chrome/Firefox နဲ့ ဖုန်းအရွယ်၊ tablet၊ laptop/desktop တို့မှာ ထပ်ဖွင့်စစ်ပါ။ API response နဲ့ network က အမှန်တကယ် ရလာမှသာ live-data rendering ကို အတည်ပြုနိုင်ပါတယ်။

## မူရင်းရင်းမြစ်များ

- NASA APOD API: <https://api.nasa.gov/> နှင့် <https://science.nasa.gov/wp-json/wp/v2/apod-basic/>
- Artemis schedule: <https://www.nasa.gov/missions/artemis/nasa-shares-plans-to-accelerate-artemis-return-to-moon/>
- Meteor shower calendar: <https://www.imo.net/calendar/>
- ISS position API limits: <https://www.media.wheretheiss.at/w/developer>
- Launch Library 2: <https://lldev.thespacedevs.com/docs>

Mission schedule နဲ့ astronomy event ရက်စွဲတွေ ပြောင်းနိုင်ပါတယ်။ ရက်နီးလာရင် မူရင်းအဖွဲ့အစည်းရဲ့ နောက်ဆုံးကြေညာချက်ကို ပြန်စစ်ဖို့ ရည်ရွယ်ထားပါတယ်။

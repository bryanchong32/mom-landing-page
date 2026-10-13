You are implementing CHAIN promo-ab of mom-landing-page (Tigrox Global marketing site, static HTML on nginx):
build version B of the Homega promo page, a server-side 50/50 A/B split on the same URL, switch version A's default
plan to 3 bottles, and tag every measurement with the version. You run unattended in a cloud sandbox; the orchestrator
reviews and merges your branch later. Be exact, be honest, never fake a pass. If a step cannot be verified in this
sandbox, say BLOCKED with the reason; never claim a check you did not run.

## Context (why)
- /promo/hmg/ is the landing page for Meta video ads (Hong Kong, Traditional Chinese, ages 30–65, ~95% phones,
  mostly Facebook's in-app browser). Checkout is an external store (store.tigroxglobal.com express links).
- Week-1 data: 73% of visitors never scroll past the first screen; the full plan/offer explanation sits 72% down and
  is reached by ~2%; 45% of all taps are on the FAQ at 80% down (top questions: 每日服用多少, 忘記服用一日,
  多久才會感覺到分別, 為何建議完整療程（6樽）, 誰不適合服用); 12 of 17 buy taps were on HK$3,000 buttons and none of
  the checkout visitors typed a phone number. A friend's review: "too many things, the offer is not clear".
- The owner (Bryan) approved: (1) default plan = 3 bottles (基本配套 HK$1,650) on BOTH versions, with 6 bottles offered
  as the upgrade that carries the 90-day money-back guarantee; (2) version B leads with who it's for + simplicity + one
  real customer quote; (3) a customer quote on screen 1. Test = same ads, same URL, server picks A or B 50/50 and
  remembers it per visitor.

## Setup
1. cd into the cloned repo (bryanchong32/mom-landing-page). git fetch origin.
2. Double-fire guard: if `git ls-remote --heads origin cloud/promo-ab` returns a branch, STOP and report
   "double-fire: cloud/promo-ab already exists" — build nothing.
3. git checkout -b cloud/promo-ab origin/main. Print `git log --oneline -1`; HEAD must be 6abed22 or a descendant.
4. Tools for verification (install, do not assume): nginx (`apt-get update && apt-get install -y nginx`, use sudo if
   needed) and Playwright Chromium (`npx -y playwright@1 install --with-deps chromium` or the closest that works).
   If either cannot be installed, continue the build and mark the dependent checks BLOCKED.
5. NEVER commit notes, reports, screenshots or any non-website file: the Dockerfile copies the whole repo into the
   public web root, so every committed file is publicly downloadable. Your report goes ONLY in your final message.
   Keep screenshots in /tmp.

## Protected — do not touch
- Branch main (pushing to main auto-deploys production). Do not merge. Push only cloud/promo-ab.
- Brand pages (/, /en/, /homega/, /imuglo/, /tiger-milk-king/, /policies/): no visual or copy changes. js/main.js is
  shared by all pages — changes there must be no-ops on pages that are not version-tagged (see Task 4).
- No new third-party scripts, fonts, CDNs or dependencies.
- Copy: use ONLY the text given in this brief or text that already exists in promo/hmg/index.html, verbatim. Customer
  quotes are verbatim, including typos (腳庫, 左, 果陣). Do not invent claims, numbers, ratings or stars. Keep every
  existing disclaimer/legal line that accompanies content you reuse (e.g. 「個人分享，效果因人而異。頭像僅作示意。」,
  record-card disclaimers, 「曲線只作示意…」, footer supplement disclaimer, sources list).

## Work (one commit per task, meaningful messages)

### Task 1 — Version A: default plan 3 bottles
File promo/hmg/index.html (+ promo/hmg/hmg2.js only if needed). On first render (before and after JS):
- Both pickers (name="plan-top" and name="plan-end"): value="3" is `checked`, not 6.
- Every `a[data-buy]` (hero, close, sticky): href → https://store.tigroxglobal.com/hk/zh-TW/express/3hmg,
  data-checkout="3box", data-value="1650", label 「購買基本配套 · HK$1,650」 (sticky label stays 「購買」).
- Sticky bar: [data-sticky-plan] 「基本配套 · 3樽」, [data-sticky-price] 「HK$1,650 · 每日 HK$18.3」.
- Box lineup ([data-boxes]) shows 3; the 3-bottle upgrade nudge is open on load (existing PLANS['3'].nudge text);
  the trustline guarantee link hides for non-6 (existing behaviour) — verify it.
- Leave the mid-page 「即刻購買 完整療程 · 6樽」 picks (data-cta chart / after-sgs / after-dose) unchanged.
- Switching plans must still update every button, label, sticky bar and nudge exactly as today (1 / 3 / 6).
- Add `<meta name="hmg-variant" content="a">` in <head>.

### Task 2 — Version B page: promo/hmg/b.html
A new file that reuses the same <head> (GA4, Meta pixel, Clarity snippets, fonts, design-tokens.css, hmg2.css, same
favicon, title, noindex robots meta if present), the same header and footer, and the same scripts (main.js, promo.js,
hmg2.js, t1.js). Add `<meta name="hmg-variant" content="b">`. New styles go in a new promo/hmg/b.css (do not restyle
version A). Phone-first; must also look tidy at desktop width. Blocks in this order:

**B1 — The offer (screen 1).** Hard requirement: at 375×812 AND 390×844 the buy button is fully visible without
scrolling. Content, top to bottom:
- Same header as A (tigrox | HOMEGA).
- Eyebrow: 為關注三高人士而設
- H1 (two lines): 「魚油、K2、D3」 / 「每日 2 粒，一次補足。」
- Proof line: 「✓ 已售出 50,000+ 瓶 · 香港用家原話 ↓」 — the 「香港用家原話 ↓」 part links to block B2.
- One quote card, reusing the existing voices card markup for Pinky P. (avatar, name, Verified badge, 「6樽完整療程 ·
  已回購 1 次」), with her message shortened ONLY by omission marked with 「…」:
  「未食前 個心好似頂住咁！… 一樽後 變綠色127-73」. Keep the legal line 「個人分享，效果因人而異。頭像僅作示意。」 under
  it in small type.
- A smaller product box lineup (existing [data-boxes] component; follows the selected plan) — shrink it as needed to
  meet the above-the-fold requirement.
- Compact plan picker (same radio/JS mechanics; data-plans fieldset so hmg2.js drives it): three compact rows,
  showing plan name + bottles/days + price only (no per-day line, no 慳 line on the rows):
  基本配套 · 3樽 · 90日 — HK$1,650 (checked) · 完整療程 · 6樽 · 180日 — HK$3,000 with the 「✓ 90日退款保證」 mark ·
  1樽 · 30日 — HK$700.
- Upgrade line, visible only while 3 bottles is selected, tapping it selects 6 (reuse the data-nudge-up behaviour,
  data-cta="nudge-upgrade"): 「升級 6樽完整療程 HK$3,000 · 每日 HK$16.7 · 享 90日退款保證 ›」. Do not also show the
  existing nudge box in B1 (avoid duplicate upgrade messages).
- Buy button (a[data-buy], data-cta="hero"): label follows the plan; default 「購買基本配套 · HK$1,650」 → 3hmg.
- Under the button, one small line: 「順豐（特快）1–2日 · 免運費 · 官方正品」 and the existing payment logos row.

**B2 — 用家的原話。** Reuse the existing voices section heading and sub-line, and its card markup, with exactly three
cards: Kin T., 霍生, Catherine C. (verbatim, same badges), plus the existing legal line under the cards. Below them, a
「了解更多：用家健康記錄 ›」 expander that reveals the existing 用家健康記錄 record cards (verbatim, with their
disclaimers).

**B3 — 買之前，最多人問的 4 個問題** (answers always visible, not an accordion):
1. 多久才會感覺到分別？ — 因人而異，我們不會承諾效果在某個時間出現。Omega-3 一般要 4–6 個月才在紅血球中累積到穩定水平，
   所以建議每日持續服用。 + the existing timing chart (the #timing figure with its 「曲線只作示意…」 note and sources
   markers) if it can be reused without new animation code; otherwise a link 「看累積時間示意圖 ›」 that opens it in B4.
2. 為何建議 6 樽？ — 180 日涵蓋整段 4–6 個月累積期，每日成本最低（HK$16.7），亦只有完整療程享 90日退款保證。想先試，可選 3 樽。
   Add a small button 「改選完整療程」 (data-nudge-up behaviour, data-cta="b3-upgrade").
3. 每日服用多少？ — 每日 2 粒，早餐及晚餐後各 1 粒，用水吞服。忘記一日？下一餐照常服用，毋須補服。
4. 誰不適合？正在服藥可以嗎？ — 正在服用華法林（Warfarin）、孕婦及哺乳婦女、18 歲以下、癌症第 3–4 期或正接受化療／放射
   治療人士不應服用。正在服藥請先諮詢醫生，並與藥物相隔最少 2 小時。
   Under it: 「完整安全須知 ›」 linking to the full FAQ item in B6.
Keep the source-number superscripts where reused text had them.

**B4 — 為何選擇 Homega？** Three rows, each with a 「了解更多 ›」 expander that reveals the FULL existing section from
version A, verbatim (same markup/classes so existing CSS/JS keep working; make sure animations, the report viewer and
any IntersectionObserver-driven pieces still work when revealed):
- 三合一：D3 決定吸收多少鈣，K2 決定鈣去哪裡。 → reveals the 三合一 MTR section.
- 看 EPA+DHA，不看總油量：每粒 468mg，一般 1000mg 魚油只有 300mg。 → reveals the dose section.
- 公開檢測：IFOS 5星 · TOTOX 8（業界上限 26）· SGS 報告。 → reveals the 從大海 / source section incl. SGS + IFOS viewer.
- A fourth expander 「專家及影片 ›」 → reveals the MRBA experts and 專家講解 video sections.
Expanders: accessible (button with aria-expanded, or <details>), closed by default. Remove the mid-page
「即刻購買」 picks from inside the revealed copies (B has its buy points elsewhere).

**B5 — Plans again.** The existing closing #pricing block ("開始你的 180 日。" picker, guarantee link, trust grid:
official store, SF delivery, returns, payment), 3 bottles checked, data-cta="close".

**B6 — 常見問題.** The full existing FAQ (all 24, same accordion), then the sources list and the footer/legal, verbatim.

Sticky bar: same as A, following the plan (default 基本配套 · 3樽 / HK$1,650 · 每日 HK$18.3).

### Task 3 — Server-side split in nginx.conf
For exactly `/promo/hmg/` (and `/promo/hmg` → 301 to `/promo/hmg/` preserving the query string):
- Variant precedence: query `?v=a|b` (preview) > cookie `hmgv=a|b` > random 50/50 (`split_clients` on something
  unique per request, e.g. `$request_id`).
- Serve promo/hmg/index.html for a, promo/hmg/b.html for b, with an INTERNAL rewrite (the address bar never changes;
  all query strings such as utm_* and fbclid are preserved for the page's JS).
- Set `Set-Cookie: hmgv=<variant>; Path=/promo/hmg/; Max-Age=2592000; SameSite=Lax; Secure` on every response for that
  URL, plus `Cache-Control: private, no-store` and `Vary: Cookie`.
- Keep the existing /promo/ headers (X-Robots-Tag noindex, nofollow + the three security headers) on these responses
  (remember: add_header inside a location replaces the server-level ones — repeat them).
- Requesting /promo/hmg/b.html directly: 301 to /promo/hmg/?v=b (so B is never a separate public address).
- Every other path behaves exactly as before (brand pages, /en/, /policies/, assets, /promo/campaign.json).

### Task 4 — Measurement tagged with the version (js/main.js + the two promo HTML heads)
Read the variant from `<meta name="hmg-variant">`. If the meta is absent (brand pages), everything stays exactly as today.
When present (v = a|b):
- GA4: add `hmg_variant: v` to the inline `gtag('config', 'G-GYFB8NWCDH', …)` call in each promo file's head so every
  GA4 event of the session carries it; also add it to the begin_checkout params.
- Meta pixel: add `variant: v` to the BuyTap custom data. No other new Meta events.
- Clarity: `window.clarity('set', 'hmg_variant', v)` once on load (the Clarity snippet queues calls, so this is safe).
- Store links: after the existing ad-tag copy, set `utm_medium` on each a[data-checkout] link to
  `(incoming utm_medium || 'direct') + '_' + v` (e.g. paid_a, paid_b) — the store records utm_medium on each order, so
  orders can be counted per version. Do not touch other utm keys.
- New engagement events (both versions, same names), each sent to GA4 (`gtag('event', name, {…, hmg_variant: v})`)
  and Clarity (`clarity('event', name)`):
  `faq_open` {faq: first 30 chars of the question} when an FAQ item opens; `report_open` {report: id or filename}
  when the SGS/IFOS viewer opens; `video_play` {video: 'arlene' | 'dr-alan'} on first play of each video;
  `more_open` {block: …} when a B4/B2 expander opens (B only).
- Bump the ?v= cache-busting query on every changed CSS/JS reference in both promo files.

### Task 5 — Keep internal files out of the public web root
- Add `.dockerignore` excluding: .git, .claude, .DS_Store, .research-tmp, **/*.md, .dockerignore. (Do NOT exclude
  nginx.conf or Dockerfile — the Dockerfile copies nginx.conf by name.)
- In the Dockerfile, after `COPY . /usr/share/nginx/html/`, remove Dockerfile and nginx.conf from the web root
  (`RUN rm -f /usr/share/nginx/html/Dockerfile /usr/share/nginx/html/nginx.conf`).
- In nginx.conf, deny dotfiles: `location ~ /\. { deny all; return 404; }` placed so it cannot shadow real pages.

## Verify (run after each task where relevant; final full run at the end)
1. `nginx -t` with a test copy of nginx.conf whose `root` points at the repo and `listen` at 8080; run nginx with it.
2. curl checks against http://127.0.0.1:8080 (fresh cookie jar each time unless stated):
   - 40 fresh requests to /promo/hmg/ → both variants occur (each between 10 and 30), every response has Set-Cookie
     hmgv, Cache-Control private/no-store, X-Robots-Tag noindex. Identify the variant by the hmg-variant meta.
   - With cookie hmgv=b: 10/10 return B; hmgv=a: 10/10 return A. `?v=b` returns B and sets hmgv=b.
   - `/promo/hmg/?utm_source=facebook&utm_medium=paid&fbclid=x` returns 200 with the query preserved for the page.
   - /promo/hmg/b.html → 301 to /promo/hmg/?v=b. /promo/hmg → 301 to /promo/hmg/.
   - Unchanged: /, /en/, /policies/money-back-guarantee/, /promo/campaign.json, a CSS file — same status and headers
     as on origin/main (compare against nginx running origin/main's config, or state what you compared).
   - Dotfiles: /.gitignore → 404 (not the index fallback).
3. Playwright (Chromium, mobile emulation, user agent of an Android phone), for A (?v=a) and B (?v=b), at 375×812 and
   390×844, with window.gtag / fbq / clarity stubbed to record calls:
   - No horizontal overflow (document.documentElement.scrollWidth <= clientWidth) on the full page.
   - B: the hero buy button's bottom edge < viewport height on both sizes. A: report where it is.
   - Default plan is 3 bottles on load; buy links → 3hmg with data-value 1650; switching to 6 and 1 updates all
     buttons, labels, sticky bar and (B) the upgrade line; the guarantee link shows only for 6.
   - With ?utm_source=facebook&utm_medium=paid&fbclid=x: every store link carries utm_source, fbclid and
     utm_medium=paid_a (A) / paid_b (B).
   - Tapping a buy button records BuyTap with cta + variant, begin_checkout with hmg_variant; opening an FAQ item,
     a report, an expander (B) and playing a video records the new events; clarity('set','hmg_variant',…) was called.
   - Zero console errors; no 4xx/5xx requests for local assets.
   - Brand homepage /: no hmg_variant in any recorded call; store links unchanged in format (no _a/_b suffix).
   - Save first-screen and full-page screenshots for A and B at 390×844 in /tmp (not committed); describe in the report
     what is above the fold on each.
GREEN means: every check above passes, or is reported BLOCKED with the exact reason. Any FAIL must be fixed or reported.

## Report (your last message, exactly this shape)
- Branch + final commit hash (pushed)
- Per task 1–5: done / partial / blocked, with commit hash and the verify lines that prove it
- The verify table: check → PASS / FAIL / BLOCKED (reason)
- Above-the-fold description for A and B at 375×812 and 390×844
- Anything you changed outside the task scope, and why
- Copy you could not place as specified, and what you did instead
- Open questions for the orchestrator
Push cloud/promo-ab. Do not merge. Do not push main.

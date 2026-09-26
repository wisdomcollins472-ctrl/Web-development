// Browser verification for the Benson Idahosa University campus site.
//
//   node tools/verify-site.mjs                       # http://127.0.0.1:8080
//   BASE=https://…node tools/verify-site.mjs         # verify a deployed URL
//
// Needs a chromium binary. Either install playwright's own build
// (`npx playwright install chromium`) or, where that CDN is unreachable,
// `npm i playwright-core @sparticuz/chromium` — the script falls back to the
// latter automatically.
import { chromium as pw } from 'playwright-core';
import fs from 'fs';

let chromium = null;
try { chromium = (await import('@sparticuz/chromium')).default; } catch { /* use playwright's build */ }
process.env.LD_LIBRARY_PATH = ['/tmp/al2023/lib','/tmp','/usr/lib'].filter(Boolean).join(':');

const BASE = process.env.BASE || 'http://127.0.0.1:8080/';
const OUT = process.env.SHOTS || '/tmp/shots';
fs.mkdirSync(OUT, { recursive: true });

const args = [
  '--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu',
  '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--hide-scrollbars',
  '--autoplay-policy=no-user-gesture-required', '--mute-audio',
];
process.env.LD_LIBRARY_PATH = ['/tmp/al2023/lib','/tmp','/usr/lib'].join(':');
const exe = chromium ? await chromium.executablePath() : undefined;
const browser = await pw.launch({ ...(exe ? { executablePath: exe } : {}), args, headless: true });

const results = [];
const check = (name, pass, detail = '') => {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
};

async function run(label, opts) {
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  const errors = [];
  const failed = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('response', (r) => { if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`); });

  await page.goto(BASE, { waitUntil: 'load' });
  await page.waitForTimeout(1200);

  const meta = await page.evaluate(() => ({
    title: document.title,
    h1: document.querySelector('h1')?.innerText.replace(/\s+/g, ' ').trim(),
    desc: document.querySelector('meta[name=description]')?.content,
    og: document.querySelector('meta[property="og:image"]')?.content,
    canonical: document.querySelector('link[rel=canonical]')?.href,
    sections: [...document.querySelectorAll('main section')].map((s) => s.id).filter(Boolean),
  }));
  check(`${label} · title`, /Benson Idahosa University/.test(meta.title), meta.title);
  check(`${label} · h1`, /Where learning takes root/.test(meta.h1 || ''), meta.h1);
  check(`${label} · og image`, !!meta.og && /og-image\.jpg$/.test(meta.og), meta.og);
  check(`${label} · sections`, ['campus', 'on-campus', 'voices', 'visit'].every((s) => meta.sections.includes(s)), meta.sections.join(','));

  // --- hero film ---
  const v = await page.evaluate(async () => {
    const el = document.getElementById('heroVideo');
    if (!el) return { missing: true };
    const t0 = el.currentTime;
    await new Promise((r) => setTimeout(r, 900));
    return {
      missing: false,
      muted: el.muted, loop: el.loop, playsInline: el.playsInline,
      poster: el.getAttribute('poster'),
      src: (el.currentSrc || el.src).split('/').pop(),
      readyState: el.readyState, paused: el.paused,
      advanced: el.currentTime - t0,
      w: el.videoWidth, h: el.videoHeight,
      visible: getComputedStyle(el).opacity,
    };
  });
  if (opts.reducedMotion) {
    check(`${label} · reduced-motion keeps the still`, v.src === '' && v.readyState === 0, `src=${v.src} poster=${!!v.poster}`);
  } else {
    check(`${label} · film loads`, v.readyState >= 2 && v.w >= 1280, `${v.src} ${v.w}x${v.h}`);
    check(`${label} · muted + looping + inline`, v.muted && v.loop && v.playsInline, `muted=${v.muted} loop=${v.loop} inline=${v.playsInline}`);
    check(`${label} · autoplaying`, !v.paused && v.advanced > 0.1, `t+${v.advanced.toFixed(2)}s paused=${v.paused}`);
    check(`${label} · poster frame present`, /campus-loop-poster\.jpg$/.test(v.poster || ''), v.poster);
    check(`${label} · video visible`, parseFloat(v.visible) > 0.9, `opacity=${v.visible}`);
  }

  // --- parallax ---
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(250);
  const before = await page.evaluate(() => {
    const els = [...document.querySelectorAll('[data-parallax]')];
    return els.map((e) => getComputedStyle(e).transform);
  });
  await page.evaluate(() => window.scrollBy(0, window.innerHeight * 0.9));
  await page.waitForTimeout(600);
  const after = await page.evaluate(() => {
    const els = [...document.querySelectorAll('[data-parallax]')];
    return els.map((e) => ({
      t: getComputedStyle(e).transform,
      prop: e.style.transform,
      depth: e.dataset.parallax,
    }));
  });
  const moved = after.filter((a, i) => a.t !== before[i]);
  const translateOnly = after.every((a) => a.t === 'none' || /^matrix3d|^matrix/.test(a.t));
  const depths = [...new Set(after.map((a) => a.depth))];
  if (opts.reducedMotion) {
    check(`${label} · parallax off for reduced motion`, moved.length === 0, `${moved.length} moved`);
  } else {
    check(`${label} · parallax layers move`, moved.length >= 2, `${moved.length}/${after.length} layers moved`);
    check(`${label} · transform-only (no layout thrash)`, translateOnly, '');
    check(`${label} · multiple depths`, depths.length >= 3, `depths: ${depths.join(', ')}`);
  }

  // --- hero composition: key facts must land inside the first screen ---
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(350);
  const comp = await page.evaluate(() => {
    const f = document.querySelector('.hero__facts').getBoundingClientRect();
    const cue = document.querySelector('.scroll-cue');
    const hero = document.querySelector('.hero').getBoundingClientRect();
    return { factsBottom: Math.round(f.bottom), heroTop: Math.round(hero.top), vh: window.innerHeight, cue: cue ? getComputedStyle(cue).display : 'none' };
  });
  check(`${label} · hero starts at the top`, Math.abs(comp.heroTop) <= 1, `heroTop=${comp.heroTop}`);
  check(`${label} · fact strip inside first screen`, comp.factsBottom <= comp.vh + 1, `bottom=${comp.factsBottom} vh=${comp.vh}`);
  if (!opts.reducedMotion && opts.viewport.width >= 900) {
    check(`${label} · scroll cue shown`, comp.cue === 'flex', comp.cue);
  }

  // --- links ---
  const links = await page.evaluate(() =>
    [...document.querySelectorAll('a[href]')].map((a) => ({
      href: a.getAttribute('href'), target: a.target, rel: a.rel,
      text: a.textContent.trim().slice(0, 40),
    })));
  const maps = links.filter((l) => /google\.[a-z.]+\/maps/.test(l.href));
  check(`${label} · maps links present`, maps.length >= 4, `${maps.length} maps links`);
  check(`${label} · maps links open safely`, maps.every((l) => l.target === '_blank' && l.rel.includes('noopener')), '');
  const dir = maps.filter((l) => l.href.includes('/maps/dir/'));
  check(`${label} · tap-to-directions links`, dir.length >= 2, `${dir.length} directions links`);
  const badDir = dir.filter((l) => !/destination=.*Agboma/.test(decodeURIComponent(l.href)));
  check(`${label} · directions target the address`, badDir.length === 0, badDir.map((b) => b.text).join(','));
  const anchors = links.filter((l) => l.href.startsWith('#') && l.href.length > 1);
  const dangling = await page.evaluate((as) => as.filter((a) => !document.querySelector(a)), anchors.map((a) => a.href));
  check(`${label} · no dangling anchors`, dangling.length === 0, dangling.join(','));

  // --- copy + map interactions ---
  await page.evaluate(() => document.getElementById('copyCode')?.scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(200);
  await page.locator('#copyCode').click();
  await page.waitForTimeout(200);
  const copied = await page.locator('#copyCode span').innerText();
  check(`${label} · plus-code copy feedback`, /copied/i.test(copied), copied);

  const iframeCount = await page.locator('#map iframe').count();
  check(`${label} · map stays unloaded until asked`, iframeCount === 0, `${iframeCount} iframes`);
  await page.locator('#loadMap').scrollIntoViewIfNeeded();
  await page.locator('#loadMap').click();
  await page.waitForTimeout(900);
  const iframeAfter = await page.locator('#map iframe').count();
  check(`${label} · map embed loads on demand`, iframeAfter === 1, `${iframeAfter} iframe`);

  // --- responsive nav (small screens only) ---
  if (opts.viewport.width < 500) {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.locator('#burger').click();
    await page.waitForTimeout(450);
    const open = await page.locator('#nav').evaluate((n) => n.classList.contains('is-open'));
    const expanded = await page.locator('#burger').getAttribute('aria-expanded');
    check(`${label} · mobile drawer opens`, open && expanded === 'true', `open=${open} aria=${expanded}`);
    await page.locator('#nav a[href="#visit"]').click();
    await page.waitForTimeout(600);
    const closed = await page.locator('#nav').evaluate((n) => !n.classList.contains('is-open'));
    check(`${label} · drawer closes on navigate`, closed, '');
  }

  // --- horizontal overflow ---
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check(`${label} · no horizontal overflow`, overflow <= 1, `${overflow}px`);

  // --- a11y basics ---
  const a11y = await page.evaluate(() => ({
    imgsNoAlt: [...document.querySelectorAll('img')].filter((i) => !i.hasAttribute('alt')).length,
    h1count: document.querySelectorAll('h1').length,
    landmarks: ['header', 'main', 'footer'].every((t) => document.querySelector(t)),
    skip: !!document.querySelector('.skip'),
  }));
  check(`${label} · accessibility basics`, a11y.imgsNoAlt === 0 && a11y.h1count === 1 && a11y.landmarks && a11y.skip, JSON.stringify(a11y));

  check(`${label} · no console errors`, errors.length === 0, errors.slice(0, 3).join(' | '));
  check(`${label} · no failed requests`, failed.length === 0, failed.slice(0, 3).join(' | '));

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/${label}-hero.png` });
  await page.screenshot({ path: `${OUT}/${label}-full.png`, fullPage: true });

  await ctx.close();
}

await run('desktop', { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
await run('mobile', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' });
await run('reduced-motion', { viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });

await browser.close();
const failedCount = results.filter((r) => !r.pass).length;
console.log(`\n${results.length - failedCount}/${results.length} checks passed`);
process.exit(failedCount ? 1 : 0);

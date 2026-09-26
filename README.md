# Web-development

Static sites built in this repo.

| Site | Path | Live |
| --- | --- | --- |
| **Benson Idahosa University** — campus guide for 15 Agboma St, Ogogugbo, Benin City | [`docs/`](docs/) | https://wisdomcollins472-ctrl.github.io/Web-development/ |
| Aurelia Travels — travel showcase (earlier build) | [`index.html`](index.html) | — |

## Benson Idahosa University — `docs/`

A single-page campus guide. Plain HTML/CSS/JS, no build step, deployed from the
`docs/` folder via GitHub Pages.

```
docs/
  index.html              markup + JSON-LD (CollegeOrUniversity)
  assets/css/site.css     design tokens, layout, motion
  assets/js/site.js       hero film, parallax, reveals, nav, copy, map
  assets/video/           hero film (1080p + 720p + poster frame)
  assets/img/             photography, logo mark, app icons
  assets/fonts/           self-hosted Fraunces + Manrope (woff2)
  og-image.jpg            Open Graph card (1200x630)
```

**Hero film** — a bespoke 25 s loop, cut and graded from original generated
frames: six campus shots (dawn aerial, tree-lined walk, Edo-bronze sculpture,
lecture hall, green court, blue hour) cross-dissolved, with a period-matched
Ken Burns so the last frame flows back into the first. Muted, looping, poster
frame set, `playsinline`, with a 720p rendition served to small screens and
`preload="none"` so it never blocks first paint. It is held on its poster frame
entirely for `prefers-reduced-motion` visitors.

**Parallax** — transform-only (`translate3d`) layers at eight depths, gated by
`IntersectionObserver`, amplitude trimmed on small screens and switched off
under reduced motion.

**Serving locally** (range requests included, so video scrubbing works):

```bash
node tools/static-server.js docs 8080
```

**Browser verification** — 75 checks across desktop, mobile and reduced-motion
contexts (video autoplay/loop/poster, parallax depth and transform-only motion,
tap-to-directions links, plus-code copy, on-demand map embed, overflow, alt
text, console and network errors):

```bash
node tools/verify-site.mjs        # requires a chromium binary + playwright-core
```

Content note: address, hours, rating and the two review quotes come from the
public Google Maps listing. Nothing else about the institution is asserted.

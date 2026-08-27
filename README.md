# m1dn1ght.com

Brand site for **M1DN1GHT Ventures** — holding co.

Dark Signal identity: shredded cobalt orbs refracted through vertical glass
blinds, rendered live in WebGL (Three.js fullscreen shader), with animated
film grain and pointer parallax. Wordmark set in Michroma; annotations in
IBM Plex Mono.

## Stack

- Static HTML/CSS + one ES module
- [Three.js](https://threejs.org) via CDN import map — no build step
- Respects `prefers-reduced-motion` (renders a single still frame)
- CSS radial-gradient fallback when WebGL is unavailable

## Develop

Any static server works:

```sh
python3 -m http.server 8080
```

## Deploy

GitHub Pages, `main` branch, root. `CNAME` targets `m1dn1ght.com` — point the
domain's DNS (A records to GitHub Pages IPs, or ALIAS/ANAME) and enable Pages
in repo settings.

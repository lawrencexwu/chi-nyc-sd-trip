# chi-nyc-sd-trip

Static itinerary site for the June 2026 trip: **Chicago → New York → San Diego → Los Angeles → Taipei** (Wed 6/10 depart TPE – Wed 6/24 arrive TPE).

- **`index.html`** — the rendered itinerary site. Open it in a browser; no build step or dependencies.
- **`style.css`** — the site's styles (a bilingual English / 繁體中文 "wabi-sabi" editorial theme: Cormorant Garamond + Noto Serif TC + Inter on a warm parchment palette).
- **`script.js`** — persists the booking-checklist checkbox state via `localStorage`.
- **`itinerary-v3.md`** — the source of truth the content is drawn from.

The site covers an overview (arc / schedule), a day-by-day timeline per city (Chicago · New York · San Diego · Los Angeles), flights & rail, hotels, suggestions, changes & flags, and a booking checklist. Fonts and the city/overview photos load from Google Fonts and Unsplash at view time; everything else is self-contained.

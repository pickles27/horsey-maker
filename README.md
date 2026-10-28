# Horsey Maker 🐴

A tiny Next.js app for designing silly racing horsies for the office race board. Pick colors, patterns, leg length,
leg count, hair, face and headwear, then download a PDF to print, cut out and stick on the whiteboard with a magnet.

- **Customize:** coat, pattern (stripes, spots, patches, checkers), hair and tail, hooves, body/neck/leg proportions,
  number of legs, eyes, mouth, headwear, racing number, facing direction
- **Save:** horsies are kept in the browser's local storage ("Your stable"), no account or database needed
- **Share:** Download PDF (US Letter, a 3 in horsey with a dotted cut line), PNG for Slack, or Copy link, which puts
  the whole design in the URL

## Run it locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Deploy to Vercel

1. Push this repo to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new), import the repo, and click **Deploy**. No settings or environment
   variables are needed.

Or from the terminal with the [Vercel CLI](https://vercel.com/docs/cli): `npx vercel` (then `npx vercel --prod`).

## Where things live

- `src/lib/horsey.ts` – the horsey data shape, defaults, randomizer and share-link encoding
- `src/components/HorseySvg.tsx` – draws a horsey as SVG from its settings
- `src/components/HorseyMaker.tsx` – the editor, stable and export buttons
- `src/lib/exportHorsey.ts`, `src/lib/pdfLayout.ts` – PNG and PDF export

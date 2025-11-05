# rPETro Dragonic Apocalypse - Raffle Site

A raffle website for King Gizzard & The Lizard Wizard's PetroDragonic Apocalypse album - the world's first 12" EcoSonic Record created from 100% recycled plastic (rPET), manufactured by Good Neighbor.

## Features

- **Interactive 3D 12" EcoSonic Record Cube**: WebGL-powered rotating 12" EcoSonic Record visualization using Three.js
- **Raffle Entry System**: Users can enter to purchase one of 70 remaining copies
- **Song Selection**: Participants select their favorite track from the album
- **Responsive Design**: Optimized for desktop and mobile devices
- **Animated Characters**: Playful SVG characters that float around the page
- **SQLite Database**: Stores raffle entries with validation

## Tech Stack

- **Frontend**: SvelteKit 2 with Svelte 5
- **Styling**: Tailwind CSS 4
- **3D Graphics**: Three.js
- **Database**: better-sqlite3
- **Deployment**: Cloudflare Workers (adapter-cloudflare)
- **Language**: TypeScript

## Developing

Install dependencies:

```sh
npm install
```

Start the development server:

```sh
npm run dev

# or start and open in browser
npm run dev -- --open
```

## Building

Create a production build:

```sh
npm run build
```

Preview the production build:

```sh
npm run preview
```

## Deployment

Deploy to Cloudflare Workers:

```sh
npm run deploy
```

## Project Structure

- `/src/lib/components/` - Svelte components (VinylCube, RaffleForm, etc.)
- `/src/routes/` - SvelteKit routes and pages
- `/static/` - Static assets (images, SVGs, videos)
- `/static/kglw_songs.json` - Album track listing data

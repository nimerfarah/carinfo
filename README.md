# Israeli Vehicle Information

Production-ready React application that retrieves **all available government open-data** about an Israeli vehicle using only its license plate (מספר רכב).

Data is fetched in parallel from every CKAN resource documented at:

[Car Check IL — Data Sources](https://car-check-il.netlify.app/guides/car-check-data-sources/)

## Features

- Configuration-driven dataset catalog (`src/config/datasets.ts`)
- Parallel queries via `Promise.allSettled()` — one failure never blocks others
- TanStack Query caching, Axios timeouts, AbortController cancellation
- Summary card, expandable dataset cards, key/value + table views
- Search history (last 10 in `localStorage`)
- Dark / light mode
- Export JSON, CSV, PDF, print report, copy JSON, shareable URL (`?plate=`)
- Glassmorphism UI with Framer Motion animations
- Fully responsive

## Tech Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4
- shadcn-style Radix UI primitives
- Lucide Icons + Framer Motion
- TanStack Query + Axios

## Getting Started

### Requirements

- Node.js 20+ (recommended) or 18.18+
- npm 9+

### Install & run

```bash
nvm use        # Node 22 (see .nvmrc) — Node 20.19+ required
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

In development, the browser calls `https://data.gov.il` directly (CORS is open).
A Vite `/api/gov` proxy is also configured and will use `HTTPS_PROXY` from
`.env.development` when present (needed on some corporate networks for Node DNS).

> **Corporate networks:** this repo includes a local `.npmrc` and `.env.development`
> with an HTTP proxy for Amdocs environments. Outside that network, remove or
> empty those files before `npm install` / `npm run dev`.

### Production build

```bash
npm run build
npm run preview
```

Deploy the `dist/` folder to any static host (Netlify, Vercel, GitHub Pages, S3, etc.).

Production builds call `https://data.gov.il` directly. If a host blocks cross-origin requests, configure a reverse proxy similar to the Vite proxy in `vite.config.ts`.

## Project Structure

```
src/
  components/     # SearchBar, DatasetCard, SummaryCard, tables, export toolbar…
  config/
    datasets.ts   # ALL government resource IDs — add new datasets here only
  hooks/
    useCarSearch.ts
    useTheme.tsx
  pages/
    Home.tsx
  services/
    carApi.ts     # fetchDataset / fetchAllDatasets
  types/
    Dataset.ts
  utils/
    formatters.ts
    export.ts
    searchHistory.ts
```

## Datasets Included

All 12 resources from the official Car Check data-sources guide:

| Dataset | Resource ID |
| --- | --- |
| Private & Commercial (active) | `053cea08-09bc-40ec-8f7a-156f0677aff3` |
| Public vehicles | `cf29862d-ca25-4691-84f6-1be60dcb4a1e` |
| Personal import | `03adc637-b6fe-402b-9937-7c3d3afc9140` |
| Inactive + model code | `f6efe89a-fb3d-43a4-bb61-9bf12a9b9099` |
| Inactive without model | `6f6acd03-f351-4a8f-8ecf-df792f4f573a` |
| Final cancellation | `851ecab1-0622-4dbe-a6c7-f950cf82abf9` |
| Disability parking tag | `c8b9f9c8-4612-4068-934f-d4acd2e3c06e` |
| Test mileage history | `56063a99-8a3e-4ff4-912e-5966c0279bad` |
| Ownership history | `bb2355dc-9ec7-4f06-9c3f-3344672171da` |
| WLTP model specs | `142afde2-6228-49f9-8a29-9b6c3a0cbe40` |
| Outstanding recalls | `36bf1404-0be4-49d2-82dc-2f1ead4a8b93` |
| Recall catalog | `2c33523f-87aa-44ec-a736-edbb0a82975e` |

Empty results are hidden. Failed datasets show an “Unavailable” state without interrupting the rest.

## Model specs (engine cc / HP)

Plate licensing rows do **not** include displacement or horsepower. Those live in the
**WLTP model catalog** (`142afde2-…`), keyed by `tozeret_cd` + `degem_cd`.

The app:
1. Searches all datasets by plate in parallel
2. For datasets with `enrichFrom` (WLTP), runs a second lookup using manufacturer/model codes from the licensing result

That is how other apps show ~1500 cc / 150 HP for cars like `40737503`.

## Adding a New Dataset

1. Open `src/config/datasets.ts`
2. Append an object:

```ts
{
  id: "my-new-dataset",
  name: "My Dataset",
  nameHe: "המאגר שלי",
  resourceId: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  description: "What this dataset contains.",
  category: "licensing", // licensing | history | safety | technical | accessibility
  icon: "car",           // see DatasetIconName in types/Dataset.ts
}
```

3. Save — no other business-logic changes required. The next search will query it automatically.

## API

Every request:

```
GET https://data.gov.il/api/3/action/datastore_search
  ?resource_id=<RESOURCE_ID>
  &q=<CAR_NUMBER>
```

Implemented in `src/services/carApi.ts` with:

- Axios + 20s timeout
- AbortController
- `Promise.allSettled` across all configured datasets

## License

MIT — data © Government of Israel / data.gov.il open data terms.

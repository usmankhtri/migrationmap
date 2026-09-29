# MigrationMap 🗺️⚡

> **"Map, validate, and ship website redirects without expensive SEO software."**

MigrationMap is a free, privacy-first website migration assistant for developers, SEO professionals, agencies, freelancers, and website owners. It pairs legacy URLs to modern destinations using deterministic string and semantic heuristics, validates your redirect topology for loops and chains, and exports production-ready redirect rules for **Next.js, Vercel, Netlify, Apache, and Nginx**.

---

## 🌟 Key Features

- **⚡ Deterministic Multi-Signal Matching:** Evaluates 11 distinct mathematical heuristics (exact path, slug similarity, path segment alignment, Jaccard keyword overlap, numeric entity ID preservation, hierarchy depth, legacy extension drops) with zero probabilistic hallucinations.
- **🛡️ Migration Health & Redirect Doctor:** Directed-graph cycle analysis detects:
  - Potential redirect loops (`/a → /b` and `/b → /a`)
  - Redirect chains (`A → B → C`)
  - Self-redirects (`/a → /a`)
  - High fan-in soft-404 risks
  - Unmapped orphan URLs
  - Trailing slash & protocol inconsistencies
- **🔒 100% Client-Side Privacy:** All CSV, TXT, and XML Sitemap parsing runs exclusively in your browser. Unreleased staging URLs and client catalogs are never uploaded to remote servers or third-party AI models.
- **📦 Multi-Format Redirect Exporters:**
  1. **Next.js:** `async redirects()` configuration for `next.config.js`
  2. **Vercel:** `vercel.json` edge redirect payload
  3. **Netlify:** `_redirects` file syntax with status overrides
  4. **Apache:** `.htaccess` `mod_rewrite` RewriteRule directives
  5. **Nginx:** `location = /old { return 301 /new; }` server blocks
  6. **CSV:** Spreadsheet export with formula injection escaping
  7. **JSON:** Machine-readable redirect schema
  8. **Markdown:** Executive migration report with tables & stats

---

## 📸 Screenshots

*(Dashboard, Review Table, Issue Detector, and Rule Exporter views)*

```
+-----------------------------------------------------------------------------------+
|  MigrationMap                                 [Overview] [Mappings] [Issues] [Exports] |
+-----------------------------------------------------------------------------------+
|  [ Total Old: 1,248 ]  [ New: 1,190 ]  [ Approved: 982 ]  [ Issues: 3 Loops ]      |
|                                                                                   |
|  Mapping Coverage: [████████████████████░░░░] 84%                                 |
|                                                                                   |
|  Review Table:                                                                    |
|  OLD URL                     NEW URL                 CONFIDENCE   REASON          |
|  /products/iphone-case       /shop/iphone-case       98% [High]   Slug + Keywords |
|  /blog/seo-guide             /resources/seo-guide    94% [High]   Directory Shift |
|  /categories/mens.html       /collections/mens       91% [High]   Clean Extension |
+-----------------------------------------------------------------------------------+
```

---

## 🔬 Matching Methodology (The 11 Signals)

Every old URL is evaluated against candidate destination URLs using an inverted index and a multi-factor deterministic scoring matrix:

1. **Exact Path Match (100%):** Identical character-for-character path equality.
2. **Exact Slug Match:** Terminal slug comparison after stripping separators.
3. **Levenshtein Slug Similarity:** Normalized string edit distance across page slugs.
4. **Path Segment Alignment:** Positional and permutation segment-by-segment alignment.
5. **Keyword Overlap:** Jaccard similarity index on non-stopword lexical tokens.
6. **Extension Handling:** Clean detection of legacy drops (`.html`, `.php`, `.aspx`).
7. **Full Path Similarity:** Global string distance across the entire URI path.
8. **Hierarchy Depth:** Comparison of directory nesting depth levels.
9. **Entity ID Match:** Exact preservation of numeric identifiers (e.g. SKU `#1042`).
10. **Token Normalization:** Punctuation sanitization and percent-decoding.
11. **Directory Transformations:** Recognizing common directory shifts (`/blog/` → `/resources/`, `/products/` → `/shop/`).

---

## 📁 Project Structure

```
├── public/
│   ├── robots.txt            # Search engine crawling rules
│   └── sitemap.xml           # XML sitemap for SEO
├── src/
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── DashboardOverview.tsx    # Metrics, coverage bar, confidence distribution
│   │   │   ├── ImportWizard.tsx         # CSV (with column selector), TXT, XML parser
│   │   │   ├── MappingReviewTable.tsx   # Interactive review, search, bulk actions
│   │   │   ├── IssueDetectorView.tsx    # Loop, chain, and self-redirect analyzer
│   │   │   ├── ExportView.tsx           # 8 production export formats & syntax preview
│   │   │   └── SettingsView.tsx         # Normalization toggles & thresholds
│   │   └── layout/
│   │       ├── Navbar.tsx               # Top header, navigation, and theme toggle
│   │       └── Footer.tsx               # Product links and privacy notice
│   ├── context/
│   │   ├── MigrationContext.tsx         # State management & analysis pipeline
│   │   └── ThemeContext.tsx             # Dark/light mode theme management
│   ├── engine/
│   │   ├── matcher.ts                   # Inverted index, 11-signal scorer, explanation builder
│   │   ├── validator.ts                 # Directed graph cycle & chain detection engine
│   │   └── exporters.ts                 # Next.js, Vercel, Netlify, Apache, Nginx generators
│   ├── pages/
│   │   ├── LandingPage.tsx              # SEO landing page with hero and feature sections
│   │   ├── AppDashboardPage.tsx         # Tabbed migration workspace
│   │   ├── DocsPage.tsx                 # Technical guide & HTTP redirect reference
│   │   ├── AboutPage.tsx                # Product philosophy & mission
│   │   └── PrivacyPage.tsx              # Browser architecture & client-side boundaries
│   ├── test/
│   │   └── pipeline.test.ts             # 34-check automated pipeline test suite
│   ├── types/
│   │   └── migration.ts                 # Strict TypeScript data models
│   ├── utils/
│   │   ├── url.ts                       # URL normalization, parsing, slug extraction
│   │   ├── parsers.ts                   # CSV, TXT, XML Sitemap parsers & invalid row detector
│   │   ├── storage.ts                   # IndexedDB persistent storage engine
│   │   └── seo.ts                       # Route metadata, OpenGraph & JSON-LD
│   ├── App.tsx                          # Client-side router & layout container
│   ├── index.css                        # Tailwind CSS styling & custom scrollbars
│   └── main.tsx                         # React 19 entry point
├── index.html                           # SEO meta tags, OpenGraph, Favicon SVG
├── metadata.json                        # App manifest & capabilities
├── package.json                         # Dependencies & build scripts
├── tsconfig.json                        # Strict TypeScript configuration
└── vite.config.ts                       # Vite bundler & Tailwind v4 plugin
```

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env.local` if custom configuration is required:

```bash
cp .env.example .env.local
```

| Variable | Required | Default | Description |
|---|---|---|---|
| `APP_URL` | No | Current host | Dynamic host URL used in hosted cloud environments. |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ or 20+
- npm, pnpm, or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/migrationmap.git

# Navigate to project directory
cd migrationmap

# Install dependencies
npm install

# Start local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛠️ Build & Verification

```bash
# Typecheck codebase
npm run lint

# Run automated end-to-end pipeline test suite (34 tests)
npm test

# Build for production
npm run build

# Preview production build locally
npm run preview
```

---

## 🚢 Deploying to Vercel

MigrationMap is ready for zero-config Vercel deployment:

1. Push your repository to GitHub, GitLab, or Bitbucket.
2. Import the project in the [Vercel Dashboard](https://vercel.com/new).
3. Framework Preset: **Vite** (or Other).
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Click **Deploy**.

---

## ⚠️ Important Limitations

- **Structural URL Analysis vs. Live Server Verification:** MigrationMap performs deterministic structural analysis on provided URL datasets. It does not issue unauthenticated bulk HTTP network probes to external production servers. Always verify generated redirect configurations on a staging or preview domain prior to DNS cutover.

---

## 🗺️ Roadmap

- [ ] Automated regex rule clustering for identical path pattern collapses (e.g. `/author/(.*)` → `/team/$1`).
- [ ] Direct sitemap fetching via user-provided CORS proxies.
- [ ] Export to Cloudflare Workers and Fastly VCL snippets.

---

## 📄 License

MIT License. Free for developers, agencies, SEO consultants, and enterprise teams.

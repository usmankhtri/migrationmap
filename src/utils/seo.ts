/**
 * MigrationMap - Advanced SEO, Metadata & Structured Data
 * 
 * Provides unique page titles, descriptions, canonical URLs, robots directives,
 * OpenGraph, Twitter cards, and Schema.org JSON-LD structured data for every route.
 */

export interface PageMetadata {
  title: string;
  description: string;
  canonicalPath: string;
  robots: string;
  ogType: string;
  jsonLd: Record<string, any>;
}

/**
 * Automatically resolves the application's current deployed origin in the browser,
 * with standard fallback for static/non-browser contexts.
 */
export function getDeployedOrigin(): string {
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return window.location.origin.replace(/\/+$/, '');
  }
  return 'https://migrationmap.dev';
}

export const BASE_URL = getDeployedOrigin();

export const ROUTE_METADATA: Record<string, PageMetadata> = {
  '/': {
    title: 'MigrationMap — Free Website Migration & Redirect Mapping Tool',
    description: 'Map legacy URLs, detect redirect loops, and export verified rules for Next.js, Vercel, Netlify, Apache, and Nginx. 100% browser-side and free.',
    canonicalPath: '/',
    robots: 'index, follow',
    ogType: 'website',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'MigrationMap',
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'All',
      url: BASE_URL,
      description: 'Free browser-side website migration and redirect mapping engine with deterministic multi-signal candidate scoring and cycle detection.',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      featureList: [
        'Deterministic multi-signal URL matching',
        'Redirect loop and chain detection',
        'Apache .htaccess, Nginx, Next.js, and Vercel export',
        'Large dataset processing (50,000+ URLs)',
        'Zero cloud persistence privacy guarantee',
      ],
    },
  },
  '/app': {
    title: 'Migration Workspace — MigrationMap',
    description: 'Interactive URL migration workspace. Import URL datasets, review deterministic match recommendations, fix redirect loops, and download config files.',
    canonicalPath: '/app',
    robots: 'noindex, nofollow',
    ogType: 'website',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'MigrationMap Workspace',
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'All',
      url: `${BASE_URL}/app`,
      description: 'Interactive workspace for website redirect mapping and validation.',
    },
  },
  '/docs': {
    title: 'Technical Documentation & Redirect Guide — MigrationMap',
    description: 'Complete guide to URL migration, 301 vs 308 HTTP redirects, deterministic scoring heuristics, cycle detection graphs, and server export syntax.',
    canonicalPath: '/docs',
    robots: 'index, follow',
    ogType: 'article',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: 'Website URL Migration & Redirect Mapping Technical Reference',
      url: `${BASE_URL}/docs`,
      description: 'Technical reference for website redirect mapping, HTTP status codes, cycle detection algorithms, and server deployment configurations.',
      author: {
        '@type': 'Organization',
        name: 'MigrationMap',
      },
    },
  },
  '/about': {
    title: 'About MigrationMap — Architectural Principles & Local Execution',
    description: 'Learn why MigrationMap was built: a client-side alternative to expensive enterprise SEO suites, powered by transparent algorithms and browser privacy.',
    canonicalPath: '/about',
    robots: 'index, follow',
    ogType: 'website',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      name: 'About MigrationMap',
      url: `${BASE_URL}/about`,
      description: 'The mission, design principles, and browser-side execution architecture of MigrationMap.',
    },
  },
  '/privacy': {
    title: 'Privacy Policy & Local Storage Architecture — MigrationMap',
    description: 'MigrationMap operates with zero cloud databases. Learn how your URL datasets are stored locally in your browser and never transmitted to external servers.',
    canonicalPath: '/privacy',
    robots: 'index, follow',
    ogType: 'website',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Privacy Policy & Local Storage Model',
      url: `${BASE_URL}/privacy`,
      description: 'Transparent documentation on local browser persistence and data privacy.',
    },
  },
};

/**
 * Updates DOM head tags dynamically for the current route
 */
export function updatePageMetadata(path: string): void {
  if (typeof document === 'undefined') return;

  const normalizedPath = ROUTE_METADATA[path] ? path : '/';
  const meta = ROUTE_METADATA[normalizedPath];

  // 1. Page Title
  document.title = meta.title;

  // 2. Meta Helper
  const setMeta = (attrName: string, attrVal: string, content: string) => {
    let el = document.querySelector(`meta[${attrName}="${attrVal}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attrName, attrVal);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };

  // 3. Meta Description & Robots
  setMeta('name', 'description', meta.description);
  setMeta('name', 'robots', meta.robots);

  // 4. Canonical URL
  const origin = getDeployedOrigin();
  const canonicalUrl = `${origin}${meta.canonicalPath === '/' ? '' : meta.canonicalPath}`;
  let canonicalEl = document.querySelector('link[rel="canonical"]');
  if (!canonicalEl) {
    canonicalEl = document.createElement('link');
    canonicalEl.setAttribute('rel', 'canonical');
    document.head.appendChild(canonicalEl);
  }
  canonicalEl.setAttribute('href', canonicalUrl);

  // 5. OpenGraph Tags
  setMeta('property', 'og:title', meta.title);
  setMeta('property', 'og:description', meta.description);
  setMeta('property', 'og:url', canonicalUrl);
  setMeta('property', 'og:type', meta.ogType);
  setMeta('property', 'og:site_name', 'MigrationMap');

  // 6. Twitter Tags
  setMeta('name', 'twitter:card', 'summary_large_image');
  setMeta('name', 'twitter:title', meta.title);
  setMeta('name', 'twitter:description', meta.description);

  // 7. Schema.org JSON-LD
  let jsonLdEl = document.querySelector('script[data-id="schema-jsonld"]');
  if (!jsonLdEl) {
    jsonLdEl = document.createElement('script');
    jsonLdEl.setAttribute('type', 'application/ld+json');
    jsonLdEl.setAttribute('data-id', 'schema-jsonld');
    document.head.appendChild(jsonLdEl);
  }
  const dynamicJsonLd = {
    ...meta.jsonLd,
    url: canonicalUrl,
  };
  jsonLdEl.textContent = JSON.stringify(dynamicJsonLd);
}

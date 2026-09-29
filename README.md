# MigrationMap

> Free URL migration and redirect mapping tool for website migrations.

MigrationMap helps developers, SEO professionals, freelancers, and agencies map URLs from an existing website to a new website, review suggested redirects, identify common migration issues, and export redirect configurations for popular platforms.

The goal is simple: make URL migration work easier without requiring an expensive SEO platform.

---

## Overview

A website migration can involve hundreds or thousands of URLs.

MigrationMap takes two URL lists:

- **Old URLs** — URLs from the existing website
- **New URLs** — URLs from the new website

It then:

1. Parses and validates the input
2. Normalizes URLs
3. Finds potential matches
4. Calculates a confidence level
5. Lets you review and edit mappings
6. Identifies common migration issues
7. Exports the final redirect rules

Everything is designed around a simple workflow:

**Import → Match → Review → Validate → Export**

---

## Features

### URL Import

Import URL lists from:

- CSV
- TXT
- XML sitemaps
- Pasted URLs

The importer handles common formatting issues and reports invalid rows instead of silently dropping them.

### URL Matching

MigrationMap uses deterministic URL and text-based signals to find likely destinations.

Matching can consider factors such as:

- Exact path matches
- Slug similarity
- Path segment similarity
- Token similarity
- Keyword overlap
- URL depth
- File extension changes
- Numeric identifiers
- Path transformations
- Overall path similarity

Each suggestion includes a confidence level and an explanation so that users can review the result rather than blindly trusting an automatic match.

### Mapping Review

Review and manage mappings in one place.

You can:

- Approve mappings
- Reject mappings
- Edit destinations
- Search URLs
- Filter results
- Sort mappings
- Perform bulk actions
- Review low-confidence matches

### Migration Checks

MigrationMap identifies common problems such as:

- Unmapped old URLs
- Duplicate source URLs
- Duplicate destinations
- Self redirects
- Potential redirect loops
- Potential redirect chains
- Low-confidence mappings
- Invalid destinations
- URL normalization inconsistencies

These checks are intended to support human review before a migration goes live.

### Redirect Exports

Export reviewed mappings in formats commonly used by developers and hosting platforms:

- CSV
- JSON
- Markdown
- Next.js
- Vercel
- Netlify
- Apache
- Nginx

Exports can be previewed and copied before downloading.

### Local-First Data

MigrationMap is designed around browser-local processing and storage.

Your migration workspace is kept on the local device rather than being stored in a cloud database by the application.

Because browser storage has practical size limits, very large projects should be backed up using the project's export functionality.

---

## Why MigrationMap?

Most website migration workflows involve a combination of spreadsheets, SEO crawlers, scripts, and manual review.

MigrationMap brings the core redirect-mapping workflow into one focused tool:

```text
Old URLs
   ↓
Import & Validate
   ↓
Normalize
   ↓
Match
   ↓
Review
   ↓
Migration Checks
   ↓
Export

#!/usr/bin/env node
/**
 * refresh-seo-data.mjs — regenerate src/seo/market-data.json from Supabase.
 *
 * Why a checked-in snapshot instead of querying at build time:
 *
 *   The prerenderer, /sitemap.xml and the SEO audit must agree about which
 *   pages exist. When each of them queried Supabase independently, a network
 *   blip during a deploy silently produced a build with no provider pages, a
 *   sitemap that still advertised them, and no failure anywhere — pages simply
 *   disappeared from the index. A snapshot in git makes the published page set
 *   reviewable in a diff and identical in every environment.
 *
 * Run this whenever provider or plan data changes, then commit the result:
 *
 *   VITE_SUPABASE_URL=... VITE_SUPABASE_ANON_KEY=... node scripts/refresh-seo-data.mjs
 *
 * Only aggregate, non-volatile facts are stored. Individual plan rates are
 * deliberately NOT snapshotted into page copy: they change often, and a stale
 * rate on a static page is worse than no rate at all. What is stored are counts
 * and ranges, published with the `generatedAt` date so the page can say when
 * the figures were captured.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

import { providerSlug } from '../src/seo/routes.js';
import { STATE_CODES } from '../src/seo/locations.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT = path.join(ROOT, 'src/seo/market-data.json');

function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

const round2 = (n) => (n === null || n === undefined ? null : Math.round(n * 100) / 100);

function summarizePlans(plans) {
  const rates = plans.map((p) => Number(p.rate_per_kwh)).filter((n) => Number.isFinite(n));
  const rateOf = (subset) => {
    const values = subset.map((p) => Number(p.rate_per_kwh)).filter((n) => Number.isFinite(n));
    return values.length ? round2(Math.min(...values)) : null;
  };
  const residential = plans.filter((p) => p.customer_type === 'residential');
  const business = plans.filter((p) => p.customer_type === 'business');
  const renewable = plans.filter((p) => Number(p.renewable_percentage) >= 100);

  return {
    plans: plans.length,
    residentialPlans: residential.length,
    businessPlans: business.length,
    renewablePlans: renewable.length,
    renewableProviders: new Set(renewable.map((p) => p.provider_name)).size,
    fixedPlans: plans.filter((p) => /fixed/i.test(p.plan_type || '')).length,
    variablePlans: plans.filter((p) => /variable/i.test(p.plan_type || '')).length,
    noEtfPlans: plans.filter((p) => !Number(p.early_termination_fee)).length,
    minRate: rates.length ? round2(Math.min(...rates)) : null,
    maxRate: rates.length ? round2(Math.max(...rates)) : null,
    medianRate: round2(median(rates)),
    minResidentialRate: rateOf(residential),
    minBusinessRate: rateOf(business),
    minRenewableRate: rateOf(renewable),
    // 0 means month-to-month; surfaced as its own flag rather than a "0 month" term.
    terms: [...new Set(plans.map((p) => Number(p.contract_length)).filter((n) => n > 0))].sort((a, b) => a - b),
    monthToMonth: plans.some((p) => Number(p.contract_length) === 0),
  };
}

async function main() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.error('VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required.');
    process.exit(2);
  }

  const supabase = createClient(url, key);

  const [{ data: plans, error: planError }, { data: providers, error: providerError }] = await Promise.all([
    supabase.from('electricity_plans').select('*').eq('is_active', true),
    supabase.from('electricity_providers').select('*'),
  ]);
  if (planError) throw planError;
  if (providerError) throw providerError;

  const states = {};
  for (const code of STATE_CODES) {
    const statePlans = plans.filter((p) => p.state === code);
    if (!statePlans.length) continue;
    states[code] = {
      ...summarizePlans(statePlans),
      providers: new Set(statePlans.map((p) => p.provider_name)).size,
      providerNames: [...new Set(statePlans.map((p) => p.provider_name))].filter(Boolean).sort(),
    };
  }

  const providerRecords = providers
    .map((provider) => {
      const own = plans.filter((p) => p.provider_name === provider.name);
      const planStates = [...new Set(own.map((p) => p.state).filter(Boolean))].sort();
      return {
        name: provider.name,
        slug: providerSlug(provider.name),
        isActive: Boolean(provider.is_active),
        description: provider.description || null,
        websiteUrl: provider.website_url || null,
        supportedStates: Array.isArray(provider.supported_states) ? [...provider.supported_states].sort() : [],
        features: Array.isArray(provider.features) ? provider.features : [],
        planStates,
        ...summarizePlans(own),
        updatedAt: provider.updated_at || null,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const snapshot = {
    generatedAt: new Date().toISOString().split('T')[0],
    source: 'supabase: electricity_plans (is_active), electricity_providers',
    totals: {
      activePlans: plans.length,
      providersWithPlans: new Set(plans.map((p) => p.provider_name)).size,
      states: Object.keys(states).length,
    },
    states,
    providers: providerRecords,
  };

  await fs.writeFile(OUTPUT, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
  console.log(`wrote ${path.relative(ROOT, OUTPUT)}`);
  console.log(
    `  ${snapshot.totals.activePlans} active plans, ` +
      `${snapshot.totals.providersWithPlans} providers with plans, ` +
      `${snapshot.totals.states} states`
  );
  const publishable = providerRecords.filter((p) => p.isActive && p.planCount !== 0 && p.plans > 0);
  console.log(`  ${publishable.length} providers qualify for a detail page (active with plans)`);
}

main().catch((error) => {
  console.error(`[refresh-seo-data] FAILED: ${error.message}`);
  process.exit(1);
});

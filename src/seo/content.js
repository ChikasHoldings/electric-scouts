/**
 * content.js
 *
 * Builds the *content model* for every prerendered page: the sections, facts,
 * tables and questions a page is entitled to show, given the data we actually
 * hold about it.
 *
 * This file is the answer to "why should Google index 144 city pages?". It is
 * deliberately structured so that a section only exists when the data behind it
 * exists — a city with no utility on record simply has no utility section,
 * rather than a sentence with an empty slot in it. Nothing here invents a
 * number, a rate, a review or a saving; every figure traces back to
 * src/data/cityRatesData.js, src/components/location/locationData.js or the
 * market snapshot in src/seo/market-data.json.
 *
 * Returns plain data. src/seo/render.js turns it into HTML; tests assert
 * against it directly without parsing markup.
 */

import { LOCATION_DATA } from '../components/location/locationData.js';
import { getCities, STATE_NAMES, STATE_PAGE_PATHS } from './locations.js';
import { UTILITY_ROOT, getUtilities, utilitiesForState, utilityForCity } from './utilities.js';
import { articlesForState, relatedArticles } from './articleLinks.js';
import { STATIC_PAGE_CONTENT } from './staticContent.js';
import { resolveSections, setDerivedCounts } from './figures.js';
import {
  comparisonsForProvider,
  comparisonsForState,
  getPlanComparisons,
  getProviderComparisons,
  providerStateData,
} from './comparisons.js';
import {
  MARKET_GENERATED_AT,
  compareToStateMedian,
  formatRate,
  formatTerms,
  getPublishableProviders,
  getStateMarket,
  joinNames,
  parseRate,
} from './market.js';

/** Slug for a provider that has its own page, or null when it has none. */
const publishableSlugs = new Map(getPublishableProviders().map((p) => [p.name, p.slug]));

/**
 * Provider names for a state as a mixed list of links and plain names. Only
 * providers with a page get a link; the rest stay as text so the page does not
 * advertise a URL that 404s.
 */
function providerEntries(names) {
  return names.map((name) => ({ name, path: publishableSlugs.get(name) ? `/providers/${publishableSlugs.get(name)}` : null }));
}

/** Whole percent, or null when the denominator makes the figure meaningless. */
function pctOf(part, whole) {
  if (!whole || part == null) return null;
  return Math.round((part / whole) * 100);
}

/**
 * Key facts we cannot stand behind, dropped before a state's copy is published.
 *
 * Three kinds, all from the hand-maintained LOCATION_DATA table:
 *
 *   1. Savings figures. Internal estimates, repeated as fact.
 *   2. Supplier counts. Every state carried one and every one disagreed with
 *      the snapshot — Texas claimed "Over 100 retail electric providers" against
 *      22 in the catalog, Pennsylvania "50+" against 15, Rhode Island "15+"
 *      against 8. Whether or not a state really has that many licensed REPs,
 *      the page has no source for it and prints it directly above the number we
 *      can source, so the page contradicts itself.
 *   3. Average residential rates. These are utility default averages; the site
 *      holds plan rates, which is a different measure. Printed unlabelled next
 *      to our median they read as the same figure disagreeing with itself —
 *      Illinois said 14.3¢/kWh beside a snapshot median of 8.99¢.
 *
 * What survives is the durable, checkable material: when the state deregulated,
 * which utilities still handle delivery, and how switching works. The counts and
 * rates a reader wants are still on the page, from the snapshot, labelled with
 * the scope they actually have.
 */
const UNSOURCED_FACT = [
  /saving/i,
  /\b(over\s+)?\d+\+?\s+[a-z ]*\b(suppliers?|providers?)\b/i,
  /average\s+residential\s+rate/i,
];

function factualKeyFacts(keyFacts = []) {
  return keyFacts.filter((fact) => !UNSOURCED_FACT.some((pattern) => pattern.test(fact)));
}

/**
 * Drop the sentences of a free-text note that assert a saving or a rate
 * comparison this site cannot substantiate — "can save families $400-$600
 * annually", "rates 15-20% below the default utility rate". Electric Scouts
 * holds plan rates, not utility default rates or customer bills, so neither
 * figure has anything behind it.
 *
 * Filtering per sentence rather than dropping the whole note keeps the local
 * detail that makes these pages worth reading — which utility serves the city,
 * whether the area is deregulated at all — and removes only the claim.
 *
 * @returns {string|null} the surviving prose, or null if nothing is left
 */
function withoutUnsupportedClaims(text) {
  if (!text) return null;
  const kept = String(text)
    .split(/(?<=[.!?])\s+/)
    .filter((sentence) => {
      if (/\$\s?\d/.test(sentence)) return false;
      if (/\d+\s*%/.test(sentence) && /sav|below|lower|less than|cheaper|discount/i.test(sentence)) {
        return false;
      }
      return true;
    })
    .join(' ')
    .trim();
  return kept || null;
}

const asOf = `as of ${MARKET_GENERATED_AT}`;

/* CITY_COUNT and UTILITY_COUNT are figures about our own coverage rather than
 * about the market, so figures.js cannot read them without importing the very
 * modules that import it. They are bound here instead, where both are already
 * in scope. */
setDerivedCounts({ cityCount: getCities().length, utilityCount: getUtilities().length });

/* ------------------------------------------------------------------ *
 * Shared fragments
 * ------------------------------------------------------------------ */

/** One sentence describing what we track in a state, or null when nothing. */
function trackedSentence(stateName, market) {
  if (!market || !market.plans) return null;
  const range =
    market.minRate !== null && market.maxRate !== null
      ? ` ranging from ${formatRate(market.minRate)} to ${formatRate(market.maxRate)}`
      : '';
  const median = market.medianRate !== null ? `, with a median of ${formatRate(market.medianRate)}` : '';
  return (
    `Electric Scouts tracks ${market.plans} active ${stateName} plans from ` +
    `${market.providers} suppliers${range}${median} (${asOf}).`
  );
}

/** Plan-mix bullets for a state: only the categories that have plans. */
function planMixBullets(market) {
  if (!market) return [];
  const bullets = [];
  if (market.residentialPlans) bullets.push(`${market.residentialPlans} residential plans`);
  if (market.businessPlans) bullets.push(`${market.businessPlans} business plans`);
  if (market.fixedPlans) bullets.push(`${market.fixedPlans} fixed-rate plans`);
  if (market.variablePlans) bullets.push(`${market.variablePlans} variable-rate plans`);
  if (market.renewablePlans) {
    bullets.push(`${market.renewablePlans} plans backed by 100% renewable energy, from ${market.renewableProviders} suppliers`);
  }
  if (market.noEtfPlans) bullets.push(`${market.noEtfPlans} plans with no early termination fee`);
  const terms = formatTerms(market.terms);
  if (terms) bullets.push(`Contract terms of ${terms}`);
  if (market.monthToMonth) bullets.push('Month-to-month plans with no fixed term');
  return bullets;
}

/* ------------------------------------------------------------------ *
 * City pages
 * ------------------------------------------------------------------ */

/** Everything known about one city, merged from all three data sources. */
export function getCityContext(city) {
  const market = getStateMarket(city.stateCode);
  const insights = LOCATION_DATA[city.stateCode]?.cities?.[city.name] || null;
  return { city, market, insights };
}

/**
 * Opening sentence for a city whose blurb did not survive sanitizing.
 *
 * Built only from fields we hold for this city — county, population, the
 * delivery utility — so it is factual and still differs city to city.
 */
function cityFallbackIntro(city) {
  const parts = [`${city.name} is in ${city.county}, ${city.stateName}`];
  if (city.population) parts.push(`with a population of ${city.population}`);
  const opening = `${parts.join(', ')}.`;
  if (city.noRetailChoice) {
    return `${opening} Electricity here is supplied by ${city.noRetailChoice.utility}.`;
  }
  if (city.utilityCompany) {
    return (
      `${opening} ${city.utilityCompany} delivers the power, and the supply half of the ` +
      `bill is bought from a competing retailer.`
    );
  }
  return `${opening} Supply is bought from a competing retailer, separately from delivery.`;
}

export function buildCitySections(route, { citiesByState }) {
  const { city } = route;
  const { market, insights } = getCityContext(city);
  const sections = [];
  const stateName = city.stateName;
  const siblings = (citiesByState[city.stateCode] || []).filter((other) => other.path !== city.path);
  // Resolved once: used both in the coverage section and in Next Steps.
  const cityUtility = utilityForCity(city);

  /* Intro: the city's own description, then what we track in its market.
   *
   * 20 of the hand-written blurbs were a single sentence whose whole content
   * was an invented supplier count ("a choice of over 40 retail electricity
   * providers"), so sanitizing them leaves nothing. Rather than open those
   * pages on the statewide sentence every city in the state shares, they get
   * an opening built from what we do hold about this city specifically. */
  /* A no-choice city's hand-written blurb is the problem, not the solution:
   * Austin's opens "provides residents with competitive electricity rates and
   * numerous green energy options from competing suppliers", which is exactly
   * the claim the rest of this page now corrects. It is replaced wholesale. */
  const intro = [
    city.noRetailChoice ? cityFallbackIntro(city) : city.description || cityFallbackIntro(city),
  ];

  /* The city's photograph. Carried on the model rather than added by either
   * renderer so the prerendered HTML and the mounted app show the same image
   * with the same alt text — and so the ImageObject in the markup describes
   * something that is actually on the page. */
  const image = city.image
    // "skyline" was asserting what the photograph shows, which we do not know.
    // A place label is accurate for a photo we do hold for this city.
    ? { url: city.image, alt: `${city.name}, ${city.stateName}` }
    : null;
  /* The statewide plan count is the wrong second sentence for a city whose
   * residents cannot buy any of those plans — it reads as an offer. Those
   * pages say why instead, which is the answer the reader actually needs. */
  if (city.noRetailChoice) {
    intro.push(city.noRetailChoice.reason);
  } else {
    const tracked = trackedSentence(stateName, market);
    if (tracked) intro.push(tracked);
  }

  /* At a glance — city-specific figures only.
   *
   * The per-city `providers` number in locationData is an unsourced legacy
   * estimate: it claims 45 suppliers for Houston and 38 for Austin while the
   * plan snapshot holds 22 for the whole of Texas. Publishing it as fact — and
   * next to the snapshot figure, which contradicts it — is exactly the kind of
   * invented detail this rebuild removes, so the supplier count comes from the
   * snapshot and is labelled with the scope it actually has (statewide). */
  const facts = [
    ['Average residential rate', city.avgRate],
    ['Estimated monthly bill', city.avgMonthlyBill],
  ];
  // The statewide supplier count is a fact about the market, not about this
  // city — and on a page that has just explained none of those suppliers sells
  // here, printing it in the at-a-glance table undoes the explanation.
  if (market?.providers && !city.noRetailChoice) {
    facts.push([`Suppliers with active ${stateName} plans`, String(market.providers)]);
  }
  facts.push(['County', city.county], ['Population', city.population]);
  if (city.noRetailChoice) {
    facts.push(['Electricity supplied by', city.noRetailChoice.utility]);
  } else if (insights?.utilityCompany) {
    facts.push(['Utility that delivers the power', insights.utilityCompany]);
  }
  if (insights?.avgUsage) facts.push(['Typical household usage', insights.avgUsage]);
  sections.push({
    heading: `${city.name} Electricity at a Glance`,
    facts: facts.filter(([, value]) => value),
  });

  /* How this city compares — the section that makes each page genuinely
   * different, because the comparison is computed from the city's own rate. */
  const comparison = compareToStateMedian(city.avgRate, market?.medianRate);
  if (comparison && market) {
    const paragraphs = [
      `The average residential rate in ${city.name} is ${city.avgRate}, which is ` +
        `${comparison.text} of ${formatRate(market.medianRate)} across the ${market.plans} ` +
        `${stateName} plans Electric Scouts tracks. Rates on this page are averages for the ` +
        `area, not a quote — what you pay depends on the plan you pick and how much you use.`,
    ];
    // Nearest neighbours by rate rather than the state's cheapest cities: a
    // fixed "cheapest 8" table renders identically on every page in the state,
    // which is precisely the duplication this rebuild is removing.
    const cityRate = parseRate(city.avgRate);
    const rated = siblings
      .map((other) => ({ other, rate: parseRate(other.avgRate) }))
      .filter((entry) => entry.rate !== null)
      .sort((a, b) => Math.abs(a.rate - cityRate) - Math.abs(b.rate - cityRate))
      .slice(0, 6)
      .sort((a, b) => a.rate - b.rate);
    const table = rated.length
      ? {
          columns: ['City', 'Average rate', 'Estimated monthly bill'],
          rows: [
            [
              { text: `${city.name}, ${city.stateCode} (this page)` },
              city.avgRate,
              city.avgMonthlyBill,
            ],
            ...rated.map(({ other }) => [
              { text: `${other.name}, ${other.stateCode}`, path: other.path },
              other.avgRate,
              other.avgMonthlyBill,
            ]),
          ].sort((a, b) => parseRate(a[1]) - parseRate(b[1])),
        }
      : null;
    sections.push({
      heading: `How ${city.name} Rates Compare Across ${stateName}`,
      paragraphs,
      table,
    });
  }

  /* Local context — only for cities we hold real notes on. */
  const localNote = withoutUnsupportedClaims(insights?.insights);
  if (localNote) {
    const paragraphs = [localNote];
    if (insights.utilityCompany) {
      paragraphs.push(
        `${insights.utilityCompany} owns the poles and wires in ${city.name} and handles ` +
          `outages and meter reads no matter which supplier you choose. Switching suppliers ` +
          `changes the supply portion of your bill, not who restores your power.`
      );
    }
    sections.push({ heading: `What to Know About Electricity in ${city.name}`, paragraphs });
  }

  /* What a household here can buy. The full statewide breakdown lives on the
   * state page — repeating all of it here made every city page in a state
   * around half identical, so this is the summary plus the link. */
  if (city.noRetailChoice) {
    /* The section that would otherwise offer a switch. A reader here searched
     * for their rate and deserves an answer, so the page explains who sets it,
     * what that means for their bill, and where retail choice does apply — it
     * just stops pretending they can shop. */
    sections.push({
      heading: `Why You Cannot Switch Suppliers in ${city.name}`,
      paragraphs: [
        city.noRetailChoice.reason,
        `That makes ${city.name} an exception in ${stateName}. In the parts of the state ` +
          `served by a competitive delivery utility, households buy the supply half of the ` +
          `bill from a retailer of their choosing and the plan comparison on this site ` +
          `applies to them. It does not apply at a ${city.name} address.`,
        `What you can still do here is reduce how much you use, and check that you are on ` +
          `the most suitable of the rate schedules ${city.noRetailChoice.utility} offers — ` +
          `many municipal utilities publish more than one, including time-of-use options.`,
      ],
      links: [
        [city.statePath, `Where retail choice does apply in ${stateName}`],
        ['/learning-center', 'Guides on reading a bill and cutting usage'],
      ],
    });
  } else if (market?.plans) {
    const options = [];
    if (market.residentialPlans) {
      options.push(
        `${market.residentialPlans} residential plans, from ${formatRate(market.minResidentialRate)}`
      );
    }
    if (market.renewablePlans) {
      options.push(`${market.renewablePlans} backed by 100% renewable energy`);
    }
    if (market.monthToMonth) options.push('month-to-month plans with no fixed term');
    else if (market.terms?.length) options.push(`terms of ${formatTerms(market.terms)}`);

    sections.push({
      heading: `What ${city.name} Households Can Buy`,
      paragraphs: [
        // Deliberately short. The full breakdown belongs on the state page and
        // is linked below; restating it on all 144 city pages was both
        // redundant with that page and the reason same-state cities read alike.
        `Supply is sold statewide, so a ${city.name} address can take any ${stateName} offer — ` +
          `${joinNames(options, 2)} among them. Which reach your meter depends on your utility ` +
          `territory, which a ZIP code settles.`,
      ],
      links: [
        [city.statePath, `Full breakdown of ${stateName} plans and suppliers`],
        ['/compare-rates', `Plans available at a ${city.name} ZIP code`],
      ],
    });
  }

  /* Neighbourhoods and ZIPs — unique to the city, and how people search.
   *
   * These carry more weight than their length suggests. Two cities in the same
   * state that happen to share a headline rate produce identical copy
   * everywhere else on the page: the same market paragraph, the same comparison
   * against the same median, the same table. Lakewood and Parma both sit in
   * Cuyahoga County at 9.5¢/kWh, and before this the only things separating
   * their pages were a name and a population. The district names are the one
   * field in the city table that belongs to the city alone. */
  const coverage = [];
  const neighborhoods = insights?.topZips && !city.zipCodes.length ? [] : city.neighborhoods || [];
  if (neighborhoods.length) {
    coverage.push(
      `Within ${city.name} we cover ${joinNames(neighborhoods, 8)} — supply is sold across the ` +
        `whole city, so the plan available in one district is available in the next.`
    );
  }
  if (city.zipCodes.length) {
    coverage.push(
      `ZIP codes covered include ${city.zipCodes.slice(0, 10).join(', ')}. Availability is settled ` +
        `by ZIP rather than by city name, because utility territory boundaries do not follow city limits.`
    );
  }
  if (cityUtility) {
    coverage.push(
      `Delivery in ${city.name} is handled by ${cityUtility.name}, which charges a regulated rate ` +
        `no supplier can discount. Everything above is the supply half — the part you choose.`
    );
  }
  if (coverage.length) {
    sections.push({
      heading: `Areas and ZIP Codes We Cover in ${city.name}`,
      paragraphs: coverage,
      links: cityUtility ? [[cityUtility.path, `What ${cityUtility.name} does and does not charge for`]] : undefined,
    });
  }

  /* FAQs built from this city's own figures. */
  sections.push({
    heading: `${city.name} Electricity Questions`,
    faqs: buildCityFaqs(city, market, insights, cityUtility),
  });

  /* Nearby cities. */
  if (siblings.length) {
    sections.push({
      heading: `Other Cities We Cover in ${stateName}`,
      links: siblings.slice(0, 12).map((other) => [other.path, `${other.name} electricity rates`]),
    });
  }

  /* "Compare plans for your ZIP code" is a dead end from a city that has no
   * plans to compare, and the renewable and business comparison links below
   * are the same. A reader here can still read their bill and cut usage, so
   * those are what the page offers instead. */
  const nextSteps = city.noRetailChoice
    ? [
        [city.statePath, `Where retail choice applies in ${stateName}`],
        ['/bill-analyzer', 'Check your current bill for overcharges'],
        ['/learning-center', 'Guides on cutting what you use'],
      ]
    : [
        [city.statePath, `${stateName} electricity rates and market overview`],
        ['/compare-rates', 'Compare plans for your ZIP code'],
        ['/bill-analyzer', 'Check your current bill for overcharges'],
      ];
  /* The delivery utility, where we publish a page for it. This is the link a
   * reader follows when they have worked out that the company on the bill is
   * not the company setting the rate. */
  if (cityUtility) {
    nextSteps.push([cityUtility.path, `What ${cityUtility.name} does and does not charge for`]);
  }
  if (!city.noRetailChoice && market?.businessPlans) {
    nextSteps.push(['/business-electricity', `Business electricity in ${stateName}`]);
  }
  if (!city.noRetailChoice && market?.renewablePlans) {
    nextSteps.push(['/renewable-compare-rates', 'Compare 100% renewable plans']);
  }
  /* Nearest siblings by rate rather than the same alphabetical list on every
   * page. Two cities in one state used to end on an identical block of links;
   * this at least points each one somewhere slightly different, and a reader
   * comparing their own city against a similar one is better served than by a
   * link to whichever city sorts first. */
  const localRate = parseRate(city.avgRate);
  if (localRate !== null && siblings.length) {
    const nearest = siblings
      .map((other) => ({ other, gap: Math.abs((parseRate(other.avgRate) ?? localRate) - localRate) }))
      .sort((a, b) => a.gap - b.gap)
      .slice(0, 2);
    for (const { other } of nearest) {
      nextSteps.push([other.path, `${other.name} rates, the closest we cover to ${city.name}`]);
    }
  }
  nextSteps.push(['/all-cities', 'Browse every city we cover']);
  sections.push({ heading: 'Next Steps', links: nextSteps });

  return { intro, image, sections };
}

/**
 * Questions only a city page can answer.
 *
 * The set this replaced asked five, of which four were about the state: how
 * many suppliers it has, how many plans are renewable, what the cheapest green
 * rate is. Those answers are identical for every city in the state and they are
 * already on the state page, which is where a reader looking for them would
 * land. On a city page they were 182 words of the ~480 on the page, and the
 * single largest reason two Ohio cities read 70% the same.
 *
 * What is left is anchored to the city: the districts it covers, the company
 * that delivers there, and how its own average sits against the state. Fewer
 * questions, none of them borrowed.
 */
function buildCityFaqs(city, market, insights, utility) {
  const faqs = [];

  /* A city with no retail choice needs the opposite answers: the question its
   * residents actually type is whether they can switch at all, and every FAQ
   * below assumes they can. Answering "which parts of Austin can compare
   * electricity plans? All of them." is not a small inaccuracy — it is the one
   * thing the reader came to find out, answered backwards. */
  if (city.noRetailChoice) {
    faqs.push({
      question: `Can I choose my electricity supplier in ${city.name}?`,
      answer: city.noRetailChoice.reason,
    });
    faqs.push({
      question: `Who sets the electricity rate in ${city.name}?`,
      answer:
        `${city.noRetailChoice.utility} does. Because it is not competing for your business, ` +
        `its rates are set through a public process rather than by an offer you accept, and ` +
        `they apply to every household in its service area. There is no cheaper supplier to ` +
        `move to and no contract to sign.`,
    });
    if (city.avgRate) {
      faqs.push({
        question: `What is the average electricity rate in ${city.name}?`,
        answer:
          `Around ${city.avgRate}, which works out at roughly ${city.avgMonthlyBill} a month ` +
          `for a typical household. That is an average for the area rather than a quote — what ` +
          `you pay depends on the rate schedule you are on and how much you use.`,
      });
    }
    faqs.push({
      question: `Where in ${city.stateName} can you choose a supplier?`,
      answer:
        `In the parts of ${city.stateName} served by a competitive delivery utility rather ` +
        `than a municipal one. Our ${city.stateName} page sets out which markets those are and ` +
        `what is on offer in them.`,
    });
    return faqs;
  }

  if (city.neighborhoods?.length) {
    faqs.push({
      question: `Which parts of ${city.name} can compare electricity plans?`,
      answer:
        `All of them. Our ${city.name} coverage spans ${joinNames(city.neighborhoods, 6)}, and ` +
        `supply is sold city-wide rather than district by district — the plans offered in one ` +
        `neighbourhood are the plans offered in the next. What varies within ${city.name} is the ` +
        `utility territory a given address falls in, which is settled by ZIP code.`,
    });
  }

  const deliverer = utility?.name || insights?.utilityCompany;
  if (deliverer) {
    faqs.push({
      question: `Who delivers electricity in ${city.name}?`,
      answer:
        `${deliverer} operates the distribution network in ${city.name}. It delivers the power, ` +
        `reads the meter and handles outages no matter which supplier you buy from, and its ` +
        `charges are regulated — no supplier can discount them. Switching changes the supply half ` +
        `of the bill and nothing else, so your service is unaffected.`,
    });
  } else {
    faqs.push({
      question: `Will my power be interrupted if I switch suppliers in ${city.name}?`,
      answer:
        `No. Your local utility keeps delivering the electricity and maintaining the lines. ` +
        `Switching changes only the company selling you the supply portion of the bill, and it ` +
        `takes effect at your next meter read.`,
    });
  }

  const local = parseRate(city.avgRate);
  const median = market?.medianRate ?? null;
  if (local !== null && median !== null) {
    const gap = Math.round(Math.abs(local - median) * 100) / 100;
    const above = local > median;
    faqs.push({
      question: `Is electricity in ${city.name} more expensive than the rest of ${city.stateName}?`,
      answer:
        gap < 0.05
          ? `Barely distinguishable. The ${city.name} average of ${city.avgRate} sits within a ` +
            `hundredth of a cent of the ${formatRate(median)} median across the ` +
            `${market.plans} ${city.stateName} plans we track, so location is not what decides ` +
            `your bill here — the plan you sign is.`
          : `The ${city.name} average of ${city.avgRate} runs ${formatRate(gap)} ` +
            `${above ? 'above' : 'below'} the ${formatRate(median)} median across the ` +
            `${market.plans} ${city.stateName} plans we track. ${above
              ? 'An area average is not a quote, though — the cheapest plan on the market is ' +
                'available here too, and it is well under this figure.'
              : 'That is the area average rather than an offer, and the spread between the ' +
                'cheapest and dearest plan on the market is wider than the gap between cities.'}`,
    });
  }

  return faqs;
}

/* ------------------------------------------------------------------ *
 * State pages
 * ------------------------------------------------------------------ */

export function buildStateSections(route, context = {}) {
  const { state } = route;
  const market = getStateMarket(state.code);
  const location = LOCATION_DATA[state.code];
  const insights = location?.marketInsights;
  const sections = [];

  const intro = [];
  if (insights?.description) intro.push(insights.description);
  const tracked = trackedSentence(state.name, market);
  if (tracked) intro.push(tracked);

  /* Market structure — statutes, regulators and utilities are the most
   * genuinely state-specific facts we hold. */
  const keyFacts = factualKeyFacts(insights?.keyFacts);
  if (keyFacts.length || insights?.marketType) {
    sections.push({
      heading: `The ${state.name} Electricity Market`,
      paragraphs: insights?.marketType
        ? [`${state.name} is a ${insights.marketType.toLowerCase()} electricity market, which means households buy supply from a competing retailer while the local utility keeps delivering it.`]
        : [],
      bullets: keyFacts,
    });
  }

  /* What we track. */
  const mix = planMixBullets(market);
  if (mix.length) {
    sections.push({
      heading: `Plans We Track in ${state.name}`,
      paragraphs: [
        `A breakdown of the ${market.plans} active ${state.name} plans in our comparison ${asOf}:`,
      ],
      bullets: mix,
    });
  }

  /* City rate table — the comparison that only a state page can offer. */
  const rated = state.cities
    .map((city) => ({ city, rate: parseRate(city.avgRate) }))
    .filter((entry) => entry.rate !== null)
    .sort((a, b) => a.rate - b.rate);
  if (rated.length) {
    const cheapest = rated[0];
    const dearest = rated[rated.length - 1];
    sections.push({
      heading: `Electricity Rates by City in ${state.name}`,
      paragraphs: [
        `Average residential rates across the ${rated.length} ${state.name} cities we cover run from ` +
          `${cheapest.city.avgRate} in ${cheapest.city.name} to ${dearest.city.avgRate} in ${dearest.city.name}. ` +
          `Pick a city for local rates, utility and coverage detail.`,
      ],
      // No provider column: the only per-city supplier count available is the
      // unsourced legacy estimate, and the snapshot figure is statewide, so it
      // would repeat one number down every row without adding information.
      table: {
        columns: ['City', 'Average rate', 'Estimated monthly bill'],
        rows: rated.map(({ city }) => [
          { text: city.name, path: city.path },
          city.avgRate,
          city.avgMonthlyBill,
        ]),
      },
    });
  }

  /* Renewable. */
  if (market?.renewablePlans) {
    sections.push({
      heading: `Renewable Electricity in ${state.name}`,
      paragraphs: [
        `${market.renewablePlans} of the ${market.plans} ${state.name} plans we track are backed by ` +
          `100% renewable energy, offered by ${market.renewableProviders} suppliers and starting at ` +
          `${formatRate(market.minRenewableRate)}. Renewable plans in competitive markets are usually ` +
          `matched with renewable energy certificates rather than a dedicated line to a wind farm.`,
      ],
      links: [
        ['/renewable-energy', 'How renewable electricity plans work'],
        ['/renewable-compare-rates', 'Compare renewable plans by ZIP code'],
      ],
    });
  }

  /* Business. */
  if (market?.businessPlans) {
    sections.push({
      heading: `Business Electricity in ${state.name}`,
      paragraphs: [
        `Electric Scouts tracks ${market.businessPlans} commercial ${state.name} plans starting at ` +
          `${formatRate(market.minBusinessRate)}. Commercial supply is usually priced against your ` +
          `load profile and contract length rather than sold off a rate card, so business pricing is quoted.`,
      ],
      links: [
        ['/business-electricity', 'How business electricity pricing works'],
        ['/business-compare-rates', 'Request business electricity quotes'],
      ],
    });
  }

  /* Suppliers. */
  if (market?.providerNames?.length) {
    sections.push({
      heading: `Suppliers with ${state.name} Plans`,
      paragraphs: [`These ${market.providers} suppliers have at least one active ${state.name} plan ${asOf}.`],
      providers: providerEntries(market.providerNames),
    });
  }

  /* Matchups fought in this state.
   *
   * Only the pairs that actually overlap here, which is what makes this
   * different from a generic "see also" block: a reader in Ohio is shown the
   * suppliers competing for their address, not the Texas-only pairs. The
   * registry drops a matchup as soon as its two suppliers stop sharing a
   * state, so this list cannot outlive the pages it points at. */
  const stateMatchups = comparisonsForState(state.code);
  if (stateMatchups.length) {
    sections.push({
      heading: `Supplier Matchups in ${state.name}`,
      paragraphs: [
        `${stateMatchups.length === 1 ? 'One pair of suppliers in' : `These ${stateMatchups.length} pairs of suppliers in`} ` +
          `${state.name} sell against each other closely enough to be worth comparing directly. ` +
          `Each page counts rates, plan mix and exit fees for both sides in ${state.name} ${asOf}.`,
      ],
      links: stateMatchups.map((entry) => [entry.path, entry.heading]),
    });
  }

  /* Guides written about this state. 26 of the 73 name a state we publish,
   * and those are the ones worth linking from it — a guide that mentions
   * Texas in passing is not a Texas guide. */
  const stateArticles = articlesForState(state.code, context.fullArticles);
  if (stateArticles.length) {
    sections.push({
      heading: `Guides for ${state.name}`,
      paragraphs: [
        `Written for ${state.name} specifically, rather than for deregulated markets in general.`,
      ],
      links: stateArticles.map((entry) => [entry.path, entry.title]),
    });
  }

  sections.push({
    heading: `${state.name} Electricity Questions`,
    faqs: buildStateFaqs(state, market, insights),
  });

  sections.push({
    heading: 'Next Steps',
    links: [
      ['/compare-rates', 'Compare plans for your ZIP code'],
      ['/compare', 'Compare suppliers head to head'],
      // The delivery territories we publish for this state. A reader who knows
      // their utility's name but not their supplier options starts there.
      ...utilitiesForState(state.code).map((u) => [u.path, `${u.name} delivery territory`]),
      ['/all-states', 'See every deregulated state we cover'],
      ['/all-providers', 'Browse the supplier directory'],
      ['/learning-center', 'Read our electricity guides'],
    ],
  });

  return { intro, sections };
}

function buildStateFaqs(state, market, insights) {
  const faqs = [];
  const deregulationFact = (insights?.keyFacts || []).find((fact) => /deregulated since/i.test(fact));
  if (deregulationFact) {
    faqs.push({
      question: `When did ${state.name} deregulate its electricity market?`,
      answer: `${deregulationFact}. Since then, households have been able to buy the supply portion of their electricity from a competing retailer while the local utility continues to deliver it.`,
    });
  }
  if (market?.plans) {
    faqs.push({
      question: `How many electricity plans can I choose from in ${state.name}?`,
      answer:
        `Electric Scouts tracks ${market.plans} active plans in ${state.name} from ${market.providers} ` +
        `suppliers ${asOf}, priced between ${formatRate(market.minRate)} and ${formatRate(market.maxRate)}. ` +
        `The plans available to you depend on your ZIP code and utility.`,
    });
  }
  const utilityFact = (insights?.keyFacts || []).find((fact) => /utilit|serve as|distribution/i.test(fact));
  if (utilityFact) {
    faqs.push({
      question: `Which utility will still deliver my power in ${state.name}?`,
      answer: `${utilityFact}. Your utility does not change when you switch suppliers — it keeps delivering electricity, reading your meter and restoring power after an outage.`,
    });
  }
  if (market?.terms?.length) {
    faqs.push({
      question: `What contract lengths are available in ${state.name}?`,
      answer:
        `${state.name} plans in our comparison run to ${formatTerms(market.terms)}` +
        `${market.monthToMonth ? ', and month-to-month plans with no fixed term are also offered' : ''}. ` +
        `${market.noEtfPlans ? `${market.noEtfPlans} of them carry no early termination fee.` : ''}`.trim(),
    });
  }
  return faqs;
}

/* ------------------------------------------------------------------ *
 * Provider pages
 * ------------------------------------------------------------------ */

export function buildProviderSections(route) {
  const provider = route.provider;
  const sections = [];
  const intro = [];
  if (provider.description) intro.push(provider.description);

  const stateLinks = (provider.planStates || [])
    .filter((code) => STATE_NAMES[code])
    .map((code) => [STATE_PAGE_PATHS[code], `${STATE_NAMES[code]} electricity rates`]);

  const bullets = [];
  if (provider.plans) bullets.push(`${provider.plans} active plans in our comparison`);
  if (provider.residentialPlans) bullets.push(`${provider.residentialPlans} residential plans`);
  if (provider.businessPlans) bullets.push(`${provider.businessPlans} business plans`);
  if (provider.renewablePlans) bullets.push(`${provider.renewablePlans} plans backed by 100% renewable energy`);
  if (provider.minRate !== null && provider.maxRate !== null) {
    bullets.push(`Rates from ${formatRate(provider.minRate)} to ${formatRate(provider.maxRate)}`);
  }
  const terms = formatTerms(provider.terms);
  if (terms) bullets.push(`Contract terms of ${terms}`);
  for (const feature of provider.features || []) bullets.push(feature);

  if (bullets.length) {
    sections.push({
      heading: `${provider.name} Plans We Track`,
      paragraphs: [`What ${provider.name} currently has in the Electric Scouts comparison (${asOf}):`],
      bullets,
    });
  }

  /* Where this supplier sits in each market it sells into.
   *
   * The single most useful thing we can say about a supplier is not what it
   * charges but whether that is cheap, and only a site holding the whole
   * catalog can answer it. Every figure is a comparison of two numbers we
   * already publish — the supplier's own entry rate, and the market it is sold
   * into — so nothing here is asserted.
   *
   * It also puts a check on the supplier-written descriptions above it. Discount
   * Power's says it "offers some of the lowest electricity rates in Texas" while
   * its cheapest plan opens at 15.5¢ against a Texas median of 14.35¢. The
   * description is the supplier's claim; this table is ours. */
  const perState = providerStateData(provider.name);
  const positions = (provider.planStates || [])
    .map((code) => {
      const own = perState[code];
      const market = getStateMarket(code);
      if (!own || !market || own.minRate == null || market.minRate == null) return null;
      return { code, name: STATE_NAMES[code], path: STATE_PAGE_PATHS[code], own, market };
    })
    .filter(Boolean);

  if (positions.length) {
    const cheaperThanMedian = positions.filter((row) => row.own.minRate <= row.market.medianRate);
    const marketLeader = positions.filter((row) => row.own.minRate <= row.market.minRate);

    const verdict =
      marketLeader.length > 0
        ? `${provider.name} holds the cheapest plan we track in ` +
          `${joinNames(marketLeader.map((row) => row.name), 3)}.`
        : cheaperThanMedian.length === positions.length
          ? `${provider.name} opens below the median in every market where we hold its plans, ` +
            `though not at the very bottom of any of them.`
          : cheaperThanMedian.length === 0
            ? `${provider.name} opens above the median rate in ${positions.length === 1 ? 'that market' : 'every market where we hold its plans'}, ` +
              `so it is competing on something other than headline price — contract length, ` +
              `renewable supply or exit terms.`
            : `${provider.name} opens below the median in ` +
              `${joinNames(cheaperThanMedian.map((row) => row.name), 3)} and above it elsewhere, ` +
              `which is the usual pattern: suppliers price by utility territory, not by brand.`;

    sections.push({
      heading: `How ${provider.name} Prices Against the Market`,
      paragraphs: [
        `A rate means little on its own. These are ${provider.name}'s cheapest plans set against ` +
          `every plan we hold in the same state (${asOf}).`,
        verdict,
      ],
      table: {
        columns: ['State', `${provider.name} from`, 'Cheapest we track', 'State median'],
        rows: positions.map((row) => [
          { text: row.name, path: row.path },
          formatRate(row.own.minRate),
          formatRate(row.market.minRate),
          formatRate(row.market.medianRate),
        ]),
      },
    });

    /* Plan mix against the market, where the supplier differs from it. A
     * supplier that matches its market on every count gets no bullets rather
     * than a list saying it is unremarkable. */
    const mix = [];
    const totalPlans = positions.reduce((sum, row) => sum + (row.own.plans || 0), 0);
    const marketPlans = positions.reduce((sum, row) => sum + (row.market.plans || 0), 0);
    const share = pctOf(totalPlans, marketPlans);
    if (share !== null && share >= 1) {
      mix.push(
        `${provider.name} accounts for ${share}% of the plans we track in the markets it sells into.`
      );
    }
    const ownRenewable = pctOf(provider.renewablePlans, provider.plans);
    const marketRenewable = pctOf(
      positions.reduce((sum, row) => sum + (row.market.renewablePlans || 0), 0),
      marketPlans
    );
    if (ownRenewable !== null && marketRenewable !== null && Math.abs(ownRenewable - marketRenewable) >= 10) {
      mix.push(
        ownRenewable > marketRenewable
          ? `${ownRenewable}% of its plans are 100% renewable, against ${marketRenewable}% across those markets.`
          : `${ownRenewable}% of its plans are 100% renewable, below the ${marketRenewable}% typical of those markets.`
      );
    }
    const ownNoEtf = pctOf(provider.noEtfPlans, provider.plans);
    const marketNoEtf = pctOf(
      positions.reduce((sum, row) => sum + (row.market.noEtfPlans || 0), 0),
      marketPlans
    );
    if (ownNoEtf !== null && marketNoEtf !== null && Math.abs(ownNoEtf - marketNoEtf) >= 10) {
      mix.push(
        ownNoEtf > marketNoEtf
          ? `${ownNoEtf}% carry no early termination fee, against ${marketNoEtf}% across those markets — ` +
            `unusually easy to leave.`
          : `${ownNoEtf}% carry no early termination fee, against ${marketNoEtf}% across those markets, ` +
            `so check the exit fee before enrolling.`
      );
    }
    if (mix.length) {
      sections.push({
        heading: `${provider.name} Against the Rest of the Market`,
        bullets: mix,
      });
    }
  }

  if (stateLinks.length) {
    sections.push({
      heading: `Where ${provider.name} Plans Are Available`,
      paragraphs: [
        `We hold active ${provider.name} plans in ${joinNames(provider.planStates.map((c) => STATE_NAMES[c]).filter(Boolean))}. ` +
          `Availability is confirmed by ZIP code, because suppliers price by utility territory.`,
      ],
      links: stateLinks,
    });
  }

  const extraStates = (provider.supportedStates || []).filter(
    (code) => STATE_NAMES[code] && !(provider.planStates || []).includes(code)
  );
  if (extraStates.length) {
    sections.push({
      heading: `Other States ${provider.name} Serves`,
      paragraphs: [
        `${provider.name} also lists service in ${joinNames(extraStates.map((c) => STATE_NAMES[c]))}, ` +
          `but we do not currently hold active plans there. Compare what is available in those markets ` +
          `from the supplier directory.`,
      ],
      links: extraStates.map((code) => [STATE_PAGE_PATHS[code], `${STATE_NAMES[code]} electricity rates`]),
    });
  }

  /* Head-to-head pages featuring this supplier.
   *
   * These links are the reason the /compare cluster is worth publishing. A
   * matchup page answers "which of these two" — the question a reader has
   * immediately after reading one supplier's page — so the supplier page is
   * where the link belongs. Without it every matchup had exactly one inbound
   * link, from the hub, and nothing pointed at it from the pages people
   * actually land on. */
  const matchups = comparisonsForProvider(provider.slug);
  if (matchups.length) {
    const opponents = matchups.map((entry) =>
      entry.a.slug === provider.slug ? entry.b.name : entry.a.name
    );
    sections.push({
      heading: `${provider.name} Compared Head to Head`,
      paragraphs: [
        `We hold side-by-side comparisons of ${provider.name} against ` +
          `${joinNames(opponents, 3)} — rates, plan counts, contract terms and exit fees, ` +
          `counted in every state where both are sold.`,
      ],
      links: matchups.map((entry) => [entry.path, entry.heading]),
    });
  }

  /* Suppliers competing for the same customer.
   *
   * A supplier with no curated matchup was reachable only from its state page
   * and the directory — two inbound links, against a median of seven across
   * the family. These are not matchups (no editorial judgement, no comparison
   * tables); they are the answer to "who else sells where this one sells",
   * which is the next question after reading a supplier profile, and they give
   * the smaller suppliers a route in from the larger ones.
   *
   * Ranked by shared footprint, then by closeness in catalog size rather than
   * by absolute size. Sorting by size put the same handful of national
   * suppliers on all 35 pages and left the small Texas-only ones with two
   * inbound links each — they shared states with the giants but never appeared
   * in a giant's own list. Closeness fixes both halves of that: it links small
   * suppliers to each other, and it is the more useful comparison anyway.
   * Weighing a five-plan retailer against a forty-one-plan national is not the
   * choice a reader on this page is making. */
  const rivals = getPublishableProviders()
    .filter((other) => other.slug !== provider.slug && other.plans > 0)
    .map((other) => ({
      other,
      shared: (other.planStates || []).filter((code) => (provider.planStates || []).includes(code)).length,
      sizeGap: Math.abs((other.plans || 0) - (provider.plans || 0)),
    }))
    .filter((entry) => entry.shared > 0)
    .sort((a, b) => b.shared - a.shared || a.sizeGap - b.sizeGap)
    .slice(0, 6);

  if (rivals.length) {
    sections.push({
      heading: `Other Suppliers Selling Where ${provider.name} Does`,
      paragraphs: [
        `${provider.name} is not the only option at these addresses. Each of these sells into at ` +
          `least one of the same states, so they are the suppliers a ${provider.name} quote is ` +
          `really being weighed against.`,
      ],
      links: rivals.map(({ other, shared }) => [
        `/providers/${other.slug}`,
        shared === 1
          ? `${other.name} — also sold in ${STATE_NAMES[(other.planStates || []).find((code) => (provider.planStates || []).includes(code))]}`
          : `${other.name} — overlaps in ${shared} states`,
      ]),
    });
  }

  sections.push({
    heading: `${provider.name} Questions`,
    faqs: buildProviderFaqs(provider),
  });

  sections.push({
    heading: 'Next Steps',
    links: [
      ['/all-providers', 'Compare every supplier in our directory'],
      ['/compare-rates', 'Compare plans for your ZIP code'],
      ['/bill-analyzer', 'Check your current bill against these rates'],
    ],
  });

  return { intro, sections };
}

function buildProviderFaqs(provider) {
  const faqs = [];
  if (provider.planStates?.length) {
    faqs.push({
      question: `Which states does ${provider.name} have plans in?`,
      answer:
        `We hold active ${provider.name} plans in ` +
        `${joinNames(provider.planStates.map((c) => STATE_NAMES[c]).filter(Boolean))} ${asOf}. ` +
        `Enter your ZIP code to check availability at your address.`,
    });
  }
  if (provider.minRate !== null) {
    faqs.push({
      question: `How much does ${provider.name} charge per kWh?`,
      answer:
        `${provider.name} plans in our comparison run from ${formatRate(provider.minRate)} to ` +
        `${formatRate(provider.maxRate)} ${asOf}. The rate you are offered depends on your ZIP code, ` +
        `the plan you pick and your contract length, and rates change often.`,
    });
  }
  if (provider.renewablePlans) {
    faqs.push({
      question: `Does ${provider.name} offer renewable energy plans?`,
      answer: `Yes — ${provider.renewablePlans} of the ${provider.plans} ${provider.name} plans we track are backed by 100% renewable energy.`,
    });
  }
  if (provider.businessPlans) {
    faqs.push({
      question: `Does ${provider.name} serve businesses?`,
      answer: `Yes. ${provider.businessPlans} of the ${provider.name} plans we track are commercial plans. Business supply is normally quoted against your load profile rather than sold at a listed rate.`,
    });
  }
  return faqs;
}

/* ------------------------------------------------------------------ *
 * Hub and static pages
 * ------------------------------------------------------------------ */

/**
 * Static pages get hand-built sections keyed by path. A page with no entry
 * here falls back to its description alone, which the audit flags as thin —
 * that is intentional, so a new indexable page cannot be added without someone
 * deciding what it should actually say.
 */
/** Headings match when they are the same words, ignoring case and punctuation. */
function normalizeHeading(heading) {
  return String(heading || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export function buildStaticSections(route, context) {
  const builder = STATIC_BUILDERS[route.path];
  const base = builder
    ? builder(route, context)
    : { intro: [route.description].filter(Boolean), sections: [] };

  /* The editorial body, where this page has one. It is merged in rather than
   * replacing the builder's output: the builder owns the tables and link lists
   * assembled from the snapshot, and this owns the prose. The drafted sections
   * go in ahead of the page's closing "Next Steps" block so the page still ends
   * on somewhere to go.
   *
   * Every sentence citing a figure is resolved here, and any that cites one we
   * cannot compute is dropped — see src/seo/figures.js. */
  const editorial = STATIC_PAGE_CONTENT[route.path];
  if (!editorial) return base;

  const drafted = resolveSections(editorial.sections);
  if (!drafted.length) return base;

  /* A drafted section whose heading the builder already uses is merged into it
   * rather than appended. Several drafts extend a section that exists —
   * "Deregulated States We Cover" is the builder's table plus the draft's
   * explanation of what the table is — and appending would have printed the
   * heading twice with half the content under each. */
  const sections = (base.sections || []).map((section) => ({ ...section }));
  const byHeading = new Map(sections.map((section, index) => [normalizeHeading(section.heading), index]));
  const appended = [];

  for (const section of drafted) {
    const existingIndex = byHeading.get(normalizeHeading(section.heading));
    if (existingIndex === undefined) {
      appended.push(section);
      byHeading.set(normalizeHeading(section.heading), sections.length + appended.length - 1);
      continue;
    }
    const target = sections[existingIndex];
    target.paragraphs = [...(target.paragraphs || []), ...(section.paragraphs || [])];
    if (section.bullets) target.bullets = [...(target.bullets || []), ...section.bullets];
    if (section.faqs) target.faqs = [...(target.faqs || []), ...section.faqs];
    if (section.links && !target.links) target.links = section.links;
  }

  const closingIndex = sections.findIndex((section) => /^Next Steps$/i.test(section.heading || ''));
  if (closingIndex === -1) sections.push(...appended);
  else sections.splice(closingIndex, 0, ...appended);

  // An intro line is added only where it says something the builder's does not.
  const intro = [...(base.intro || [])];
  for (const line of editorial.intro || []) {
    if (!intro.some((existing) => existing.trim() === line.trim())) intro.push(line);
  }

  return { ...base, intro, sections };
}

export function hasStaticContent(path) {
  return Boolean(STATIC_BUILDERS[path]);
}

/** Per-state summary rows, reused by several hub pages. */
function stateRows(states, pick) {
  return states
    .map((state) => ({ state, market: getStateMarket(state.code) }))
    .filter((entry) => entry.market)
    .map(pick);
}

const STATIC_BUILDERS = {
  '/': (route, { states }) => ({
    intro: [
      'Electric Scouts is a free, independent comparison service for the 12 US states where ' +
        'households can choose their electricity supplier. Enter a ZIP code or upload a bill and we ' +
        'show what is actually available at that address.',
      `We track ${totalPlans(states)} active plans from ${totalProviders(states)} suppliers across ` +
        `${states.length} states (${asOf}).`,
    ],
    sections: [
      {
        heading: 'Start Where You Are',
        links: [
          ['/compare-rates', 'Compare electricity rates by ZIP code'],
          ['/bill-analyzer', 'Upload a bill and see what you are overpaying'],
          ['/savings-calculator', 'Estimate savings from your current rate and usage'],
          ['/home-concierge', 'Set up electricity and other utilities when you move'],
        ],
      },
      {
        heading: 'Electricity Rates by State',
        paragraphs: ['Each state page covers how that market works, which suppliers have plans and what rates look like city by city.'],
        table: {
          columns: ['State', 'Plans tracked', 'Suppliers', 'Rate range'],
          rows: stateRows(states, ({ state, market }) => [
            { text: state.name, path: state.path },
            String(market.plans),
            String(market.providers),
            `${formatRate(market.minRate)} – ${formatRate(market.maxRate)}`,
          ]),
        },
      },
      {
        heading: 'Shop by What You Need',
        links: [
          ['/residential-electricity', 'Electricity for your home'],
          ['/renewable-energy', 'Renewable and 100% green electricity plans'],
          ['/business-electricity', 'Business and commercial electricity'],
          ['/all-providers', 'Every supplier in our directory'],
          ['/all-cities', 'Electricity rates by city'],
          ['/learning-center', 'Guides on switching, contracts and billing'],
          ['/faq', 'Common questions about switching supplier'],
        ],
      },
    ],
  }),

  '/all-states': (route, { states }) => ({
    intro: [
      'Twelve US states let households buy electricity supply from a competing retailer instead of ' +
        'the local utility. These are the markets Electric Scouts covers, with what we currently track in each.',
    ],
    sections: [
      {
        heading: 'Deregulated States We Cover',
        table: {
          columns: ['State', 'Plans tracked', 'Suppliers', 'Rate range', 'Renewable plans'],
          rows: stateRows(states, ({ state, market }) => [
            { text: state.name, path: state.path },
            String(market.plans),
            String(market.providers),
            `${formatRate(market.minRate)} – ${formatRate(market.maxRate)}`,
            String(market.renewablePlans),
          ]),
        },
      },
      {
        heading: 'How Deregulated Markets Differ',
        paragraphs: [
          'Each state deregulated under its own legislation and its own regulator, so contract rules, ' +
            'switching timelines and default-service pricing are not the same across markets. The state ' +
            'pages set out the statute, the regulator and the utilities that still handle delivery.',
        ],
      },
      {
        heading: 'Next Steps',
        links: [
          ['/compare-rates', 'Compare plans for your ZIP code'],
          ['/all-cities', 'Browse rates city by city'],
          ['/all-providers', 'Browse the supplier directory'],
        ],
      },
    ],
  }),

  '/all-cities': (route, { states }) => ({
    intro: [
      'Local averages, utilities and coverage for every city Electric Scouts publishes. Rates are area ' +
        'averages rather than quotes — the plans you can actually buy depend on your ZIP code.',
    ],
    sections: states
      .filter((state) => state.cities.length)
      .map((state) => ({
        heading: `${state.name} Cities`,
        links: state.cities.map((city) => [city.path, `${city.name}, ${city.stateCode} — ${city.avgRate}`]),
      }))
      .concat([
        {
          heading: 'Next Steps',
          links: [
            ['/all-states', 'Compare states rather than cities'],
            ['/compare-rates', 'Compare plans for your ZIP code'],
          ],
        },
      ]),
  }),

  '/all-providers': (route, { states }) => {
    const publishable = getPublishableProviders();
    const everyName = [...new Set(states.flatMap((state) => getStateMarket(state.code)?.providerNames || []))].sort();
    return {
      intro: [
        `Electric Scouts tracks plans from ${everyName.length} electricity suppliers across ` +
          `${states.length} deregulated states (${asOf}). Supplier availability is set by utility ` +
          'territory, so the list at your address is narrower than the list here.',
      ],
      sections: [
        publishable.length
          ? {
              heading: 'Supplier Profiles',
              paragraphs: [
                'Suppliers with a full profile on Electric Scouts, covering the plans we hold, the states they cover and their contract terms.',
              ],
              providers: publishable.map((provider) => ({ name: provider.name, path: `/providers/${provider.slug}` })),
            }
          : null,
        {
          heading: 'All Suppliers with Tracked Plans',
          paragraphs: ['Every supplier with at least one active plan in our comparison.'],
          providers: providerEntries(everyName),
        },
        {
          heading: 'Suppliers by State',
          table: {
            columns: ['State', 'Suppliers with plans', 'Plans tracked'],
            rows: stateRows(states, ({ state, market }) => [
              { text: state.name, path: state.path },
              String(market.providers),
              String(market.plans),
            ]),
          },
        },
        {
          heading: 'Next Steps',
          links: [
            ['/compare-rates', 'See which suppliers serve your ZIP code'],
            ['/renewable-energy', 'Suppliers with 100% renewable plans'],
            ['/business-electricity', 'Suppliers with commercial plans'],
          ],
        },
      ].filter(Boolean),
    };
  },

  '/residential-electricity': (route, { states }) => {
    const rows = stateRows(states, ({ state, market }) => ({ state, market })).filter(
      (entry) => entry.market.residentialPlans
    );
    const totalResidential = rows.reduce((sum, entry) => sum + entry.market.residentialPlans, 0);
    const totalRenewable = rows.reduce((sum, entry) => sum + entry.market.renewablePlans, 0);

    return {
      intro: [
        `Electric Scouts tracks ${totalResidential} residential electricity plans across ` +
          `${rows.length} deregulated states (${asOf}). This page covers how buying electricity ` +
          'for a home works, what the comparison asks you and what it can tell you before you switch.',
        'Supply is licensed by utility territory, so what you can actually buy is decided by your ' +
          'ZIP code rather than by your state.',
      ],
      sections: [
        {
          heading: 'How Residential Electricity Shopping Works',
          bullets: [
            'Your ZIP code determines which suppliers are allowed to sell to your address',
            'You describe the home — house, apartment or condo — and roughly how much you use',
            'A recent bill can be uploaded instead, and the measured usage replaces the estimate',
            'Plans are shown with rate per kWh, contract length and early termination fee together',
            'Enrollment happens with the supplier; the utility, meter and wiring stay unchanged',
          ],
        },
        {
          heading: 'Moving, Switching or Checking Your Rate',
          paragraphs: [
            'Starting new service means the supply has to be live on the day you arrive: enrollment ' +
              'takes minutes, but the connection itself is scheduled by the utility.',
            'Switching supplier is worth timing against your current contract, because leaving a ' +
              'fixed term early can carry an early termination fee. Contracts can usually be quoted ' +
              'before the end date rather than after it.',
            'If you are out of contract you may have rolled onto a variable rate, which is the case ' +
              'where comparing against currently sold plans tells you the most.',
          ],
        },
        {
          heading: 'Using Your Bill Instead of an Estimate',
          paragraphs: [
            'A headline rate per kWh is not the whole bill. Monthly base charges and usage credits ' +
              'with thresholds change what you pay, and by how much, as your usage moves. Uploading a ' +
              'bill lets the comparison work from your measured usage and the rate you are actually ' +
              'paying rather than from a band.',
          ],
          links: [['/bill-analyzer', 'Analyse an electricity bill']],
        },
        {
          heading: 'Residential Plans by State',
          table: {
            columns: ['State', 'Plans for homes', 'Suppliers', 'From'],
            rows: rows.map(({ state, market }) => [
              { text: state.name, path: state.path },
              String(market.residentialPlans),
              String(market.providers),
              formatRate(market.minResidentialRate) || '—',
            ]),
          },
        },
        {
          heading: 'Renewable Options for a Home',
          paragraphs: [
            `${totalRenewable} of the plans we track are backed by renewable generation. On a ` +
              'competitive market that means the supplier matches your consumption with renewable ' +
              'certificates — the electricity arriving at your meter is the same either way.',
          ],
          links: [['/renewable-energy', 'How renewable electricity plans work']],
        },
        {
          heading: 'Residential Electricity Questions',
          faqs: [
            {
              question: 'Will my power go out when I switch suppliers?',
              answer:
                'No. Your local utility still owns the wires, the meter and the outage line, and ' +
                'nothing at your property changes. Switching changes which company sells you the ' +
                'supply and bills you for it.',
            },
            {
              question: 'Can I compare plans for an apartment or a condo?',
              answer:
                'Yes, as long as you pay an electricity bill in your own name at a deregulated ' +
                'address. Where supply is bundled into rent or billed by the building, the choice ' +
                'sits with whoever holds the account.',
            },
            {
              question: 'Do I need a bill to compare plans?',
              answer:
                'No. A ZIP code and a rough idea of your usage is enough to see what is available. ' +
                'A bill makes the estimate more accurate because it replaces the usage band with a ' +
                'measured figure.',
            },
            {
              question: 'Why is the cheapest rate per kWh not always the cheapest bill?',
              answer:
                'Monthly base charges and usage credits with thresholds change the effective rate at ' +
                'different usage levels. Comparing estimated cost at your own usage is the only way ' +
                'to see which plan is cheaper for you.',
            },
          ],
        },
        {
          heading: 'Next Steps',
          links: [
            ['/compare-rates', 'Compare plans for your ZIP code'],
            ['/bill-analyzer', 'See the rate you are actually paying'],
            ['/renewable-energy', 'Renewable electricity plans'],
            ['/business-electricity', 'Electricity for a business or commercial property'],
            ['/all-cities', 'Electricity rates by city'],
          ],
        },
      ],
    };
  },

  '/renewable-energy': (route, { states }) => {
    const rows = stateRows(states, ({ state, market }) => ({ state, market })).filter(
      (entry) => entry.market.renewablePlans
    );
    const totalGreen = rows.reduce((sum, entry) => sum + entry.market.renewablePlans, 0);
    return {
      intro: [
        `Electric Scouts tracks ${totalGreen} electricity plans backed by 100% renewable energy across ` +
          `${rows.length} states (${asOf}). This page covers what those plans are, what they cost and where to get them.`,
      ],
      sections: [
        {
          heading: 'What a 100% Renewable Plan Actually Is',
          paragraphs: [
            'On a competitive market a renewable plan does not mean a dedicated wire from a wind farm to ' +
              'your house. The supplier buys renewable energy certificates matching the electricity you ' +
              'use, so an equivalent amount of renewable generation is added to the grid on your behalf.',
            'That matters when comparing: a renewable plan and a standard plan deliver identical ' +
              'electricity to the same meter over the same wires. What differs is how the supply is sourced and priced.',
          ],
        },
        {
          heading: 'Renewable Plans by State',
          table: {
            columns: ['State', 'Renewable plans', 'Suppliers', 'From'],
            rows: rows.map(({ state, market }) => [
              { text: state.name, path: state.path },
              String(market.renewablePlans),
              String(market.renewableProviders),
              formatRate(market.minRenewableRate) || '—',
            ]),
          },
        },
        {
          heading: 'Next Steps',
          links: [
            ['/renewable-compare-rates', 'Compare renewable plans for your ZIP code'],
            ['/residential-electricity', 'Renewable supply for a home'],
            ['/business-electricity', 'Renewable supply for a business'],
            ['/all-providers', 'Browse suppliers'],
            ['/learning-center', 'Guides on green energy plans'],
          ],
        },
      ],
    };
  },

  '/renewable-compare-rates': (route, { states }) => {
    const rows = stateRows(states, ({ state, market }) => ({ state, market })).filter(
      (entry) => entry.market.renewablePlans
    );
    return {
      intro: [
        'Filter the comparison down to plans backed by 100% renewable energy and rank them by rate, ' +
          'contract length or supplier. Enter a ZIP code to see what is available at your address.',
      ],
      sections: [
        {
          heading: 'How the Renewable Comparison Works',
          bullets: [
            'Enter your ZIP code so only plans sold in your utility territory are shown',
            'Results are limited to plans backed by 100% renewable energy',
            'Sort by rate, contract length or supplier',
            'Rates shown per kWh alongside contract term and early termination fee',
          ],
        },
        {
          heading: 'Where Renewable Plans Are Available',
          table: {
            columns: ['State', 'Renewable plans', 'From'],
            rows: rows.map(({ state, market }) => [
              { text: state.name, path: state.path },
              String(market.renewablePlans),
              formatRate(market.minRenewableRate) || '—',
            ]),
          },
        },
        {
          heading: 'Renewable Comparison Questions',
          faqs: [
            {
              question: 'Do renewable plans cost more?',
              answer:
                'Not necessarily. In several of the markets we track, the cheapest plan on the board is a ' +
                'renewable one. Where a premium exists it comes from the certificates the supplier buys, ' +
                'not from the electricity itself.',
            },
            {
              question: 'What counts as a 100% renewable plan here?',
              answer:
                'A plan the supplier matches entirely with renewable generation, recorded as 100% renewable ' +
                'content in our data. Plans with partial renewable content are not included in this filter.',
            },
            {
              question: 'Does switching to a renewable plan change anything at my property?',
              answer:
                'No. Your meter, wiring and utility stay exactly as they are. Only the supply contract and ' +
                'how that supply is sourced change.',
            },
          ],
        },
        {
          heading: 'Next Steps',
          links: [
            ['/renewable-energy', 'How renewable electricity plans work'],
            ['/compare-rates', 'Compare all plans, not just renewable'],
            ['/all-providers', 'Suppliers with renewable plans'],
          ],
        },
      ],
    };
  },

  '/business-electricity': (route, { states }) => {
    const rows = stateRows(states, ({ state, market }) => ({ state, market })).filter(
      (entry) => entry.market.businessPlans
    );
    const totalBusiness = rows.reduce((sum, entry) => sum + entry.market.businessPlans, 0);
    return {
      intro: [
        `Commercial electricity is bought differently from household supply: pricing depends on your ` +
          `load profile and contract length rather than a published rate card. Electric Scouts tracks ` +
          `${totalBusiness} commercial plans across ${rows.length} states (${asOf}).`,
      ],
      sections: [
        {
          heading: 'How Business Electricity Pricing Differs',
          bullets: [
            'Rates are quoted against your usage pattern, not just total kWh',
            'Demand charges bill you on your highest measured load, not only consumption',
            'Contract terms are negotiated and often longer than residential terms',
            'Multi-site businesses can usually be aggregated under one contract',
            'Pricing is normally quoted rather than listed, so a quote request is the starting point',
          ],
        },
        {
          heading: 'Commercial Plans by State',
          table: {
            columns: ['State', 'Business plans', 'From'],
            rows: rows.map(({ state, market }) => [
              { text: state.name, path: state.path },
              String(market.businessPlans),
              formatRate(market.minBusinessRate) || '—',
            ]),
          },
        },
        {
          heading: 'Business Electricity Questions',
          faqs: [
            {
              question: 'Why can I not just see a business rate the way I see a residential rate?',
              answer:
                'Commercial supply is priced against your load profile — when you use power, not only how ' +
                'much. Two businesses on the same street with the same annual consumption can be quoted ' +
                'different rates. That is why business supply is quoted rather than listed.',
            },
            {
              question: 'What is a demand charge?',
              answer:
                'A demand charge bills you on the highest rate of power you drew during the billing period, ' +
                'measured in kW, separately from the total energy you consumed. For businesses with short ' +
                'heavy peaks it can be a large share of the bill.',
            },
            {
              question: 'Can one contract cover several locations?',
              answer:
                'Usually yes, provided the sites sit in the same deregulated market. Aggregating sites gives ' +
                'a supplier a larger volume to price against, which is normally reflected in the quote.',
            },
          ],
        },
        {
          heading: 'Next Steps',
          links: [
            ['/compare-rates', 'Start a business comparison with your ZIP code'],
            ['/business-compare-rates', 'Request business electricity quotes'],
            ['/business-hub', 'Business electricity by company size'],
            ['/residential-electricity', 'Electricity for a home instead'],
          ],
        },
      ],
    };
  },

  '/business-hub': (route, { states }) => {
    const rows = stateRows(states, ({ state, market }) => ({ state, market })).filter(
      (entry) => entry.market.businessPlans
    );
    return {
      intro: [
        'What a business needs from an electricity contract depends mostly on its size and load shape. ' +
          'This page groups the options by company profile and routes each one to the right quote process.',
      ],
      sections: [
        {
          heading: 'Small Business',
          paragraphs: [
            'Offices, shops and restaurants with a steady, modest load. Small commercial accounts are often ' +
              'priced close to residential structures, and a fixed-rate contract is usually the simplest way ' +
              'to make costs predictable.',
          ],
        },
        {
          heading: 'Medium Business',
          paragraphs: [
            'Warehouses, clinics and hotels, where load is larger and less uniform. At this size demand ' +
              'charges start to matter and contract length becomes a real lever on the rate.',
          ],
        },
        {
          heading: 'Large and Industrial',
          paragraphs: [
            'Manufacturing sites and data centres with high, sustained load. Supply at this scale is ' +
              'negotiated individually, and the shape of your consumption drives the price more than the headline rate.',
          ],
        },
        {
          heading: 'Where We Track Commercial Plans',
          table: {
            columns: ['State', 'Business plans', 'From'],
            rows: rows.map(({ state, market }) => [
              { text: state.name, path: state.path },
              String(market.businessPlans),
              formatRate(market.minBusinessRate) || '—',
            ]),
          },
        },
        {
          heading: 'Next Steps',
          links: [
            ['/business-compare-rates', 'Request quotes for your business'],
            ['/business-electricity', 'How commercial pricing and demand charges work'],
          ],
        },
      ],
    };
  },

  '/business-compare-rates': (route, { states }) => ({
    intro: [
      'Enter your business ZIP code and usage to get commercial electricity quotes. Because commercial ' +
        'supply is priced against your load profile, this is a quote request rather than an instant checkout.',
    ],
    sections: [
      {
        heading: 'What You Need Before You Start',
        bullets: [
          'Your service ZIP code and utility',
          'Recent monthly kWh usage, ideally 12 months of it',
          'Your peak demand in kW if it appears on your bill',
          'Contract end date with your current supplier, if you have one',
          'The number of sites you want covered',
        ],
      },
      {
        heading: 'What Happens Next',
        bullets: [
          'We match your details against suppliers active in your utility territory',
          'Suppliers price against your load profile and contract length',
          'You compare quotes side by side rather than one at a time',
        ],
      },
      {
        heading: 'Commercial Coverage by State',
        table: {
          columns: ['State', 'Business plans', 'Suppliers'],
          rows: stateRows(states, ({ state, market }) => ({ state, market }))
            .filter((entry) => entry.market.businessPlans)
            .map(({ state, market }) => [
              { text: state.name, path: state.path },
              String(market.businessPlans),
              String(market.providers),
            ]),
        },
      },
      {
        heading: 'Business Quote Questions',
        faqs: [
          {
            question: 'How long does a commercial quote take?',
            answer:
              'Suppliers usually price against a load profile within a couple of business days. Larger or ' +
              'multi-site accounts take longer because the pricing is built individually.',
          },
          {
            question: 'What if I am still under contract?',
            answer:
              'You can still get quotes. Suppliers commonly price a contract that starts when your current ' +
              'one ends, so it is worth quoting a few months before your end date rather than after it.',
          },
        ],
      },
      {
        heading: 'Next Steps',
        links: [
          ['/business-electricity', 'How business electricity pricing works'],
          ['/business-hub', 'Options by company size'],
        ],
      },
    ],
  }),

  '/compare-rates': (route, { states }) => ({
    intro: [
      'Enter a ZIP code and see the plans actually sold in that utility territory, side by side, with ' +
        'the rate, contract length and early termination fee on the same row.',
    ],
    sections: [
      {
        heading: 'How the Comparison Works',
        bullets: [
          'Your ZIP code determines which suppliers can sell to you',
          'Plans are shown with rate per kWh, contract term and early termination fee',
          'Filter to fixed, variable or 100% renewable plans',
          'Sort by rate, term or supplier',
          'Enter your monthly usage to compare estimated bills rather than headline rates',
        ],
      },
      {
        heading: 'Why the Headline Rate Is Not the Whole Bill',
        paragraphs: [
          'A plan advertised at a low rate per kWh can still cost more than a higher-rate plan once monthly ' +
            'base charges, usage credits with thresholds and delivery charges are counted. Comparing at your ' +
            'own usage level is the only way to see which plan is actually cheaper for you.',
        ],
      },
      {
        heading: 'Coverage',
        table: {
          columns: ['State', 'Plans tracked', 'Suppliers', 'Rate range'],
          rows: stateRows(states, ({ state, market }) => [
            { text: state.name, path: state.path },
            String(market.plans),
            String(market.providers),
            `${formatRate(market.minRate)} – ${formatRate(market.maxRate)}`,
          ]),
        },
      },
      {
        heading: 'Next Steps',
        links: [
          ['/bill-analyzer', 'Analyse your current bill first'],
          ['/savings-calculator', 'Estimate savings before you switch'],
          ['/residential-electricity', 'How comparing works for a home'],
          ['/business-electricity', 'How commercial electricity is priced'],
          ['/renewable-compare-rates', 'Compare renewable plans only'],
        ],
      },
    ],
  }),

  '/bill-analyzer': () => ({
    intro: [
      'Upload an electricity bill and Electric Scouts reads the rate you are actually paying, the charges ' +
        'attached to it and how it compares with plans currently available in your area.',
    ],
    sections: [
      {
        heading: 'What the Analyser Reads',
        bullets: [
          'The effective rate per kWh you paid, not the advertised rate',
          'Monthly base charges and delivery charges',
          'Usage credits and the thresholds attached to them',
          'Your usage pattern across the billing period',
          'Contract end date and early termination fee, where the bill shows them',
        ],
      },
      {
        heading: 'Why the Effective Rate Matters',
        paragraphs: [
          'The number on your bill is rarely the number you were sold. Base charges and usage credits mean ' +
            'the effective rate changes with how much you use, so a plan can look cheap at 2,000 kWh and be ' +
            'expensive at 800 kWh. The analyser works out what you actually paid per kWh so the comparison is like for like.',
        ],
      },
      {
        heading: 'What the Analysis Cannot Tell You',
        bullets: [
          'It cannot change your delivery charges — those are set by your utility, not your supplier',
          'It cannot see a rate change scheduled after the bill you upload',
          'It reads one billing period, so a seasonal peak can skew a single-month comparison',
          'It does not enrol you in anything; switching is a separate, deliberate step',
        ],
      },
      {
        heading: 'Bill Analyzer Questions',
        faqs: [
          {
            question: 'What do I need to upload?',
            answer:
              'A recent electricity bill as a PDF or an image. The analysis needs the supply rate, the ' +
              'charges attached to it and your usage for the period — all of which appear on a standard bill.',
          },
          {
            question: 'Why is my effective rate higher than the rate I signed up for?',
            answer:
              'Monthly base charges and minimum-usage fees are spread across every kWh you used. At lower ' +
              'usage they raise the effective rate substantially, which is why a plan advertised at one ' +
              'rate can bill at another.',
          },
        ],
      },
      {
        heading: 'Next Steps',
        links: [
          ['/compare-rates', 'Compare your rate against current plans'],
          ['/savings-calculator', 'Estimate annual savings'],
          ['/learning-center', 'Guides on reading your bill'],
        ],
      },
    ],
  }),

  '/savings-calculator': () => ({
    intro: [
      'Enter your current rate and monthly usage to estimate what a different plan would cost you over a ' +
        'year. The calculator works from your own numbers rather than a generic average.',
    ],
    sections: [
      {
        heading: 'What You Need',
        bullets: [
          'Your current rate per kWh, from your bill',
          'Your average monthly usage in kWh',
          'Your state, so the comparison uses plans sold in your market',
        ],
      },
      {
        heading: 'How the Estimate Is Built',
        paragraphs: [
          'The estimate multiplies the difference between your current rate and an available rate by your ' +
            'annual usage. It is an arithmetic projection from the figures you enter, not a guaranteed ' +
            'saving: rates change, usage varies season to season, and delivery charges are set by your utility rather than your supplier.',
        ],
      },
      {
        heading: 'What the Estimate Does Not Include',
        bullets: [
          'Delivery and transmission charges, which your utility sets and a supplier switch does not change',
          'Early termination fees on a contract you are still inside',
          'Seasonal swings in usage, unless you enter a usage figure that already averages them',
          'Rate changes during the term on a variable-rate plan',
        ],
      },
      {
        heading: 'Savings Calculator Questions',
        faqs: [
          {
            question: 'Where do I find my current rate?',
            answer:
              'It appears on your bill as the supply or energy charge, usually expressed in cents per kWh. ' +
              'If your bill shows a total rather than a rate, the Bill Analyzer will work it out from the figures on the bill.',
          },
          {
            question: 'Is the projected saving guaranteed?',
            answer:
              'No. It is arithmetic applied to the numbers you enter: the rate difference multiplied by your ' +
              'annual usage. If your usage changes or you are on a variable rate, the actual figure will differ.',
          },
        ],
      },
      {
        heading: 'Next Steps',
        links: [
          ['/compare-rates', 'See the plans behind the estimate'],
          ['/bill-analyzer', 'Get your current rate from your bill'],
        ],
      },
    ],
  }),

  '/learning-center': (route, { articles }) => ({
    intro: [
      `Guides on how electricity markets work, how to read a bill and what to check before signing a ` +
        `contract. ${articles?.length ? `${articles.length} articles, written for people switching supplier rather than for the industry.` : ''}`.trim(),
    ],
    sections: [
      articles?.length
        ? {
            heading: 'All Guides',
            links: articles.map((article) => [article.path, article.heading || article.title]),
          }
        : null,
      {
        heading: 'Next Steps',
        links: [
          ['/faq', 'Short answers to common questions'],
          ['/compare-rates', 'Compare plans for your ZIP code'],
          ['/all-states', 'How your state market works'],
        ],
      },
    ].filter(Boolean),
  }),

  '/faq': (route, { states }) => ({
    intro: [
      'Common questions about choosing an electricity supplier in a deregulated market, answered plainly.',
    ],
    sections: [
      {
        heading: 'Switching Supplier',
        faqs: [
          {
            question: 'Will my power go out when I switch suppliers?',
            answer:
              'No. Your local utility keeps delivering electricity over the same wires and stays responsible ' +
              'for outages and meter reads. Switching changes only which company sells you the supply portion of your bill.',
          },
          {
            question: 'How long does a switch take?',
            answer:
              'Most switches take effect on your next meter read, so anywhere from a few days to about a ' +
              'billing cycle depending on your utility. You do not need to contact your old supplier — the new one handles it.',
          },
          {
            question: 'Will I be charged to leave my current plan?',
            answer:
              'Only if your current contract carries an early termination fee and you are still inside the ' +
              'term. Your bill or contract summary will say. Plans sold with no early termination fee can be left at any time.',
          },
        ],
      },
      {
        heading: 'Rates and Plans',
        faqs: [
          {
            question: 'What is the difference between a fixed and a variable rate?',
            answer:
              'A fixed rate stays the same for the contract term. A variable rate can change month to month ' +
              'at the supplier’s discretion, which means it can fall but also rise sharply, often after an introductory period.',
          },
          {
            question: 'Why is the advertised rate not what I end up paying?',
            answer:
              'Advertised rates are usually quoted at a specific usage level, commonly 1,000 or 2,000 kWh a ' +
              'month. Monthly base charges and usage credits with thresholds change the effective rate at any ' +
              'other usage level, so the same plan can cost noticeably more or less than advertised depending on your consumption.',
          },
          {
            question: 'Does a renewable plan deliver different electricity to my home?',
            answer:
              'No. The electrons reaching your meter are the same. On a renewable plan the supplier buys ' +
              'renewable energy certificates matching your usage, so an equivalent amount of renewable ' +
              'generation is added to the grid.',
          },
        ],
      },
      {
        heading: 'Coverage',
        paragraphs: [
          `Electric Scouts covers the ${states.length} US states where households can choose their supplier. ` +
            'Whether you have a choice at all depends on your state and, in some places, on your specific utility territory.',
        ],
        links: [['/all-states', 'See every state we cover']],
      },
      {
        heading: 'Next Steps',
        links: [
          ['/compare-rates', 'Compare plans for your ZIP code'],
          ['/learning-center', 'Longer guides on each topic'],
        ],
      },
    ],
  }),

  '/about-us': (route, { states }) => ({
    intro: [
      'Electric Scouts is an independent electricity comparison service. We are not a supplier and we do ' +
        'not sell electricity — we show what is available so the choice is made on the numbers.',
    ],
    sections: [
      {
        heading: 'What We Cover',
        paragraphs: [
          `We track ${totalPlans(states)} active plans from ${totalProviders(states)} suppliers across the ` +
            `${states.length} deregulated states where households can choose a supplier (${asOf}).`,
        ],
      },
      {
        heading: 'How We Make Money',
        paragraphs: [
          'Some suppliers pay us a referral fee when a customer signs up through our links. That is how the ' +
            'service stays free to use. It does not change the rates you are shown, and suppliers without a ' +
            'referral arrangement appear in the comparison on the same terms.',
        ],
      },
      {
        heading: 'What We Do Not Do',
        bullets: [
          'We do not generate or sell electricity — your contract is always with the supplier',
          'We do not publish customer star ratings we cannot verify',
          'We do not promise a saving before seeing your rate and usage',
          'We do not sell your personal information',
        ],
      },
      {
        heading: 'How the Data Is Kept Current',
        paragraphs: [
          'Plan and supplier figures on this site come from a snapshot of our comparison database, ' +
            `last refreshed on ${MARKET_GENERATED_AT}. Rates in competitive markets move often, so the ` +
            'plans shown when you enter a ZIP code are read live rather than from that snapshot.',
        ],
      },
      {
        heading: 'Next Steps',
        links: [
          ['/compare-rates', 'Compare plans for your ZIP code'],
          ['/privacy-policy', 'How we handle your data'],
          ['/terms-of-service', 'Terms of service'],
        ],
      },
    ],
  }),

  '/home-concierge': (route, { states }) => ({
    intro: [
      'Moving house means setting up electricity before you arrive, usually alongside internet, water and ' +
        'phone. The concierge service handles the electricity setup and coordinates the rest so nothing is switched on late.',
    ],
    sections: [
      {
        heading: 'What Moving Changes About Your Electricity',
        bullets: [
          'A new address means a new utility territory and often a different set of available suppliers',
          'Your existing contract does not automatically follow you, and may carry an early termination fee',
          'Service needs to start on your move-in date, which requires a few days of notice',
          'A deposit is sometimes required depending on the supplier and your service history',
        ],
      },
      {
        heading: 'Where We Can Set Up Service',
        table: {
          columns: ['State', 'Suppliers with plans'],
          rows: stateRows(states, ({ state, market }) => [
            { text: state.name, path: state.path },
            String(market.providers),
          ]),
        },
      },
      {
        heading: 'Moving and Electricity Questions',
        faqs: [
          {
            question: 'How far ahead should I set up electricity at a new address?',
            answer:
              'Around a week is comfortable. Most suppliers can start service within a few business days, ' +
              'but same-day or next-day starts are not guaranteed and sometimes carry a fee.',
          },
          {
            question: 'Can I take my current plan with me when I move?',
            answer:
              'Sometimes, if the new address is in the same utility territory and your supplier serves it. ' +
              'Across territories or states the contract usually ends, and an early termination fee may apply.',
          },
          {
            question: 'Do I need a deposit?',
            answer:
              'It depends on the supplier and your service history. Some suppliers waive deposits entirely; ' +
              'others set one based on a credit check. Prepaid plans avoid the question altogether in some markets.',
          },
        ],
      },
      {
        heading: 'Next Steps',
        links: [
          ['/compare-rates', 'Compare plans at your new address'],
          ['/all-cities', 'Rates in the city you are moving to'],
        ],
      },
    ],
  }),

  '/privacy-policy': () => ({
    intro: [
      'How Electric Scouts collects, uses and protects the information you give us when comparing electricity plans.',
    ],
    sections: [
      {
        heading: 'In Short',
        bullets: [
          'We do not sell your personal information',
          'ZIP code and usage are used to find plans available to you',
          'Bills you upload are used to analyse your rate and are not published',
          'Contact details are shared with a supplier only when you choose to sign up',
        ],
      },
      {
        heading: 'What This Policy Covers',
        bullets: [
          'Information we collect, and what is optional',
          'How we use your information to find plans',
          'Information sharing and disclosure, including with suppliers you choose',
          'Data security: encryption, secure storage and access controls',
          'Your rights and choices over your data',
          'Cookies and tracking technologies',
          'How we notify you about changes to this policy',
          'How to contact us about your data',
        ],
      },
      {
        heading: 'Privacy at a Glance',
        paragraphs: [
          'Your ZIP code and usage are used to find plans available to you. A bill you upload is used to ' +
            'analyse your rate and is not published. Your contact details reach a supplier only when you ' +
            'choose to sign up with that supplier. The full text of each section is set out on this page.',
        ],
      },
    ],
  }),

  '/terms-of-service': () => ({
    intro: ['The terms that apply when you use Electric Scouts to compare electricity plans.'],
    sections: [
      {
        heading: 'In Short',
        bullets: [
          'Electric Scouts is a comparison service, not an electricity supplier',
          'Rates shown are gathered from suppliers and change frequently',
          'Your contract is with the supplier you choose, not with Electric Scouts',
          'Estimates and calculators are projections, not guarantees',
        ],
      },
      {
        heading: 'What These Terms Cover',
        bullets: [
          'Acceptance of terms and what using the site means',
          'Service description: what Electric Scouts does and does not do',
          'Accuracy of information and the disclaimer that applies to rates',
          'No guarantee of savings',
          'Your responsibilities, including verifying plan details before signing',
          'Intellectual property',
          'Third-party links and affiliate relationships',
          'Limitation of liability and indemnification',
          'Changes to these terms',
          'Governing law and dispute resolution',
          'How to contact us',
        ],
      },
      {
        heading: 'The Part That Matters Most',
        paragraphs: [
          'Rates and plan details shown here are gathered from suppliers and change frequently. Before you ' +
            'sign anything, check the supplier\u2019s own contract documents — in most markets that means the ' +
            'facts label or terms-of-service document for the specific plan. Your contract is with the ' +
            'supplier, not with Electric Scouts, and any saving is an estimate rather than a promise.',
        ],
      },
    ],
  }),
};

function totalPlans(states) {
  return states.reduce((sum, state) => sum + (getStateMarket(state.code)?.plans || 0), 0);
}

function totalProviders(states) {
  return new Set(states.flatMap((state) => getStateMarket(state.code)?.providerNames || [])).size;
}

/* ------------------------------------------------------------------ *
 * Comparison pages
 *
 * The prerendered half of /compare/:slug. Everything here is read off the
 * comparison object src/seo/comparisons.js already computed, so the crawled
 * page and the React page state the same verdicts from the same numbers —
 * there is no second copy of the logic to drift.
 * ------------------------------------------------------------------ */

export function buildComparisonSections(route) {
  const comparison = route.comparison;
  if (!comparison) return { intro: [route.description].filter(Boolean), sections: [] };
  return comparison.type === 'provider-vs-provider'
    ? providerVersusSections(comparison)
    : planVersusSections(comparison);
}

function providerVersusSections(comparison) {
  const { a, b, sharedStates, cheaperCounts, dimensions, faqs, aOnly, bOnly } = comparison;
  const sections = [];

  const decided = cheaperCounts.a !== cheaperCounts.b;
  const leader = cheaperCounts.a > cheaperCounts.b ? a : b;
  const intro = [
    comparison.angle,
    sharedStates.length === 1
      ? `Both suppliers sell into ${sharedStates[0].name}, which is where this comparison applies. ` +
        `Everything below comes from the plans Electric Scouts holds for each of them (${asOf}).`
      : `They compete in ${sharedStates.length} of the states we cover. ` +
        (decided
          ? `${leader.name} has the lower starting rate in ${Math.max(cheaperCounts.a, cheaperCounts.b)} of them`
          : `Neither has the lower starting rate in more of them`) +
        `, but the answer changes by market, so the table below is broken out state by state (${asOf}).`,
  ].filter(Boolean);

  /* The head-to-head table. This is the page: two columns of the suppliers'
   * own figures, with the dimension each one wins marked. */
  sections.push({
    heading: `${a.name} vs ${b.name} at a Glance`,
    paragraphs: [
      `Every figure below is counted from the ${a.plans} ${a.name} plans and the ${b.plans} ` +
        `${b.name} plans in our catalog (${asOf}). Rate figures describe the plans a supplier ` +
        `offers somewhere, not a quote for your address.`,
    ],
    table: {
      columns: ['', a.name, b.name],
      rows: dimensions.map((dimension) => [
        { text: dimension.label },
        dimension.winner === 'a' ? `${dimension.a} ✓` : dimension.a,
        dimension.winner === 'b' ? `${dimension.b} ✓` : dimension.b,
      ]),
    },
  });

  /* Per-state rates — the part that answers "which is cheaper where I live",
   * and the part no two comparison pages share. */
  if (sharedStates.length) {
    sections.push({
      heading: `Which Is Cheaper in Your State`,
      paragraphs: [
        `Suppliers price by utility territory, so the winner in one state routinely loses in the ` +
          `next. These are the lowest and median rates we hold for each supplier in every market ` +
          `where both are sold.`,
      ],
      table: {
        columns: ['State', `${a.name} from`, `${b.name} from`, 'Cheaper start'],
        rows: sharedStates.map((row) => [
          { text: row.name, path: row.path },
          formatRate(row.a.minRate),
          formatRate(row.b.minRate),
          row.cheaper === null ? 'Tied' : row.cheaper === 'a' ? a.name : b.name,
        ]),
      },
    });
  }

  /* Coverage only matters when it differs, so a pair with identical footprints
   * gets no section rather than a section saying "neither has extra states". */
  const coverageBullets = [];
  if (aOnly.length) {
    coverageBullets.push(
      `${a.name} also has plans in ${joinNames(aOnly.map((code) => STATE_NAMES[code]))}, where ${b.name} does not.`
    );
  }
  if (bOnly.length) {
    coverageBullets.push(
      `${b.name} also has plans in ${joinNames(bOnly.map((code) => STATE_NAMES[code]))}, where ${a.name} does not.`
    );
  }
  if (coverageBullets.length) {
    sections.push({
      heading: 'Where Only One of Them Sells',
      paragraphs: [
        'Outside the shared markets there is no comparison to make — only one of the two is an option at all.',
      ],
      bullets: coverageBullets,
      links: [...aOnly, ...bOnly]
        .filter((code, index, list) => list.indexOf(code) === index)
        .map((code) => [STATE_PAGE_PATHS[code], `${STATE_NAMES[code]} electricity rates`]),
    });
  }

  sections.push({ heading: `${a.name} vs ${b.name}: Common Questions`, faqs });

  /* Sideways links to the other matchups either supplier appears in.
   *
   * Someone comparing two suppliers has usually not narrowed it to exactly
   * these two, so the next question is almost always "and how does one of them
   * do against a third". Linking those pages from here is what turns the
   * cluster into something a reader can walk, rather than a set of leaves that
   * all hang off the hub and dead-end. */
  const related = [...comparisonsForProvider(a.slug), ...comparisonsForProvider(b.slug)]
    .filter((entry) => entry.slug !== comparison.slug)
    .filter((entry, index, list) => list.findIndex((other) => other.slug === entry.slug) === index);
  if (related.length) {
    sections.push({
      heading: 'Other Matchups With These Suppliers',
      paragraphs: [
        `If one of these two is on your shortlist but the other is not, these compare the same ` +
          `supplier against a different competitor, on the same figures.`,
      ],
      links: related.map((entry) => [entry.path, entry.heading]),
    });
  }

  sections.push({
    heading: 'Check Both at Your Address',
    paragraphs: [
      `A tally of markets is not an offer. Enter your ZIP code to see which of these two actually ` +
        `serves your utility territory and what each is charging there today.`,
    ],
    links: [
      ['/compare-rates', 'Compare both suppliers at your ZIP code'],
      [`/providers/${a.slug}`, `${a.name} plans and rates`],
      [`/providers/${b.slug}`, `${b.name} plans and rates`],
      ['/compare', 'All head-to-head comparisons'],
    ],
  });

  return { intro, sections };
}

function planVersusSections(comparison) {
  const { a, b, rows, columns, unit, faqs, lede } = comparison;
  const sections = [];

  const intro = [lede];
  if (unit === 'plans') {
    const totalA = rows.reduce((sum, row) => sum + (Number(row.a) || 0), 0);
    const totalB = rows.reduce((sum, row) => sum + (Number(row.b) || 0), 0);
    intro.push(
      `Across the ${rows.length} deregulated states Electric Scouts covers, our catalog holds ` +
        `${totalA} ${a.short.toLowerCase()} plans and ${totalB} ${b.short.toLowerCase()} plans (${asOf}). ` +
        `The split is nothing like even in every state, which is the first thing worth knowing before you shop.`
    );
  } else {
    intro.push(
      `The table below shows how the two compare in each of the ${rows.length} states we cover (${asOf}).`
    );
  }

  sections.push({
    heading: 'How the Two Compare, State by State',
    paragraphs: [
      `Markets differ enough that a rule of thumb from one state misleads in another. ` +
        `Each row links through to that state's full breakdown.`,
    ],
    table: {
      columns: ['State', ...columns],
      rows: rows.map((row) => [
        { text: row.name, path: row.path },
        String(row.a),
        String(row.b),
      ]),
    },
  });

  /* Where the split is most lopsided.
   *
   * The state table above shows every market, which is thorough and hard to
   * read — 12 rows of two numbers do not tell you where the choice actually
   * matters. These are the markets at either end, named, so the page says
   * something a reader can act on rather than leaving them to scan. Only for
   * countable comparisons: "offered / not offered" has no extremes to find. */
  if (unit === 'plans') {
    const scored = rows
      .map((row) => ({ ...row, a: Number(row.a) || 0, b: Number(row.b) || 0 }))
      .filter((row) => row.a + row.b > 0);
    const widestA = [...scored].sort((x, y) => y.a - y.b - (x.a - x.b))[0];
    const widestB = [...scored].sort((x, y) => y.b - y.a - (x.b - x.a))[0];
    const bullets = [];
    if (widestA && widestA.a > widestA.b) {
      bullets.push(
        `${widestA.name} leans hardest toward ${a.short.toLowerCase()}: ${widestA.a} of them ` +
          `against ${widestA.b} ${b.short.toLowerCase()}.`
      );
    }
    if (widestB && widestB.b > widestB.a && widestB.name !== widestA?.name) {
      bullets.push(
        `${widestB.name} goes the other way: ${widestB.b} ${b.short.toLowerCase()} ` +
          `against ${widestB.a} ${a.short.toLowerCase()}.`
      );
    }
    const balanced = scored.filter((row) => row.a > 0 && row.b > 0);
    if (balanced.length) {
      bullets.push(
        `${balanced.length} of the ${scored.length} markets carry both, so in most states this is ` +
          `a real choice rather than a decision the market makes for you.`
      );
    }
    const absent = scored.filter((row) => row.a === 0 || row.b === 0);
    if (absent.length) {
      bullets.push(
        `In ${joinNames(absent.map((row) => row.name), 4)} one side is not sold at all, ` +
          `so the comparison there is academic.`
      );
    }
    if (bullets.length) {
      sections.push({
        heading: 'Where the Balance Tips',
        paragraphs: [
          `The state table is the full picture; these are the markets worth noticing in it.`,
        ],
        bullets,
        links: [widestA, widestB]
          .filter(Boolean)
          .filter((row, index, list) => list.findIndex((other) => other.name === row.name) === index)
          .map((row) => [row.path, `${row.name} electricity rates`]),
      });
    }
  }

  sections.push({ heading: 'Questions People Ask', faqs });

  /* The other plan-shape questions. Someone weighing fixed against variable is
   * usually also deciding a term length and whether an exit fee matters — the
   * shapes are chosen together, so the pages should link together. */
  const otherShapes = getPlanComparisons().filter((entry) => entry.slug !== comparison.slug);
  if (otherShapes.length) {
    sections.push({
      heading: 'The Other Choices You Are Making',
      paragraphs: [
        `Plan shape is not one decision but several, taken at the same time. These cover the rest ` +
          `of them, counted from the same catalog.`,
      ],
      links: otherShapes.map((entry) => [entry.path, entry.heading]),
    });
  }

  sections.push({
    heading: 'See What Is Available Where You Live',
    links: [
      ['/compare-rates', 'Compare plans for your ZIP code'],
      ['/bill-analyzer', 'Check what your current plan is really costing'],
      ['/compare', 'All head-to-head comparisons'],
      ['/all-states', 'How each state market works'],
    ],
  });

  return { intro, sections };
}

/**
 * The hub. Its job is to give every comparison page one crawlable inbound link
 * from a page that itself has a reason to exist, and to let a reader see the
 * whole set at once.
 */
export function buildCompareHubSections() {
  const providerPages = getProviderComparisons();
  const planPages = getPlanComparisons();
  const sections = [];

  const intro = [
    'Two suppliers rarely differ in the ways their advertising suggests. These pages put the ' +
      'figures we hold for each side by side — rates, plan counts, contract terms, renewable mix ' +
      'and exit fees — and mark which one wins on each, market by market.',
    `Every comparison here is built from the same plan catalog as the rest of the site (${asOf}). ` +
      'A supplier matchup is published only where both suppliers actually compete for the same ' +
      'customer, so the list is short on purpose.',
  ];

  if (providerPages.length) {
    sections.push({
      heading: 'Supplier vs Supplier',
      paragraphs: [
        `Head-to-head comparisons for ${providerPages.length} matchups where both suppliers sell ` +
          'into at least one of the same states.',
      ],
      table: {
        columns: ['Comparison', 'States where both are sold', 'Cheaper start in more markets'],
        rows: providerPages.map((entry) => [
          { text: entry.heading, path: entry.path },
          entry.stateNames.length === 1 ? entry.stateNames[0] : String(entry.stateNames.length),
          entry.cheaperCounts.a === entry.cheaperCounts.b
            ? 'Split'
            : entry.cheaperCounts.a > entry.cheaperCounts.b
              ? entry.a.name
              : entry.b.name,
        ]),
      },
    });
  }

  if (planPages.length) {
    sections.push({
      heading: 'Plan Type vs Plan Type',
      paragraphs: [
        'The choices that apply in every market: how long to commit, what happens to the rate, ' +
          'what it costs to leave, and whether renewable supply is worth the difference.',
      ],
      links: planPages.map((entry) => [entry.path, entry.heading]),
    });
  }

  sections.push({
    heading: 'Compare for Your Own Address',
    paragraphs: [
      'These pages compare suppliers and plan shapes in general. What you can actually buy depends ' +
        'on your utility territory, which is set by ZIP code.',
    ],
    links: [
      ['/compare-rates', 'Compare electricity rates by ZIP code'],
      ['/all-providers', 'Every supplier we track'],
      ['/all-states', 'Electricity rates by state'],
      ['/bill-analyzer', 'Check your current bill against these rates'],
    ],
  });

  return { intro, sections };
}

/* ------------------------------------------------------------------ *
 * Articles
 * ------------------------------------------------------------------ */

/**
 * @param {Record<string, any>} route
 * @param {{articles?: Record<string, any>}} [context] the raw article map, which
 *   carries the tags the related-guide links are scored on
 */
export function buildArticleSections(route, context = {}) {
  const { articles } = context;
  const sections = [];

  /* Guides on the same subject.
   *
   * These 73 pages are the best content on the site and were the worst
   * linked — a median of one inbound link each, from /learning-center, and
   * every one of them ending with the same three hub links. Nothing pointed
   * from one guide to another, so none of them passed any authority to the
   * others and none of them accumulated any. */
  const related = route.id && articles ? relatedArticles(route.id, articles) : [];
  if (related.length) {
    sections.push({
      heading: 'Related Guides',
      links: related.map((entry) => [entry.path, entry.title]),
    });
  }

  sections.push({
    heading: 'Keep Reading',
    links: [
      ['/learning-center', 'All electricity guides'],
      ['/compare-rates', 'Compare plans for your ZIP code'],
      ['/compare', 'Compare suppliers head to head'],
      ['/all-states', 'How your state market works'],
    ],
  });

  return {
    intro: route.description ? [route.description] : [],
    sections,
  };
}

/* ==================================================================
 * Utility territories
 *
 * The reader arriving here believes their delivery utility sets their
 * price. Everything on the page is arranged around correcting that and
 * then answering what they actually wanted to know.
 * ================================================================== */

export function buildUtilitySections(route) {
  const utility = route.utility;
  if (!utility) return { intro: [route.description].filter(Boolean), sections: [] };

  const { name, cities, states, multiState } = utility;
  const stateNames = states.map((entry) => entry.name);
  const sections = [];

  const intro = [
    utility.note,
    multiState
      ? `${name} delivers electricity in ${joinNames(stateNames)}. We cover ${cities.length} cities ` +
        `across that territory, and because each state writes its own rules, what you can buy ` +
        `changes at the border even though the wires company does not.`
      : `${name} delivers electricity in ${stateNames[0]}, where we cover ${cities.length} of the ` +
        `cities in its territory.`,
  ].filter(Boolean);

  /* The correction, first, because the rest of the page depends on it.
   *
   * Written per regulatory model rather than once with the name swapped. The
   * three are genuinely different arrangements, and flattening them would be
   * both less accurate and the templated page this site keeps refusing to
   * publish: Texas has no utility supply rate to fall back on at all, the
   * Northeast utilities sell a regulated default, and Illinois and Ohio add
   * municipal aggregation on top of one. */
  const short = utility.shortName || name;
  if (utility.model === 'texas') {
    sections.push({
      heading: `What ${short} Bills You For, and What It Cannot Sell You`,
      paragraphs: [
        `Texas split the two jobs further than anywhere else in the country. ${name} owns the ` +
          `poles, the wires and the meter, and it is not allowed to sell you electricity at all. ` +
          `There is no ${short} rate to fall back on, no default tariff, no "staying put" option.`,
        `That means every household in the territory has bought its energy from a retailer, ` +
          `whether or not it remembers choosing one. If you have never shopped, you are on ` +
          `whatever a retailer signed you up to — frequently a renewal that rolled over at a ` +
          `higher rate than the one you agreed to.`,
      ],
      bullets: [
        `${short} charges regulated delivery, identical across every retailer.`,
        `A retail supplier sets the cents per kWh, and that is the only contestable half.`,
        `Switching retailer changes no equipment and no service — ${short} still runs the wires.`,
      ],
    });
  } else if (utility.model === 'aggregation') {
    sections.push({
      heading: `What ${short} Charges For, and the Two Ways Around It`,
      paragraphs: [
        `${name} delivers the power and bills you for it, at a regulated rate no supplier can ` +
          `discount. The supply half — the energy itself — is contestable, and here there are two ` +
          `routes rather than one.`,
        `You can leave supply with ${short} at the regulated default price, or buy it from a ` +
          `competing retailer. There is also a third possibility peculiar to this part of the ` +
          `country: your municipality may have negotiated a supply contract on behalf of every ` +
          `household in it, and enrolled you unless you opted out. Many people on an aggregation ` +
          `rate have no idea they are on one.`,
      ],
      bullets: [
        `${short} sets and bills delivery, which shopping cannot lower.`,
        `Default supply from ${short} is the price a competitive offer has to beat.`,
        `A municipal aggregation deal may already have replaced that default without your involvement.`,
      ],
    });
  } else {
    sections.push({
      heading: `What ${short} Charges For, and What a Supplier Charges For`,
      paragraphs: [
        `Your bill has two halves. ${name} owns one of them and it cannot be shopped: delivery — ` +
          `the poles and wires, the meter, the crew that restores power after a storm. Those ` +
          `charges are set by the state regulator and are identical whoever supplies your energy.`,
        `The other half is supply. ${short} sells that too, at a regulated default rate that ` +
          `resets on a published schedule, and a competing retailer may beat it. That default is ` +
          `the number worth knowing: it is what you pay by doing nothing, and the only fair ` +
          `benchmark for any offer put in front of you.`,
      ],
      bullets: [
        `${short} sets and bills delivery charges, which no supplier can discount.`,
        `Its regulated default supply rate is the benchmark, not a rate you are stuck with.`,
        `Switching supplier changes the supply rate only — same wires, same meter, same outage number.`,
      ],
    });
  }

  /* Cities, ordered cheapest first — the table a reader came for. */
  if (cities.length) {
    const spread = utility.highestCityRate != null && utility.lowestCityRate != null
      ? Math.round((utility.highestCityRate - utility.lowestCityRate) * 10) / 10
      : null;
    sections.push({
      heading: `Cities We Cover in the ${name} Territory`,
      paragraphs: [
        spread && spread >= 1
          ? `Average residential rates across these ${cities.length} cities span ${spread}¢/kWh, ` +
            `which is a wider gap than most people expect inside one delivery territory — ` +
            `supply is priced locally even where delivery is not.`
          : `Average residential rates across these ${cities.length} cities sit close together, ` +
            `which is what a single delivery territory usually looks like. What separates two ` +
            `households here is the supply contract each one signed, not where they live.`,
      ],
      table: {
        columns: ['City', 'Average residential rate', 'Estimated monthly bill'],
        rows: cities.map((city) => [
          { text: `${city.name}, ${city.stateCode}`, path: city.path },
          city.avgRate,
          city.avgMonthlyBill,
        ]),
      },
    });
  }

  /* What is actually buyable in the territory, from the plan snapshot. */
  const withPlans = states.filter((entry) => entry.market?.plans > 0);
  if (withPlans.length) {
    sections.push({
      heading: `Suppliers You Can Choose Instead`,
      paragraphs: [
        multiState
          ? `Supply is licensed state by state, so the choice differs across the ${name} footprint ` +
            `(${asOf}).`
          : `These are the plans we hold for ${stateNames[0]}, any of which replaces the supply half ` +
            `of a ${name} bill (${asOf}).`,
      ],
      table: {
        columns: ['State', 'Plans we track', 'Suppliers', 'Cheapest', 'Median'],
        rows: withPlans.map((entry) => [
          { text: entry.name, path: entry.path },
          String(entry.market.plans),
          String(entry.market.providers),
          formatRate(entry.market.minRate),
          formatRate(entry.market.medianRate),
        ]),
      },
      links: [
        ['/compare-rates', 'Compare supply rates for your ZIP code'],
        ['/all-providers', 'Every supplier we track'],
      ],
    });
  }

  sections.push({
    heading: `${name} Questions`,
    faqs: buildUtilityFaqs(utility),
  });

  sections.push({
    heading: 'Next Steps',
    links: [
      ['/compare-rates', 'Compare plans for your ZIP code'],
      ...states.map((entry) => [entry.path, `${entry.name} electricity rates`]),
      ['/bill-analyzer', 'Check what your current bill is really costing'],
      [UTILITY_ROOT, 'Other delivery territories'],
    ],
  });

  return { intro, sections };
}

function buildUtilityFaqs(utility) {
  const { name, states, cities, multiState } = utility;
  const primary = states[0];
  const cheapest = states
    .filter((entry) => entry.market?.minRate != null)
    .sort((a, b) => a.market.minRate - b.market.minRate)[0];
  const faqs = [];

  /* The lead question is the one the reader arrived with, and its honest answer
   * differs by market, so it is written three ways rather than one. */
  const short = utility.shortName || name;
  if (utility.model === 'texas') {
    faqs.push({
      question: `Does ${short} set my electricity rate?`,
      answer:
        `No, and it cannot sell you electricity at all. ${name} is a delivery-only company: it ` +
        `charges a regulated amount to carry power to your meter and that amount is the same ` +
        `whoever supplies you. Texas has no utility default rate, so every household here buys ` +
        `its energy from a retailer — including the households that never chose one.`,
    });
  } else if (utility.model === 'aggregation') {
    faqs.push({
      question: `Does ${short} set my electricity rate?`,
      answer:
        `Only the delivery part, which is regulated and identical across every supplier. The ` +
        `supply part may be ${short}'s default rate, a retailer you chose, or a contract your ` +
        `municipality signed on your behalf through an aggregation programme. All three arrive on ` +
        `the same ${short} bill, which is why so few people know which one they are on.`,
    });
  } else {
    faqs.push({
      question: `Does ${short} set my electricity rate?`,
      answer:
        `It sets the delivery charge, which is regulated and identical whoever supplies you, and ` +
        `it also sells supply at a default rate that resets on a published schedule. That default ` +
        `is not a rate you are stuck with — it is the benchmark. A competing supplier either ` +
        `beats it or is not worth signing.`,
    });
  }

  if (cheapest?.market) {
    faqs.push({
      question: `What is the cheapest electricity rate in the ${name} area?`,
      answer:
        `The lowest supply rate we currently hold in ${cheapest.name} is ` +
        `${formatRate(cheapest.market.minRate)}, against a median of ` +
        `${formatRate(cheapest.market.medianRate)} across ${cheapest.market.plans} plans ` +
        `(${asOf}). Delivery charges are added on top of whichever supply rate you pick, and they ` +
        `do not change with the supplier.`,
    });
  }

  faqs.push({
    question: `Will switching supplier interrupt my ${short} service?`,
    answer:
      `No. Nothing physical changes and nobody visits the property. ${name} keeps delivering the ` +
      `power, reading the meter and handling outages; only the company selling you the energy ` +
      `changes, and it takes effect at your next meter read.`,
  });

  if (utility.model === 'aggregation') {
    faqs.push({
      question: `How do I tell whether I am on a municipal aggregation rate?`,
      answer:
        `Look at the supply line on your bill, not the delivery line. If it names a retailer you ` +
        `do not remember choosing, your town most likely enrolled you through an aggregation ` +
        `programme — legal, opt-out rather than opt-in, and not always cheaper than what you ` +
        `could get yourself. You can leave it for any supplier on the market.`,
    });
  } else if (utility.model === 'texas') {
    faqs.push({
      question: `What happens if my contract ends and I do nothing?`,
      answer:
        `You are moved to a holdover or renewal rate, and it is frequently well above the one you ` +
        `signed. Because there is no ${short} default to fall back to, nothing stops that rate ` +
        `from being far higher than the market — the only protection is checking the end date and ` +
        `shopping before it arrives.`,
    });
  }

  if (multiState) {
    faqs.push({
      question: `Is the ${name} offer the same in every state it serves?`,
      answer:
        `No. ${name} delivers in ${joinNames(states.map((entry) => entry.name))}, but supply is ` +
        `licensed and regulated separately in each one, so the plans available and the default ` +
        `rate you are compared against both change at the state line.`,
    });
  }

  faqs.push({
    question: `Who do I call when the power goes out?`,
    answer:
      `${name}, always — including when a competing retailer supplies your energy. Outages are a ` +
      `wires problem, and the wires stay with ${name} whoever you buy from.`,
  });

  if (primary && cities.length) {
    faqs.push({
      question: `Which cities does this cover?`,
      answer:
        `We cover ${cities.length} cities in the ${name} territory, from ` +
        `${cities[0].name} to ${cities[cities.length - 1].name}. Availability is confirmed by ZIP ` +
        `code rather than by city, because territory boundaries do not follow city limits.`,
    });
  }

  return faqs;
}

/**
 * The utility hub. Exists so every territory page has one crawlable inbound
 * link from a page with its own reason to exist, and so a reader who does not
 * know their utility's name can find it from their state.
 */
export function buildUtilityHubSections() {
  const utilities = getUtilities();
  const sections = [];

  const covered = utilities.reduce((sum, utility) => sum + utility.cities.length, 0);
  const intro = [
    'Two companies appear on a deregulated electricity bill and they do very different jobs. ' +
      'The delivery utility owns the wires and cannot be changed. The supplier sells the energy ' +
      'and can be changed at any time, which is the whole reason this site exists.',
    `These are the ${utilities.length} delivery territories where we cover enough of the market ` +
      `to be useful — ${covered} cities in total. If yours is not here, its state page carries the ` +
      `same plan data.`,
  ];

  sections.push({
    heading: 'Delivery Territories We Cover',
    paragraphs: [
      'Ordered by how much of each territory we cover. Rate spans are the average residential ' +
        'rates in the cities listed, not delivery charges — those are regulated and we do not hold them.',
    ],
    table: {
      columns: ['Utility', 'States', 'Cities we cover', 'City rate range'],
      rows: utilities.map((utility) => [
        { text: utility.name, path: utility.path },
        utility.stateCodes.map((code) => STATE_NAMES[code]).join(', '),
        String(utility.cities.length),
        utility.lowestCityRate != null
          ? `${formatRate(utility.lowestCityRate)} – ${formatRate(utility.highestCityRate)}`
          : '—',
      ]),
    },
  });

  sections.push({
    heading: 'Why the Distinction Matters',
    paragraphs: [
      'Most people searching for their utility by name are trying to find out what they will pay, ' +
        'and are looking at the wrong company. The utility charge is regulated, identical across ' +
        'every supplier, and not something shopping can lower. The supply rate is none of those ' +
        'things — it varies by a factor of two between the cheapest and most expensive plans in ' +
        'some of the markets we track.',
    ],
    links: [
      ['/compare-rates', 'Compare supply rates for your ZIP code'],
      ['/all-states', 'Electricity rates by state'],
      ['/all-cities', 'Electricity rates by city'],
      ['/bill-analyzer', 'See what your current bill is really costing'],
    ],
  });

  return { intro, sections };
}

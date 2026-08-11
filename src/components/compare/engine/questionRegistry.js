/**
 * Question registry.
 *
 * Each question declares when it applies (`appliesWhen`) and when it is already
 * answered (`satisfiedBy`). The resolver walks this list in order and asks the
 * first question that applies and is not yet satisfied, which is what makes the
 * flow dynamic: a bill that yields usage and provider silently satisfies those
 * questions instead of the flow having to branch around them.
 *
 * Order in this array IS the order of the flow.
 */

import { CUSTOMER_TYPES, isKnown } from './comparisonState.js';

const isResidential = (s) => s.customerType === CUSTOMER_TYPES.RESIDENTIAL;
const isCommercial = (s) => s.customerType === CUSTOMER_TYPES.COMMERCIAL;

export const QUESTIONS = [
  {
    id: 'zip',
    type: 'zip',
    title: 'Where do you need electricity?',
    subtitle: 'Enter the ZIP code for the home or business.',
    appliesWhen: () => true,
    satisfiedBy: (s) => isKnown(s, 'zip') && isKnown(s, 'state'),
  },

  {
    id: 'customer_type',
    type: 'choice',
    title: 'What are you shopping for?',
    autoAdvance: true,
    options: [
      { value: 'home', label: 'Home electricity', description: 'For a house, apartment or condo', icon: 'home' },
      { value: 'business', label: 'Business electricity', description: 'For a business or commercial property', icon: 'building' },
      { value: 'renewable', label: 'Renewable energy', description: 'Explore greener electricity options', icon: 'leaf' },
    ],
    // Selecting "renewable" sets the preference but leaves customerType blank,
    // so the follow-up question below is what actually resolves the branch.
    // This question is therefore satisfied by *either* outcome — otherwise a
    // renewable pick would loop straight back to this same screen.
    appliesWhen: () => true,
    satisfiedBy: (s) => isKnown(s, 'customerType') || s.energyPreference === 'renewable',
  },

  {
    id: 'renewable_context',
    type: 'choice',
    title: 'Is this for your home or business?',
    subtitle: "We'll show greener options either way.",
    autoAdvance: true,
    options: [
      { value: 'home', label: 'Home', description: 'A house, apartment or condo', icon: 'home' },
      { value: 'business', label: 'Business', description: 'A business or commercial property', icon: 'building' },
    ],
    appliesWhen: (s) => s.energyPreference === 'renewable',
    satisfiedBy: (s) => isKnown(s, 'customerType'),
  },

  // ── Residential branch ──
  {
    id: 'property_type',
    type: 'choice',
    title: 'What type of home is this?',
    autoAdvance: true,
    options: [
      { value: 'house', label: 'House', icon: 'home' },
      { value: 'apartment', label: 'Apartment', icon: 'building' },
      { value: 'condo', label: 'Condo / townhome', icon: 'building' },
      { value: 'other', label: 'Other', icon: 'home' },
    ],
    appliesWhen: isResidential,
    satisfiedBy: (s) => isKnown(s, 'propertyType'),
  },

  // ── Commercial branch ──
  {
    id: 'business_type',
    type: 'choice',
    title: 'What type of business is this?',
    autoAdvance: true,
    options: [
      { value: 'office', label: 'Office' },
      { value: 'retail', label: 'Retail' },
      { value: 'restaurant', label: 'Restaurant / hospitality' },
      { value: 'multifamily', label: 'Multifamily / property management' },
      { value: 'industrial', label: 'Industrial / manufacturing' },
      { value: 'healthcare', label: 'Healthcare' },
      { value: 'other', label: 'Other business' },
    ],
    appliesWhen: isCommercial,
    satisfiedBy: (s) => isKnown(s, 'businessType'),
  },

  // ── Bill analyzer (optional, both branches) ──
  {
    id: 'bill_offer',
    type: 'bill_offer',
    title: (s) => isCommercial(s)
      ? 'Have a recent business electricity bill?'
      : 'Have a recent electricity bill?',
    subtitle: (s) => isCommercial(s)
      ? 'Upload it so we can use your actual energy usage to help match your business with appropriate options.'
      : "Upload it and we'll use your actual usage to personalize your options.",
    appliesWhen: (s) => isKnown(s, 'customerType'),
    // Answered once the visitor has either engaged with the upload or declined
    // it. Usage already known from elsewhere also skips the offer entirely —
    // there is nothing left for the bill to tell us.
    satisfiedBy: (s) =>
      s.billOffered ||
      s.billAnalysisStatus === 'complete' ||
      isKnown(s, 'monthlyUsageKwh'),
  },

  {
    id: 'bill_verify',
    type: 'verify',
    title: 'Quick check',
    appliesWhen: (s) => s.billAnalysisStatus === 'complete' && s.billConfidence === 'low' && s.unverifiedFields.length > 0,
    satisfiedBy: (s) => s.unverifiedFields.length === 0,
  },

  // ── Usage / qualification ──
  {
    id: 'usage_range',
    type: 'choice',
    title: 'About how much electricity do you use?',
    subtitle: "An estimate is fine — we'll refine it later.",
    autoAdvance: true,
    options: [
      { value: 'under_500', label: 'Under 500 kWh/month' },
      { value: '500_999', label: '500–999 kWh/month' },
      { value: '1000_1999', label: '1,000–1,999 kWh/month' },
      { value: '2000_plus', label: '2,000+ kWh/month' },
      { value: 'not_sure', label: "I'm not sure" },
    ],
    appliesWhen: isResidential,
    // The bill answering usage is the core of the skipping behaviour.
    satisfiedBy: (s) => isKnown(s, 'usageRange') || isKnown(s, 'monthlyUsageKwh'),
  },

  {
    id: 'shopping_intent',
    type: 'choice',
    title: 'What brings you here today?',
    autoAdvance: true,
    options: [
      { value: 'moving', label: 'Moving / starting new service' },
      { value: 'switching', label: 'Switching electricity providers' },
      { value: 'better_rate', label: 'Checking if I can get a better rate' },
    ],
    appliesWhen: isResidential,
    satisfiedBy: (s) => isKnown(s, 'shoppingIntent'),
  },

  {
    id: 'commercial_spend',
    type: 'choice',
    title: 'About how much does your business spend on electricity each month?',
    autoAdvance: true,
    options: [
      { value: 'under_500', label: 'Under $500' },
      { value: '500_1499', label: '$500–$1,499' },
      { value: '1500_4999', label: '$1,500–$4,999' },
      { value: '5000_19999', label: '$5,000–$19,999' },
      { value: '20000_plus', label: '$20,000+' },
      { value: 'not_sure', label: "I'm not sure" },
    ],
    appliesWhen: isCommercial,
    // A bill that produced a monthly cost makes this redundant.
    satisfiedBy: (s) => isKnown(s, 'monthlySpendRange') || isKnown(s, 'monthlyCost'),
  },

  {
    id: 'commercial_timing',
    type: 'choice',
    title: 'When do you need a new electricity plan?',
    autoAdvance: true,
    options: [
      { value: 'now', label: 'Starting service now' },
      { value: '30_days', label: 'Within 30 days' },
      { value: '1_3_months', label: '1–3 months' },
      { value: '3_6_months', label: '3–6 months' },
      { value: '6_plus_months', label: 'More than 6 months' },
      { value: 'comparing', label: 'Just comparing options' },
    ],
    appliesWhen: isCommercial,
    // A contract end date from the bill tells us the timing already.
    satisfiedBy: (s) => isKnown(s, 'timing') || isKnown(s, 'contractEndDate'),
  },

  {
    id: 'business_name',
    type: 'text',
    title: "What's the business name?",
    inputLabel: 'Business name',
    autoComplete: 'organization',
    appliesWhen: isCommercial,
    satisfiedBy: (s) => isKnown(s, 'businessName'),
  },

  // ── Contact ──
  {
    id: 'name',
    type: 'text',
    title: (s) => isCommercial(s)
      ? 'Who should we contact about the electricity account?'
      : "What's your first name?",
    inputLabel: 'First name',
    autoComplete: 'given-name',
    appliesWhen: (s) => isKnown(s, 'customerType'),
    satisfiedBy: (s) => isKnown(s, 'firstName'),
  },

  {
    id: 'email',
    type: 'email',
    title: 'Where should we send your electricity matches?',
    subtitle: "We'll also save your comparison so you can return to it.",
    inputLabel: 'Email address',
    autoComplete: 'email',
    appliesWhen: (s) => isKnown(s, 'customerType'),
    satisfiedBy: (s) => isKnown(s, 'email'),
  },

  {
    id: 'phone',
    type: 'phone',
    title: "What's the best phone number for updates?",
    inputLabel: 'Phone number',
    autoComplete: 'tel',
    appliesWhen: (s) => isKnown(s, 'customerType'),
    satisfiedBy: (s) => isKnown(s, 'phone'),
  },
];

export const QUESTIONS_BY_ID = Object.fromEntries(QUESTIONS.map((q) => [q.id, q]));

/** Resolve a title/subtitle that may be a function of state. */
export function resolveCopy(value, state) {
  return typeof value === 'function' ? value(state) : value;
}

/**
 * staticContent.js
 *
 * The editorial body of the hub and tool pages.
 *
 * WHY IT LIVES HERE RATHER THAN IN content.js
 *
 * These ten pages were the thinnest indexable URLs on the site — /all-states
 * carried 197 words, /business-hub 197, /renewable-energy 207 — against
 * competitors running well over a thousand on the same queries. The depth they
 * needed is prose, and prose does not belong interleaved with the builders in
 * content.js that assemble tables and links from the snapshot. Keeping it as
 * data means the sections can be read and edited as writing, and means
 * content.js stays a place where structure is decided rather than authored.
 *
 * FIGURES
 *
 * Sentences that cite a number use a {TOKEN} resolved at build time from
 * src/seo/figures.js, so they cannot drift from the tables above them when the
 * market snapshot is refreshed. A token with no figure behind it drops the
 * sentence rather than publishing a hole — see resolveSections().
 */

export const STATIC_PAGE_CONTENT = {
  '/about-us': {
    intro: [
      'Electric Scouts is an independent electricity comparison service. We are not a supplier and we do not sell electricity — we show what is available so the choice is made on the numbers.',
      'In a market with retail choice the bill has two halves. The utility owns the poles, reads the meter and restores power after a storm, and its delivery charges are regulated and do not move when you switch. A separate retailer sells you the supply, and the supply rate is the only part of the bill this site can help you change.',
      'This page sets out what we track, where the figures come from, how the site is paid for, and what we will not claim. The last section explains how to check any of it.',
    ],
    sections: [
      {
        heading: 'What We Cover',
        paragraphs: [
          'We track {PLAN_COUNT} active plans from {SUPPLIER_COUNT} suppliers across the {STATE_COUNT} deregulated states Electric Scouts covers ({AS_OF}).',
          'Underneath that total, {RESIDENTIAL_PLAN_COUNT} of those plans are sold to households and {BUSINESS_PLAN_COUNT} to businesses; {FIXED_PLAN_COUNT} hold a fixed supply rate for the contract term, and {RENEWABLE_PLAN_COUNT} are backed by 100% renewable energy. The cheapest plan rate in the catalog is {RATE_MIN} and the dearest is {RATE_MAX} — different plans, in different states, on different terms, so that spread is not a saving anyone can claim.',
          'Around the plan data sit {CITY_COUNT} city pages and {UTILITY_COUNT} pages for the delivery utilities. A utility earns a page only once we already cover at least three of the cities in its territory; below that, its state page says everything we could honestly say.',
        ],
      },
      {
        heading: 'Where the Numbers Come From',
        paragraphs: [
          'Two kinds of figure appear on this site and they behave differently. Counts, ranges and medians — the ones above, and on every state, supplier and hub page — come from a snapshot of our plan catalog taken on {SNAPSHOT_DATE} and committed into the site\'s source code. Individual plan rates are deliberately not snapshotted: they move too often, and a stale rate printed as fact is worse than no rate, so the plans you see after entering a ZIP code are read live instead.',
          'The snapshot is built from our own catalog of supplier plans. It is not a utility default-service tariff and not a third-party rate index. A utility\'s average residential rate and the median rate across competing plans measure different things, and printing them side by side unlabelled makes a page contradict itself. Unless a page says otherwise, a rate here is a plan rate.',
          'The city pages are the one place worth naming as different: the average rate and estimated monthly bill shown for a city are area averages from our own city table rather than figures from the plan catalog, which is why a city page calls them averages and not offers.',
          'Sections on this site are built to exist only when the data behind them does. A city with no utility on record has no utility section, rather than a sentence with a blank in it. That is why some pages here are shorter than others.',
        ],
      },
      {
        heading: 'How We Make Money',
        paragraphs: [
          'Some suppliers pay us a referral fee when a customer signs up through our links. That is how the service stays free to use. It does not change the rates you are shown, and suppliers without a referral arrangement appear in the comparison on the same terms.',
          'Results are ordered by the sort you choose — rate, contract term or supplier — and a supplier that pays us is sorted by the same rule as one that does not.',
          'The honest limit runs the other way. We do not claim to list every supplier licensed in your state; we list those whose plans we hold. The risk worth knowing about is therefore not a paying supplier pushed up a ranking, it is a supplier missing from the comparison altogether. Every state with retail choice licenses the suppliers that sell there, and that licensed-supplier list is the check on us.',
        ],
      },
      {
        heading: 'What We Do Not Do',
        paragraphs: [
          'Two of those deserve expanding. On savings: this site holds plan rates, not anyone\'s bill, so a headline savings figure would have nothing behind it. What we can do is compare the rate you are on against the rates available and show the arithmetic — a projection, not a promise. On ratings: no supplier record in our catalog carries a verified customer rating.',
        ],
        bullets: [
          'We do not generate or sell electricity — your contract is always with the supplier',
          'We do not publish customer star ratings we cannot verify',
          'We do not promise a saving before seeing your rate and usage',
          'We do not sell your personal information',
          'We do not quote delivery or transmission charges — your utility sets those and we do not hold them',
          'We do not claim to list every supplier licensed in your state, only those whose plans we hold',
          'We do not enrol you in anything; switching is a separate, deliberate step taken with the supplier',
          'We do not print a rate we cannot trace to a plan in our catalog',
        ],
      },
      {
        heading: 'How to Check Our Work',
        bullets: [
          'Read the supplier\'s own contract document before signing. In Texas that is the Electricity Facts Label; in other markets it is the plan\'s terms of service or disclosure statement. It is the binding document, and where it disagrees with this site, it wins',
          'Check your state regulator. Every state with retail choice licenses the suppliers that sell there, and several regulators publish an official plan comparison alongside the list of licensed suppliers',
          'Check your own bill. Your supply rate and your monthly usage are printed on it, which is what the comparison needs to work from your own figures rather than a usage band. Base charges and usage credits still move the effective rate, so compare estimated cost rather than headline rates',
          'Check the date. The counts and ranges in this copy are only as current as the snapshot they came from, which was captured on {SNAPSHOT_DATE}',
        ],
        links: [
          [
            '/all-providers',
            'The suppliers whose plans we hold',
          ],
          [
            '/bill-analyzer',
            'Read your current rate off your bill',
          ],
        ],
      },
      {
        heading: 'Questions About Electric Scouts',
        faqs: [
          {
            question: 'Is Electric Scouts free to use?',
            answer: 'Yes. Comparing plans, running a bill through the Bill Analyzer and signing up through the site cost you nothing. The service is funded by referral fees that some suppliers pay when a customer signs up through our links.',
          },
          {
            question: 'Do you show every electricity supplier available at my address?',
            answer: 'No. We show the suppliers whose plans we hold that sell into your utility territory — {SUPPLIER_COUNT} suppliers across the states we cover ({AS_OF}). Your state regulator publishes the full list of licensed suppliers, which is where to look for one we do not carry.',
          },
          {
            question: 'Does a supplier pay to rank higher in your results?',
            answer: 'No. Referral fees are paid when a customer signs up, not for placement. Plans are ordered by the sort you choose — rate, contract term or supplier — and the same ordering applies to every supplier in the comparison.',
          },
          {
            question: 'How current are the rates on this site?',
            answer: 'The counts and ranges in the written copy come from a snapshot dated {SNAPSHOT_DATE}. The plans shown after you enter a ZIP code are read live, because supply rates move faster than page copy can. Confirm any rate against the supplier\'s own contract document before you sign.',
          },
          {
            question: 'Are you connected to my utility?',
            answer: 'No. Electric Scouts does not deliver electricity and is not part of any utility. Your utility keeps delivering your power, reading your meter and handling outages whether you buy supply through this site, direct from a supplier, or not at all.',
          },
        ],
      },
      {
        heading: 'Next Steps',
        links: [
          [
            '/compare-rates',
            'Compare plans for your ZIP code',
          ],
          [
            '/all-states',
            'The states we cover and how each market works',
          ],
          [
            '/all-providers',
            'Every supplier whose plans we track',
          ],
          [
            '/privacy-policy',
            'How we handle your data',
          ],
          [
            '/terms-of-service',
            'Terms of service',
          ],
        ],
      },
    ],
  },

  '/all-providers': {
    intro: [
      'Every supplier here sells the same electricity over the same wires. What separates them is the contract: the rate type, the term, the fees and what happens when the term ends. This page explains how to read one before you sign.',
    ],
    sections: [
      {
        heading: 'Your Supplier and Your Utility Are Different Companies',
        paragraphs: [
          'Two companies are involved in every electricity bill in a deregulated market, and only one of them is listed on this page. The utility owns the poles, the wires and the meter at your property. It delivers the power, reads the meter, restores service after a storm, and charges a delivery rate set by your state regulator. You do not choose it, and switching supplier does not change it.',
          'The supplier sells you the energy itself, the cents per kWh on the supply line of your bill. That is the contestable half, and it is the only part switching changes. A supplier owns no equipment at your address, does not read your meter, and does not have to own generation: it buys wholesale energy and resells it to you under a contract.',
          'Nothing physical therefore separates one supplier from another. The electricity arriving at your meter is the same whoever sold it to you. What differs is the contract.',
        ],
      },
      {
        heading: 'What Actually Separates One Supplier from Another',
        paragraphs: [
          'If the product is identical, a supplier is its terms and its footprint. Across the {STATE_COUNT} markets we cover, the snapshot holds {PLAN_COUNT} plans: {FIXED_PLANS} fixed, {VARIABLE_PLANS} variable, {NO_ETF_PLANS} with no early termination fee and {RENEWABLE_PLANS} backed by renewable generation ({AS_OF}). The mix is uneven across the directory: {FIXED_ONLY_SUPPLIERS} of the suppliers we track hold no variable plan at all, and {M2M_SUPPLIERS} sell month-to-month supply.',
          'Catalog size varies as widely. The smallest supplier here has {MIN_PROVIDER_PLANS} tracked plans and the largest has {MAX_PROVIDER_PLANS}.',
        ],
        bullets: [
          'Rate type — fixed for the term, or variable and reset by the supplier month to month',
          'Contract length — terms in our snapshot run from {TERM_MIN} to {TERM_MAX} months, and month-to-month supply appears in {MONTH_TO_MONTH_STATES} of the {STATE_COUNT} markets we cover',
          'Early termination fee — whether there is one, and how much of the remaining term it charges for',
          'Charge structure — a monthly base charge or a usage credit changes what the headline rate means at your consumption',
          'Renewable content — whether the supply is matched with renewable certificates',
          'Footprint — {SINGLE_STATE_SUPPLIERS} of the suppliers we track have tracked plans in one state only, {MULTI_STATE_SUPPLIERS} in more than one',
        ],
      },
      {
        heading: 'Why Your Address Sees a Shorter List Than This One',
        paragraphs: [
          'Retail supply is licensed state by state. A supplier needs a license from the regulator in each state it sells in, and then has to be set up to operate in each utility territory inside that state. Both gates apply before a company can quote your address.',
          'The snapshot shows the gap directly: {SUPPLIER_COUNT} suppliers across {STATE_COUNT} states produce {SUPPLIER_STATE_PAIRS} supplier-and-state pairings, not {SUPPLIER_COUNT} in every market.',
          'A license is also not the same as a live offer. A supplier can be licensed in a state and be selling nothing there this month. This directory counts suppliers with at least one active plan in the snapshot rather than everyone holding a license, so it is the narrower list. The suppliers-by-state table on this page gives the count market by market.',
          'Territory boundaries do not follow city or county lines either. That is why availability is confirmed by ZIP code rather than by place name.',
        ],
        links: [
          [
            '/compare-rates',
            'See which suppliers can sell to your ZIP code',
          ],
          [
            '/all-states',
            'How each deregulated market is set up',
          ],
        ],
      },
      {
        heading: 'How to Read a Supplier Before You Sign',
        paragraphs: [
          'A supplier is easier to judge from its contract documents than from its website. Residential offers come with written terms setting out the rate, the term, the charges and what happens when the term ends. The name of that document varies by state, but that is the page to read.',
          'Then check the company against your state\'s list of licensed suppliers. Every state that permits retail choice licenses the companies allowed to sell there and publishes the list. A company you cannot find on it — under its own name or the legal name it is licensed under — is not authorized to sell to you, whatever the offer says.',
        ],
        bullets: [
          'The usage level the rate is quoted at. Advertised rates are commonly quoted at 1,000 or 2,000 kWh a month, and the effective rate at your own usage can be some way off it.',
          'Every recurring charge, not only the rate per kWh. A monthly base charge is paid whatever you use, so it weighs heaviest on a low-usage household.',
          'Whether the rate is fixed for the whole term or only for an introductory period.',
          'The exact end date, and what the contract says happens the day after it.',
          'The early termination fee in dollars, and whether it falls as the term runs down.',
          'Whether a deposit is required, and the conditions under which it comes back.',
        ],
      },
      {
        heading: 'Warning Signs in a Supplier Contract',
        paragraphs: [
          'Most bad outcomes in retail electricity come from a few recurring contract structures rather than from outright fraud. They are legal, they are disclosed, and they are easy to skim past.',
          'None of these make a plan a bad buy. They mean the headline rate is not the price. The comparison worth making is estimated cost at your own usage across the whole term, including the base charge and whatever the contract rolls into at the end.',
        ],
        bullets: [
          'A teaser rate: a low introductory price for the first month or two, followed by a variable rate the supplier sets at its own discretion.',
          'Automatic rollover: a fixed contract that ends into a month-to-month variable rate unless you act. That rate is set by the supplier, and it is frequently well above the one you signed.',
          'A usage credit with a threshold: a bill credit that only applies above, say, 1,000 kWh makes a plan look cheap at exactly that figure and dear just below it.',
          'A fixed rate with pass-through clauses: check whether the fixed part covers only the energy charge, and whether the contract lets other charges be passed on during the term.',
          'An early termination fee that never shrinks: a flat amount charged whether you leave in month two or month twenty-two.',
          'Enrollment pressure at the door or on the phone. An agent needs little more than the account number from your bill and, in many of these markets, a recorded verbal authorization, so handing over a bill can be the switch itself.',
        ],
      },
      {
        heading: 'Common Questions About Electricity Suppliers',
        faqs: [
          {
            question: 'What is the difference between an electricity supplier and my utility?',
            answer: 'The utility delivers the electricity and owns the wires and meter at your property; its charges are set by the state regulator and are the same whoever supplies you. The supplier sells the energy itself and sets the rate per kWh. You can change your supplier; you cannot change your utility.',
          },
          {
            question: 'Does it matter which supplier I pick if the electricity is the same?',
            answer: 'The electricity is the same, the contract is not. Plans in our snapshot run from {MIN_RATE} to {MAX_RATE} ({AS_OF}), with and without early termination fees. Two suppliers can send the same power down the same wire and bill very differently for it.',
          },
          {
            question: 'How do I find out who my current supplier is?',
            answer: 'Look at the supply or generation line on your bill rather than the delivery line; the supplier is named there. In most of these markets, a household that has never shopped is still on the utility\'s regulated default service. Texas has no utility default rate, so every Texas address has a retailer, even if nobody at the property remembers choosing one.',
          },
          {
            question: 'Is a large supplier safer than a small one?',
            answer: 'Not on size alone. Every supplier selling to you has to be licensed by your state regulator, and if one exits the market its customers are moved to default service or to a provider of last resort rather than being cut off. The check that matters is the terms of the specific contract.',
          },
        ],
      },
    ],
  },

  '/all-states': {
    intro: [
      'Twelve US states let households buy electricity supply from a competing retailer instead of the local utility. These are the markets Electric Scouts covers, with what we currently track in each.',
    ],
    sections: [
      {
        heading: 'Deregulated States We Cover',
        paragraphs: [
          'The table is what we hold, not what each state licenses. Across the {STATE_COUNT} markets we cover we track {TOTAL_PLANS} active plans from {TOTAL_SUPPLIERS} suppliers ({AS_OF}). A smaller number in a row means we hold fewer plans there, not that fewer suppliers operate in that state.',
        ],
      },
      {
        heading: 'What Deregulation Actually Changed',
        paragraphs: [
          'Deregulation did not build competing sets of wires. It split the bill. In every one of these states the local utility still owns the poles, the cables and the meter at your property, still reads that meter, and still sends a crew when the power goes out. What it charges for that work is set by the state regulator and is identical whichever company sells you the energy. No supplier can discount it, and no comparison site can find you a cheaper version of it.',
          'What was opened to competition is the other half: supply, the energy itself, priced in cents per kWh. That is the only line a switch changes. Everything else about your service stays where it was, including the number you call in a storm.',
          'This is why the model most people arrive with is backwards. The utility named on the envelope is usually not the company setting the price they are unhappy about, and you cannot switch away from that utility at all — you are switching the supplier whose rate sits inside its bill.',
        ],
      },
      {
        heading: 'How Deregulated Markets Differ',
        paragraphs: [
          'Each state deregulated under its own legislation and its own regulator, so contract rules, switching timelines and default-service pricing are not the same across markets. The state pages set out the statute, the regulator and the utilities that still handle delivery.',
          'The difference that matters most to a switching decision is what happens to a household that never chooses. In most of these markets the utility still supplies those households itself, at a regulated default rate that resets on a published schedule. It goes by a different name from state to state — the price to compare in Pennsylvania and Ohio, Basic Generation Service in New Jersey, the standard offer in Maine — but the function is the same. It is what you pay by doing nothing, and it is the benchmark any offer put in front of you has to beat. The state pages carry the local term.',
          'Texas is the exception. The wires company there is not permitted to sell energy at all, so there is no utility default rate to fall back to and no option of staying put. Every household in the competitive part of Texas is on a retail contract, including the ones that do not remember signing one.',
          'Some of these states allow a third arrangement. In Ohio and Illinois a municipality can negotiate a supply contract for every household inside it and enrol them unless they opt out, so the supply line on your bill may name a retailer your town chose rather than one you did. It is not automatically cheaper than shopping yourself, and you can leave it for any supplier on the market.',
          'Prices differ as much as the rules do. The median plan rate in the states we track runs from {LOWEST_MEDIAN} in {LOWEST_MEDIAN_STATE} to {HIGHEST_MEDIAN} in {HIGHEST_MEDIAN_STATE} ({AS_OF}). A national average rate is not a benchmark for either of them.',
        ],
      },
      {
        heading: 'Contract Length, Exit Fees and the Rollover',
        paragraphs: [
          'Contract lengths are not uniform across these markets. In {SINGLE_TERM_STATE} every fixed-term plan we hold runs to a single length, {SINGLE_TERM_LENGTH} months. In {WIDEST_TERM_STATE} the terms we hold run from {WIDEST_TERM_MIN} to {WIDEST_TERM_MAX} months.',
          '{NO_ETF_TOTAL} of the {TOTAL_PLANS} plans we track carry no early termination fee, and {MTM_STATE_COUNT} of the {COVERED_COUNT} markets have month-to-month plans with no fixed term ({AS_OF}).',
          'If you are already under contract, the timing question is your own end date rather than the state\'s rules. Leaving a fixed term early can trigger an early termination fee, and the amount is set out in your contract documents.',
          'When a fixed term ends and you have done nothing, your supplier can move you onto a renewal or month-to-month rate, and that is not the rate you agreed to. Your end date is in the contract documents you were given at sign-up.',
        ],
      },
      {
        heading: 'Who Cannot Switch, Even in a Covered State',
        paragraphs: [
          'A state being deregulated does not make every address in it deregulated. Retail choice was granted to customers of the investor-owned utilities the restructuring statutes covered, and several groups sit outside that.',
        ],
        bullets: [
          'Municipal utilities. City-owned systems were generally left outside restructuring, so most addresses they serve have no competing supplier to switch to.',
          'Electric cooperatives. Member-owned rural systems were treated the same way, and most have not opted in.',
          'Addresses where the bill is not in your name. Where supply is bundled into rent, or a building is master-metered and submetered to tenants, the choice belongs to whoever holds the utility account.',
          'Parts of a state outside the competitive footprint, because eligibility follows utility territory rather than city or county lines.',
          'Households mid-contract can switch, but may owe an early termination fee for leaving before the end date.',
        ],
      },
      {
        heading: 'Questions About Deregulated States',
        faqs: [
          {
            question: 'How do I know if my state is deregulated?',
            answer: 'The states in the table above are the ones where households can buy supply from a competing retailer. Being in one is not the whole answer: choice follows utility territory rather than state lines, and municipal and co-op customers inside these states usually sit outside it. The state page explains how that market works; a ZIP code check settles whether your own address is in it.',
          },
          {
            question: 'Will my power go out when I switch supplier?',
            answer: 'No. The utility keeps the wires, the meter and the outage line whichever supplier you buy from, and nothing at your property changes. The switch usually takes effect on your next meter read, and the first sign of it is a different name on the supply line of your bill.',
          },
          {
            question: 'What happens if I never choose a supplier?',
            answer: 'In most of these states you stay on the utility\'s regulated default supply rate, which resets on a published schedule. Texas has no such rate, because the wires company there cannot sell energy at all, so you are on a retailer\'s contract whether or not you remember picking one. In Ohio and Illinois you may instead be on a supply deal your municipality signed for everyone who did not opt out.',
          },
          {
            question: 'Is electricity cheaper in a deregulated state?',
            answer: 'Deregulation does not set a price level. It decides who sets the supply price, and rates across these markets span a wide range that moves with wholesale costs. Whether shopping helps you comes down to one comparison: the offer in front of you against the default rate you would otherwise pay.',
          },
          {
            question: 'Can I go back to my utility after switching?',
            answer: 'In every one of these markets except Texas, yes — you return to the utility\'s regulated default service. Texas has nothing to return to, so you would pick a different retailer instead. Check your contract first, because leaving a fixed term early can carry an early termination fee.',
          },
        ],
      },
      {
        heading: 'Next Steps',
        links: [
          [
            '/compare-rates',
            'Compare plans for your ZIP code',
          ],
          [
            '/all-cities',
            'Browse rates city by city',
          ],
          [
            '/all-providers',
            'Browse the supplier directory',
          ],
          [
            '/utilities',
            'Delivery territories and who owns the wires',
          ],
          [
            '/learning-center',
            'Guides on switching, contracts and billing',
          ],
        ],
      },
    ],
  },

  '/bill-analyzer': {
    intro: [],
    sections: [
      {
        heading: 'The Two Halves of an Electricity Bill',
        paragraphs: [
          'An electricity bill in a deregulated market pays for two different things. Supply is the electricity itself, bought from a retail supplier you chose. Delivery is the poles, wires, meter and the crew that restores power after a storm, handled by the utility that owns the network where you live. You can change the first; you cannot change the second.',
          'Who sends the bill differs by market. In the eleven states outside Texas the utility usually prints both halves on one statement and collects the whole amount, which is why a bill can arrive from a company you never signed a contract with. In Texas it is the other way round: the retailer bills you, and the delivery charges are collected through that bill. Either way, look for a supply, energy or generation section naming your supplier, and a delivery, distribution or transmission section naming the utility.',
        ],
        bullets: [
          'A supply or energy charge — your contracted rate multiplied by the kWh you used',
          'On some plans, a fixed monthly base charge from the supplier, owed whether you use much or little',
          'A per-kWh delivery charge from the utility, at a rate approved by the state regulator',
          'A fixed customer or service charge from the utility, for being connected at all',
          'Riders, surcharges and state or local taxes, which vary by utility territory',
          'A usage or bill credit, where the plan carries one',
        ],
      },
      {
        heading: 'Working Out the Effective Rate by Hand',
        paragraphs: [
          'The effective rate is charges divided by kWh used. It matters because it folds every fixed charge back into a per-kWh number, which is the only form in which your current deal and an advertised plan can be held against each other.',
          'Do the division twice. The supply section alone divided by your kWh is your supply cost per kWh. The whole bill divided by your kWh is your all-in cost per kWh. Which of the two an advertised rate is comparable to depends on the market. Outside Texas, a supplier advertises a supply rate and the supply figure is the one to hold against it. In Texas the average price shown on a plan\'s Electricity Facts Label already includes the delivery charges from your local wires company, so it is the all-in figure that lines up. Comparing the wrong one of the two against a quoted rate produces a mismatch that looks like the quote was wrong.',
          'Your kWh for the period is on the bill, shown with the meter readings. Use the actual figure rather than a rounded one: once a fixed monthly charge is in the arithmetic, a small error in usage shifts the effective rate noticeably.',
        ],
      },
      {
        heading: 'Why a Base Charge Changes the Rate You Pay',
        paragraphs: [
          'A fixed monthly charge does not scale with usage, so its weight per kWh falls as usage rises. Spread across a heavy air-conditioning month it is close to invisible. Spread across a light month it can be the largest single influence on your effective rate. A plan with a base charge therefore has no one price — it has a curve, and your usage decides where on that curve you sit.',
          'Texas makes the curve explicit: the Electricity Facts Label a retailer must publish for a plan states an average price per kWh at 500, 1,000 and 2,000 kWh rather than a single headline figure. The other markets covered here have no equivalent three-point disclosure, so the arithmetic is left to the reader.',
          'The practical consequence is to compare at your own usage rather than at a typical one, and if your usage swings hard between summer and winter, to check a candidate plan at both ends instead of at the average of the two.',
        ],
      },
      {
        heading: 'Usage Credits and the Cliff They Create',
        paragraphs: [
          'A usage credit is a fixed amount taken off the bill once your usage crosses a threshold set by the plan. Below the threshold you get nothing. Above it you get the whole credit at once.',
          'That is a cliff, not a slope. A month that lands just under the threshold can cost more in total than a month comfortably over it, because the extra kWh cost less than the credit they unlocked. Over a year the credit may still be worth having, but it makes any single bill a poor guide to the plan, and an advertised average price calculated above the threshold does not describe a household that finishes most months below it.',
          'When the analyser reports an effective rate for a period in which a credit was applied, that is the rate for that period. Check the plan\'s own terms for the threshold before assuming the same number will repeat next month.',
        ],
      },
      {
        heading: 'What to Compare the Number Against',
        paragraphs: [
          'An effective rate on its own is just a number. It becomes useful when you hold it against something, and there are two references worth using.',
          'The first is the regulated default supply rate. In eleven of the twelve markets Electric Scouts covers, the utility sells electricity at a published default rate to anyone who has never chosen a retailer — the price to compare in Pennsylvania, the standard service offer in Ohio, the standard offer in Maine, basic service in Massachusetts and New York. It resets on a schedule set by the state, and beating it is the minimum test of whether shopping achieved anything. Texas is the exception: its utilities are delivery-only and sell no electricity at all, so there is no default rate there to measure against.',
          'The second is what suppliers are actually selling today. Electric Scouts tracks {PLAN_COUNT} active plans from {SUPPLIER_COUNT} suppliers across {STATE_COUNT} deregulated states ({AS_OF}), and the rates attached to them run from {RATE_MIN} to {RATE_MAX} across the catalog. That is a wide band, and where in it your own effective rate sits is the question worth taking to a comparison for your ZIP code.',
        ],
        links: [
          [
            '/compare-rates',
            'See what is being sold in your ZIP code',
          ],
          [
            '/all-providers',
            'Every supplier in the directory',
          ],
        ],
      },
      {
        heading: 'Fixed, Variable and What One Statement Can Show',
        paragraphs: [
          'A bill shows the rate you were charged for that period. It does not show the rate you will be charged next. On a fixed plan those are the same until the term ends. On a variable or month-to-month plan they are not: the supplier can reset the rate each cycle, and an introductory rate that expires does so quietly — the only visible sign is a larger number on the following statement.',
          'A fixed term ending does not stop your supply. Depending on the contract, the account rolls onto a variable or month-to-month rate with the same supplier, or returns to the utility\'s default service where the market has one. Either way the change happens without anyone signing anything.',
          'So read the bill for two things beyond the rate — the plan name and the contract end date, where the bill prints them — and then compare the rate against your last two or three statements. Three bills at three different rates tell you the rate is moving, whatever the plan is called.',
        ],
        links: [
          [
            '/compare/fixed-vs-variable-electricity-plans',
            'How fixed and variable plans differ, state by state',
          ],
        ],
      },
      {
        heading: 'Bill Analyzer Questions',
        faqs: [
          {
            question: 'Why is my electricity bill so high when my rate is low?',
            answer: 'Because a low rate applies to the electricity, not to the whole bill. Delivery charges, a fixed customer charge from the utility, riders and taxes sit alongside it, and none of them move when you change supplier. Divide the bill by your kWh and you get your all-in cost, which is always higher than the supply rate you shopped for.',
          },
          {
            question: 'How do I calculate my effective rate per kWh?',
            answer: 'Add up the charges in the supply or energy section of the bill and divide by the kWh you used in that period. Outside Texas that is the figure to compare against an advertised supply rate. In Texas, where the average price on an Electricity Facts Label already includes delivery charges, divide the whole bill by your kWh instead.',
          },
          {
            question: 'There is a credit on my bill — is that a discount off my rate?',
            answer: 'Not usually. A usage credit is a fixed amount applied only when your usage passes a threshold set by the plan, so it arrives whole or not at all rather than shaving a fraction off each kWh. Check the plan\'s terms for the threshold before you assume the credit will appear again next month.',
          },
        ],
      },
    ],
  },

  '/business-electricity': {
    intro: [
      'The rate per kWh is only one input into a commercial bill. When you draw power, how sharply your load rises and falls, and which charges a quote leaves outside its headline number all move what you end up paying. This page sets out those mechanisms, so a quote can be read rather than ranked.',
    ],
    sections: [
      {
        heading: 'The Two Halves of a Commercial Bill',
        paragraphs: [
          'A commercial electricity cost splits into supply and delivery. Supply is the energy itself, sold by a retailer you choose. Delivery is the wires, the meter and the crews who restore service after a storm, charged for by the utility that owns the network in your territory. Delivery is set by tariff, identical whichever retailer you buy from, and no quote can lower it. Whether the two reach you as separate lines or folded into one number depends on the market and the retailer.',
          'That split is why a comparison is narrower than it looks. Shopping moves one half of the bill, and how large that half is varies by territory and by how peaky the load is. Taxes and rider charges sit on top of both halves, and some quotes fold them in while others do not.',
        ],
        links: [
          [
            '/utilities',
            'Which utility delivers power in your territory',
          ],
          [
            '/bill-analyzer',
            'Check the effective rate you are actually paying',
          ],
        ],
      },
      {
        heading: 'Demand Charges: Paying for the Peak, Not the Total',
        paragraphs: [
          'Where a tariff carries a demand charge, the meter records more than a monthly total. It averages your draw over short intervals through the month, and the highest interval it saw sets the demand you are billed on.',
          'Two buildings can use identical kWh in a month and be billed differently, because one drew it evenly and the other drew it in bursts. Three compressors started together, or an oven bank fired at the same moment each morning, set a peak that is billed for the whole month however brief it was.',
          'Some tariffs go further with a ratchet, which puts a floor under this month\'s billing demand based on the highest demand recorded over an earlier period. One hot afternoon then follows you into the winter. Whether a ratchet applies, and over what period, is a question for your utility tariff rather than your supplier.',
        ],
      },
      {
        heading: 'Load Factor, and Why Suppliers Ask For It',
        paragraphs: [
          'Load factor describes the shape of your usage rather than its size: your average load as a proportion of your peak load over the same period. A site drawing a flat load around the clock sits near 100%. A site with the same consumption squeezed into weekday afternoons sits far below that, because the peak it is measured against is much higher.',
          'High load factor is cheaper to serve. More of the volume can be bought as steady round-the-clock blocks, which cost less than the on-peak blocks needed to cover a peaky load, and less capacity has to be reserved on your behalf. Low load factor pushes more of the same volume into fewer hours. That cost is in your rate whether or not it is itemised.',
        ],
      },
      {
        heading: 'What a Commercial Price Is Built From',
        paragraphs: [
          'A commercial price is built rather than looked up. The supplier starts from forward prices for the hours you actually consume, adds the non-energy costs that follow from your demand rather than your total — transmission, and capacity where the market runs a capacity market — then ancillary services, losses and a margin.',
          'Two of those inputs keep moving. Forward energy prices change through the trading day, which is why a commercial quote usually expires the day it is issued. The peak figures behind the demand-driven costs are normally set once a year from your own meter, so a business that cut its peaks last summer can be priced differently this year without changing anything else.',
        ],
      },
      {
        heading: 'Reading Two Quotes That Look the Same',
        paragraphs: [
          'Offers with the same term and the same headline rate can behave very differently once you are on them. What separates them:',
        ],
        bullets: [
          'Fixed all-in against energy-only. An all-in price folds the non-energy components — transmission, ancillaries, and capacity where the market runs a capacity market — into a single rate. An energy-only price passes them through at cost, so the quoted number looks lower and the bill is not actually fixed',
          'Bandwidth, or swing. Many contracts fix the price only within a band around forecast volume. Use materially more or less and the difference settles at market, which is where a seasonal business or a site that closes a line gets caught',
          'Start date. A term beginning in a summer month prices differently from the same term beginning in spring, because the forward curve is seasonal',
          'Termination. Commercial contracts often replace a flat early termination fee with liquidated damages: the supplier\'s loss on reselling your unused volume at market. That figure is not knowable at signing, which is an argument for getting the term right rather than planning to leave',
        ],
        links: [
          [
            '/business-compare-rates',
            'What a supplier needs before it can price you',
          ],
        ],
      },
      {
        heading: 'Timing, Renewals and Rolling Off',
        paragraphs: [
          'A contract that lapses without a replacement leaves the account on a holdover or default rate that nobody negotiated, and that rate can move from one period to the next. It is the outcome worth ruling out before an end date arrives.',
          'Where you want to extend early from inside a contract, some suppliers will blend the remaining term into a new one at a weighted price rather than charge you to leave.',
        ],
        links: [
          [
            '/learn/business-electricity-rates-guide',
            'Longer guide to commercial rates',
          ],
        ],
      },
      {
        heading: 'Business Electricity Questions',
        faqs: [
          {
            question: 'How do I work out my load factor?',
            answer: 'Take the kWh and the peak kW from the same bill — the peak appears only where the account is demand-metered. Divide the kWh by the peak kW multiplied by the number of hours in the billing period. A result near 1 means a steady load; the lower the figure, the more your consumption is concentrated into a few hours of the day.',
          },
          {
            question: 'Why did two suppliers quote different rates for the same building?',
            answer: 'They are pricing the same building against different supply positions and different assumptions about what your usage will do. One may include transmission and capacity in the rate while the other passes them through, and one may have been given twelve months of interval data where the other worked from monthly totals. Compare what each price includes before comparing the numbers.',
          },
        ],
      },
    ],
  },

  '/business-hub': {
    intro: [
      'Size is a shorthand for three things a supplier actually prices: what your meter records, the shape of your load through the day, and how long you want a price held.',
    ],
    sections: [
      {
        heading: 'Small Business',
        paragraphs: [
          'The practical marker of a small account is the meter. Most sit on a non-demand meter, which records total kilowatt-hours and nothing else, so the bill reads like a larger household bill: supply charged per kWh, delivery charged per kWh plus a fixed monthly service charge, and no line billing you on how hard you pulled.',
          'Watch what a household would watch: the monthly base charge, any usage credit that only applies above a threshold, and the early termination fee. In Texas the regulator treats accounts under 50 kW of peak demand as small commercial, so the same standardised plan disclosure a residential customer gets applies to them.',
        ],
      },
      {
        heading: 'Medium Business',
        paragraphs: [
          'Somewhere in this band the utility fits a meter that records demand as well as consumption, and a kW line appears on the bill. Demand is the highest average load over a short interval, typically 15 or 30 minutes depending on the utility, during the billing period. A single interval sets it: two compressors and an oven running together through one busy afternoon interval can set the demand charge for the whole month. Some tariffs add a ratchet, where billed demand cannot fall below a share of your highest demand over the preceding months, so a one-off peak follows you for months afterwards.',
          'Load factor also starts to matter here. It is your average load divided by your peak load. A business that draws power steadily is cheaper for a supplier to serve than one with the same annual kWh squeezed into a few hours, and the quote reflects that.',
        ],
      },
      {
        heading: 'Large and Industrial',
        paragraphs: [
          'At this size there is no standing offer. Your meter records interval data, the supplier prices your actual shape against wholesale forward prices, and the bid is held only briefly. Products stop being simply fixed or variable: a block-and-index contract fixes part of your load and leaves the rest floating, and many quotes separate energy from the non-energy components instead of bundling everything into one rate.',
          'Those components matter. In the PJM states your capacity charge is set by usage during a handful of system peak hours the previous summer; in New England it is set by usage in the single annual system peak hour. Cutting load on those hours lowers a charge you pay the following year, which is a different exercise from cutting monthly kWh. Expect a credit review as well, and possibly a deposit or a parent guarantee.',
        ],
      },
      {
        heading: 'What Actually Changes as You Grow',
        paragraphs: [
          'Two things change as a business grows, and not at the same point. First the metering: kWh only, then kWh plus demand, then interval. Second, how you are priced: from a quote built off a bill that reads like a household\'s, to a quote built off twelve months of consumption, to a bid built off your interval data and held only briefly. What does not change is delivery. Your utility keeps the wires, the meter and the outage line whatever you sign, and its delivery tariff is set by the regulator.',
        ],
      },
      {
        heading: 'When to Sign',
        paragraphs: [
          'Timing matters more than length. Suppliers will price a contract that starts when your current one ends, so the useful window is a few months before your end date, while you can still walk away. Letting a contract lapse does not leave you on the old rate: you roll on to a holdover or renewal rate with the same supplier, or on to whatever default or last-resort supply your market assigns. If wholesale prices have moved in your favour mid-contract, ask about a blend and extend before paying an exit fee.',
        ],
      },
      {
        heading: 'What a Supplier Needs Before Quoting',
        paragraphs: [
          'A commercial quote is only as good as the usage data behind it, and suppliers pad a price when they are guessing at your shape. All of this comes off your bill or your utility account, and gathering it once gets you comparable quotes instead of a spread of assumptions.',
        ],
        bullets: [
          'Your utility account number, and in Texas the ESI ID that identifies the service point',
          'The rate or tariff code printed on the bill, which tells a supplier which utility tariff you sit on',
          'Twelve months of kWh, plus interval data if your meter records it — your utility can usually release it on request',
          'Your peak demand in kW, if a kW figure appears on the bill at all',
          'Your current contract end date, current rate and any auto-renewal clause',
          'A signed letter of authorization, which is what lets a supplier or broker pull your usage history from the utility',
          'Every site you want covered, each with its own account number, and whether they sit in the same market',
          'Any known change in load — a new shift, added refrigeration, EV charging — because the quote is priced on the shape you describe',
        ],
      },
      {
        heading: 'Business Electricity by Size: Common Questions',
        faqs: [
          {
            question: 'How do I know if my business has a demand meter?',
            answer: 'Look for a figure in kW on the bill, usually labelled demand, billed demand or peak kW. If every quantity on the bill is in kilowatt-hours and there is no kW line, you are on a non-demand meter and are billed on consumption alone. The rate or tariff code printed near your account number is the other giveaway, and your utility can tell you what it means.',
          },
          {
            question: 'Does switching supplier reduce my demand charges?',
            answer: 'Not the utility\'s. Delivery charges, including any demand charge in the delivery tariff, are set by the regulator and follow the meter whatever supplier you use. What a supplier can change is how its own capacity and transmission costs reach you — bundled into one rate, or passed through as separate line items — so check which of the two a quote is offering.',
          },
          {
            question: 'Why does a business quote expire so quickly?',
            answer: 'The price is built from wholesale forward prices for the exact months of your contract, and those move every trading day. Suppliers therefore hold a commercial price for a short window rather than leaving it standing. If the quote lapses, the supplier reprices rather than honouring the old number.',
          },
          {
            question: 'What happens if my business contract ends and I do nothing?',
            answer: 'You do not keep the old rate. Depending on the market and the contract, you roll on to a holdover or renewal rate with the same supplier, or on to whatever default or last-resort supply your market assigns. Neither is priced to retain you, which is why the end date is worth putting in the calendar a few months ahead.',
          },
          {
            question: 'Is my business too small to be worth shopping?',
            answer: 'There is no minimum. The one thing that helps at any size is a usage history — a supplier quoting a brand-new site with no meter reads will price that uncertainty into the rate.',
          },
        ],
      },
      {
        heading: 'Next Steps',
        links: [
          [
            '/business-compare-rates',
            'Request quotes for your business',
          ],
          [
            '/business-electricity',
            'How commercial pricing and demand charges work',
          ],
          [
            '/bill-analyzer',
            'Read your current bill before you ask for quotes',
          ],
          [
            '/all-states',
            'Which states let you choose a supplier at all',
          ],
        ],
      },
    ],
  },

  '/compare-rates': {
    intro: [
      'A rate on a plan card is tied to three things: the usage level it is quoted at, the contract term behind it, and the utility territory it is sold into. The sections below set out what each of those does to the number.',
    ],
    sections: [
      {
        heading: 'Which Plans Appear in Your Results',
        paragraphs: [
          'The result list is not a directory of every supplier in your state. It is the set of plans a supplier is licensed to sell, and is currently selling, into the utility territory your ZIP code falls in. Territory boundaries follow utility service areas rather than city or county lines, so two ZIP codes in the same city can return different lists.',
          'The plan counts elsewhere on this page are statewide totals. No single address is offered all of them, and that is how the market works rather than a gap in the data.',
          'What you are choosing is the supply half of your bill: the electricity itself, sold by a retailer. The other half is delivery — the poles, the wires, the meter reads and the crews who turn up after a storm — priced by your utility at a regulated rate that no supplier can discount and no comparison can change. In some markets the advertised rate covers supply alone and delivery is billed on top; in others the rate is quoted all-in with delivery already inside it. Either way, switching changes who sells you the energy and leaves the wires, the meter and the outage number as they were.',
        ],
      },
      {
        heading: 'Reading a Rate at Your Own Usage Level',
        paragraphs: [
          'Texas plans are sold with an Electricity Facts Label, and the label prices the same plan three times over — at 500, 1,000 and 2,000 kWh a month. Those are not three offers. They are the average price per kWh on that one plan at three usage levels, and they are usually three different numbers.',
          'They differ because a plan is rarely a single rate. A monthly base charge is spread across whatever you use, so it raises the average price sharply at 500 kWh and barely at 2,000. A bill credit that only pays out above a threshold works the other way: it can make the 1,000 kWh figure the lowest of the three, and a household that uses 900 kWh in a mild month does not get the credit at all.',
          'So read the figure nearest your own usage rather than the lowest one on the page. One recent bill will tell you your usage; a year of bills will tell you how far it swings between January and August, which is what decides whether a plan with a credit threshold works for you.',
          'The three-tier label is a Texas requirement. Elsewhere the same detail sits in the plan\'s own contract documents, and the mechanism is unchanged.',
        ],
      },
      {
        heading: 'Rate, Term and Exit Fee Are One Decision',
        paragraphs: [
          'A rate means little without the term attached to it and the cost of leaving that term early. Plans in our comparison run from {TERM_MIN} to {TERM_MAX} months.',
          'The early termination fee is what makes a long term expensive to be wrong about. Some are a flat amount; others are charged per remaining month, so what it costs to leave depends on when you leave. Both the amount and the structure sit in the plan\'s contract documents rather than in the advertisement, and they are worth reading before the rate is.',
          '{NO_ETF_COUNT} of the {TOTAL_PLANS} plans we track carry no early termination fee. Those are the ones to look at if you may move within the year or expect to shop again soon.',
          'If you are already under contract, find its end date before you compare. Suppliers commonly price a contract that starts when the current one ends, so a switch can be timed around the end date rather than into an exit fee.',
        ],
      },
      {
        heading: 'Fixed, Variable and the End of a Term',
        paragraphs: [
          '{FIXED_COUNT} of the plans we track are fixed-rate and {VARIABLE_COUNT} are variable. A fixed rate holds for the contract term; a variable rate can be reset by the supplier month to month, so it is the one figure on a comparison page with no commitment behind it.',
          'An expiring contract does not usually cancel itself. It rolls onto a month-to-month or holdover rate the supplier sets, and that rate is not the one you signed up for. Put the end date in a calendar on the day you enrol and compare again a month before it.',
        ],
      },
      {
        heading: 'What the Estimated Cost Includes',
        paragraphs: [
          'Enter your monthly usage and each plan is priced from the components we actually hold for it: the energy charge at the plan\'s rate, any monthly base charge, the utility delivery charge where we have a tariff on record for your territory, and any usage credit whose threshold your usage clears. The result is an estimate built from your number and the plan\'s published terms, not a quote.',
        ],
        bullets: [
          'Where a plan\'s rate is quoted all-in, delivery is already inside it and is not added a second time',
          'Where no delivery tariff is on record for your territory, the figure is supply-only and is labelled as such rather than presented as a full bill',
          'A bill credit your usage does not reach is not applied, and the shortfall is stated instead of quietly assumed',
          'Ranking is done on the supply portion, so plans we hold less delivery data for cannot look cheaper simply because we know less about them',
          'Taxes, municipal fees and any deposit a supplier asks for sit outside the estimate',
        ],
      },
      {
        heading: 'Questions About Comparing Rates',
        faqs: [
          {
            question: 'Why does a Texas plan show three different prices per kWh?',
            answer: 'Because the Electricity Facts Label prices the same plan at 500, 1,000 and 2,000 kWh a month. The three figures differ because base charges and bill credits land differently depending on how much you use. Read the one closest to your own monthly usage.',
          },
          {
            question: 'Why do I have to enter a ZIP code before I see plan prices?',
            answer: 'Because suppliers are licensed and priced by utility territory rather than by state, and a ZIP code is the smallest thing that reliably settles which territory an address sits in. A statewide list would include plans you cannot buy.',
          },
          {
            question: 'What usage should I enter if I don\'t know mine?',
            answer: 'Take it from a recent bill — the kWh total for the period is on every one. If you can, look at a summer bill and a winter bill rather than one month, because a plan that wins at your average can lose at your peak. Uploading a bill does this for you and uses the measured figure instead of a usage band.',
          },
          {
            question: 'Can I compare plans while I\'m still under contract?',
            answer: 'Yes. Check your contract\'s end date and its early termination fee first: early in a long term, the exit fee can be more than the difference in rate is worth.',
          },
          {
            question: 'How current are these rates?',
            answer: 'The plan figures written into these pages come from a snapshot taken {AS_OF}, so treat them as the state of the market on that date. When you enter a ZIP code, the comparison reads current plans rather than the snapshot. Either way, the rate that binds is the one in the contract documents the supplier gives you at enrolment, so read those before you sign.',
          },
        ],
      },
    ],
  },

  '/home-concierge': {
    intro: [
      'Getting electricity live at a new address is a sequence, not a purchase. Some of the steps run on the utility\'s schedule rather than on yours, which is why they belong in the weeks before the move rather than on the day itself.',
    ],
    sections: [
      {
        heading: 'The Order Things Have to Happen In',
        paragraphs: [
          'Each step depends on the one before it, and once the request is in, the timing belongs to the utility rather than to you.',
          'You need the exact service address first, unit number included, because supply is enrolled against a specific meter rather than against a building. Then you need a start date, which is the day you take the keys and not the day the furniture arrives. Then you choose a supplier: the supply half of the bill is the part of it you can change.',
        ],
        bullets: [
          'Two to three weeks out: confirm the address exactly as the utility records it, and find out which utility delivers to it',
          'Two weeks out: compare plans for that ZIP code, and read the contract length and early termination fee before you pick, not after',
          'About a week out: enroll with your chosen supplier and give it the start date',
          'The same week: tell your current supplier the move-out date, so the old account is closed on a read rather than left running',
          'Move-in day: check the power is live before the truck is unloaded, and photograph the meter',
        ],
      },
      {
        heading: 'Who You Actually Open the Account With',
        paragraphs: [
          'Who you contact depends on which market you are moving into, and the two models work differently enough that it is worth knowing which one applies before you start.',
          'In the deregulated parts of Texas the retail supplier holds the account. You sign up with the supplier, it sends the move-in request to the local wires company on your behalf, and one bill covers both supply and delivery. You do not open anything with the utility directly.',
          'In the other markets we cover, the delivery utility holds the account. You open service with the utility for the new address first, and a competitive supplier is then layered onto that account, with delivery and supply usually arriving on one utility bill. Skipping the supplier step does not leave you without power: you sit on the utility\'s regulated default service until you choose.',
          'Electric Scouts compares the supply half of that in {STATE_COUNT} deregulated states — {SUPPLIER_COUNT} suppliers and {PLAN_COUNT} active plans ({AS_OF}). The delivery half is not shoppable in either model. Whichever utility owns the wires at the address is the one that connects you, at charges its state regulator sets.',
        ],
        links: [
          [
            '/utilities',
            'Which utility delivers power in your area',
          ],
          [
            '/compare-rates',
            'Compare supply plans for your new ZIP code',
          ],
        ],
      },
      {
        heading: 'What a Landlord or a Closing Needs From You',
        paragraphs: [
          'If you are renting, many leases make electricity in your own name a condition of the tenancy, and some agents ask for proof before handing over keys: an account number and a start date that matches the lease start. The supplier\'s confirmation email is the document to forward, so keep it.',
          'Some landlords hold a continuous-service arrangement with the utility that puts power back into their name when a tenant\'s account ends, so the property is never dark between tenancies. Where that applies and your own account does not start on the lease date, the days in between are billed under that arrangement and charged on to you.',
          'If you are buying, the closing agent does not transfer utility accounts. The seller closes their account with a final meter read on the closing date, and you open yours from the same date. Ask which utility serves the property, because that tells you which territory you are enrolling in before you compare anything.',
          'A house that has stood empty is the case to check early. Where supply has been off for a long stretch, restoring it can take more than a phone call — some utilities require an inspection before a disconnected service is re-energised — and closing day is the wrong time to find that out.',
        ],
      },
      {
        heading: 'What Goes Wrong When It Is Left Late',
        paragraphs: [
          'Leaving it late does not usually end with a dark house. It ends with a rate and a schedule somebody else set.',
          'None of these is a catastrophe on its own. They compound because a move has no slack in it: the date is fixed, the truck is booked, and the utility\'s schedule is not yours to move.',
        ],
        bullets: [
          'Short notice narrows the field to whatever can start quickly, which is not the same as the best plan available at the address',
          'Expedited and same-day connections are chargeable in some utility territories, and that charge is set by the utility, not by the supplier',
          'Where service falls back to a landlord, a builder or the utility\'s default rate, you pay a rate nobody chose for you, from the day you moved in',
          'An enrollment can fail on the address alone — a missing unit number, or a new build not yet in the utility\'s records — and the clock restarts once it is corrected',
        ],
      },
      {
        heading: 'Closing the Old Account Without Paying for an Empty House',
        paragraphs: [
          'Service does not stop because you left. It stops when you give a stop date and the meter is read for the last time. Until then the account is yours, including anything the new occupant uses.',
          'Set the move-out date in the same week you set up the new address, so both ends of the move sit on one calendar. Photograph the meter on the day you hand back the keys; if the final read is estimated, that photograph is the evidence you will need.',
          'If you are still inside a fixed term at the old address, read the terms document before you cancel anything. Whatever relief a contract allows on a move has to be asked for, and asked for before the account closes.',
        ],
      },
      {
        heading: 'More Moving Questions',
        faqs: [
          {
            question: 'The power is already on at my new place. Do I still need to set up an account?',
            answer: 'Yes. It is usually on because the previous occupant\'s account has not closed yet, or because a landlord or builder is holding service on the property. Everything used from your move-in date is billed to whoever holds that account, and it can be charged on to you. Open your own account with a start date rather than waiting for the lights to go off.',
          },
          {
            question: 'Do I need to be at the property when the power is switched on?',
            answer: 'Usually not. Where the meter is already installed and reachable, a move-in is often completed without anyone going inside. Access is only needed if the meter sits behind a locked door or inside the property, or if the service was physically disconnected rather than simply transferred.',
          },
          {
            question: 'Can I set up electricity before I have a signed lease or a closing date?',
            answer: 'You can compare plans at any point, but enrollment needs a service address and a start date. A start date a few weeks ahead is usually accepted, and it can usually be moved if the closing slips, so enrolling as soon as you have a date is safer than waiting for the date to be certain.',
          },
          {
            question: 'What information do I need to hand over to enroll?',
            answer: 'The service address exactly as the utility records it, including any apartment or unit number, the date you want supply to start, and identification for the credit check that decides whether a deposit applies. In deregulated Texas you may also be asked for the ESI ID, the identifier for the meter at that address, which appears on bills issued for the property.',
          },
        ],
      },
    ],
  },

  '/renewable-energy': {
    intro: [
      'The rest of this page covers what a supplier actually buys when it sells renewable supply, what that purchase does not change, and how the plans price against everything else we track.',
    ],
    sections: [
      {
        heading: 'What a 100% Renewable Plan Actually Is',
        paragraphs: [
          'The certificate is the unit that makes that work. A regional tracking system issues one renewable energy certificate for each megawatt-hour a registered renewable generator produces, carrying the details of the plant that produced it. A supplier selling renewable supply retires certificates equal to your consumption, and a retired certificate cannot be retired again, which is what stops the same generation being claimed by more than one household.',
        ],
      },
      {
        heading: 'What the Certificate Does and Does Not Buy',
        paragraphs: [
          'A certificate does two things: it pays a renewable generator on top of what it earns for the electricity, and it carries the exclusive right to claim that generation. It is not proof that anything was built because you signed up. A certificate can come from a plant that has run for years and would keep running either way, or from new generation under long-term contract. Both are sold as 100% renewable.',
          'Timing and geography are the other limits. Certificates are normally matched against annual consumption rather than the hour the power was used, so summer solar output can cover a January evening on paper, and generation in another region still counts.',
        ],
      },
      {
        heading: 'How Renewable Plans Price Against Standard Plans',
        paragraphs: [
          'In {CHEAPEST_IS_RENEWABLE_COUNT} of the {STATE_COUNT} states we cover, the cheapest renewable plan we track is priced at the state\'s lowest residential rate — no green premium at the bottom of the board at all. The states where the cheapest renewable plan does cost more than the cheapest residential plan, and by how much: {RENEWABLE_PREMIUM_LIST}.',
          'The wider spread is between markets. The cheapest renewable plan runs from {MIN_RENEWABLE_RATE} in {MIN_RENEWABLE_STATE} to {MAX_RENEWABLE_RATE} in {MAX_RENEWABLE_STATE}. Contract term, early termination fee and the rate at renewal are worth reading on a renewable plan for the same reasons they are on any other.',
        ],
      },
      {
        heading: 'Who Sells Renewable Plans',
        paragraphs: [
          '{RENEWABLE_SUPPLIER_COUNT} of the {SUPPLIERS_WITH_PLANS} suppliers in our catalog sell at least one 100% renewable plan, and {PURE_RENEWABLE_SUPPLIER_COUNT} of those sell nothing else.',
          'Offers are set by utility territory rather than by state line, so the count for your address is the one that matters. Across the states we cover, between {MIN_RENEWABLE_PROVIDERS} and {MAX_RENEWABLE_PROVIDERS} suppliers sell at least one renewable plan.',
          'A supplier selling only renewable plans tells you about its product line, not about how the certificates behind it are sourced. Those are separate questions, and the second one is answered in the contract documents.',
        ],
      },
      {
        heading: 'What to Check Before You Sign',
        paragraphs: [
          'Renewable content is a contract term like any other, and it is written down. In Texas, suppliers state it as a percentage on the Electricity Facts Label. Elsewhere, look for it in the plan\'s terms of service or contract summary.',
        ],
        bullets: [
          'Whether the plan is 100% renewable or a partial blend, and what percentage the document states',
          'Whether that figure appears in the contract documents and not only in the marketing',
          'Whether the product carries independent certification such as Green-e, which verifies the certificate purchases behind a certified product',
          'Whether the rate is fixed or variable, which is a separate term from renewable content',
          'The contract term and the early termination fee, which decide what leaving early costs',
          'What happens to the rate when the term ends, since the contract does not simply stop',
        ],
      },
      {
        heading: 'What a Renewable Plan Is Not',
        paragraphs: [
          'Buying renewable supply is not the same as generating your own power. Rooftop solar changes the meter: you produce electricity on site, draw less from the grid, and where net metering is offered you are credited for the surplus you export. A renewable supply plan does none of that. Your usage and your meter read exactly what they read before.',
          'Community solar is different again. You subscribe to a share of an off-site array and credits from its output are applied to your utility bill. It sits alongside a supply contract rather than replacing one.',
        ],
      },
      {
        heading: 'Renewable Plan Questions',
        faqs: [
          {
            question: 'Do renewable electricity plans cost more?',
            answer: 'Not in most of the markets we track. In {CHEAPEST_IS_RENEWABLE_COUNT} of the {STATE_COUNT} states we cover, the cheapest renewable plan we track is priced at the state\'s lowest residential rate. In the rest, the gap between the cheapest renewable plan and the cheapest residential plan is {MAX_RENEWABLE_PREMIUM} or less.',
          },
          {
            question: 'What is a renewable energy certificate?',
            answer: 'It is the record that one megawatt-hour of renewable electricity was generated, issued by a regional tracking system and carrying the details of the plant that produced it. Suppliers retire certificates matching what you use, which transfers the claim on that generation to you and takes the certificate off the market.',
          },
          {
            question: 'Does signing up for a green plan get new wind farms built?',
            answer: 'Not on its own. The certificate revenue does reach renewable generators, but a certificate can come from a plant that already exists and would run either way. If that matters to you, look for products tied to new or named generation, and for certification that verifies the sourcing, rather than the 100% renewable label by itself.',
          },
          {
            question: 'Is a 100% renewable plan the same as having solar panels?',
            answer: 'No. Panels generate electricity at your property and reduce what you buy. A renewable plan changes who supplies the electricity you already buy, and what that supplier purchases on your behalf. Nothing is installed and your consumption does not change.',
          },
        ],
      },
    ],
  },

  '/savings-calculator': {
    intro: [
      'Enter your current rate and monthly usage to estimate what a different plan would cost you over a year. The calculator works from your own numbers rather than a generic average.',
      'The comparison goes wrong when the two rates being compared are not the same half of the bill. This page sets out what the calculation counts, what it deliberately leaves out, and the handful of things that make a twelve-month projection drift.',
    ],
    sections: [
      {
        heading: 'Supply, Delivery and Which Half You Are Comparing',
        paragraphs: [
          'An electricity bill has two halves. Supply is the electricity itself, and in a deregulated state that is the half you can shop for. Delivery is the cost of moving it to your meter over the poles and wires your local utility owns, along with metering and the utility\'s fixed customer charge. Switching supplier changes the first half and leaves the second exactly as it was.',
          'Delivery rates are not quoted competitively. They are set in a tariff filed with the state regulator, and they do not change according to which company sells you the supply half. That is why the calculator works on the supply rate alone. Adding delivery would put the same figure on both sides of the subtraction: the difference would not move, it would only look smaller as a share of the total.',
          'In Texas the retailer bills for both halves, so the delivery charge set by the TDU arrives on the same bill as the energy. In the other states we cover the utility usually sends the bill and shows supply as its own line. Either way, the figure the calculator wants is the one attached to the supply half, in cents per kWh.',
        ],
      },
      {
        heading: 'Why the Answer Is Annual',
        paragraphs: [
          'A month is the wrong unit for this question, because usage is not flat across the year. Cooling load concentrates in summer; in a home with electric heat the load concentrates in winter instead. Under a fixed per-kWh rate the heaviest months carry the most weight, so a rate difference measured against a mild spring bill understates what the same difference does over twelve months. Multiplying annual usage by the rate difference weights every kWh once, which is what makes the arithmetic come out right.',
          'This is also why the usage figure you enter matters more than it looks. If your bill or your online utility account shows a twelve-month usage history, take the total and divide it by twelve. Multiplying a single August bill by twelve overstates a cooling-dominated home; doing the same with a shoulder-season bill understates it. With only one bill to hand, the estimate inherits that bill\'s season.',
        ],
      },
      {
        heading: 'Base Charges and the Break-Even Point',
        paragraphs: [
          'A plan is rarely one number. A monthly base charge is spread across whatever you used that month, so it raises the effective rate most at low usage and least at high usage. Two plans advertised at the same rate per kWh can differ by the whole of the base charge, and the one that wins at high usage can lose at low usage. Usage credits work the same way in reverse, and more sharply: a credit that applies only at or above a threshold creates a cliff, so a month that lands just under it can cost more than a month that lands just over.',
          'The consequence for the calculator is simple. A rate difference is like for like only if both sides are effective rates at your own usage rather than headline rates. The plan\'s disclosure document — the Electricity Facts Label in Texas, the terms of service or disclosure statement elsewhere — is where the base charge and any usage credits are written down. That is the document to read before trusting a difference of a few tenths of a cent.',
        ],
      },
      {
        heading: 'What the Catalog Behind the Estimate Holds',
        paragraphs: [
          'The plans on the other side of the comparison are the ones Electric Scouts actually tracks: {PLAN_COUNT} active plans from {SUPPLIER_COUNT} suppliers across {STATE_COUNT} deregulated states ({AS_OF}). The cheapest rate in that catalog is {MIN_RATE} and the dearest is {MAX_RATE}. That is not a saving anyone is promised: the plans at either end sit in different states, on different terms, and some of them are sold to businesses rather than homes.',
          '{FIXED_PLAN_COUNT} of the tracked plans are fixed-rate and {VARIABLE_PLAN_COUNT} are variable; {NO_ETF_COUNT} carry no early termination fee. Contract terms run from {MIN_TERM} to {MAX_TERM} months. Where a term is shorter or longer than a year, the annual figure holds only while the contract does, and what replaces it at the end is a separate calculation.',
        ],
      },
      {
        heading: 'The Baseline Moves Too',
        paragraphs: [
          'The estimate compares a plan you could buy against the rate you are paying now, and it assumes the rate you are paying now stands still. Often it does not. If you are on your utility\'s default or standard offer service, that rate is reset on a schedule the regulator sets rather than being fixed for as long as you stay on it, so the baseline can move between the day you run the numbers and the day a switch takes effect. Some states publish that default rate precisely so it can be held against competitive offers. Texas is the exception among the states we cover: there is no utility supply rate to fall back on there, so every household is already buying from a retailer whether or not it remembers choosing one.',
          'A fixed contract has the same problem at its end date. A contract that expires often continues month to month at a holdover rate the contract permits but does not fix, and the annual projection stops describing your bill from that date. If you are inside a term with an early termination fee, treat the fee as a one-off subtraction from a twelve-month figure rather than a recurring cost, and check the contract for whether and when it stops applying before the term ends.',
        ],
      },
      {
        heading: 'Questions About the Estimate',
        faqs: [
          {
            question: 'How many months of usage should I enter?',
            answer: 'Enter an average built from twelve months if you can get it. Bills and online utility accounts often show a usage history you can total and divide by twelve. A single month is enough to run the calculator, but it carries that month\'s season into the annual figure.',
          },
          {
            question: 'Should I include delivery charges in the rate I enter?',
            answer: 'No. Enter the supply rate only. Delivery is set by your utility in a tariff filed with the state regulator and does not change according to who sells you supply, so including it adds the same amount to both sides of the comparison without changing the difference.',
          },
          {
            question: 'What if I am on my utility\'s default service rather than a contract?',
            answer: 'Use the default supply rate from your bill as your current rate. Bear in mind it is not fixed the way a contract rate is: regulators reset default service on a set schedule, so the baseline you compared against can change part-way through the year even if you do nothing.',
          },
          {
            question: 'Does the estimate subtract my early termination fee?',
            answer: 'No. The fee is a one-off charge on a contract you are leaving, not a recurring cost, so it does not belong in a per-kWh comparison. Subtract it once from the twelve-month figure to see whether switching still comes out ahead.',
          },
          {
            question: 'Why does the calculator use my own rate instead of my state\'s average?',
            answer: 'A state average mixes fixed and variable plans sold on different terms and at different usage levels, and it is not a rate anyone is billed. Your own supply rate and your own usage are the only baseline that describes your bill.',
          },
        ],
      },
      {
        heading: 'Related Reading',
        links: [
          [
            '/residential-electricity',
            'How buying electricity for a home works',
          ],
          [
            '/all-states',
            'Every deregulated state we cover',
          ],
          [
            '/learning-center',
            'Guides on contracts, terms and billing',
          ],
          [
            '/faq',
            'Short answers to common switching questions',
          ],
        ],
      },
    ],
  },
};

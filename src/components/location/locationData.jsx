// Location data for state and city pages
// Powers state and city pages with localized insights

export const LOCATION_DATA = {
  // Texas
  TX: {
    state: "Texas",
    marketInsights: {
      description: "Texas has the most competitive deregulated electricity market in the United States, with over 100 retail electric providers (REPs) serving 85% of the state's residential customers.",
      keyFacts: [
        "Deregulated since 2002 under Senate Bill 7",
        "Average residential rate: 13.1¢/kWh (varies by region)",
        "Over 100 retail electric providers competing for your business",
        "Customers can switch providers anytime without penalty",
        "Average savings potential: $300-$800 annually by comparing plans"
      ],
      marketType: "Fully Deregulated",
      averageSavings: "$600",
      providerCount: "100+"
    },
    topProviders: [
      { name: "TXU Energy", marketShare: "18%", avgRate: "12.8¢/kWh", specialty: "Fixed-rate plans" },
      { name: "Reliant Energy", marketShare: "15%", avgRate: "13.2¢/kWh", specialty: "Smart home integration" },
      { name: "Gexa Energy", marketShare: "12%", avgRate: "12.5¢/kWh", specialty: "100% renewable options" },
      { name: "Direct Energy", marketShare: "10%", avgRate: "13.0¢/kWh", specialty: "Long-term contracts" },
      { name: "Green Mountain Energy", marketShare: "8%", avgRate: "13.5¢/kWh", specialty: "100% renewable energy" }
    ],
    cities: {
      "Houston": {
        population: "2.3 million",
        avgRate: "12.9¢/kWh",
        avgUsage: "1,200 kWh/month",
        insights: "Houston's hot, humid climate drives high summer electricity usage, with many households consuming over 2,000 kWh in July and August. Residents save significantly by choosing plans with free nights or weekends during peak AC season.",
        utilityCompany: "CenterPoint Energy",
        topZips: ["77002", "77019", "77024", "77056", "77063"]
      },
      "Dallas": {
        population: "1.3 million",
        avgRate: "13.1¢/kWh",
        avgUsage: "1,150 kWh/month",
        insights: "Dallas customers benefit from intense competition among providers. Time-of-use plans often provide significant savings for customers who can shift usage to off-peak hours.",
        utilityCompany: "Oncor Electric Delivery",
        topZips: ["75201", "75204", "75205", "75219", "75225"]
      },
      "Austin": {
        population: "978,000",
        avgRate: "11.8¢/kWh",
        avgUsage: "1,100 kWh/month",
        insights: "Austin Energy serves most of the city, but some areas have deregulated options. Austin residents show strong preference for renewable energy plans.",
        utilityCompany: "Austin Energy / Oncor",
        topZips: ["78701", "78702", "78703", "78704", "78731"]
      },
      "San Antonio": {
        population: "1.5 million",
        avgRate: "11.5¢/kWh",
        avgUsage: "1,180 kWh/month",
        insights: "Most of San Antonio is served by CPS Energy (not deregulated), but surrounding areas have competitive options with rates 10-15% lower than the municipal utility.",
        utilityCompany: "CPS Energy / Others",
        topZips: ["78201", "78202", "78209", "78216", "78232"]
      },
      "Fort Worth": {
        population: "935,000",
        avgRate: "13.0¢/kWh",
        avgUsage: "1,160 kWh/month",
        insights: "Fort Worth's deregulated areas offer excellent plan variety. Fixed-rate 24-month plans provide best protection against price volatility.",
        utilityCompany: "Oncor Electric Delivery",
        topZips: ["76102", "76104", "76107", "76109", "76116"]
      },
      "Arlington": {
        population: "394,000",
        avgRate: "12.7¢/kWh",
        avgUsage: "1,140 kWh/month",
        insights: "Arlington residents enjoy some of the most competitive electricity rates in the DFW metroplex, with 50+ providers offering plans starting under 10¢/kWh.",
        utilityCompany: "Oncor Electric Delivery",
        topZips: ["76010", "76011", "76012", "76013", "76014"]
      },
      "Plano": {
        population: "285,000",
        avgRate: "12.5¢/kWh",
        avgUsage: "1,120 kWh/month",
        insights: "Plano's affluent households tend toward premium plans with smart home features. However, basic fixed-rate plans can save families $400-$600 annually.",
        utilityCompany: "Oncor Electric Delivery",
        topZips: ["75023", "75024", "75025", "75074", "75075"]
      },
      "Corpus Christi": {
        population: "317,000",
        avgRate: "13.4¢/kWh",
        avgUsage: "1,250 kWh/month",
        insights: "Corpus Christi's coastal climate means high cooling costs year-round. Residents benefit from comparing plans with tiered pricing that rewards moderate usage.",
        utilityCompany: "AEP Texas",
        topZips: ["78401", "78404", "78405", "78411", "78412"]
      },
      "El Paso": {
        population: "681,000",
        avgRate: "12.2¢/kWh",
        avgUsage: "1,050 kWh/month",
        insights: "El Paso has limited deregulation compared to other Texas cities. However, residents in deregulated zones can find rates 15-20% below the default utility rate.",
        utilityCompany: "El Paso Electric",
        topZips: ["79901", "79902", "79903", "79912", "79925"]
      },
      "Lubbock": {
        population: "264,000",
        avgRate: "11.9¢/kWh",
        avgUsage: "1,080 kWh/month",
        insights: "Lubbock recently opened its electricity market to competition, giving residents new options to compare rates and potentially save hundreds annually.",
        utilityCompany: "Lubbock Power & Light / Others",
        topZips: ["79401", "79404", "79410", "79413", "79416"]
      },
      "Irving": {
        population: "256,000",
        avgRate: "12.6¢/kWh",
        avgUsage: "1,100 kWh/month",
        insights: "Irving's central DFW location means residents have access to the full range of competitive electricity providers, with rates often 10-15% below the state average.",
        utilityCompany: "Oncor Electric Delivery",
        topZips: ["75038", "75039", "75060", "75061", "75062"]
      },
      "Frisco": {
        population: "220,000",
        avgRate: "12.3¢/kWh",
        avgUsage: "1,180 kWh/month",
        insights: "Frisco is one of the fastest-growing cities in Texas, and new homeowners can save significantly by comparing electricity plans before their move-in date.",
        utilityCompany: "Oncor Electric Delivery",
        topZips: ["75033", "75034", "75035", "75036"]
      },
      "McKinney": {
        population: "199,000",
        avgRate: "12.4¢/kWh",
        avgUsage: "1,150 kWh/month",
        insights: "McKinney residents benefit from strong provider competition in the Collin County area, with many providers offering exclusive rates for the region.",
        utilityCompany: "Oncor Electric Delivery",
        topZips: ["75069", "75070", "75071", "75072"]
      },
      "Killeen": {
        population: "156,000",
        avgRate: "13.2¢/kWh",
        avgUsage: "1,200 kWh/month",
        insights: "Killeen's military community benefits from flexible month-to-month plans that don't penalize for early termination due to PCS orders.",
        utilityCompany: "Oncor Electric Delivery",
        topZips: ["76541", "76542", "76543", "76544", "76549"]
      },
      "Midland": {
        population: "146,000",
        avgRate: "12.0¢/kWh",
        avgUsage: "1,100 kWh/month",
        insights: "Midland's energy-industry workforce is particularly savvy about electricity markets. Fixed-rate plans are popular for budget predictability.",
        utilityCompany: "Oncor Electric Delivery",
        topZips: ["79701", "79703", "79705", "79706", "79707"]
      }
    }
  },

  // Illinois
  IL: {
    state: "Illinois",
    marketInsights: {
      description: "Illinois deregulated its electricity market in 1997, giving residential and business customers throughout the state the power to choose their electricity supplier.",
      keyFacts: [
        "Deregulated since 1997 under the Electric Service Customer Choice Act",
        "Average residential rate: 14.3¢/kWh",
        "40+ alternative retail electric suppliers compete statewide",
        "ComEd and Ameren serve as default utilities for delivery",
        "Customers can switch suppliers with no interruption in service"
      ],
      marketType: "Fully Deregulated",
      averageSavings: "$450",
      providerCount: "40+"
    },
    topProviders: [
      { name: "ComEd", marketShare: "35%", avgRate: "14.1¢/kWh", specialty: "Default utility provider" },
      { name: "Constellation Energy", marketShare: "15%", avgRate: "13.8¢/kWh", specialty: "Green energy options" },
      { name: "Direct Energy", marketShare: "12%", avgRate: "13.5¢/kWh", specialty: "Fixed-rate plans" },
      { name: "Ambit Energy", marketShare: "8%", avgRate: "14.0¢/kWh", specialty: "Rewards programs" },
      { name: "MC Squared Energy", marketShare: "6%", avgRate: "13.2¢/kWh", specialty: "Low introductory rates" }
    ],
    cities: {
      "Chicago": {
        population: "2.7 million",
        avgRate: "14.5¢/kWh",
        avgUsage: "750 kWh/month",
        insights: "Chicago residents pay some of the highest electricity rates in Illinois due to urban demand. Comparing plans can save the average household $300-$500 per year, especially with fixed-rate winter plans.",
        utilityCompany: "ComEd",
        topZips: ["60601", "60602", "60603", "60604", "60605"]
      },
      "Aurora": {
        population: "180,000",
        avgRate: "13.8¢/kWh",
        avgUsage: "800 kWh/month",
        insights: "Aurora's suburban households use more electricity than Chicago apartments. Families with higher usage benefit most from tiered plans that offer lower per-kWh rates at higher consumption levels.",
        utilityCompany: "ComEd",
        topZips: ["60502", "60503", "60504", "60505", "60506"]
      },
      "Naperville": {
        population: "149,000",
        avgRate: "13.6¢/kWh",
        avgUsage: "850 kWh/month",
        insights: "Naperville consistently ranks among Illinois' most desirable suburbs. Residents here tend to prefer premium plans with smart home integration and renewable energy options.",
        utilityCompany: "ComEd",
        topZips: ["60540", "60563", "60564", "60565"]
      },
      "Rockford": {
        population: "148,000",
        avgRate: "14.2¢/kWh",
        avgUsage: "780 kWh/month",
        insights: "Rockford's industrial heritage means many homes are older with less efficient insulation. Energy audits combined with competitive rate shopping can yield savings of $400+ annually.",
        utilityCompany: "ComEd",
        topZips: ["61101", "61102", "61103", "61104", "61107"]
      },
      "Joliet": {
        population: "150,000",
        avgRate: "14.0¢/kWh",
        avgUsage: "820 kWh/month",
        insights: "Joliet's growing population has attracted more electricity providers to the area, increasing competition and driving down rates for consumers.",
        utilityCompany: "ComEd",
        topZips: ["60431", "60432", "60433", "60435", "60436"]
      },
      "Springfield": {
        population: "114,000",
        avgRate: "13.5¢/kWh",
        avgUsage: "900 kWh/month",
        insights: "As the state capital, Springfield is served by Ameren Illinois rather than ComEd. Residents have different supplier options and should compare rates specific to the Ameren service territory.",
        utilityCompany: "Ameren Illinois",
        topZips: ["62701", "62702", "62703", "62704", "62707"]
      },
      "Peoria": {
        population: "113,000",
        avgRate: "13.9¢/kWh",
        avgUsage: "870 kWh/month",
        insights: "Peoria's extreme temperature swings between summer and winter mean electricity bills can vary dramatically. Budget billing combined with competitive rates helps smooth out costs.",
        utilityCompany: "Ameren Illinois",
        topZips: ["61602", "61603", "61604", "61605", "61606"]
      },
      "Elgin": {
        population: "112,000",
        avgRate: "13.7¢/kWh",
        avgUsage: "810 kWh/month",
        insights: "Elgin's diverse community benefits from multilingual provider support. Many suppliers now offer Spanish-language customer service and billing.",
        utilityCompany: "ComEd",
        topZips: ["60120", "60123", "60124"]
      },
      "Champaign": {
        population: "88,000",
        avgRate: "13.3¢/kWh",
        avgUsage: "750 kWh/month",
        insights: "Champaign's large student population creates demand for flexible, no-deposit electricity plans. Short-term plans aligned with academic semesters are popular.",
        utilityCompany: "Ameren Illinois",
        topZips: ["61820", "61821", "61822"]
      },
      "Schaumburg": {
        population: "78,000",
        avgRate: "13.5¢/kWh",
        avgUsage: "830 kWh/month",
        insights: "Schaumburg's mix of residential and commercial properties means providers offer diverse plan types. Residential customers can often find rates below the ComEd default.",
        utilityCompany: "ComEd",
        topZips: ["60159", "60168", "60173", "60193", "60194"]
      }
    }
  },

  // Ohio
  OH: {
    state: "Ohio",
    marketInsights: {
      description: "Ohio's electricity market has been deregulated since 2001, allowing customers in all major cities to choose from competitive retail electric suppliers.",
      keyFacts: [
        "Deregulated since 2001 under Senate Bill 3",
        "Average residential rate: 13.8¢/kWh",
        "30+ certified retail electric suppliers",
        "All major utilities offer customer choice programs",
        "Ohio Public Utilities Commission oversees the market"
      ],
      marketType: "Fully Deregulated",
      averageSavings: "$400",
      providerCount: "30+"
    },
    topProviders: [
      { name: "AEP Ohio", marketShare: "25%", avgRate: "13.5¢/kWh", specialty: "Default utility provider" },
      { name: "Duke Energy Ohio", marketShare: "20%", avgRate: "13.2¢/kWh", specialty: "Reliable service" },
      { name: "IGS Energy", marketShare: "10%", avgRate: "12.8¢/kWh", specialty: "Fixed-rate plans" },
      { name: "Constellation Energy", marketShare: "8%", avgRate: "13.0¢/kWh", specialty: "Green energy" },
      { name: "Direct Energy", marketShare: "7%", avgRate: "12.9¢/kWh", specialty: "Bundle deals" }
    ],
    cities: {
      "Columbus": {
        population: "905,000",
        avgRate: "13.4¢/kWh",
        avgUsage: "850 kWh/month",
        insights: "Columbus is Ohio's largest city and fastest-growing metro. The competitive electricity market here offers some of the best rates in the Midwest, with savings of $200-$400 per year.",
        utilityCompany: "AEP Ohio",
        topZips: ["43201", "43202", "43204", "43205", "43206"]
      },
      "Cleveland": {
        population: "372,000",
        avgRate: "14.1¢/kWh",
        avgUsage: "820 kWh/month",
        insights: "Cleveland's cold winters drive significant heating costs. Residents who pair competitive electricity rates with energy-efficient heating can save substantially.",
        utilityCompany: "Cleveland Electric Illuminating",
        topZips: ["44101", "44102", "44103", "44104", "44106"]
      },
      "Cincinnati": {
        population: "309,000",
        avgRate: "13.0¢/kWh",
        avgUsage: "880 kWh/month",
        insights: "Cincinnati benefits from Duke Energy's service territory, which tends to have lower base delivery charges. This makes competitive supply rates even more impactful.",
        utilityCompany: "Duke Energy Ohio",
        topZips: ["45201", "45202", "45203", "45204", "45206"]
      },
      "Toledo": {
        population: "270,000",
        avgRate: "13.6¢/kWh",
        avgUsage: "800 kWh/month",
        insights: "Toledo's proximity to Lake Erie moderates summer temperatures but brings harsh winters. Year-round fixed-rate plans are popular for budget predictability.",
        utilityCompany: "Toledo Edison",
        topZips: ["43601", "43604", "43605", "43606", "43607"]
      },
      "Akron": {
        population: "190,000",
        avgRate: "13.8¢/kWh",
        avgUsage: "810 kWh/month",
        insights: "Akron's revitalizing economy has attracted new electricity providers to the region, increasing competition and lowering rates for residential customers.",
        utilityCompany: "Ohio Edison",
        topZips: ["44301", "44302", "44303", "44304", "44305"]
      },
      "Dayton": {
        population: "137,000",
        avgRate: "13.2¢/kWh",
        avgUsage: "840 kWh/month",
        insights: "Dayton residents served by Dayton Power & Light have access to Ohio's competitive supplier market. Many find savings of 15-20% by switching from the default rate.",
        utilityCompany: "Dayton Power & Light",
        topZips: ["45401", "45402", "45403", "45404", "45405"]
      },
      "Canton": {
        population: "71,000",
        avgRate: "13.5¢/kWh",
        avgUsage: "790 kWh/month",
        insights: "Canton's moderate electricity usage makes it an ideal market for fixed-rate plans that lock in savings without requiring high consumption levels.",
        utilityCompany: "Ohio Edison",
        topZips: ["44701", "44702", "44703", "44704", "44705"]
      },
      "Youngstown": {
        population: "60,000",
        avgRate: "14.0¢/kWh",
        avgUsage: "770 kWh/month",
        insights: "Youngstown's older housing stock means many homes benefit from energy efficiency upgrades paired with competitive electricity rates.",
        utilityCompany: "Ohio Edison",
        topZips: ["44501", "44502", "44503", "44504", "44505"]
      }
    }
  },

  // Pennsylvania
  PA: {
    state: "Pennsylvania",
    marketInsights: {
      description: "Pennsylvania was one of the first states to deregulate its electricity market in 1996, offering residents the ability to choose their electricity generation supplier.",
      keyFacts: [
        "Deregulated since 1996 under the Electricity Generation Customer Choice Act",
        "Average residential rate: 16.5¢/kWh",
        "50+ licensed electricity generation suppliers",
        "11 electric distribution companies serve the state",
        "PA Public Utility Commission provides rate comparison tools"
      ],
      marketType: "Fully Deregulated",
      averageSavings: "$500",
      providerCount: "50+"
    },
    topProviders: [
      { name: "PECO Energy", marketShare: "22%", avgRate: "16.0¢/kWh", specialty: "Southeastern PA utility" },
      { name: "PPL Electric", marketShare: "18%", avgRate: "15.5¢/kWh", specialty: "Central/Eastern PA" },
      { name: "Constellation Energy", marketShare: "10%", avgRate: "14.8¢/kWh", specialty: "Green energy plans" },
      { name: "Direct Energy", marketShare: "8%", avgRate: "15.2¢/kWh", specialty: "Fixed-rate plans" },
      { name: "Clearview Energy", marketShare: "5%", avgRate: "14.5¢/kWh", specialty: "Low-cost options" }
    ],
    cities: {
      "Philadelphia": {
        population: "1.6 million",
        avgRate: "16.8¢/kWh",
        avgUsage: "750 kWh/month",
        insights: "Philadelphia's dense urban environment and aging infrastructure contribute to higher rates. Residents can save $400-$600 annually by switching from PECO's default rate to a competitive supplier.",
        utilityCompany: "PECO Energy",
        topZips: ["19101", "19102", "19103", "19104", "19106"]
      },
      "Pittsburgh": {
        population: "302,000",
        avgRate: "15.2¢/kWh",
        avgUsage: "800 kWh/month",
        insights: "Pittsburgh's tech-driven economy has attracted innovative energy providers offering smart home plans and time-of-use pricing that rewards off-peak consumption.",
        utilityCompany: "Duquesne Light",
        topZips: ["15201", "15203", "15206", "15210", "15213"]
      },
      "Allentown": {
        population: "126,000",
        avgRate: "15.8¢/kWh",
        avgUsage: "780 kWh/month",
        insights: "Allentown's Lehigh Valley location means residents have access to both PPL and Met-Ed service territories, each with different competitive supplier options.",
        utilityCompany: "PPL Electric",
        topZips: ["18101", "18102", "18103", "18104", "18109"]
      },
      "Reading": {
        population: "95,000",
        avgRate: "16.2¢/kWh",
        avgUsage: "760 kWh/month",
        insights: "Reading residents face some of Pennsylvania's highest rates. Comparing suppliers is especially impactful here, with potential savings of $500+ per year.",
        utilityCompany: "Met-Ed",
        topZips: ["19601", "19602", "19604", "19605", "19606"]
      },
      "Erie": {
        population: "94,000",
        avgRate: "14.8¢/kWh",
        avgUsage: "820 kWh/month",
        insights: "Erie's lake-effect climate drives high winter heating costs. Residents benefit from fixed-rate plans that protect against seasonal price spikes.",
        utilityCompany: "Penelec",
        topZips: ["16501", "16502", "16503", "16504", "16505"]
      },
      "Scranton": {
        population: "77,000",
        avgRate: "15.5¢/kWh",
        avgUsage: "790 kWh/month",
        insights: "Scranton's northeastern Pennsylvania location means cold winters and moderate summers. Annual savings of $300-$500 are common when switching from default utility rates.",
        utilityCompany: "PPL Electric",
        topZips: ["18501", "18503", "18504", "18505", "18508"]
      },
      "Bethlehem": {
        population: "76,000",
        avgRate: "15.6¢/kWh",
        avgUsage: "770 kWh/month",
        insights: "Bethlehem's revitalized economy and growing population have attracted more competitive electricity suppliers to the Lehigh Valley region.",
        utilityCompany: "PPL Electric",
        topZips: ["18015", "18016", "18017", "18018", "18020"]
      },
      "Lancaster": {
        population: "63,000",
        avgRate: "15.3¢/kWh",
        avgUsage: "810 kWh/month",
        insights: "Lancaster County's mix of urban and rural areas means electricity usage patterns vary widely. Comparing plans based on actual usage is key to maximizing savings.",
        utilityCompany: "PPL Electric",
        topZips: ["17601", "17602", "17603", "17604"]
      }
    }
  },

  // New York
  NY: {
    state: "New York",
    marketInsights: {
      description: "New York deregulated its electricity market in the late 1990s, allowing residential customers to choose their energy supply company (ESCO) while utilities continue to deliver power.",
      keyFacts: [
        "Deregulated since 1998 under restructuring orders",
        "Average residential rate: 22.5¢/kWh (highest in continental US)",
        "60+ Energy Service Companies (ESCOs) operate statewide",
        "Con Edison serves NYC; National Grid, NYSEG, and others serve upstate",
        "NY Public Service Commission oversees ESCO market"
      ],
      marketType: "Fully Deregulated",
      averageSavings: "$550",
      providerCount: "60+"
    },
    topProviders: [
      { name: "Con Edison", marketShare: "30%", avgRate: "24.0¢/kWh", specialty: "NYC default utility" },
      { name: "National Grid", marketShare: "20%", avgRate: "20.5¢/kWh", specialty: "Upstate NY utility" },
      { name: "Constellation Energy", marketShare: "10%", avgRate: "19.8¢/kWh", specialty: "Green energy plans" },
      { name: "Direct Energy", marketShare: "8%", avgRate: "20.2¢/kWh", specialty: "Fixed-rate plans" },
      { name: "NYSEG", marketShare: "7%", avgRate: "19.5¢/kWh", specialty: "Central NY utility" }
    ],
    cities: {
      "New York City": {
        population: "8.3 million",
        avgRate: "24.5¢/kWh",
        avgUsage: "600 kWh/month",
        insights: "NYC has the highest electricity rates in the continental US. Even small rate reductions translate to significant savings. Apartment dwellers should compare ESCO rates against Con Edison's default supply charge.",
        utilityCompany: "Con Edison",
        topZips: ["10001", "10002", "10003", "10004", "10005"]
      },
      "Buffalo": {
        population: "278,000",
        avgRate: "18.5¢/kWh",
        avgUsage: "700 kWh/month",
        insights: "Buffalo's harsh winters drive high energy costs. Residents benefit from comparing both electricity and natural gas rates, as many ESCOs offer bundled savings.",
        utilityCompany: "National Grid",
        topZips: ["14201", "14202", "14203", "14204", "14206"]
      },
      "Rochester": {
        population: "211,000",
        avgRate: "19.2¢/kWh",
        avgUsage: "680 kWh/month",
        insights: "Rochester's moderate electricity usage and competitive ESCO market make it one of the best cities in New York for finding savings through rate comparison.",
        utilityCompany: "Rochester Gas & Electric",
        topZips: ["14604", "14605", "14606", "14607", "14608"]
      },
      "Syracuse": {
        population: "148,000",
        avgRate: "18.8¢/kWh",
        avgUsage: "720 kWh/month",
        insights: "Syracuse's central New York location means access to National Grid's service territory with multiple competitive ESCO options for supply savings.",
        utilityCompany: "National Grid",
        topZips: ["13201", "13202", "13203", "13204", "13205"]
      },
      "Albany": {
        population: "99,000",
        avgRate: "19.5¢/kWh",
        avgUsage: "690 kWh/month",
        insights: "As the state capital, Albany has a stable electricity market with consistent ESCO competition. Government employees often benefit from community choice aggregation programs.",
        utilityCompany: "National Grid",
        topZips: ["12201", "12202", "12203", "12204", "12205"]
      },
      "Yonkers": {
        population: "200,000",
        avgRate: "23.8¢/kWh",
        avgUsage: "620 kWh/month",
        insights: "Yonkers residents in the Con Edison territory face NYC-level rates. Comparing ESCO options can yield savings of $400-$700 annually.",
        utilityCompany: "Con Edison",
        topZips: ["10701", "10702", "10703", "10704", "10705"]
      },
      "Jersey City": {
        population: "292,000",
        avgRate: "17.5¢/kWh",
        avgUsage: "650 kWh/month",
        insights: "Jersey City's proximity to NYC attracts competitive energy suppliers. Residents enjoy lower rates than Manhattan while having access to many of the same ESCO options.",
        utilityCompany: "PSE&G",
        topZips: ["07302", "07304", "07305", "07306", "07307"]
      },
      "New Haven": {
        population: "134,000",
        avgRate: "26.2¢/kWh",
        avgUsage: "680 kWh/month",
        insights: "New Haven's university-driven economy creates demand for flexible electricity plans. Students and renters benefit from month-to-month options without long-term commitments.",
        utilityCompany: "United Illuminating",
        topZips: ["06510", "06511", "06512", "06513", "06515"]
      }
    }
  },

  // New Jersey
  NJ: {
    state: "New Jersey",
    marketInsights: {
      description: "New Jersey's Electric Discount and Energy Competition Act of 1999 opened the electricity market to competition, allowing all residential customers to choose their electricity supplier.",
      keyFacts: [
        "Deregulated since 1999 under the Electric Discount and Energy Competition Act",
        "Average residential rate: 17.8¢/kWh",
        "35+ licensed third-party electricity suppliers",
        "PSE&G, JCP&L, ACE, and RECO serve as distribution utilities",
        "NJ Board of Public Utilities provides consumer protection"
      ],
      marketType: "Fully Deregulated",
      averageSavings: "$480",
      providerCount: "35+"
    },
    topProviders: [
      { name: "PSE&G", marketShare: "28%", avgRate: "17.5¢/kWh", specialty: "Largest NJ utility" },
      { name: "JCP&L", marketShare: "18%", avgRate: "16.8¢/kWh", specialty: "Central NJ utility" },
      { name: "Constellation Energy", marketShare: "10%", avgRate: "16.2¢/kWh", specialty: "Green energy" },
      { name: "Direct Energy", marketShare: "8%", avgRate: "16.5¢/kWh", specialty: "Fixed-rate plans" },
      { name: "Clearview Energy", marketShare: "5%", avgRate: "15.8¢/kWh", specialty: "Low-cost options" }
    ],
    cities: {
      "Newark": {
        population: "311,000",
        avgRate: "18.2¢/kWh",
        avgUsage: "680 kWh/month",
        insights: "Newark's urban density and aging infrastructure contribute to higher electricity costs. Residents can save $350-$500 annually by comparing third-party supplier rates against PSE&G's default.",
        utilityCompany: "PSE&G",
        topZips: ["07101", "07102", "07103", "07104", "07105"]
      },
      "Paterson": {
        population: "159,000",
        avgRate: "17.8¢/kWh",
        avgUsage: "700 kWh/month",
        insights: "Paterson's diverse community benefits from multilingual electricity provider options. Many suppliers offer Spanish-language support and community-specific plans.",
        utilityCompany: "PSE&G",
        topZips: ["07501", "07502", "07503", "07504", "07505"]
      },
      "Edison": {
        population: "107,000",
        avgRate: "17.0¢/kWh",
        avgUsage: "750 kWh/month",
        insights: "Edison's suburban households use more electricity than urban NJ averages. Families with higher usage see the biggest savings from competitive rate shopping.",
        utilityCompany: "JCP&L",
        topZips: ["08817", "08818", "08820", "08837"]
      },
      "Trenton": {
        population: "90,000",
        avgRate: "17.5¢/kWh",
        avgUsage: "710 kWh/month",
        insights: "As the state capital, Trenton has a stable electricity market. Government employees and state workers can benefit from community choice aggregation programs.",
        utilityCompany: "PSE&G",
        topZips: ["08601", "08602", "08608", "08609", "08611"]
      },
      "Camden": {
        population: "74,000",
        avgRate: "17.2¢/kWh",
        avgUsage: "690 kWh/month",
        insights: "Camden residents in the ACE service territory have access to competitive suppliers that can offer rates 10-15% below the default utility price.",
        utilityCompany: "Atlantic City Electric",
        topZips: ["08101", "08102", "08103", "08104", "08105"]
      },
      "Hoboken": {
        population: "60,000",
        avgRate: "18.5¢/kWh",
        avgUsage: "550 kWh/month",
        insights: "Hoboken's young professional population favors green energy plans and smart home integration. Despite smaller apartments, competitive rates still yield meaningful savings.",
        utilityCompany: "PSE&G",
        topZips: ["07030"]
      }
    }
  },

  // Maryland
  MD: {
    state: "Maryland",
    marketInsights: {
      description: "Maryland deregulated its electricity market in 1999, allowing all residential customers to choose their electricity supplier through the state's competitive market.",
      keyFacts: [
        "Deregulated since 1999 under the Electric Customer Choice Act",
        "Average residential rate: 15.2¢/kWh",
        "25+ licensed electricity suppliers",
        "BGE, Pepco, Delmarva Power, and Potomac Edison serve as utilities",
        "MD Public Service Commission provides rate comparison tools"
      ],
      marketType: "Fully Deregulated",
      averageSavings: "$420",
      providerCount: "25+"
    },
    topProviders: [
      { name: "BGE (Baltimore Gas & Electric)", marketShare: "30%", avgRate: "15.0¢/kWh", specialty: "Central MD utility" },
      { name: "Pepco", marketShare: "22%", avgRate: "14.8¢/kWh", specialty: "DC suburbs utility" },
      { name: "Constellation Energy", marketShare: "12%", avgRate: "14.2¢/kWh", specialty: "Green energy" },
      { name: "Direct Energy", marketShare: "8%", avgRate: "14.5¢/kWh", specialty: "Fixed-rate plans" },
      { name: "Clearview Energy", marketShare: "5%", avgRate: "13.8¢/kWh", specialty: "Budget plans" }
    ],
    cities: {
      "Baltimore": {
        population: "585,000",
        avgRate: "15.5¢/kWh",
        avgUsage: "850 kWh/month",
        insights: "Baltimore's hot summers and cold winters create year-round electricity demand. Comparing BGE's standard offer against competitive suppliers can save households $300-$500 annually.",
        utilityCompany: "BGE",
        topZips: ["21201", "21202", "21205", "21206", "21209"]
      },
      "Columbia": {
        population: "104,000",
        avgRate: "14.8¢/kWh",
        avgUsage: "900 kWh/month",
        insights: "Columbia's planned community features many energy-efficient homes, but residents still benefit from comparing electricity rates to maximize savings on their moderate usage.",
        utilityCompany: "BGE",
        topZips: ["21044", "21045", "21046"]
      },
      "Germantown": {
        population: "91,000",
        avgRate: "14.5¢/kWh",
        avgUsage: "880 kWh/month",
        insights: "Germantown residents in the Pepco service territory have access to competitive suppliers offering rates 10-20% below the default utility price.",
        utilityCompany: "Pepco",
        topZips: ["20874", "20876"]
      },
      "Silver Spring": {
        population: "81,000",
        avgRate: "14.9¢/kWh",
        avgUsage: "780 kWh/month",
        insights: "Silver Spring's proximity to DC means residents have access to a competitive electricity market with many suppliers targeting the affluent suburban demographic.",
        utilityCompany: "Pepco",
        topZips: ["20901", "20902", "20903", "20904", "20910"]
      },
      "Annapolis": {
        population: "40,000",
        avgRate: "15.0¢/kWh",
        avgUsage: "860 kWh/month",
        insights: "As Maryland's capital, Annapolis has a stable electricity market. Waterfront properties with higher cooling needs benefit most from competitive rate shopping.",
        utilityCompany: "BGE",
        topZips: ["21401", "21402", "21403", "21404", "21405"]
      },
      "Frederick": {
        population: "78,000",
        avgRate: "14.6¢/kWh",
        avgUsage: "870 kWh/month",
        insights: "Frederick's growing population in the Potomac Edison territory has attracted new competitive suppliers, increasing options and driving down rates.",
        utilityCompany: "Potomac Edison",
        topZips: ["21701", "21702", "21703", "21704"]
      }
    }
  },

  // Massachusetts
  MA: {
    state: "Massachusetts",
    marketInsights: {
      description: "Massachusetts restructured its electricity market in 1997, allowing all residential customers to choose their competitive electricity supplier while utilities handle delivery.",
      keyFacts: [
        "Deregulated since 1997 under the Restructuring Act",
        "Average residential rate: 25.8¢/kWh (among highest in US)",
        "20+ competitive electricity suppliers",
        "National Grid, Eversource, and Unitil serve as distribution utilities",
        "MA Department of Public Utilities oversees the market"
      ],
      marketType: "Fully Deregulated",
      averageSavings: "$600",
      providerCount: "20+"
    },
    topProviders: [
      { name: "National Grid", marketShare: "35%", avgRate: "25.5¢/kWh", specialty: "Eastern MA utility" },
      { name: "Eversource", marketShare: "30%", avgRate: "26.0¢/kWh", specialty: "Western MA utility" },
      { name: "Constellation Energy", marketShare: "8%", avgRate: "23.5¢/kWh", specialty: "Green energy" },
      { name: "Direct Energy", marketShare: "6%", avgRate: "24.0¢/kWh", specialty: "Fixed-rate plans" },
      { name: "Clearview Energy", marketShare: "4%", avgRate: "22.8¢/kWh", specialty: "Low-cost options" }
    ],
    cities: {
      "Boston": {
        population: "675,000",
        avgRate: "26.5¢/kWh",
        avgUsage: "600 kWh/month",
        insights: "Boston's high electricity rates make rate comparison especially valuable. Even a 2¢/kWh savings translates to $150+ annually. Many neighborhoods participate in community choice aggregation programs offering group discounts.",
        utilityCompany: "Eversource",
        topZips: ["02101", "02102", "02103", "02108", "02109"]
      },
      "Worcester": {
        population: "206,000",
        avgRate: "25.0¢/kWh",
        avgUsage: "680 kWh/month",
        insights: "Worcester's central Massachusetts location and moderate housing costs attract families who can save significantly by comparing electricity rates in the National Grid territory.",
        utilityCompany: "National Grid",
        topZips: ["01601", "01602", "01603", "01604", "01605"]
      },
      "Springfield": {
        population: "155,000",
        avgRate: "24.5¢/kWh",
        avgUsage: "700 kWh/month",
        insights: "Springfield's western Massachusetts location means different rate structures than eastern MA. Residents should compare suppliers specific to the Eversource West territory.",
        utilityCompany: "Eversource",
        topZips: ["01101", "01102", "01103", "01104", "01105"]
      },
      "Cambridge": {
        population: "118,000",
        avgRate: "27.0¢/kWh",
        avgUsage: "550 kWh/month",
        insights: "Cambridge's tech-savvy population and university community drive demand for innovative energy plans including 100% renewable options and smart home integration.",
        utilityCompany: "Eversource",
        topZips: ["02138", "02139", "02140", "02141", "02142"]
      },
      "Lowell": {
        population: "115,000",
        avgRate: "25.2¢/kWh",
        avgUsage: "670 kWh/month",
        insights: "Lowell's diverse community benefits from competitive electricity suppliers offering multilingual support and community-focused energy programs.",
        utilityCompany: "National Grid",
        topZips: ["01850", "01851", "01852", "01853", "01854"]
      },
      "New Bedford": {
        population: "101,000",
        avgRate: "25.8¢/kWh",
        avgUsage: "690 kWh/month",
        insights: "New Bedford's coastal location and fishing industry heritage mean many homes have unique energy needs. Comparing rates can save $400-$600 annually.",
        utilityCompany: "Eversource",
        topZips: ["02740", "02741", "02742", "02743", "02744"]
      }
    }
  },

  // Maine
  ME: {
    state: "Maine",
    marketInsights: {
      description: "Maine deregulated its electricity market in 2000, allowing residential customers to choose their electricity supplier while Central Maine Power and Versant Power handle delivery.",
      keyFacts: [
        "Deregulated since 2000 under the Electric Restructuring Act",
        "Average residential rate: 22.0¢/kWh",
        "15+ competitive electricity providers",
        "Central Maine Power and Versant Power serve as utilities",
        "Maine Public Utilities Commission oversees the market"
      ],
      marketType: "Fully Deregulated",
      averageSavings: "$380",
      providerCount: "15+"
    },
    topProviders: [
      { name: "Central Maine Power", marketShare: "40%", avgRate: "21.5¢/kWh", specialty: "Southern/Central ME" },
      { name: "Versant Power", marketShare: "25%", avgRate: "20.8¢/kWh", specialty: "Northern ME" },
      { name: "Constellation Energy", marketShare: "8%", avgRate: "19.5¢/kWh", specialty: "Green energy" },
      { name: "Clearview Energy", marketShare: "5%", avgRate: "19.8¢/kWh", specialty: "Fixed-rate plans" },
      { name: "Direct Energy", marketShare: "4%", avgRate: "20.2¢/kWh", specialty: "Budget plans" }
    ],
    cities: {
      "Portland": {
        population: "68,000",
        avgRate: "22.5¢/kWh",
        avgUsage: "650 kWh/month",
        insights: "Portland's coastal climate and growing tech sector create diverse energy needs. Residents can save $250-$400 annually by comparing competitive electricity suppliers.",
        utilityCompany: "Central Maine Power",
        topZips: ["04101", "04102", "04103", "04104"]
      },
      "Lewiston": {
        population: "37,000",
        avgRate: "21.8¢/kWh",
        avgUsage: "680 kWh/month",
        insights: "Lewiston's mill-town heritage means many older homes with higher energy needs. Pairing efficiency upgrades with competitive rates maximizes savings.",
        utilityCompany: "Central Maine Power",
        topZips: ["04240", "04241", "04243"]
      },
      "Bangor": {
        population: "32,000",
        avgRate: "21.0¢/kWh",
        avgUsage: "700 kWh/month",
        insights: "Bangor's northern Maine location means harsh winters and high heating costs. Fixed-rate electricity plans help stabilize budgets during cold months.",
        utilityCompany: "Versant Power",
        topZips: ["04401", "04402"]
      },
      "Auburn": {
        population: "24,000",
        avgRate: "21.5¢/kWh",
        avgUsage: "670 kWh/month",
        insights: "Auburn's twin-city relationship with Lewiston means shared electricity market dynamics. Residents benefit from the same competitive supplier options.",
        utilityCompany: "Central Maine Power",
        topZips: ["04210", "04211", "04212"]
      },
      "Augusta": {
        population: "19,000",
        avgRate: "21.2¢/kWh",
        avgUsage: "690 kWh/month",
        insights: "As Maine's capital, Augusta has a stable electricity market with consistent competitive supplier options for both residential and government customers.",
        utilityCompany: "Central Maine Power",
        topZips: ["04330", "04332", "04333", "04338"]
      }
    }
  },

  // New Hampshire
  NH: {
    state: "New Hampshire",
    marketInsights: {
      description: "New Hampshire restructured its electricity market in 1996, allowing residential customers to choose their competitive electricity supplier while utilities continue to deliver power.",
      keyFacts: [
        "Deregulated since 1996 under the Electric Utility Restructuring Act",
        "Average residential rate: 21.5¢/kWh",
        "15+ competitive electricity suppliers",
        "Eversource, Liberty Utilities, and Unitil serve as distribution utilities",
        "NH Public Utilities Commission oversees the market"
      ],
      marketType: "Fully Deregulated",
      averageSavings: "$350",
      providerCount: "15+"
    },
    topProviders: [
      { name: "Eversource", marketShare: "45%", avgRate: "21.0¢/kWh", specialty: "Largest NH utility" },
      { name: "Liberty Utilities", marketShare: "20%", avgRate: "20.5¢/kWh", specialty: "Southern NH" },
      { name: "Constellation Energy", marketShare: "8%", avgRate: "19.5¢/kWh", specialty: "Green energy" },
      { name: "Direct Energy", marketShare: "5%", avgRate: "19.8¢/kWh", specialty: "Fixed-rate plans" },
      { name: "Clearview Energy", marketShare: "4%", avgRate: "19.2¢/kWh", specialty: "Budget plans" }
    ],
    cities: {
      "Manchester": {
        population: "115,000",
        avgRate: "21.8¢/kWh",
        avgUsage: "700 kWh/month",
        insights: "Manchester is New Hampshire's largest city with a competitive electricity market. Residents can save $250-$400 annually by comparing competitive suppliers against Eversource's default rate.",
        utilityCompany: "Eversource",
        topZips: ["03101", "03102", "03103", "03104", "03105"]
      },
      "Nashua": {
        population: "91,000",
        avgRate: "21.2¢/kWh",
        avgUsage: "720 kWh/month",
        insights: "Nashua's proximity to the Massachusetts border means many residents commute south but benefit from NH's lower overall energy costs and competitive supplier market.",
        utilityCompany: "Eversource",
        topZips: ["03060", "03061", "03062", "03063", "03064"]
      },
      "Concord": {
        population: "44,000",
        avgRate: "20.8¢/kWh",
        avgUsage: "690 kWh/month",
        insights: "As the state capital, Concord's Unitil service territory offers different competitive supplier options than the Eversource areas, often with lower base rates.",
        utilityCompany: "Unitil",
        topZips: ["03301", "03302", "03303", "03304", "03305"]
      },
      "Dover": {
        population: "32,000",
        avgRate: "21.0¢/kWh",
        avgUsage: "680 kWh/month",
        insights: "Dover's seacoast location and growing economy attract competitive electricity suppliers offering innovative plans for the region's diverse housing stock.",
        utilityCompany: "Eversource",
        topZips: ["03820", "03821", "03822"]
      },
      "Rochester": {
        population: "31,000",
        avgRate: "20.5¢/kWh",
        avgUsage: "710 kWh/month",
        insights: "Rochester's affordable housing and moderate electricity usage make it an ideal market for fixed-rate plans that lock in savings without requiring high consumption.",
        utilityCompany: "Eversource",
        topZips: ["03839", "03866", "03867", "03868"]
      }
    }
  },

  // Rhode Island
  RI: {
    state: "Rhode Island",
    marketInsights: {
      description: "Rhode Island's electricity market was deregulated in 1997, giving all residential customers the right to choose their electricity supplier while Rhode Island Energy handles delivery.",
      keyFacts: [
        "Deregulated since 1997 under the Utility Restructuring Act",
        "Average residential rate: 24.5¢/kWh",
        "15+ competitive electricity suppliers",
        "Rhode Island Energy (formerly National Grid) serves as the distribution utility",
        "RI Public Utilities Commission oversees the market"
      ],
      marketType: "Fully Deregulated",
      averageSavings: "$450",
      providerCount: "15+"
    },
    topProviders: [
      { name: "Rhode Island Energy", marketShare: "45%", avgRate: "24.0¢/kWh", specialty: "State utility" },
      { name: "Constellation Energy", marketShare: "10%", avgRate: "22.5¢/kWh", specialty: "Green energy" },
      { name: "Direct Energy", marketShare: "8%", avgRate: "23.0¢/kWh", specialty: "Fixed-rate plans" },
      { name: "Clearview Energy", marketShare: "5%", avgRate: "22.0¢/kWh", specialty: "Budget plans" },
      { name: "Town Square Energy", marketShare: "4%", avgRate: "22.8¢/kWh", specialty: "Local focus" }
    ],
    cities: {
      "Providence": {
        population: "190,000",
        avgRate: "25.0¢/kWh",
        avgUsage: "620 kWh/month",
        insights: "Providence's high electricity rates make rate comparison essential. The city's community choice aggregation program offers group discounts that can save residents $300-$500 annually.",
        utilityCompany: "Rhode Island Energy",
        topZips: ["02901", "02902", "02903", "02904", "02905"]
      },
      "Warwick": {
        population: "82,000",
        avgRate: "24.2¢/kWh",
        avgUsage: "680 kWh/month",
        insights: "Warwick's suburban households use more electricity than Providence apartments. Families with higher usage see the biggest savings from competitive rate shopping.",
        utilityCompany: "Rhode Island Energy",
        topZips: ["02886", "02887", "02888", "02889"]
      },
      "Cranston": {
        population: "82,000",
        avgRate: "24.5¢/kWh",
        avgUsage: "670 kWh/month",
        insights: "Cranston's residential neighborhoods offer ideal conditions for competitive electricity shopping, with potential savings of $350-$500 per year.",
        utilityCompany: "Rhode Island Energy",
        topZips: ["02910", "02920", "02921"]
      },
      "Pawtucket": {
        population: "75,000",
        avgRate: "24.8¢/kWh",
        avgUsage: "640 kWh/month",
        insights: "Pawtucket's diverse community benefits from competitive suppliers offering multilingual support and community-focused energy programs.",
        utilityCompany: "Rhode Island Energy",
        topZips: ["02860", "02861", "02862"]
      },
      "East Providence": {
        population: "48,000",
        avgRate: "24.3¢/kWh",
        avgUsage: "660 kWh/month",
        insights: "East Providence's waterfront location and moderate climate mean consistent year-round electricity usage, making fixed-rate plans particularly attractive.",
        utilityCompany: "Rhode Island Energy",
        topZips: ["02914", "02915", "02916"]
      }
    }
  },

  // Connecticut
  CT: {
    state: "Connecticut",
    marketInsights: {
      description: "Connecticut deregulated its electricity market in 1998, allowing all residential customers to choose their electricity generation supplier while Eversource and United Illuminating handle delivery.",
      keyFacts: [
        "Deregulated since 1998 under the Electric Restructuring Act",
        "Average residential rate: 26.5¢/kWh (among highest in US)",
        "20+ competitive electricity suppliers",
        "Eversource and United Illuminating serve as distribution utilities",
        "CT Public Utilities Regulatory Authority oversees the market"
      ],
      marketType: "Fully Deregulated",
      averageSavings: "$550",
      providerCount: "20+"
    },
    topProviders: [
      { name: "Eversource", marketShare: "40%", avgRate: "26.0¢/kWh", specialty: "Largest CT utility" },
      { name: "United Illuminating", marketShare: "20%", avgRate: "25.5¢/kWh", specialty: "Southern CT utility" },
      { name: "Constellation Energy", marketShare: "10%", avgRate: "24.0¢/kWh", specialty: "Green energy" },
      { name: "Direct Energy", marketShare: "7%", avgRate: "24.5¢/kWh", specialty: "Fixed-rate plans" },
      { name: "Clearview Energy", marketShare: "5%", avgRate: "23.5¢/kWh", specialty: "Low-cost options" }
    ],
    cities: {
      "Bridgeport": {
        population: "148,000",
        avgRate: "27.0¢/kWh",
        avgUsage: "650 kWh/month",
        insights: "Bridgeport's high electricity rates in the United Illuminating territory make competitive rate shopping essential. Residents can save $400-$600 annually by switching suppliers.",
        utilityCompany: "United Illuminating",
        topZips: ["06601", "06602", "06604", "06605", "06606"]
      },
      "New Haven": {
        population: "134,000",
        avgRate: "26.2¢/kWh",
        avgUsage: "680 kWh/month",
        insights: "New Haven's university-driven economy creates demand for flexible electricity plans. Students and renters benefit from month-to-month options without long-term commitments.",
        utilityCompany: "United Illuminating",
        topZips: ["06510", "06511", "06512", "06513", "06515"]
      },
      "Hartford": {
        population: "121,000",
        avgRate: "26.8¢/kWh",
        avgUsage: "700 kWh/month",
        insights: "Hartford's insurance industry workforce benefits from stable, fixed-rate electricity plans. The Eversource territory has strong competitive supplier options.",
        utilityCompany: "Eversource",
        topZips: ["06101", "06102", "06103", "06104", "06105"]
      },
      "Stamford": {
        population: "135,000",
        avgRate: "25.5¢/kWh",
        avgUsage: "720 kWh/month",
        insights: "Stamford's affluent Fairfield County location means higher-than-average electricity usage. Premium plans with smart home features are popular, but basic rate comparison still yields significant savings.",
        utilityCompany: "Eversource",
        topZips: ["06901", "06902", "06903", "06904", "06905"]
      },
      "Waterbury": {
        population: "114,000",
        avgRate: "26.5¢/kWh",
        avgUsage: "670 kWh/month",
        insights: "Waterbury's diverse economy and moderate housing costs make it a strong market for competitive electricity shopping, with savings of $350-$550 per year.",
        utilityCompany: "Eversource",
        topZips: ["06701", "06702", "06704", "06705", "06706"]
      },
      "Norwalk": {
        population: "91,000",
        avgRate: "25.8¢/kWh",
        avgUsage: "710 kWh/month",
        insights: "Norwalk's coastal Fairfield County location and higher-income demographics drive demand for both competitive rates and premium green energy plans.",
        utilityCompany: "Eversource",
        topZips: ["06850", "06851", "06853", "06854", "06855"]
      }
    }
  },

}; 

// Helper function to get state data
export const getStateData = (stateCode) => {
  return LOCATION_DATA[stateCode] || null;
};

// Helper function to get city data
export const getCityData = (stateCode, cityName) => {
  const stateData = LOCATION_DATA[stateCode];
  if (!stateData || !stateData.cities) return null;
  return stateData.cities[cityName] || null;
};

// Helper function to get all cities across all states
export const getAllCities = () => {
  const cities = [];
  Object.entries(LOCATION_DATA).forEach(([stateCode, stateData]) => {
    Object.entries(stateData.cities).forEach(([cityName, cityData]) => {
      cities.push({
        city: cityName,
        state: stateData.state,
        stateCode,
        ...cityData
      });
    });
  });
  return cities;
};

// Helper function to get all states
export const getAllStates = () => {
  return Object.entries(LOCATION_DATA).map(([code, data]) => ({
    code,
    name: data.state,
    marketType: data.marketInsights.marketType,
    averageSavings: data.marketInsights.averageSavings,
    providerCount: data.marketInsights.providerCount,
    cityCount: Object.keys(data.cities).length
  }));
};

// Helper function to generate SEO-friendly description
export const generateLocationDescription = (stateCode, cityName = null) => {
  const stateData = getStateData(stateCode);
  if (!stateData) return "";

  if (cityName) {
    const cityData = getCityData(stateCode, cityName);
    if (cityData) {
      return `Compare electricity rates in ${cityName}, ${stateData.state}. Average rate: ${cityData.avgRate}. ${stateData.marketInsights.providerCount} providers available. ${cityData.insights}`;
    }
  }

  return `${stateData.marketInsights.description} ${stateData.topProviders.length}+ providers compete for your business with rates starting as low as ${stateData.topProviders[0]?.avgRate}.`;
};

// Helper function to get provider recommendations for location
export const getLocationProviders = (stateCode) => {
  const stateData = getStateData(stateCode);
  return stateData?.topProviders || [];
};

// Helper to generate city slug for URLs
export const getCitySlug = (cityName) => {
  return cityName.toLowerCase().replace(/\s+/g, '-');
};

// Helper to find city by slug
export const findCityBySlug = (slug) => {
  for (const [stateCode, stateData] of Object.entries(LOCATION_DATA)) {
    for (const [cityName, cityData] of Object.entries(stateData.cities)) {
      if (getCitySlug(cityName) === slug) {
        return { city: cityName, state: stateData.state, stateCode, ...cityData };
      }
    }
  }
  return null;
};

// Helper to find state by slug
export const findStateBySlug = (slug) => {
  for (const [code, data] of Object.entries(LOCATION_DATA)) {
    const stateSlug = data.state.toLowerCase().replace(/\s+/g, '-');
    if (stateSlug === slug || code.toLowerCase() === slug) {
      return { code, ...data };
    }
  }
  return null;
};

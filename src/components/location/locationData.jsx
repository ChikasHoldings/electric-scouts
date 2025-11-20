// Dynamic location-specific content for SEO and user experience
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
      Houston: {
        population: "2.3 million",
        avgRate: "12.9¢/kWh",
        avgUsage: "1,200 kWh/month",
        insights: "Houston's hot climate drives high summer usage. Many residents save by choosing plans with free nights or weekends during peak AC season.",
        utilityCompany: "CenterPoint Energy",
        topZips: ["77002", "77019", "77024", "77056", "77063"]
      },
      Dallas: {
        population: "1.3 million",
        avgRate: "13.1¢/kWh",
        avgUsage: "1,150 kWh/month",
        insights: "Dallas customers benefit from intense competition among providers. Time-of-use plans often provide significant savings for customers who can shift usage to off-peak hours.",
        utilityCompany: "Oncor Electric Delivery",
        topZips: ["75201", "75204", "75205", "75219", "75225"]
      },
      Austin: {
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
        "ComEd and Ameren remain regulated utilities for delivery",
        "Average savings: $200-$500 per year by switching suppliers"
      ],
      marketType: "Fully Deregulated",
      averageSavings: "$350",
      providerCount: "40+"
    },
    topProviders: [
      { name: "Constellation", marketShare: "22%", avgRate: "13.9¢/kWh", specialty: "Renewable options" },
      { name: "Direct Energy", marketShare: "18%", avgRate: "14.1¢/kWh", specialty: "Fixed-rate plans" },
      { name: "Homefield Energy", marketShare: "12%", avgRate: "13.7¢/kWh", specialty: "Local Illinois provider" },
      { name: "IGS Energy", marketShare: "10%", avgRate: "14.0¢/kWh", specialty: "Price protection" },
      { name: "Verde Energy", marketShare: "8%", avgRate: "14.2¢/kWh", specialty: "100% renewable" }
    ],
    cities: {
      Chicago: {
        population: "2.7 million",
        avgRate: "14.5¢/kWh",
        avgUsage: "750 kWh/month",
        insights: "Chicago's diverse housing stock (condos, single-family homes) creates varied usage patterns. Fixed-rate plans protect against ComEd rate fluctuations.",
        utilityCompany: "ComEd",
        topZips: ["60601", "60602", "60603", "60610", "60611"]
      },
      Aurora: {
        population: "180,000",
        avgRate: "14.2¢/kWh",
        avgUsage: "800 kWh/month",
        insights: "Aurora residents benefit from competitive suburban rates. Many choose 12-month fixed plans for budget certainty.",
        utilityCompany: "ComEd",
        topZips: ["60502", "60504", "60505", "60506", "60507"]
      },
      Naperville: {
        population: "149,000",
        avgRate: "14.1¢/kWh",
        avgUsage: "820 kWh/month",
        insights: "Naperville's newer homes often have higher efficiency. Green energy plans are popular in this environmentally-conscious suburb.",
        utilityCompany: "ComEd",
        topZips: ["60540", "60563", "60564", "60565"]
      },
      Joliet: {
        population: "150,000",
        avgRate: "14.2¢/kWh",
        avgUsage: "810 kWh/month",
        insights: "Joliet residents in ComEd territory benefit from strong retail competition. Industrial background means diverse housing types with varying usage patterns.",
        utilityCompany: "ComEd",
        topZips: ["60431", "60432", "60433", "60435"]
      }
    }
  },

  // Ohio
  OH: {
    state: "Ohio",
    marketInsights: {
      description: "Ohio's electricity market has been deregulated since 2001, allowing customers in all major cities to choose from competitive retail electric suppliers.",
      keyFacts: [
        "Deregulated in 2001 under Senate Bill 3",
        "Average residential rate: 13.8¢/kWh",
        "50+ certified retail electric suppliers",
        "Three main utility territories: AEP Ohio, Duke Energy, FirstEnergy",
        "Typical savings: $250-$600 annually"
      ],
      marketType: "Fully Deregulated",
      averageSavings: "$425",
      providerCount: "50+"
    },
    topProviders: [
      { name: "AEP Energy", marketShare: "20%", avgRate: "13.5¢/kWh", specialty: "Ohio-based provider" },
      { name: "Constellation", marketShare: "16%", avgRate: "13.7¢/kWh", specialty: "Renewable plans" },
      { name: "Direct Energy", marketShare: "14%", avgRate: "13.9¢/kWh", specialty: "Flexible terms" },
      { name: "IGS Energy", marketShare: "12%", avgRate: "13.6¢/kWh", specialty: "Price protection" },
      { name: "Major Energy", marketShare: "10%", avgRate: "13.8¢/kWh", specialty: "Local service" }
    ],
    cities: {
      Columbus: {
        population: "905,000",
        avgRate: "13.7¢/kWh",
        avgUsage: "900 kWh/month",
        insights: "Columbus has Ohio's most competitive market with the highest number of supplier options. AEP Ohio serves as the utility, with dozens of competitive alternatives.",
        utilityCompany: "AEP Ohio",
        topZips: ["43201", "43202", "43203", "43206", "43215"]
      },
      Cleveland: {
        population: "372,000",
        avgRate: "14.0¢/kWh",
        avgUsage: "850 kWh/month",
        insights: "Cleveland residents can save significantly by switching from FirstEnergy's default rate. Winter heating costs make fixed-rate plans attractive.",
        utilityCompany: "FirstEnergy (Illuminating Company)",
        topZips: ["44101", "44102", "44103", "44106", "44113"]
      },
      Cincinnati: {
        population: "309,000",
        avgRate: "13.9¢/kWh",
        avgUsage: "880 kWh/month",
        insights: "Duke Energy territory offers good supplier competition. Many Cincinnati residents choose green energy plans from competitive suppliers.",
        utilityCompany: "Duke Energy Ohio",
        topZips: ["45202", "45203", "45206", "45219", "45220"]
      },
      Toledo: {
        population: "270,000",
        avgRate: "13.8¢/kWh",
        avgUsage: "870 kWh/month",
        insights: "Toledo's FirstEnergy territory sees strong retail competition. Lake Erie proximity influences heating/cooling patterns, making seasonal plans attractive.",
        utilityCompany: "FirstEnergy (Toledo Edison)",
        topZips: ["43604", "43606", "43607", "43608", "43612"]
      }
    }
  },

  // Pennsylvania
  PA: {
    state: "Pennsylvania",
    marketInsights: {
      description: "Pennsylvania was one of the first states to deregulate electricity in 1997, creating a mature competitive market with numerous supplier options.",
      keyFacts: [
        "Deregulated since 1997 under Electricity Generation Customer Choice Act",
        "Average residential rate: 14.7¢/kWh",
        "60+ licensed electric generation suppliers",
        "Four major utility territories: PECO, PPL, Duquesne, Met-Ed",
        "Average savings: $300-$700 per year"
      ],
      marketType: "Fully Deregulated",
      averageSavings: "$500",
      providerCount: "60+"
    },
    topProviders: [
      { name: "Constellation", marketShare: "24%", avgRate: "14.3¢/kWh", specialty: "Market leader" },
      { name: "Direct Energy", marketShare: "18%", avgRate: "14.5¢/kWh", specialty: "Fixed rates" },
      { name: "Verde Energy", marketShare: "12%", avgRate: "14.8¢/kWh", specialty: "100% renewable" },
      { name: "Penn Power & Light Energy", marketShare: "10%", avgRate: "14.4¢/kWh", specialty: "Regional focus" },
      { name: "IGS Energy", marketShare: "9%", avgRate: "14.6¢/kWh", specialty: "Customer service" }
    ],
    cities: {
      Philadelphia: {
        population: "1.6 million",
        avgRate: "15.1¢/kWh",
        avgUsage: "750 kWh/month",
        insights: "Philadelphia's PECO territory offers extensive supplier choice. Row homes and apartments have lower usage than suburban areas, making shorter-term plans attractive.",
        utilityCompany: "PECO",
        topZips: ["19102", "19103", "19104", "19106", "19130"]
      },
      Pittsburgh: {
        population: "303,000",
        avgRate: "14.8¢/kWh",
        avgUsage: "800 kWh/month",
        insights: "Pittsburgh's Duquesne Light territory sees strong competition. Many residents lock in 2-3 year fixed rates for price stability.",
        utilityCompany: "Duquesne Light",
        topZips: ["15201", "15203", "15206", "15213", "15232"]
      },
      Allentown: {
        population: "125,000",
        avgRate: "14.5¢/kWh",
        avgUsage: "820 kWh/month",
        insights: "PPL territory customers benefit from competitive rates. Green energy options are increasingly popular in the Lehigh Valley.",
        utilityCompany: "PPL Electric Utilities",
        topZips: ["18101", "18102", "18103", "18104"]
      }
    }
  },

  // New York
  NY: {
    state: "New York",
    marketInsights: {
      description: "New York's electricity market has been restructured since 1996, with energy service companies (ESCOs) competing to serve residential and commercial customers across the state.",
      keyFacts: [
        "Restructured since 1996",
        "Average residential rate: 20.6¢/kWh (highest in continental US)",
        "100+ Energy Service Companies (ESCOs) statewide",
        "Con Edison, National Grid, NYSEG, RG&E serve as utilities",
        "Potential savings: $300-$900 annually"
      ],
      marketType: "Restructured/Competitive",
      averageSavings: "$600",
      providerCount: "100+"
    },
    topProviders: [
      { name: "Direct Energy", marketShare: "20%", avgRate: "19.8¢/kWh", specialty: "Fixed-rate plans" },
      { name: "Constellation", marketShare: "18%", avgRate: "20.1¢/kWh", specialty: "Green options" },
      { name: "Ambit Energy", marketShare: "12%", avgRate: "20.3¢/kWh", specialty: "Variable rates" },
      { name: "Liberty Power", marketShare: "10%", avgRate: "19.9¢/kWh", specialty: "NY-focused" },
      { name: "Verde Energy", marketShare: "8%", avgRate: "20.5¢/kWh", specialty: "100% renewable" }
    ],
    cities: {
      "New York City": {
        population: "8.3 million",
        avgRate: "21.5¢/kWh",
        avgUsage: "600 kWh/month",
        insights: "NYC apartments typically use less electricity than suburban homes. Con Edison's high delivery charges make supply rate shopping crucial for savings.",
        utilityCompany: "Con Edison",
        topZips: ["10001", "10002", "10003", "10009", "10011"]
      },
      Buffalo: {
        population: "276,000",
        avgRate: "18.9¢/kWh",
        avgUsage: "700 kWh/month",
        insights: "National Grid territory offers competitive supply options. Winter heating with electricity drives higher usage and makes fixed rates attractive.",
        utilityCompany: "National Grid",
        topZips: ["14201", "14202", "14203", "14209", "14222"]
      },
      Rochester: {
        population: "206,000",
        avgRate: "19.2¢/kWh",
        avgUsage: "720 kWh/month",
        insights: "RG&E customers can achieve meaningful savings through ESCOs. Green energy plans are growing in popularity.",
        utilityCompany: "Rochester Gas & Electric",
        topZips: ["14604", "14605", "14607", "14610", "14620"]
      },
      Syracuse: {
        population: "148,000",
        avgRate: "19.5¢/kWh",
        avgUsage: "730 kWh/month",
        insights: "National Grid territory with active ESCO market. Syracuse's harsh winters make budget billing and fixed-rate plans popular choices.",
        utilityCompany: "National Grid",
        topZips: ["13201", "13202", "13203", "13204", "13210"]
      }
    }
  },

  // New Jersey
  NJ: {
    state: "New Jersey",
    marketInsights: {
      description: "New Jersey deregulated its electricity market in 1999, allowing customers to choose Third Party Suppliers (TPS) while utilities continue to deliver power.",
      keyFacts: [
        "Deregulated since 1999 under Electric Discount and Energy Competition Act",
        "Average residential rate: 16.2¢/kWh",
        "40+ licensed Third Party Suppliers",
        "Four utility territories: JCP&L, PSE&G, ACE, RECO",
        "Average savings: $250-$550 per year"
      ],
      marketType: "Fully Deregulated",
      averageSavings: "$400",
      providerCount: "40+"
    },
    topProviders: [
      { name: "Constellation", marketShare: "26%", avgRate: "15.8¢/kWh", specialty: "Market leader" },
      { name: "Direct Energy", marketShare: "20%", avgRate: "16.0¢/kWh", specialty: "Fixed rates" },
      { name: "Suez Energy", marketShare: "12%", avgRate: "15.9¢/kWh", specialty: "NJ specialist" },
      { name: "Verde Energy", marketShare: "10%", avgRate: "16.3¢/kWh", specialty: "Green energy" },
      { name: "South Jersey Energy", marketShare: "8%", avgRate: "16.1¢/kWh", specialty: "Regional" }
    ],
    cities: {
      Newark: {
        population: "311,000",
        avgRate: "16.5¢/kWh",
        avgUsage: "700 kWh/month",
        insights: "PSE&G territory customers benefit from competitive third-party supplier rates. Multi-family housing dominates, creating opportunities for apartment-specific plans.",
        utilityCompany: "PSE&G",
        topZips: ["07101", "07102", "07103", "07104", "07105"]
      },
      "Jersey City": {
        population: "292,000",
        avgRate: "16.7¢/kWh",
        avgUsage: "680 kWh/month",
        insights: "High-rise apartments and condos mean lower per-unit usage. Short-term plans work well for the transient population.",
        utilityCompany: "PSE&G",
        topZips: ["07302", "07304", "07305", "07306", "07310"]
      },
      Paterson: {
        population: "159,000",
        avgRate: "16.3¢/kWh",
        avgUsage: "720 kWh/month",
        insights: "Competitive supplier rates can save JCP&L customers 10-15% annually. Fixed-rate plans provide budget certainty.",
        utilityCompany: "JCP&L",
        topZips: ["07501", "07502", "07503", "07504", "07505"]
      }
    }
  },

  // Maryland
  MD: {
    state: "Maryland",
    marketInsights: {
      description: "Maryland's electricity market was restructured in 1999, creating competition through retail electricity suppliers while maintaining utility infrastructure.",
      keyFacts: [
        "Restructured since 1999",
        "Average residential rate: 14.2¢/kWh",
        "30+ licensed electricity suppliers",
        "Major utilities: BGE, Pepco, Delmarva Power",
        "Average savings: $200-$500 annually"
      ],
      marketType: "Restructured/Competitive",
      averageSavings: "$350",
      providerCount: "30+"
    },
    topProviders: [
      { name: "Constellation", marketShare: "30%", avgRate: "13.8¢/kWh", specialty: "Local company (BGE parent)" },
      { name: "Direct Energy", marketShare: "18%", avgRate: "14.0¢/kWh", specialty: "Fixed rates" },
      { name: "WGL Energy", marketShare: "15%", avgRate: "13.9¢/kWh", specialty: "DC-MD region" },
      { name: "CleanChoice Energy", marketShare: "10%", avgRate: "14.3¢/kWh", specialty: "100% renewable" },
      { name: "Inspire Energy", marketShare: "8%", avgRate: "14.1¢/kWh", specialty: "Clean energy" }
    ],
    cities: {
      Baltimore: {
        population: "576,000",
        avgRate: "14.5¢/kWh",
        avgUsage: "850 kWh/month",
        insights: "BGE territory offers strong supplier competition. Baltimore's row homes have moderate usage, making 12-24 month fixed plans popular.",
        utilityCompany: "Baltimore Gas & Electric (BGE)",
        topZips: ["21201", "21202", "21218", "21224", "21230"]
      },
      Frederick: {
        population: "72,000",
        avgRate: "14.1¢/kWh",
        avgUsage: "880 kWh/month",
        insights: "Potomac Edison territory customers can save through competitive suppliers. Growing city attracts green energy customers.",
        utilityCompany: "Potomac Edison",
        topZips: ["21701", "21702", "21703", "21704"]
      },
      Rockville: {
        population: "68,000",
        avgRate: "14.0¢/kWh",
        avgUsage: "850 kWh/month",
        insights: "Pepco territory with excellent supplier options. Affluent Montgomery County residents often choose 100% renewable plans at competitive rates.",
        utilityCompany: "Pepco",
        topZips: ["20850", "20851", "20852", "20853"]
      }
    }
  },

  // Massachusetts
  MA: {
    state: "Massachusetts",
    marketInsights: {
      description: "Massachusetts electricity market was restructured in 1998, allowing competitive suppliers while utilities maintain the distribution network.",
      keyFacts: [
        "Restructured since 1998",
        "Average residential rate: 22.6¢/kWh (second highest in nation)",
        "25+ competitive electricity suppliers",
        "Major utilities: Eversource, National Grid, Unitil",
        "Potential savings: $300-$800 per year"
      ],
      marketType: "Restructured/Competitive",
      averageSavings: "$550",
      providerCount: "25+"
    },
    topProviders: [
      { name: "Constellation", marketShare: "28%", avgRate: "21.8¢/kWh", specialty: "Green options" },
      { name: "Direct Energy", marketShare: "22%", avgRate: "22.1¢/kWh", specialty: "Fixed rates" },
      { name: "Verde Energy", marketShare: "15%", avgRate: "22.5¢/kWh", specialty: "100% renewable" },
      { name: "Ambit Energy", marketShare: "12%", avgRate: "22.0¢/kWh", specialty: "Variable plans" },
      { name: "Eligo Energy", marketShare: "10%", avgRate: "21.9¢/kWh", specialty: "Competitive rates" }
    ],
    cities: {
      Boston: {
        population: "694,000",
        avgRate: "23.2¢/kWh",
        avgUsage: "650 kWh/month",
        insights: "Eversource territory has high delivery charges. Competitive supply can save 15-20%. Apartments and condos dominate, creating unique usage patterns.",
        utilityCompany: "Eversource",
        topZips: ["02101", "02108", "02109", "02110", "02111"]
      },
      Worcester: {
        population: "206,000",
        avgRate: "22.5¢/kWh",
        avgUsage: "700 kWh/month",
        insights: "National Grid customers benefit from competitive rates. Fixed-rate plans protect against seasonal price spikes.",
        utilityCompany: "National Grid",
        topZips: ["01604", "01605", "01606", "01607", "01608"]
      },
      Springfield: {
        population: "155,000",
        avgRate: "22.8¢/kWh",
        avgUsage: "710 kWh/month",
        insights: "Eversource territory with growing competitive options. Older housing stock drives higher usage; energy efficiency programs can reduce costs significantly.",
        utilityCompany: "Eversource",
        topZips: ["01103", "01104", "01105", "01107", "01109"]
      }
    }
  },

  // Connecticut
  CT: {
    state: "Connecticut",
    marketInsights: {
      description: "Connecticut restructured its electricity market in 2000, allowing customers to choose competitive suppliers while Eversource and United Illuminating maintain distribution.",
      keyFacts: [
        "Restructured in 2000",
        "Average residential rate: 22.0¢/kWh (among highest in nation)",
        "20+ licensed competitive suppliers",
        "Two main utilities: Eversource, United Illuminating",
        "Average savings: $200-$500 annually"
      ],
      marketType: "Restructured/Competitive",
      averageSavings: "$350",
      providerCount: "20+"
    },
    topProviders: [
      { name: "Constellation", marketShare: "25%", avgRate: "21.5¢/kWh", specialty: "Market leader" },
      { name: "Direct Energy", marketShare: "20%", avgRate: "21.8¢/kWh", specialty: "Fixed rates" },
      { name: "Verde Energy", marketShare: "15%", avgRate: "22.2¢/kWh", specialty: "Green energy" },
      { name: "Eligo Energy", marketShare: "12%", avgRate: "21.7¢/kWh", specialty: "Competitive rates" },
      { name: "CleanChoice Energy", marketShare: "10%", avgRate: "22.0¢/kWh", specialty: "100% renewable" }
    ],
    cities: {
      Hartford: {
        population: "121,000",
        avgRate: "22.3¢/kWh",
        avgUsage: "680 kWh/month",
        insights: "Eversource territory with active supplier competition. State capital residents can save 10-15% by choosing competitive suppliers over standard service.",
        utilityCompany: "Eversource",
        topZips: ["06103", "06105", "06106", "06114", "06120"]
      },
      "New Haven": {
        population: "135,000",
        avgRate: "22.1¢/kWh",
        avgUsage: "690 kWh/month",
        insights: "United Illuminating territory offers strong supplier options. University presence creates diverse housing types with varying energy needs.",
        utilityCompany: "United Illuminating",
        topZips: ["06510", "06511", "06513", "06515", "06519"]
      },
      Bridgeport: {
        population: "148,000",
        avgRate: "22.5¢/kWh",
        avgUsage: "700 kWh/month",
        insights: "United Illuminating customers benefit from retail competition. Coastal location and older housing stock make weatherization and fixed-rate plans valuable.",
        utilityCompany: "United Illuminating",
        topZips: ["06604", "06605", "06606", "06607", "06608"]
      }
    }
  },

  // Maine
  ME: {
    state: "Maine",
    marketInsights: {
      description: "Maine restructured its electricity market in 2000, creating competition through competitive electricity providers while Central Maine Power and Versant Power handle distribution.",
      keyFacts: [
        "Restructured in 2000",
        "Average residential rate: 18.5¢/kWh",
        "15+ licensed competitive providers",
        "Two utilities: Central Maine Power, Versant Power",
        "Average savings: $200-$400 annually"
      ],
      marketType: "Restructured/Competitive",
      averageSavings: "$300",
      providerCount: "15+"
    },
    topProviders: [
      { name: "Constellation", marketShare: "30%", avgRate: "18.0¢/kWh", specialty: "Market leader" },
      { name: "Direct Energy", marketShare: "22%", avgRate: "18.3¢/kWh", specialty: "Fixed rates" },
      { name: "Eligo Energy", marketShare: "15%", avgRate: "18.2¢/kWh", specialty: "Competitive pricing" },
      { name: "Verde Energy", marketShare: "12%", avgRate: "18.7¢/kWh", specialty: "Green energy" },
      { name: "Residents Energy", marketShare: "10%", avgRate: "18.4¢/kWh", specialty: "New England focus" }
    ],
    cities: {
      Portland: {
        population: "68,000",
        avgRate: "18.8¢/kWh",
        avgUsage: "650 kWh/month",
        insights: "Central Maine Power territory with robust supplier competition. Coastal climate creates moderate electricity usage, making 12-month fixed plans ideal.",
        utilityCompany: "Central Maine Power",
        topZips: ["04101", "04102", "04103", "04104"]
      },
      Lewiston: {
        population: "37,000",
        avgRate: "18.6¢/kWh",
        avgUsage: "680 kWh/month",
        insights: "CMP customers can save through competitive suppliers. Industrial heritage means diverse housing stock; weatherization programs enhance savings.",
        utilityCompany: "Central Maine Power",
        topZips: ["04240", "04241", "04243"]
      },
      Bangor: {
        population: "32,000",
        avgRate: "18.4¢/kWh",
        avgUsage: "700 kWh/month",
        insights: "Versant Power territory with growing supplier options. Northern location drives winter heating costs; fixed-rate plans provide budget stability.",
        utilityCompany: "Versant Power",
        topZips: ["04401", "04402"]
      }
    }
  },

  // New Hampshire
  NH: {
    state: "New Hampshire",
    marketInsights: {
      description: "New Hampshire restructured its electricity market in 1996, creating one of the nation's first competitive markets with numerous supplier options statewide.",
      keyFacts: [
        "Restructured in 1996 (earliest adopter)",
        "Average residential rate: 20.3¢/kWh",
        "18+ licensed competitive suppliers",
        "Three utilities: Eversource, Unitil, Liberty Utilities",
        "Average savings: $250-$500 per year"
      ],
      marketType: "Restructured/Competitive",
      averageSavings: "$375",
      providerCount: "18+"
    },
    topProviders: [
      { name: "Constellation", marketShare: "28%", avgRate: "19.8¢/kWh", specialty: "Market leader" },
      { name: "Direct Energy", marketShare: "22%", avgRate: "20.0¢/kWh", specialty: "Fixed rates" },
      { name: "Verde Energy", marketShare: "15%", avgRate: "20.5¢/kWh", specialty: "Green options" },
      { name: "Eligo Energy", marketShare: "12%", avgRate: "19.9¢/kWh", specialty: "Price protection" },
      { name: "Residents Energy", marketShare: "10%", avgRate: "20.1¢/kWh", specialty: "NH specialist" }
    ],
    cities: {
      Manchester: {
        population: "115,000",
        avgRate: "20.5¢/kWh",
        avgUsage: "720 kWh/month",
        insights: "Eversource territory with mature competitive market. State's largest city offers widest supplier choice; cold winters make long-term fixed rates attractive.",
        utilityCompany: "Eversource",
        topZips: ["03101", "03102", "03103", "03104"]
      },
      Nashua: {
        population: "91,000",
        avgRate: "20.3¢/kWh",
        avgUsage: "710 kWh/month",
        insights: "Eversource customers benefit from proximity to Massachusetts border and supplier competition. Tech sector presence drives interest in green energy plans.",
        utilityCompany: "Eversource",
        topZips: ["03060", "03062", "03063", "03064"]
      },
      Concord: {
        population: "43,000",
        avgRate: "20.1¢/kWh",
        avgUsage: "690 kWh/month",
        insights: "Eversource territory, state capital offers good supplier diversity. Government buildings and moderate population create stable, competitive pricing.",
        utilityCompany: "Eversource",
        topZips: ["03301", "03303"]
      }
    }
  },

  // Rhode Island
  RI: {
    state: "Rhode Island",
    marketInsights: {
      description: "Rhode Island restructured its electricity market in 1997, allowing customers to choose competitive suppliers while National Grid maintains the distribution system.",
      keyFacts: [
        "Restructured in 1997",
        "Average residential rate: 23.5¢/kWh (highest in region)",
        "15+ licensed competitive suppliers",
        "Single utility: National Grid",
        "Average savings: $200-$450 annually"
      ],
      marketType: "Restructured/Competitive",
      averageSavings: "$325",
      providerCount: "15+"
    },
    topProviders: [
      { name: "Constellation", marketShare: "30%", avgRate: "22.8¢/kWh", specialty: "Market leader" },
      { name: "Direct Energy", marketShare: "25%", avgRate: "23.0¢/kWh", specialty: "Fixed rates" },
      { name: "Verde Energy", marketShare: "15%", avgRate: "23.5¢/kWh", specialty: "100% renewable" },
      { name: "Eligo Energy", marketShare: "12%", avgRate: "22.9¢/kWh", specialty: "Competitive pricing" },
      { name: "Residents Energy", marketShare: "10%", avgRate: "23.1¢/kWh", specialty: "Regional focus" }
    ],
    cities: {
      Providence: {
        population: "190,000",
        avgRate: "23.8¢/kWh",
        avgUsage: "660 kWh/month",
        insights: "National Grid's standard service rates make competitive suppliers attractive. Urban density and mixed housing types create varied usage patterns.",
        utilityCompany: "National Grid",
        topZips: ["02903", "02904", "02905", "02906", "02907"]
      },
      Warwick: {
        population: "83,000",
        avgRate: "23.6¢/kWh",
        avgUsage: "680 kWh/month",
        insights: "Suburban National Grid customers save through supplier choice. Coastal location and single-family homes drive moderate summer AC usage.",
        utilityCompany: "National Grid",
        topZips: ["02886", "02888", "02889"]
      },
      Cranston: {
        population: "82,000",
        avgRate: "23.7¢/kWh",
        avgUsage: "670 kWh/month",
        insights: "National Grid territory adjacent to Providence offers same supplier options. Mix of residential types creates opportunities for tailored plans.",
        utilityCompany: "National Grid",
        topZips: ["02910", "02920", "02921"]
      }
    }
  }
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

// Helper function to generate SEO-friendly description
export const generateLocationDescription = (stateCode, cityName = null) => {
  const stateData = getStateData(stateCode);
  if (!stateData) return "";

  if (cityName) {
    const cityData = getCityData(stateCode, cityName);
    if (cityData) {
      return `Compare electricity rates in ${cityName}, ${stateData.state}. Average rate: ${cityData.avgRate}. ${stateData.providerCount} providers available. ${cityData.insights}`;
    }
  }

  return `${stateData.marketInsights.description} ${stateData.topProviders.length}+ providers compete for your business with rates starting as low as ${stateData.topProviders[0]?.avgRate}.`;
};

// Helper function to get provider recommendations for location
export const getLocationProviders = (stateCode) => {
  const stateData = getStateData(stateCode);
  return stateData?.topProviders || [];
};
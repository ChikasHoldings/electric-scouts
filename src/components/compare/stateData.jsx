// Comprehensive US deregulated electricity market data

export const DEREGULATED_STATES = {
  TX: {
    name: 'Texas',
    fullName: 'Texas',
    deregulated: true,
    marketType: 'Fully Deregulated',
    avgSavings: 800,
    providerCount: 45,
    cities: ['Houston', 'Dallas', 'Austin', 'San Antonio', 'Fort Worth', 'Arlington', 'Plano', 'Corpus Christi']
  },
  PA: {
    name: 'Pennsylvania',
    fullName: 'Pennsylvania',
    deregulated: true,
    marketType: 'Fully Deregulated',
    avgSavings: 750,
    providerCount: 38,
    cities: ['Philadelphia', 'Pittsburgh', 'Allentown', 'Erie', 'Reading', 'Scranton', 'Lancaster']
  },
  NJ: {
    name: 'New Jersey',
    fullName: 'New Jersey',
    deregulated: true,
    marketType: 'Fully Deregulated',
    avgSavings: 720,
    providerCount: 35,
    cities: ['Newark', 'Jersey City', 'Paterson', 'Elizabeth', 'Trenton', 'Camden']
  },
  MD: {
    name: 'Maryland',
    fullName: 'Maryland',
    deregulated: true,
    marketType: 'Fully Deregulated',
    avgSavings: 680,
    providerCount: 32,
    cities: ['Baltimore', 'Columbia', 'Germantown', 'Silver Spring', 'Waldorf', 'Ellicott City']
  },
  OH: {
    name: 'Ohio',
    fullName: 'Ohio',
    deregulated: true,
    marketType: 'Fully Deregulated',
    avgSavings: 760,
    providerCount: 40,
    cities: ['Columbus', 'Cleveland', 'Cincinnati', 'Toledo', 'Akron', 'Dayton']
  },
  IL: {
    name: 'Illinois',
    fullName: 'Illinois',
    deregulated: true,
    marketType: 'Fully Deregulated',
    avgSavings: 700,
    providerCount: 36,
    cities: ['Chicago', 'Aurora', 'Naperville', 'Joliet', 'Rockford', 'Springfield']
  },
  MI: {
    name: 'Michigan',
    fullName: 'Michigan',
    deregulated: true,
    marketType: 'Partial Deregulation',
    avgSavings: 650,
    providerCount: 28,
    cities: ['Detroit', 'Grand Rapids', 'Warren', 'Sterling Heights', 'Ann Arbor', 'Lansing']
  },
  CT: {
    name: 'Connecticut',
    fullName: 'Connecticut',
    deregulated: true,
    marketType: 'Fully Deregulated',
    avgSavings: 690,
    providerCount: 30,
    cities: ['Bridgeport', 'New Haven', 'Hartford', 'Stamford', 'Waterbury', 'Norwalk']
  },
  MA: {
    name: 'Massachusetts',
    fullName: 'Massachusetts',
    deregulated: true,
    marketType: 'Fully Deregulated',
    avgSavings: 710,
    providerCount: 34,
    cities: ['Boston', 'Worcester', 'Springfield', 'Cambridge', 'Lowell', 'Brockton']
  },
  RI: {
    name: 'Rhode Island',
    fullName: 'Rhode Island',
    deregulated: true,
    marketType: 'Fully Deregulated',
    avgSavings: 660,
    providerCount: 26,
    cities: ['Providence', 'Warwick', 'Cranston', 'Pawtucket', 'East Providence', 'Woonsocket']
  },
  NH: {
    name: 'New Hampshire',
    fullName: 'New Hampshire',
    deregulated: true,
    marketType: 'Fully Deregulated',
    avgSavings: 640,
    providerCount: 25,
    cities: ['Manchester', 'Nashua', 'Concord', 'Derry', 'Rochester', 'Salem']
  },
  ME: {
    name: 'Maine',
    fullName: 'Maine',
    deregulated: true,
    marketType: 'Fully Deregulated',
    avgSavings: 620,
    providerCount: 22,
    cities: ['Portland', 'Lewiston', 'Bangor', 'South Portland', 'Auburn', 'Biddeford']
  },
  NY: {
    name: 'New York',
    fullName: 'New York',
    deregulated: true,
    marketType: 'Fully Deregulated',
    avgSavings: 740,
    providerCount: 42,
    cities: ['New York City', 'Buffalo', 'Rochester', 'Yonkers', 'Syracuse', 'Albany']
  },
  DE: {
    name: 'Delaware',
    fullName: 'Delaware',
    deregulated: true,
    marketType: 'Fully Deregulated',
    avgSavings: 670,
    providerCount: 28,
    cities: ['Wilmington', 'Dover', 'Newark', 'Middletown', 'Smyrna', 'Milford']
  },
  DC: {
    name: 'Washington DC',
    fullName: 'District of Columbia',
    deregulated: true,
    marketType: 'Fully Deregulated',
    avgSavings: 700,
    providerCount: 30,
    cities: ['Washington']
  },
  OR: {
    name: 'Oregon',
    fullName: 'Oregon',
    deregulated: true,
    marketType: 'Partial Deregulation',
    avgSavings: 600,
    providerCount: 20,
    cities: ['Portland', 'Salem', 'Eugene', 'Gresham', 'Hillsboro', 'Beaverton']
  },
  MT: {
    name: 'Montana',
    fullName: 'Montana',
    deregulated: true,
    marketType: 'Partial Deregulation',
    avgSavings: 580,
    providerCount: 18,
    cities: ['Billings', 'Missoula', 'Great Falls', 'Bozeman', 'Butte', 'Helena']
  }
};

// ZIP code prefix to state mapping (first 3 digits)
export const ZIP_TO_STATE = {
  // Texas (750-799)
  '750': 'TX', '751': 'TX', '752': 'TX', '753': 'TX', '754': 'TX', '755': 'TX',
  '756': 'TX', '757': 'TX', '758': 'TX', '759': 'TX', '760': 'TX', '761': 'TX',
  '762': 'TX', '763': 'TX', '764': 'TX', '765': 'TX', '766': 'TX', '767': 'TX',
  '768': 'TX', '769': 'TX', '770': 'TX', '771': 'TX', '772': 'TX', '773': 'TX',
  '774': 'TX', '775': 'TX', '776': 'TX', '777': 'TX', '778': 'TX', '779': 'TX',
  '780': 'TX', '781': 'TX', '782': 'TX', '783': 'TX', '784': 'TX', '785': 'TX',
  '786': 'TX', '787': 'TX', '788': 'TX', '789': 'TX', '790': 'TX', '791': 'TX',
  '792': 'TX', '793': 'TX', '794': 'TX', '795': 'TX', '796': 'TX', '797': 'TX',
  '798': 'TX', '799': 'TX',
  
  // Pennsylvania (150-196)
  '150': 'PA', '151': 'PA', '152': 'PA', '153': 'PA', '154': 'PA', '155': 'PA',
  '156': 'PA', '157': 'PA', '158': 'PA', '159': 'PA', '160': 'PA', '161': 'PA',
  '162': 'PA', '163': 'PA', '164': 'PA', '165': 'PA', '166': 'PA', '167': 'PA',
  '168': 'PA', '169': 'PA', '170': 'PA', '171': 'PA', '172': 'PA', '173': 'PA',
  '174': 'PA', '175': 'PA', '176': 'PA', '177': 'PA', '178': 'PA', '179': 'PA',
  '180': 'PA', '181': 'PA', '182': 'PA', '183': 'PA', '184': 'PA', '185': 'PA',
  '186': 'PA', '187': 'PA', '188': 'PA', '189': 'PA', '190': 'PA', '191': 'PA',
  '192': 'PA', '193': 'PA', '194': 'PA', '195': 'PA', '196': 'PA',
  
  // New Jersey (070-089)
  '070': 'NJ', '071': 'NJ', '072': 'NJ', '073': 'NJ', '074': 'NJ', '075': 'NJ',
  '076': 'NJ', '077': 'NJ', '078': 'NJ', '079': 'NJ', '080': 'NJ', '081': 'NJ',
  '082': 'NJ', '083': 'NJ', '084': 'NJ', '085': 'NJ', '086': 'NJ', '087': 'NJ',
  '088': 'NJ', '089': 'NJ',
  
  // Maryland (206-219)
  '206': 'MD', '207': 'MD', '208': 'MD', '209': 'MD', '210': 'MD', '211': 'MD',
  '212': 'MD', '214': 'MD', '215': 'MD', '216': 'MD', '217': 'MD', '218': 'MD',
  '219': 'MD',
  
  // Ohio (430-458)
  '430': 'OH', '431': 'OH', '432': 'OH', '433': 'OH', '434': 'OH', '435': 'OH',
  '436': 'OH', '437': 'OH', '438': 'OH', '439': 'OH', '440': 'OH', '441': 'OH',
  '442': 'OH', '443': 'OH', '444': 'OH', '445': 'OH', '446': 'OH', '447': 'OH',
  '448': 'OH', '449': 'OH', '450': 'OH', '451': 'OH', '452': 'OH', '453': 'OH',
  '454': 'OH', '455': 'OH', '456': 'OH', '457': 'OH', '458': 'OH',
  
  // Illinois (600-629)
  '600': 'IL', '601': 'IL', '602': 'IL', '603': 'IL', '604': 'IL', '605': 'IL',
  '606': 'IL', '607': 'IL', '608': 'IL', '609': 'IL', '610': 'IL', '611': 'IL',
  '612': 'IL', '613': 'IL', '614': 'IL', '615': 'IL', '616': 'IL', '617': 'IL',
  '618': 'IL', '619': 'IL', '620': 'IL', '621': 'IL', '622': 'IL', '623': 'IL',
  '624': 'IL', '625': 'IL', '626': 'IL', '627': 'IL', '628': 'IL', '629': 'IL',
  
  // Michigan (480-499)
  '480': 'MI', '481': 'MI', '482': 'MI', '483': 'MI', '484': 'MI', '485': 'MI',
  '486': 'MI', '487': 'MI', '488': 'MI', '489': 'MI', '490': 'MI', '491': 'MI',
  '492': 'MI', '493': 'MI', '494': 'MI', '495': 'MI', '496': 'MI', '497': 'MI',
  '498': 'MI', '499': 'MI',
  
  // Connecticut (060-069)
  '060': 'CT', '061': 'CT', '062': 'CT', '063': 'CT', '064': 'CT', '065': 'CT',
  '066': 'CT', '067': 'CT', '068': 'CT', '069': 'CT',
  
  // Massachusetts (010-027)
  '010': 'MA', '011': 'MA', '012': 'MA', '013': 'MA', '014': 'MA', '015': 'MA',
  '016': 'MA', '017': 'MA', '018': 'MA', '019': 'MA', '020': 'MA', '021': 'MA',
  '022': 'MA', '023': 'MA', '024': 'MA', '025': 'MA', '026': 'MA', '027': 'MA',
  
  // Rhode Island (028-029)
  '028': 'RI', '029': 'RI',
  
  // New Hampshire (030-038)
  '030': 'NH', '031': 'NH', '032': 'NH', '033': 'NH', '034': 'NH', '035': 'NH',
  '036': 'NH', '037': 'NH', '038': 'NH',
  
  // Maine (039-049)
  '039': 'ME', '040': 'ME', '041': 'ME', '042': 'ME', '043': 'ME', '044': 'ME',
  '045': 'ME', '046': 'ME', '047': 'ME', '048': 'ME', '049': 'ME',
  
  // New York (100-149)
  '100': 'NY', '101': 'NY', '102': 'NY', '103': 'NY', '104': 'NY', '105': 'NY',
  '106': 'NY', '107': 'NY', '108': 'NY', '109': 'NY', '110': 'NY', '111': 'NY',
  '112': 'NY', '113': 'NY', '114': 'NY', '115': 'NY', '116': 'NY', '117': 'NY',
  '118': 'NY', '119': 'NY', '120': 'NY', '121': 'NY', '122': 'NY', '123': 'NY',
  '124': 'NY', '125': 'NY', '126': 'NY', '127': 'NY', '128': 'NY', '129': 'NY',
  '130': 'NY', '131': 'NY', '132': 'NY', '133': 'NY', '134': 'NY', '135': 'NY',
  '136': 'NY', '137': 'NY', '138': 'NY', '139': 'NY', '140': 'NY', '141': 'NY',
  '142': 'NY', '143': 'NY', '144': 'NY', '145': 'NY', '146': 'NY', '147': 'NY',
  '148': 'NY', '149': 'NY',
  
  // Delaware (197-199)
  '197': 'DE', '198': 'DE', '199': 'DE',
  
  // DC (200-205)
  '200': 'DC', '201': 'DC', '202': 'DC', '203': 'DC', '204': 'DC', '205': 'DC',
  
  // Oregon (970-979)
  '970': 'OR', '971': 'OR', '972': 'OR', '973': 'OR', '974': 'OR', '975': 'OR',
  '976': 'OR', '977': 'OR', '978': 'OR', '979': 'OR',
  
  // Montana (590-599)
  '590': 'MT', '591': 'MT', '592': 'MT', '593': 'MT', '594': 'MT', '595': 'MT',
  '596': 'MT', '597': 'MT', '598': 'MT', '599': 'MT'
};

export const validateZipCode = (zip) => {
  if (!zip || zip.length !== 5) {
    return { valid: false, error: "Please enter a 5-digit ZIP code" };
  }
  
  const prefix = zip.substring(0, 3);
  const stateCode = ZIP_TO_STATE[prefix];
  
  if (!stateCode) {
    return { 
      valid: false, 
      error: "This ZIP code is not in a deregulated electricity market", 
      waitlist: true 
    };
  }
  
  const stateInfo = DEREGULATED_STATES[stateCode];
  
  return { 
    valid: true, 
    state: stateCode,
    stateName: stateInfo.name,
    stateFullName: stateInfo.fullName,
    deregulated: true,
    marketType: stateInfo.marketType,
    avgSavings: stateInfo.avgSavings,
    providerCount: stateInfo.providerCount
  };
};

export const getStateByZip = (zip) => {
  if (!zip || zip.length < 3) return null;
  const prefix = zip.substring(0, 3);
  return ZIP_TO_STATE[prefix];
};

export const getAllDeregulatedStates = () => {
  return Object.entries(DEREGULATED_STATES).map(([code, data]) => ({
    code,
    ...data
  }));
};
// Comprehensive provider availability mapping by ZIP code
// This ensures accurate provider-to-ZIP matching across the platform
// 
// IMPORTANT: This data structure is the single source of truth for:
// - Which providers serve which ZIP codes
// - Provider logos and websites
// - State-level coverage
//
// When adding real-time data, this structure ensures filtering accuracy

// Provider information with service areas
export const PROVIDERS = {
  "TXU Energy": {
    name: "TXU Energy",
    states: ["TX"],
    logo: "https://www.txu.com/-/media/txu/images/logos/txu-logo.svg",
    website: "https://www.txu.com",
    zipCodes: [
      // Houston area
      "77002", "77003", "77004", "77005", "77006", "77007", "77008", "77009", "77010",
      "77011", "77012", "77013", "77014", "77015", "77016", "77017", "77018", "77019",
      "77020", "77021", "77022", "77023", "77024", "77025", "77026", "77027", "77028",
      "77029", "77030", "77031", "77032", "77033", "77034", "77035", "77036", "77037",
      "77038", "77039", "77040", "77041", "77042", "77043", "77044", "77045", "77046",
      "77047", "77048", "77049", "77050", "77051", "77053", "77054", "77055", "77056",
      "77057", "77058", "77059", "77060", "77061", "77062", "77063", "77064", "77065",
      "77066", "77067", "77068", "77069", "77070", "77071", "77072", "77073", "77074",
      "77075", "77076", "77077", "77078", "77079", "77080", "77081", "77082", "77083",
      "77084", "77085", "77086", "77087", "77088", "77089", "77090", "77091", "77092",
      "77093", "77094", "77095", "77096", "77098", "77099",
      // Dallas area
      "75201", "75202", "75203", "75204", "75205", "75206", "75207", "75208", "75209",
      "75210", "75211", "75212", "75214", "75215", "75216", "75217", "75218", "75219",
      "75220", "75221", "75222", "75223", "75224", "75225", "75226", "75227", "75228",
      "75229", "75230", "75231", "75232", "75233", "75234", "75235", "75236", "75237",
      "75238", "75240", "75241", "75242", "75243", "75244", "75246", "75247", "75248",
      "75249", "75251", "75252", "75253", "75254",
      // Austin area
      "78701", "78702", "78703", "78704", "78705", "78712", "78717", "78719", "78721",
      "78722", "78723", "78724", "78725", "78726", "78727", "78728", "78729", "78730",
      "78731", "78732", "78733", "78734", "78735", "78736", "78737", "78738", "78739",
      "78741", "78742", "78744", "78745", "78746", "78747", "78748", "78749", "78750",
      "78751", "78752", "78753", "78754", "78756", "78757", "78758", "78759",
      // Tyler area (75703 and surrounding)
      "75701", "75702", "75703", "75704", "75705", "75706", "75707", "75708", "75709"
    ]
  },
  "Reliant Energy": {
    name: "Reliant Energy",
    states: ["TX"],
    logo: "https://www.reliant.com/content/dam/reliant/images/logo/reliant-logo.svg",
    website: "https://www.reliant.com",
    zipCodes: [
      // Houston area (full coverage)
      "77002", "77003", "77004", "77005", "77006", "77007", "77008", "77009", "77010",
      "77011", "77012", "77013", "77014", "77015", "77016", "77017", "77018", "77019",
      "77020", "77021", "77022", "77023", "77024", "77025", "77026", "77027", "77028",
      "77029", "77030", "77031", "77032", "77033", "77034", "77035", "77036", "77037",
      "77038", "77039", "77040", "77041", "77042", "77043", "77044", "77045", "77046",
      "77047", "77048", "77049", "77050", "77051", "77053", "77054", "77055", "77056",
      "77057", "77058", "77059", "77060", "77061", "77062", "77063", "77064", "77065",
      "77066", "77067", "77068", "77069", "77070", "77071", "77072", "77073", "77074",
      "77075", "77076", "77077", "77078", "77079", "77080", "77081", "77082", "77083",
      "77084", "77085", "77086", "77087", "77088", "77089", "77090", "77091", "77092",
      "77093", "77094", "77095", "77096", "77098", "77099",
      // Dallas area
      "75201", "75202", "75203", "75204", "75205", "75206", "75207", "75208", "75209",
      "75210", "75211", "75212", "75214", "75215", "75216", "75217", "75218", "75219",
      "75220", "75221", "75222", "75223", "75224", "75225", "75226", "75227", "75228",
      "75229", "75230", "75231", "75232", "75233", "75234", "75235", "75236", "75237",
      "75238", "75240", "75241", "75242", "75243", "75244", "75246", "75247", "75248",
      // Tyler area
      "75701", "75702", "75703", "75704", "75705", "75706", "75707", "75708", "75709"
    ]
  },
  "Gexa Energy": {
    name: "Gexa Energy",
    states: ["TX"],
    logo: "https://www.gexaenergy.com/wp-content/uploads/2021/01/gexa-energy-logo.svg",
    website: "https://www.gexaenergy.com",
    zipCodes: [
      // Houston area
      "77002", "77003", "77004", "77005", "77006", "77007", "77008", "77019",
      "77024", "77027", "77056", "77063", "77098",
      "77042", "77043", "77055", "77057", "77077", "77079", "77080", "77081",
      // Dallas area  
      "75201", "75202", "75204", "75205", "75206", "75214", "75219", "75225",
      "75230", "75231", "75240", "75243", "75248",
      // Fort Worth
      "76102", "76104", "76107", "76109", "76116", "76132",
      // Tyler area
      "75701", "75702", "75703", "75704", "75705"
    ]
  },
  "Direct Energy": {
    name: "Direct Energy",
    states: ["TX", "PA", "NY", "OH", "IL", "NJ", "MD"],
    logo: "https://www.directenergy.com/sites/retail/themes/custom/de_theme/logo.svg",
    website: "https://www.directenergy.com",
    zipCodes: [
      // Texas - Houston
      "77002", "77019", "77024", "77027", "77056", "77063",
      // Texas - Dallas
      "75201", "75204", "75205", "75219", "75225", "75230",
      // Pennsylvania - Philadelphia
      "19102", "19103", "19104", "19106", "19107", "19130", "19146",
      // Pennsylvania - Pittsburgh
      "15201", "15203", "15206", "15210", "15213", "15232",
      // New York - NYC
      "10001", "10002", "10003", "10009", "10010", "10011", "10012", "10013", "10014",
      // Ohio - Cleveland
      "44101", "44102", "44103", "44105", "44106", "44113", "44114", "44115",
      // Ohio - Columbus
      "43201", "43202", "43203", "43204", "43205", "43206", "43215",
      // Illinois - Chicago
      "60601", "60602", "60603", "60604", "60605", "60606", "60607", "60610"
    ]
  },
  "Frontier Utilities": {
    name: "Frontier Utilities",
    states: ["TX"],
    logo: "https://www.frontierutilities.com/wp-content/uploads/2020/01/frontier-logo.png",
    website: "https://www.frontierutilities.com",
    zipCodes: [
      // Houston area
      "77002", "77003", "77004", "77005", "77006", "77019", "77024", "77027",
      "77056", "77063", "77098", "77042", "77043", "77055",
      // Dallas area
      "75201", "75202", "75204", "75205", "75206", "75214", "75219", "75225",
      // San Antonio
      "78201", "78202", "78203", "78204", "78209", "78212", "78216", "78232"
    ]
  },
  "Green Mountain Energy": {
    name: "Green Mountain Energy",
    states: ["TX", "PA", "NJ"],
    logo: "https://www.greenmountainenergy.com/wp-content/themes/gme/images/logo.svg",
    website: "https://www.greenmountainenergy.com",
    zipCodes: [
      // Texas - Houston
      "77002", "77019", "77024", "77027", "77056", "77063", "77098",
      // Texas - Dallas
      "75201", "75204", "75205", "75219", "75225", "75230",
      // Texas - Austin
      "78701", "78702", "78703", "78704", "78731", "78745",
      // Pennsylvania
      "19102", "19103", "19104",
      // New Jersey
      "07001", "07002", "07003"
    ]
  },
  "Pulse Power": {
    name: "Pulse Power",
    states: ["TX"],
    logo: "https://www.pulsepower.com/wp-content/uploads/2021/01/pulse-power-logo.svg",
    website: "https://www.pulsepower.com",
    zipCodes: [
      // Houston
      "77002", "77003", "77004", "77005", "77006", "77007", "77008", "77019",
      "77024", "77027", "77056", "77063", "77098",
      // Dallas
      "75201", "75202", "75204", "75205", "75206", "75214", "75219", "75225"
    ]
  },
  "Champion Energy": {
    name: "Champion Energy",
    states: ["TX", "PA"],
    logo: "https://championenergyservices.com/wp-content/uploads/2020/07/champion-energy-logo.svg",
    website: "https://www.championenergyservices.com",
    zipCodes: [
      // Texas - Houston
      "77002", "77019", "77024", "77027", "77056", "77063",
      // Texas - Dallas
      "75201", "75204", "75205", "75219", "75225",
      // Pennsylvania
      "19102", "19103", "19104", "15201", "15203"
    ]
  },
  "Constellation": {
    name: "Constellation",
    states: ["TX", "PA", "NY", "OH", "IL", "NJ", "MD", "MA", "ME", "NH", "RI", "CT"],
    logo: "https://www.constellation.com/content/dam/constellationenergy/images/logo/constellation-logo.svg",
    website: "https://www.constellation.com",
    zipCodes: [
      // Multi-state coverage - major cities only shown
      // Texas
      "77002", "77019", "75201", "75204", "78701", "78702",
      // Pennsylvania
      "19102", "19103", "15201", "15203",
      // New York
      "10001", "10002", "10003", "10009",
      // Ohio
      "44101", "44102", "43201", "43202",
      // Illinois
      "60601", "60602", "60603", "60604",
      // New Jersey
      "07001", "07002", "07003",
      // Maryland
      "21201", "21202", "21218",
      // Massachusetts
      "02101", "02108", "02109",
      // Maine
      "04101", "04102",
      // New Hampshire
      "03101", "03102",
      // Rhode Island
      "02901", "02903",
      // Connecticut
      "06101", "06103"
    ]
  },
  "4Change Energy": {
    name: "4Change Energy",
    states: ["TX"],
    logo: "https://www.4changeenergy.com/wp-content/themes/4change/images/logo.svg",
    website: "https://www.4changeenergy.com",
    zipCodes: [
      // Houston
      "77002", "77003", "77004", "77019", "77024", "77027", "77056",
      // Dallas
      "75201", "75202", "75204", "75205", "75219"
    ]
  }
};

// Function to get providers available for a specific ZIP code
export const getProvidersForZipCode = (zipCode) => {
  if (!zipCode || zipCode.length !== 5) return [];
  
  const availableProviders = [];
  
  // First, try exact ZIP match
  Object.values(PROVIDERS).forEach(provider => {
    if (provider.zipCodes.includes(zipCode)) {
      availableProviders.push(provider);
    }
  });
  
  // If no exact match, fall back to state-level providers
  if (availableProviders.length === 0) {
    const stateCode = getStateFromZip(zipCode);
    if (stateCode) {
      Object.values(PROVIDERS).forEach(provider => {
        if (provider.states.includes(stateCode)) {
          availableProviders.push(provider);
        }
      });
    }
  }
  
  return availableProviders;
};

// Function to check if a provider serves a specific ZIP code
export const providerServesZip = (providerName, zipCode) => {
  const provider = PROVIDERS[providerName];
  if (!provider) return false;
  
  // Check exact ZIP match
  if (provider.zipCodes.includes(zipCode)) return true;
  
  // Fallback: check if provider serves the state
  const stateCode = getStateFromZip(zipCode);
  if (stateCode && provider.states.includes(stateCode)) {
    return true;
  }
  
  return false;
};

// Function to get provider details
export const getProviderDetails = (providerName) => {
  return PROVIDERS[providerName] || null;
};

// Function to get all available provider names for a ZIP
export const getProviderNamesForZip = (zipCode) => {
  return getProvidersForZipCode(zipCode).map(p => p.name);
};

// ZIP code to city mapping
export const ZIP_TO_CITY = {
  // Houston area
  "77002": "Houston", "77003": "Houston", "77004": "Houston", "77005": "Houston",
  "77006": "Houston", "77007": "Houston", "77008": "Houston", "77009": "Houston",
  "77019": "Houston", "77024": "Houston", "77027": "Houston", "77056": "Houston",
  "77063": "Houston", "77098": "Houston", "77042": "Houston", "77043": "Houston",
  
  // Dallas area
  "75201": "Dallas", "75202": "Dallas", "75204": "Dallas", "75205": "Dallas",
  "75206": "Dallas", "75214": "Dallas", "75219": "Dallas", "75225": "Dallas",
  "75230": "Dallas", "75231": "Dallas", "75240": "Dallas", "75243": "Dallas",
  
  // Tyler area
  "75701": "Tyler", "75702": "Tyler", "75703": "Tyler", "75704": "Tyler", "75705": "Tyler",
  
  // Austin area
  "78701": "Austin", "78702": "Austin", "78703": "Austin", "78704": "Austin",
  "78731": "Austin", "78745": "Austin", "78757": "Austin",
  
  // Fort Worth
  "76102": "Fort Worth", "76104": "Fort Worth", "76107": "Fort Worth",
  
  // San Antonio
  "78201": "San Antonio", "78202": "San Antonio", "78209": "San Antonio",
  
  // Pennsylvania - Philadelphia
  "19102": "Philadelphia", "19103": "Philadelphia", "19104": "Philadelphia",
  
  // Pennsylvania - Pittsburgh
  "15201": "Pittsburgh", "15203": "Pittsburgh", "15206": "Pittsburgh",
  
  // New York - NYC
  "10001": "New York", "10002": "New York", "10003": "New York",
  
  // Ohio - Cleveland
  "44101": "Cleveland", "44102": "Cleveland", "44103": "Cleveland",
  
  // Ohio - Columbus
  "43201": "Columbus", "43202": "Columbus", "43203": "Columbus",
  
  // Illinois - Chicago
  "60601": "Chicago", "60602": "Chicago", "60603": "Chicago",
  
  // New Jersey
  "07001": "Newark", "07002": "Newark", "07003": "Newark",
  
  // Maryland - Baltimore
  "21201": "Baltimore", "21202": "Baltimore", "21218": "Baltimore",
  
  // Massachusetts - Boston
  "02101": "Boston", "02108": "Boston", "02109": "Boston",
  
  // Maine - Portland
  "04101": "Portland", "04102": "Portland",
  
  // New Hampshire - Manchester
  "03101": "Manchester", "03102": "Manchester",
  
  // Rhode Island - Providence
  "02901": "Providence", "02903": "Providence",
  
  // Connecticut - Hartford
  "06101": "Hartford", "06103": "Hartford"
};

// Helper to get state from ZIP
export const getStateFromZip = (zipCode) => {
  if (!zipCode || zipCode.length < 3) return null;
  const prefix = zipCode.substring(0, 3);
  
  // Import state mapping from stateData
  const ZIP_TO_STATE = {
    '750': 'TX', '751': 'TX', '752': 'TX', '753': 'TX', '754': 'TX', '755': 'TX',
    '756': 'TX', '757': 'TX', '758': 'TX', '759': 'TX', '760': 'TX', '761': 'TX',
    '762': 'TX', '763': 'TX', '764': 'TX', '765': 'TX', '766': 'TX', '767': 'TX',
    '768': 'TX', '769': 'TX', '770': 'TX', '771': 'TX', '772': 'TX', '773': 'TX',
    '774': 'TX', '775': 'TX', '776': 'TX', '777': 'TX', '778': 'TX', '779': 'TX',
    '780': 'TX', '781': 'TX', '782': 'TX', '783': 'TX', '784': 'TX', '785': 'TX',
    '786': 'TX', '787': 'TX', '788': 'TX', '789': 'TX', '790': 'TX', '791': 'TX',
    '792': 'TX', '793': 'TX', '794': 'TX', '795': 'TX', '796': 'TX', '797': 'TX',
    '798': 'TX', '799': 'TX',
    '150': 'PA', '151': 'PA', '152': 'PA', '153': 'PA', '154': 'PA', '155': 'PA',
    '156': 'PA', '157': 'PA', '158': 'PA', '159': 'PA', '160': 'PA', '161': 'PA',
    '162': 'PA', '163': 'PA', '164': 'PA', '165': 'PA', '166': 'PA', '167': 'PA',
    '168': 'PA', '169': 'PA', '170': 'PA', '171': 'PA', '172': 'PA', '173': 'PA',
    '174': 'PA', '175': 'PA', '176': 'PA', '177': 'PA', '178': 'PA', '179': 'PA',
    '180': 'PA', '181': 'PA', '182': 'PA', '183': 'PA', '184': 'PA', '185': 'PA',
    '186': 'PA', '187': 'PA', '188': 'PA', '189': 'PA', '190': 'PA', '191': 'PA',
    '192': 'PA', '193': 'PA', '194': 'PA', '195': 'PA', '196': 'PA',
    '070': 'NJ', '071': 'NJ', '072': 'NJ', '073': 'NJ', '074': 'NJ', '075': 'NJ',
    '076': 'NJ', '077': 'NJ', '078': 'NJ', '079': 'NJ', '080': 'NJ', '081': 'NJ',
    '082': 'NJ', '083': 'NJ', '084': 'NJ', '085': 'NJ', '086': 'NJ', '087': 'NJ',
    '088': 'NJ', '089': 'NJ',
    '206': 'MD', '207': 'MD', '208': 'MD', '209': 'MD', '210': 'MD', '211': 'MD',
    '212': 'MD', '214': 'MD', '215': 'MD', '216': 'MD', '217': 'MD', '218': 'MD',
    '219': 'MD',
    '430': 'OH', '431': 'OH', '432': 'OH', '433': 'OH', '434': 'OH', '435': 'OH',
    '436': 'OH', '437': 'OH', '438': 'OH', '439': 'OH', '440': 'OH', '441': 'OH',
    '442': 'OH', '443': 'OH', '444': 'OH', '445': 'OH', '446': 'OH', '447': 'OH',
    '448': 'OH', '449': 'OH', '450': 'OH', '451': 'OH', '452': 'OH', '453': 'OH',
    '454': 'OH', '455': 'OH', '456': 'OH', '457': 'OH', '458': 'OH',
    '600': 'IL', '601': 'IL', '602': 'IL', '603': 'IL', '604': 'IL', '605': 'IL',
    '606': 'IL', '607': 'IL', '608': 'IL', '609': 'IL', '610': 'IL', '611': 'IL',
    '612': 'IL', '613': 'IL', '614': 'IL', '615': 'IL', '616': 'IL', '617': 'IL',
    '618': 'IL', '619': 'IL', '620': 'IL', '621': 'IL', '622': 'IL', '623': 'IL',
    '624': 'IL', '625': 'IL', '626': 'IL', '627': 'IL', '628': 'IL', '629': 'IL',
    '060': 'CT', '061': 'CT', '062': 'CT', '063': 'CT', '064': 'CT', '065': 'CT',
    '066': 'CT', '067': 'CT', '068': 'CT', '069': 'CT',
    '010': 'MA', '011': 'MA', '012': 'MA', '013': 'MA', '014': 'MA', '015': 'MA',
    '016': 'MA', '017': 'MA', '018': 'MA', '019': 'MA', '020': 'MA', '021': 'MA',
    '022': 'MA', '023': 'MA', '024': 'MA', '025': 'MA', '026': 'MA', '027': 'MA',
    '028': 'RI', '029': 'RI',
    '030': 'NH', '031': 'NH', '032': 'NH', '033': 'NH', '034': 'NH', '035': 'NH',
    '036': 'NH', '037': 'NH', '038': 'NH',
    '039': 'ME', '040': 'ME', '041': 'ME', '042': 'ME', '043': 'ME', '044': 'ME',
    '045': 'ME', '046': 'ME', '047': 'ME', '048': 'ME', '049': 'ME',
    '100': 'NY', '101': 'NY', '102': 'NY', '103': 'NY', '104': 'NY', '105': 'NY',
    '106': 'NY', '107': 'NY', '108': 'NY', '109': 'NY', '110': 'NY', '111': 'NY',
    '112': 'NY', '113': 'NY', '114': 'NY', '115': 'NY', '116': 'NY', '117': 'NY',
    '118': 'NY', '119': 'NY', '120': 'NY', '121': 'NY', '122': 'NY', '123': 'NY',
    '124': 'NY', '125': 'NY', '126': 'NY', '127': 'NY', '128': 'NY', '129': 'NY',
    '130': 'NY', '131': 'NY', '132': 'NY', '133': 'NY', '134': 'NY', '135': 'NY',
    '136': 'NY', '137': 'NY', '138': 'NY', '139': 'NY', '140': 'NY', '141': 'NY',
    '142': 'NY', '143': 'NY', '144': 'NY', '145': 'NY', '146': 'NY', '147': 'NY',
    '148': 'NY', '149': 'NY'
  };
  
  return ZIP_TO_STATE[prefix] || null;
};

// Get city name from ZIP code
export const getCityFromZip = (zipCode) => {
  const city = ZIP_TO_CITY[zipCode];
  if (city) return city;
  
  // Fallback: return state name + "area" if ZIP is valid but city not mapped
  const stateCode = getStateFromZip(zipCode);
  if (stateCode) {
    const stateNames = {
      'TX': 'Texas', 'IL': 'Illinois', 'OH': 'Ohio', 'PA': 'Pennsylvania',
      'NY': 'New York', 'NJ': 'New Jersey', 'MD': 'Maryland', 'MA': 'Massachusetts',
      'ME': 'Maine', 'NH': 'New Hampshire', 'RI': 'Rhode Island', 'CT': 'Connecticut'
    };
    return stateNames[stateCode] || "your area";
  }
  
  return "your area";
};

// Get all unique provider names in the system
export const getAllProviderNames = () => {
  return Object.keys(PROVIDERS);
};

// Validate if provider exists in our system
export const isValidProvider = (providerName) => {
  return PROVIDERS.hasOwnProperty(providerName);
};
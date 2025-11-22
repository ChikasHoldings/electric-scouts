import { base44 } from "@/api/base44Client";

// Database-driven provider system
let cachedProviders = null;

// Fetch providers from database
async function fetchProviders() {
  if (cachedProviders) return cachedProviders;
  
  try {
    const providers = await base44.entities.ElectricityProvider.filter(
      { is_active: true },
      '-created_date',
      100
    );
    cachedProviders = providers;
    return providers;
  } catch (error) {
    console.error('Failed to fetch providers:', error);
    return [];
  }
}

// Clear cache when needed
export function clearProviderCache() {
  cachedProviders = null;
}

// Function to get providers available for a specific ZIP code
export const getProvidersForZipCode = async (zipCode) => {
  if (!zipCode || zipCode.length !== 5) return [];
  
  const stateCode = getStateFromZip(zipCode);
  if (!stateCode) return [];
  
  const providers = await fetchProviders();
  
  // Filter providers by state
  const availableProviders = providers.filter(provider => {
    const supportedStates = provider.supported_states || provider.data?.supported_states || [];
    return supportedStates.includes(stateCode);
  }).map(provider => ({
    name: provider.name || provider.data?.name,
    logo: provider.logo_url || provider.data?.logo_url,
    website: provider.affiliate_url || provider.data?.affiliate_url || provider.website_url || provider.data?.website_url,
    states: provider.supported_states || provider.data?.supported_states || [],
    isRecommended: provider.is_recommended || provider.data?.is_recommended || false,
    isFeatured: provider.is_featured || provider.data?.is_featured || false
  }));
  
  // Sort: recommended first
  return availableProviders.sort((a, b) => {
    if (a.isRecommended && !b.isRecommended) return -1;
    if (!a.isRecommended && b.isRecommended) return 1;
    return 0;
  });
};

// Function to check if a provider serves a specific ZIP code
export const providerServesZip = async (providerName, zipCode) => {
  const stateCode = getStateFromZip(zipCode);
  if (!stateCode) return false;
  
  const providers = await fetchProviders();
  const provider = providers.find(p => 
    (p.name || p.data?.name) === providerName
  );
  
  if (!provider) return false;
  
  const supportedStates = provider.supported_states || provider.data?.supported_states || [];
  return supportedStates.includes(stateCode);
};

// Function to get provider details
export const getProviderDetails = async (providerName) => {
  const providers = await fetchProviders();
  const provider = providers.find(p => 
    (p.name || p.data?.name) === providerName
  );
  
  if (!provider) return null;
  
  return {
    name: provider.name || provider.data?.name,
    logo: provider.logo_url || provider.data?.logo_url,
    website: provider.affiliate_url || provider.data?.affiliate_url || provider.website_url || provider.data?.website_url,
    states: provider.supported_states || provider.data?.supported_states || [],
    isRecommended: provider.is_recommended || provider.data?.is_recommended || false
  };
};

// Function to get all available provider names for a ZIP
export const getProviderNamesForZip = async (zipCode) => {
  const providers = await getProvidersForZipCode(zipCode);
  return providers.map(p => p.name);
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
export const getAllProviderNames = async () => {
  const providers = await fetchProviders();
  return providers.map(p => p.name || p.data?.name);
};

// Validate if provider exists in our system
export const isValidProvider = async (providerName) => {
  const providers = await fetchProviders();
  return providers.some(p => (p.name || p.data?.name) === providerName);
};
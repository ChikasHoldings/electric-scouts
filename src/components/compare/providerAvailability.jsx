import { ElectricityProvider } from "@/api/supabaseEntities";

// Database-driven provider system
let cachedProviders = null;

// Fetch providers from database
async function fetchProviders() {
  if (cachedProviders) return cachedProviders;
  
  try {
    const providers = await ElectricityProvider.filter(
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

/**
 * Checks if a provider serves a specific ZIP code using service_areas JSONB data.
 * Handles two service_areas formats:
 *   1. Simple (TX-only): { excluded_zip_prefixes: [...], utility_territories: [...] }
 *   2. Multi-state: { state_config: { TX: { excluded_zip_prefixes: [...] }, OH: {...} } }
 * Returns false if the ZIP prefix is in the provider's excluded list.
 */
const isProviderAvailableForZip = (provider, zipCode, stateCode) => {
  const serviceAreas = provider.service_areas;
  const zipPrefix = zipCode.substring(0, 3);

  // If no service_areas data, fall back to supported_states check only
  if (!serviceAreas) {
    const supportedStates = provider.supported_states || [];
    return supportedStates.includes(stateCode);
  }

  // Multi-state config format: { state_config: { TX: {...}, OH: {...} } }
  if (serviceAreas.state_config) {
    const stateConfig = serviceAreas.state_config[stateCode];
    // Provider doesn't serve this state at all
    if (!stateConfig) return false;
    // Check excluded ZIP prefixes for this state
    const excludedPrefixes = stateConfig.excluded_zip_prefixes || [];
    if (excludedPrefixes.length > 0 && excludedPrefixes.includes(zipPrefix)) {
      return false;
    }
    return true;
  }

  // Simple format (TX-only providers): { excluded_zip_prefixes: [...] }
  if (serviceAreas.excluded_zip_prefixes) {
    const supportedStates = provider.supported_states || [];
    if (!supportedStates.includes(stateCode)) return false;
    const excludedPrefixes = serviceAreas.excluded_zip_prefixes || [];
    if (excludedPrefixes.length > 0 && excludedPrefixes.includes(zipPrefix)) {
      return false;
    }
    return true;
  }

  // Fallback: just check supported_states
  const supportedStates = provider.supported_states || [];
  return supportedStates.includes(stateCode);
};

// Function to get providers available for a specific ZIP code
export const getProvidersForZipCode = async (zipCode) => {
  
  if (!zipCode || zipCode.length !== 5) {
    return [];
  }
  
  const stateCode = getStateFromZip(zipCode);
  
  if (!stateCode) {
    return [];
  }
  
  const providers = await fetchProviders();
  
  // Filter providers by state AND ZIP-code-level service area
  const availableProviders = providers.filter(provider => {
    const isActive = provider.data?.is_active ?? provider.is_active ?? true;
    if (!isActive) return false;
    return isProviderAvailableForZip(provider, zipCode, stateCode);
  }).map(provider => {
    return {
      name: provider.name,
      logo: provider.logo_url,
      website: provider.affiliate_url || provider.website_url,
      states: provider.supported_states || [],
      isRecommended: provider.data?.is_recommended || provider.is_recommended || false,
      isFeatured: provider.data?.is_featured || provider.is_featured || false
    };
  });
  
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
  
  // Fetch from database to check provider availability
  const providers = await fetchProviders();
  const provider = providers.find(p => p.name === providerName);
  
  if (!provider) return false;
  
  return isProviderAvailableForZip(provider, zipCode, stateCode);
};

// Synchronous version for immediate checks (uses cache)
export const providerServesZipSync = (providerName, zipCode) => {
  const stateCode = getStateFromZip(zipCode);
  if (!stateCode) return false;
  
  // If cache is available, use it with full ZIP-level filtering
  if (!cachedProviders) {
    // Fallback mapping if cache not loaded yet
    const providerStateMapping = {
      'NextVolt Energy': ['TX', 'PA', 'OH', 'IL', 'DE']
    };
    const supportedStates = providerStateMapping[providerName] || [];
    return supportedStates.includes(stateCode);
  }
  
  const provider = cachedProviders.find(p => p.name === providerName);
  
  if (!provider) return false;
  
  return isProviderAvailableForZip(provider, zipCode, stateCode);
};

// Function to get provider details
export const getProviderDetails = async (providerName) => {
  const providers = await fetchProviders();
  const provider = providers.find(p => p.name === providerName);
  
  if (!provider) return null;
  
  return {
    name: provider.name,
    logo: provider.logo_url,
    website: provider.affiliate_url || provider.website_url,
    states: provider.supported_states || [],
    isRecommended: provider.data?.is_recommended || provider.is_recommended || false
  };
};

// Function to get all available provider names for a ZIP
export const getProviderNamesForZip = async (zipCode) => {
  const providers = await getProvidersForZipCode(zipCode);
  return providers.map(p => p.name);
};

// ZIP code to city mapping - comprehensive coverage for all 12 deregulated states
export const ZIP_TO_CITY = {
  // === TEXAS ===
  // Houston area
  "77001": "Houston", "77002": "Houston", "77003": "Houston", "77004": "Houston",
  "77005": "Houston", "77006": "Houston", "77007": "Houston", "77008": "Houston",
  "77009": "Houston", "77010": "Houston", "77011": "Houston", "77012": "Houston",
  "77013": "Houston", "77014": "Houston", "77015": "Houston", "77016": "Houston",
  "77017": "Houston", "77018": "Houston", "77019": "Houston", "77020": "Houston",
  "77021": "Houston", "77022": "Houston", "77023": "Houston", "77024": "Houston",
  "77025": "Houston", "77026": "Houston", "77027": "Houston", "77028": "Houston",
  "77029": "Houston", "77030": "Houston", "77031": "Houston", "77032": "Houston",
  "77033": "Houston", "77034": "Houston", "77035": "Houston", "77036": "Houston",
  "77037": "Houston", "77038": "Houston", "77039": "Houston", "77040": "Houston",
  "77041": "Houston", "77042": "Houston", "77043": "Houston", "77044": "Houston",
  "77045": "Houston", "77046": "Houston", "77047": "Houston", "77048": "Houston",
  "77049": "Houston", "77050": "Houston", "77051": "Houston", "77053": "Houston",
  "77054": "Houston", "77055": "Houston", "77056": "Houston", "77057": "Houston",
  "77058": "Houston", "77059": "Houston", "77060": "Houston", "77061": "Houston",
  "77062": "Houston", "77063": "Houston", "77064": "Houston", "77065": "Houston",
  "77066": "Houston", "77067": "Houston", "77068": "Houston", "77069": "Houston",
  "77070": "Houston", "77071": "Houston", "77072": "Houston", "77073": "Houston",
  "77074": "Houston", "77075": "Houston", "77076": "Houston", "77077": "Houston",
  "77078": "Houston", "77079": "Houston", "77080": "Houston", "77081": "Houston",
  "77082": "Houston", "77083": "Houston", "77084": "Houston", "77085": "Houston",
  "77086": "Houston", "77087": "Houston", "77088": "Houston", "77089": "Houston",
  "77090": "Houston", "77091": "Houston", "77092": "Houston", "77093": "Houston",
  "77094": "Houston", "77095": "Houston", "77096": "Houston", "77098": "Houston",
  "77099": "Houston",
  // Dallas area
  "75201": "Dallas", "75202": "Dallas", "75203": "Dallas", "75204": "Dallas",
  "75205": "Dallas", "75206": "Dallas", "75207": "Dallas", "75208": "Dallas",
  "75209": "Dallas", "75210": "Dallas", "75211": "Dallas", "75212": "Dallas",
  "75214": "Dallas", "75215": "Dallas", "75216": "Dallas", "75217": "Dallas",
  "75218": "Dallas", "75219": "Dallas", "75220": "Dallas", "75223": "Dallas",
  "75224": "Dallas", "75225": "Dallas", "75226": "Dallas", "75227": "Dallas",
  "75228": "Dallas", "75229": "Dallas", "75230": "Dallas", "75231": "Dallas",
  "75232": "Dallas", "75233": "Dallas", "75234": "Dallas", "75235": "Dallas",
  "75236": "Dallas", "75237": "Dallas", "75238": "Dallas", "75240": "Dallas",
  "75241": "Dallas", "75243": "Dallas", "75244": "Dallas", "75246": "Dallas",
  "75247": "Dallas", "75248": "Dallas", "75249": "Dallas", "75250": "Dallas",
  "75251": "Dallas", "75252": "Dallas", "75253": "Dallas", "75254": "Dallas",
  // Tyler area
  "75701": "Tyler", "75702": "Tyler", "75703": "Tyler", "75704": "Tyler", "75705": "Tyler", "75706": "Tyler", "75707": "Tyler", "75708": "Tyler", "75709": "Tyler",
  // Austin area
  "78701": "Austin", "78702": "Austin", "78703": "Austin", "78704": "Austin",
  "78705": "Austin", "78712": "Austin", "78717": "Austin", "78719": "Austin",
  "78721": "Austin", "78722": "Austin", "78723": "Austin", "78724": "Austin",
  "78725": "Austin", "78726": "Austin", "78727": "Austin", "78728": "Austin",
  "78729": "Austin", "78730": "Austin", "78731": "Austin", "78732": "Austin",
  "78733": "Austin", "78734": "Austin", "78735": "Austin", "78736": "Austin",
  "78737": "Austin", "78738": "Austin", "78739": "Austin", "78741": "Austin",
  "78742": "Austin", "78744": "Austin", "78745": "Austin", "78746": "Austin",
  "78747": "Austin", "78748": "Austin", "78749": "Austin", "78750": "Austin",
  "78751": "Austin", "78752": "Austin", "78753": "Austin", "78754": "Austin",
  "78756": "Austin", "78757": "Austin", "78758": "Austin", "78759": "Austin",
  // Fort Worth
  "76101": "Fort Worth", "76102": "Fort Worth", "76103": "Fort Worth", "76104": "Fort Worth",
  "76105": "Fort Worth", "76106": "Fort Worth", "76107": "Fort Worth", "76108": "Fort Worth",
  "76109": "Fort Worth", "76110": "Fort Worth", "76111": "Fort Worth", "76112": "Fort Worth",
  "76113": "Fort Worth", "76114": "Fort Worth", "76115": "Fort Worth", "76116": "Fort Worth",
  "76117": "Fort Worth", "76118": "Fort Worth", "76119": "Fort Worth", "76120": "Fort Worth",
  "76121": "Fort Worth", "76122": "Fort Worth", "76123": "Fort Worth", "76124": "Fort Worth",
  "76126": "Fort Worth", "76129": "Fort Worth", "76130": "Fort Worth", "76131": "Fort Worth",
  "76132": "Fort Worth", "76133": "Fort Worth", "76134": "Fort Worth", "76135": "Fort Worth",
  "76136": "Fort Worth", "76137": "Fort Worth", "76140": "Fort Worth", "76147": "Fort Worth",
  "76148": "Fort Worth", "76155": "Fort Worth", "76161": "Fort Worth", "76162": "Fort Worth",
  "76164": "Fort Worth", "76177": "Fort Worth", "76179": "Fort Worth", "76185": "Fort Worth",
  "76191": "Fort Worth", "76192": "Fort Worth", "76193": "Fort Worth", "76196": "Fort Worth",
  "76197": "Fort Worth", "76198": "Fort Worth", "76199": "Fort Worth",
  // San Antonio
  "78201": "San Antonio", "78202": "San Antonio", "78203": "San Antonio", "78204": "San Antonio",
  "78205": "San Antonio", "78206": "San Antonio", "78207": "San Antonio", "78208": "San Antonio",
  "78209": "San Antonio", "78210": "San Antonio", "78211": "San Antonio", "78212": "San Antonio",
  "78213": "San Antonio", "78214": "San Antonio", "78215": "San Antonio", "78216": "San Antonio",
  "78217": "San Antonio", "78218": "San Antonio", "78219": "San Antonio", "78220": "San Antonio",
  "78221": "San Antonio", "78222": "San Antonio", "78223": "San Antonio", "78224": "San Antonio",
  "78225": "San Antonio", "78226": "San Antonio", "78227": "San Antonio", "78228": "San Antonio",
  "78229": "San Antonio", "78230": "San Antonio", "78231": "San Antonio", "78232": "San Antonio",
  "78233": "San Antonio", "78234": "San Antonio", "78235": "San Antonio", "78236": "San Antonio",
  "78237": "San Antonio", "78238": "San Antonio", "78239": "San Antonio", "78240": "San Antonio",
  "78241": "San Antonio", "78242": "San Antonio", "78243": "San Antonio", "78244": "San Antonio",
  "78245": "San Antonio", "78246": "San Antonio", "78247": "San Antonio", "78248": "San Antonio",
  "78249": "San Antonio", "78250": "San Antonio", "78251": "San Antonio", "78252": "San Antonio",
  "78253": "San Antonio", "78254": "San Antonio", "78255": "San Antonio", "78256": "San Antonio",
  "78257": "San Antonio", "78258": "San Antonio", "78259": "San Antonio", "78260": "San Antonio",
  "78261": "San Antonio", "78263": "San Antonio", "78264": "San Antonio", "78266": "San Antonio",
  // Other TX cities
  "79901": "El Paso", "79902": "El Paso", "79903": "El Paso", "79904": "El Paso", "79905": "El Paso",
  "79906": "El Paso", "79907": "El Paso", "79908": "El Paso", "79910": "El Paso", "79911": "El Paso",
  "79912": "El Paso", "79913": "El Paso", "79914": "El Paso", "79915": "El Paso", "79916": "El Paso",
  "79920": "El Paso", "79922": "El Paso", "79924": "El Paso", "79925": "El Paso", "79927": "El Paso",
  "79928": "El Paso", "79930": "El Paso", "79932": "El Paso", "79934": "El Paso", "79935": "El Paso",
  "79936": "El Paso", "79938": "El Paso",
  "76001": "Arlington", "76002": "Arlington", "76003": "Arlington", "76004": "Arlington",
  "76005": "Arlington", "76006": "Arlington", "76010": "Arlington", "76011": "Arlington",
  "76012": "Arlington", "76013": "Arlington", "76014": "Arlington", "76015": "Arlington",
  "76016": "Arlington", "76017": "Arlington", "76018": "Arlington", "76019": "Arlington",
  "78401": "Corpus Christi", "78402": "Corpus Christi", "78404": "Corpus Christi",
  "78405": "Corpus Christi", "78406": "Corpus Christi", "78407": "Corpus Christi",
  "78408": "Corpus Christi", "78409": "Corpus Christi", "78410": "Corpus Christi",
  "78411": "Corpus Christi", "78412": "Corpus Christi", "78413": "Corpus Christi",
  "78414": "Corpus Christi", "78415": "Corpus Christi", "78416": "Corpus Christi",
  "78417": "Corpus Christi", "78418": "Corpus Christi",
  "75001": "Plano", "75023": "Plano", "75024": "Plano", "75025": "Plano", "75026": "Plano",
  "75074": "Plano", "75075": "Plano", "75086": "Plano", "75093": "Plano", "75094": "Plano",
  "77301": "Conroe", "77302": "Conroe", "77303": "Conroe", "77304": "Conroe", "77305": "Conroe",
  "77380": "The Woodlands", "77381": "The Woodlands", "77382": "The Woodlands", "77384": "The Woodlands", "77385": "The Woodlands", "77386": "The Woodlands", "77389": "The Woodlands",
  "77401": "Bellaire", "77459": "Missouri City", "77469": "Richmond", "77478": "Sugar Land", "77479": "Sugar Land", "77489": "Missouri City", "77494": "Katy", "77449": "Katy", "77450": "Katy",
  "75040": "Garland", "75041": "Garland", "75042": "Garland", "75043": "Garland", "75044": "Garland", "75045": "Garland", "75046": "Garland",
  "75060": "Irving", "75061": "Irving", "75062": "Irving", "75063": "Irving",
  "75080": "Richardson", "75081": "Richardson", "75082": "Richardson", "75083": "Richardson",
  "79101": "Amarillo", "79102": "Amarillo", "79103": "Amarillo", "79104": "Amarillo", "79106": "Amarillo", "79107": "Amarillo", "79108": "Amarillo", "79109": "Amarillo", "79110": "Amarillo", "79111": "Amarillo", "79118": "Amarillo", "79119": "Amarillo", "79121": "Amarillo", "79124": "Amarillo",
  "79401": "Lubbock", "79402": "Lubbock", "79403": "Lubbock", "79404": "Lubbock", "79405": "Lubbock", "79406": "Lubbock", "79407": "Lubbock", "79408": "Lubbock", "79409": "Lubbock", "79410": "Lubbock", "79411": "Lubbock", "79412": "Lubbock", "79413": "Lubbock", "79414": "Lubbock", "79415": "Lubbock", "79416": "Lubbock",
  "76501": "Temple", "76502": "Temple", "76503": "Temple", "76504": "Temple",
  "76541": "Killeen", "76542": "Killeen", "76543": "Killeen", "76544": "Killeen", "76549": "Killeen",
  "77520": "Baytown", "77521": "Baytown", "77522": "Baytown", "77523": "Baytown",
  "77550": "Galveston", "77551": "Galveston", "77553": "Galveston", "77554": "Galveston",

  // === OHIO ===
  // Columbus
  "43201": "Columbus", "43202": "Columbus", "43203": "Columbus", "43204": "Columbus",
  "43205": "Columbus", "43206": "Columbus", "43207": "Columbus", "43209": "Columbus",
  "43210": "Columbus", "43211": "Columbus", "43212": "Columbus", "43213": "Columbus",
  "43214": "Columbus", "43215": "Columbus", "43216": "Columbus", "43217": "Columbus",
  "43218": "Columbus", "43219": "Columbus", "43220": "Columbus", "43221": "Columbus",
  "43222": "Columbus", "43223": "Columbus", "43224": "Columbus", "43227": "Columbus",
  "43228": "Columbus", "43229": "Columbus", "43230": "Columbus", "43231": "Columbus",
  "43232": "Columbus", "43235": "Columbus", "43240": "Columbus",
  // Cleveland
  "44101": "Cleveland", "44102": "Cleveland", "44103": "Cleveland", "44104": "Cleveland",
  "44105": "Cleveland", "44106": "Cleveland", "44107": "Cleveland", "44108": "Cleveland",
  "44109": "Cleveland", "44110": "Cleveland", "44111": "Cleveland", "44112": "Cleveland",
  "44113": "Cleveland", "44114": "Cleveland", "44115": "Cleveland", "44116": "Cleveland",
  "44117": "Cleveland", "44118": "Cleveland", "44119": "Cleveland", "44120": "Cleveland",
  "44121": "Cleveland", "44122": "Cleveland", "44124": "Cleveland", "44125": "Cleveland",
  "44126": "Cleveland", "44127": "Cleveland", "44128": "Cleveland", "44129": "Cleveland",
  "44130": "Cleveland", "44131": "Cleveland", "44132": "Cleveland", "44133": "Cleveland",
  "44134": "Cleveland", "44135": "Cleveland", "44136": "Cleveland", "44137": "Cleveland",
  "44138": "Cleveland", "44139": "Cleveland", "44140": "Cleveland", "44141": "Cleveland",
  "44142": "Cleveland", "44143": "Cleveland", "44144": "Cleveland", "44145": "Cleveland",
  "44146": "Cleveland",
  // Cincinnati
  "45201": "Cincinnati", "45202": "Cincinnati", "45203": "Cincinnati", "45204": "Cincinnati",
  "45205": "Cincinnati", "45206": "Cincinnati", "45207": "Cincinnati", "45208": "Cincinnati",
  "45209": "Cincinnati", "45210": "Cincinnati", "45211": "Cincinnati", "45212": "Cincinnati",
  "45213": "Cincinnati", "45214": "Cincinnati", "45215": "Cincinnati", "45216": "Cincinnati",
  "45217": "Cincinnati", "45218": "Cincinnati", "45219": "Cincinnati", "45220": "Cincinnati",
  "45223": "Cincinnati", "45224": "Cincinnati", "45225": "Cincinnati", "45226": "Cincinnati",
  "45227": "Cincinnati", "45229": "Cincinnati", "45230": "Cincinnati", "45231": "Cincinnati",
  "45232": "Cincinnati", "45233": "Cincinnati", "45236": "Cincinnati", "45237": "Cincinnati",
  "45238": "Cincinnati", "45239": "Cincinnati", "45240": "Cincinnati", "45241": "Cincinnati",
  "45242": "Cincinnati", "45243": "Cincinnati", "45244": "Cincinnati", "45245": "Cincinnati",
  "45246": "Cincinnati", "45247": "Cincinnati", "45248": "Cincinnati", "45249": "Cincinnati",
  "45251": "Cincinnati", "45252": "Cincinnati", "45255": "Cincinnati",
  // Toledo
  "43601": "Toledo", "43602": "Toledo", "43603": "Toledo", "43604": "Toledo",
  "43605": "Toledo", "43606": "Toledo", "43607": "Toledo", "43608": "Toledo",
  "43609": "Toledo", "43610": "Toledo", "43611": "Toledo", "43612": "Toledo",
  "43613": "Toledo", "43614": "Toledo", "43615": "Toledo", "43617": "Toledo",
  "43620": "Toledo", "43623": "Toledo",
  // Akron
  "44301": "Akron", "44302": "Akron", "44303": "Akron", "44304": "Akron",
  "44305": "Akron", "44306": "Akron", "44307": "Akron", "44308": "Akron",
  "44310": "Akron", "44311": "Akron", "44312": "Akron", "44313": "Akron",
  "44314": "Akron", "44319": "Akron", "44320": "Akron", "44321": "Akron",
  // Dayton
  "45401": "Dayton", "45402": "Dayton", "45403": "Dayton", "45404": "Dayton",
  "45405": "Dayton", "45406": "Dayton", "45407": "Dayton", "45408": "Dayton",
  "45409": "Dayton", "45410": "Dayton", "45414": "Dayton", "45415": "Dayton",
  "45416": "Dayton", "45417": "Dayton", "45419": "Dayton", "45420": "Dayton",
  "45424": "Dayton", "45426": "Dayton", "45428": "Dayton", "45429": "Dayton",
  "45430": "Dayton", "45431": "Dayton", "45432": "Dayton", "45433": "Dayton",
  "45434": "Dayton", "45439": "Dayton", "45440": "Dayton",
  // Canton, Youngstown
  "44701": "Canton", "44702": "Canton", "44703": "Canton", "44704": "Canton", "44705": "Canton", "44706": "Canton", "44707": "Canton", "44708": "Canton", "44709": "Canton", "44710": "Canton", "44714": "Canton", "44718": "Canton", "44720": "Canton", "44721": "Canton",
  "44501": "Youngstown", "44502": "Youngstown", "44503": "Youngstown", "44504": "Youngstown", "44505": "Youngstown", "44506": "Youngstown", "44507": "Youngstown", "44509": "Youngstown", "44510": "Youngstown", "44511": "Youngstown", "44512": "Youngstown", "44514": "Youngstown", "44515": "Youngstown",

  // === PENNSYLVANIA ===
  // Philadelphia
  "19101": "Philadelphia", "19102": "Philadelphia", "19103": "Philadelphia", "19104": "Philadelphia",
  "19105": "Philadelphia", "19106": "Philadelphia", "19107": "Philadelphia", "19108": "Philadelphia",
  "19109": "Philadelphia", "19110": "Philadelphia", "19111": "Philadelphia", "19112": "Philadelphia",
  "19113": "Philadelphia", "19114": "Philadelphia", "19115": "Philadelphia", "19116": "Philadelphia",
  "19118": "Philadelphia", "19119": "Philadelphia", "19120": "Philadelphia", "19121": "Philadelphia",
  "19122": "Philadelphia", "19123": "Philadelphia", "19124": "Philadelphia", "19125": "Philadelphia",
  "19126": "Philadelphia", "19127": "Philadelphia", "19128": "Philadelphia", "19129": "Philadelphia",
  "19130": "Philadelphia", "19131": "Philadelphia", "19132": "Philadelphia", "19133": "Philadelphia",
  "19134": "Philadelphia", "19135": "Philadelphia", "19136": "Philadelphia", "19137": "Philadelphia",
  "19138": "Philadelphia", "19139": "Philadelphia", "19140": "Philadelphia", "19141": "Philadelphia",
  "19142": "Philadelphia", "19143": "Philadelphia", "19144": "Philadelphia", "19145": "Philadelphia",
  "19146": "Philadelphia", "19147": "Philadelphia", "19148": "Philadelphia", "19149": "Philadelphia",
  "19150": "Philadelphia", "19151": "Philadelphia", "19152": "Philadelphia", "19153": "Philadelphia",
  "19154": "Philadelphia",
  // Pittsburgh
  "15201": "Pittsburgh", "15202": "Pittsburgh", "15203": "Pittsburgh", "15204": "Pittsburgh",
  "15205": "Pittsburgh", "15206": "Pittsburgh", "15207": "Pittsburgh", "15208": "Pittsburgh",
  "15209": "Pittsburgh", "15210": "Pittsburgh", "15211": "Pittsburgh", "15212": "Pittsburgh",
  "15213": "Pittsburgh", "15214": "Pittsburgh", "15215": "Pittsburgh", "15216": "Pittsburgh",
  "15217": "Pittsburgh", "15218": "Pittsburgh", "15219": "Pittsburgh", "15220": "Pittsburgh",
  "15221": "Pittsburgh", "15222": "Pittsburgh", "15223": "Pittsburgh", "15224": "Pittsburgh",
  "15225": "Pittsburgh", "15226": "Pittsburgh", "15227": "Pittsburgh", "15228": "Pittsburgh",
  "15229": "Pittsburgh", "15230": "Pittsburgh", "15232": "Pittsburgh", "15233": "Pittsburgh",
  "15234": "Pittsburgh", "15235": "Pittsburgh", "15236": "Pittsburgh", "15237": "Pittsburgh",
  "15238": "Pittsburgh", "15239": "Pittsburgh", "15240": "Pittsburgh", "15241": "Pittsburgh",
  "15242": "Pittsburgh", "15243": "Pittsburgh",
  // Allentown, Reading, Erie, Scranton, Bethlehem, Lancaster
  "18101": "Allentown", "18102": "Allentown", "18103": "Allentown", "18104": "Allentown", "18105": "Allentown", "18106": "Allentown", "18109": "Allentown",
  "19601": "Reading", "19602": "Reading", "19604": "Reading", "19605": "Reading", "19606": "Reading", "19607": "Reading", "19608": "Reading", "19609": "Reading", "19610": "Reading", "19611": "Reading", "19612": "Reading",
  "16501": "Erie", "16502": "Erie", "16503": "Erie", "16504": "Erie", "16505": "Erie", "16506": "Erie", "16507": "Erie", "16508": "Erie", "16509": "Erie", "16510": "Erie", "16511": "Erie",
  "18501": "Scranton", "18502": "Scranton", "18503": "Scranton", "18504": "Scranton", "18505": "Scranton", "18507": "Scranton", "18508": "Scranton", "18509": "Scranton", "18510": "Scranton", "18512": "Scranton",
  "18015": "Bethlehem", "18016": "Bethlehem", "18017": "Bethlehem", "18018": "Bethlehem", "18020": "Bethlehem",
  "17601": "Lancaster", "17602": "Lancaster", "17603": "Lancaster", "17604": "Lancaster",
  "17101": "Harrisburg", "17102": "Harrisburg", "17103": "Harrisburg", "17104": "Harrisburg", "17109": "Harrisburg", "17110": "Harrisburg", "17111": "Harrisburg", "17112": "Harrisburg",

  // === NEW YORK ===
  // NYC
  "10001": "New York", "10002": "New York", "10003": "New York", "10004": "New York",
  "10005": "New York", "10006": "New York", "10007": "New York", "10008": "New York",
  "10009": "New York", "10010": "New York", "10011": "New York", "10012": "New York",
  "10013": "New York", "10014": "New York", "10016": "New York", "10017": "New York",
  "10018": "New York", "10019": "New York", "10020": "New York", "10021": "New York",
  "10022": "New York", "10023": "New York", "10024": "New York", "10025": "New York",
  "10026": "New York", "10027": "New York", "10028": "New York", "10029": "New York",
  "10030": "New York", "10031": "New York", "10032": "New York", "10033": "New York",
  "10034": "New York", "10035": "New York", "10036": "New York", "10037": "New York",
  "10038": "New York", "10039": "New York", "10040": "New York", "10044": "New York",
  "10065": "New York", "10069": "New York", "10075": "New York", "10103": "New York",
  "10110": "New York", "10111": "New York", "10112": "New York", "10115": "New York",
  "10119": "New York", "10128": "New York", "10152": "New York", "10153": "New York",
  "10154": "New York", "10162": "New York", "10165": "New York", "10167": "New York",
  "10168": "New York", "10169": "New York", "10170": "New York", "10171": "New York",
  "10172": "New York", "10173": "New York", "10174": "New York", "10177": "New York",
  "10199": "New York", "10271": "New York", "10278": "New York", "10279": "New York",
  "10280": "New York", "10282": "New York",
  // Brooklyn
  "11201": "Brooklyn", "11203": "Brooklyn", "11204": "Brooklyn", "11205": "Brooklyn",
  "11206": "Brooklyn", "11207": "Brooklyn", "11208": "Brooklyn", "11209": "Brooklyn",
  "11210": "Brooklyn", "11211": "Brooklyn", "11212": "Brooklyn", "11213": "Brooklyn",
  "11214": "Brooklyn", "11215": "Brooklyn", "11216": "Brooklyn", "11217": "Brooklyn",
  "11218": "Brooklyn", "11219": "Brooklyn", "11220": "Brooklyn", "11221": "Brooklyn",
  "11222": "Brooklyn", "11223": "Brooklyn", "11224": "Brooklyn", "11225": "Brooklyn",
  "11226": "Brooklyn", "11228": "Brooklyn", "11229": "Brooklyn", "11230": "Brooklyn",
  "11231": "Brooklyn", "11232": "Brooklyn", "11233": "Brooklyn", "11234": "Brooklyn",
  "11235": "Brooklyn", "11236": "Brooklyn", "11237": "Brooklyn", "11238": "Brooklyn",
  "11239": "Brooklyn",
  // Queens
  "11101": "Queens", "11102": "Queens", "11103": "Queens", "11104": "Queens",
  "11105": "Queens", "11106": "Queens", "11354": "Queens", "11355": "Queens",
  "11356": "Queens", "11357": "Queens", "11358": "Queens", "11360": "Queens",
  "11361": "Queens", "11362": "Queens", "11363": "Queens", "11364": "Queens",
  "11365": "Queens", "11366": "Queens", "11367": "Queens", "11368": "Queens",
  "11369": "Queens", "11370": "Queens", "11372": "Queens", "11373": "Queens",
  "11374": "Queens", "11375": "Queens", "11377": "Queens", "11378": "Queens",
  "11379": "Queens", "11385": "Queens", "11411": "Queens", "11412": "Queens",
  "11413": "Queens", "11414": "Queens", "11415": "Queens", "11416": "Queens",
  "11417": "Queens", "11418": "Queens", "11419": "Queens", "11420": "Queens",
  "11421": "Queens", "11422": "Queens", "11423": "Queens", "11426": "Queens",
  "11427": "Queens", "11428": "Queens", "11429": "Queens", "11430": "Queens",
  "11432": "Queens", "11433": "Queens", "11434": "Queens", "11435": "Queens",
  "11436": "Queens",
  // Bronx
  "10451": "Bronx", "10452": "Bronx", "10453": "Bronx", "10454": "Bronx",
  "10455": "Bronx", "10456": "Bronx", "10457": "Bronx", "10458": "Bronx",
  "10459": "Bronx", "10460": "Bronx", "10461": "Bronx", "10462": "Bronx",
  "10463": "Bronx", "10464": "Bronx", "10465": "Bronx", "10466": "Bronx",
  "10467": "Bronx", "10468": "Bronx", "10469": "Bronx", "10470": "Bronx",
  "10471": "Bronx", "10472": "Bronx", "10473": "Bronx", "10474": "Bronx",
  "10475": "Bronx",
  // Staten Island
  "10301": "Staten Island", "10302": "Staten Island", "10303": "Staten Island",
  "10304": "Staten Island", "10305": "Staten Island", "10306": "Staten Island",
  "10307": "Staten Island", "10308": "Staten Island", "10309": "Staten Island",
  "10310": "Staten Island", "10312": "Staten Island", "10314": "Staten Island",
  // Buffalo
  "14201": "Buffalo", "14202": "Buffalo", "14203": "Buffalo", "14204": "Buffalo",
  "14206": "Buffalo", "14207": "Buffalo", "14208": "Buffalo", "14209": "Buffalo",
  "14210": "Buffalo", "14211": "Buffalo", "14212": "Buffalo", "14213": "Buffalo",
  "14214": "Buffalo", "14215": "Buffalo", "14216": "Buffalo", "14217": "Buffalo",
  "14218": "Buffalo", "14219": "Buffalo", "14220": "Buffalo", "14221": "Buffalo",
  "14222": "Buffalo", "14223": "Buffalo", "14224": "Buffalo", "14225": "Buffalo",
  "14226": "Buffalo", "14227": "Buffalo", "14228": "Buffalo",
  // Rochester
  "14602": "Rochester", "14604": "Rochester", "14605": "Rochester", "14606": "Rochester",
  "14607": "Rochester", "14608": "Rochester", "14609": "Rochester", "14610": "Rochester",
  "14611": "Rochester", "14612": "Rochester", "14613": "Rochester", "14614": "Rochester",
  "14615": "Rochester", "14616": "Rochester", "14617": "Rochester", "14618": "Rochester",
  "14619": "Rochester", "14620": "Rochester", "14621": "Rochester", "14622": "Rochester",
  "14623": "Rochester", "14624": "Rochester", "14625": "Rochester", "14626": "Rochester",
  // Syracuse, Albany, Yonkers
  "13201": "Syracuse", "13202": "Syracuse", "13203": "Syracuse", "13204": "Syracuse", "13205": "Syracuse", "13206": "Syracuse", "13207": "Syracuse", "13208": "Syracuse", "13209": "Syracuse", "13210": "Syracuse", "13211": "Syracuse", "13212": "Syracuse", "13214": "Syracuse", "13215": "Syracuse", "13219": "Syracuse", "13224": "Syracuse",
  "12201": "Albany", "12202": "Albany", "12203": "Albany", "12204": "Albany", "12205": "Albany", "12206": "Albany", "12207": "Albany", "12208": "Albany", "12209": "Albany", "12210": "Albany", "12211": "Albany", "12212": "Albany",
  "10701": "Yonkers", "10702": "Yonkers", "10703": "Yonkers", "10704": "Yonkers", "10705": "Yonkers", "10707": "Yonkers", "10708": "Yonkers", "10710": "Yonkers",
  "10801": "New Rochelle", "10802": "New Rochelle", "10803": "New Rochelle", "10804": "New Rochelle", "10805": "New Rochelle",
  "10550": "Mount Vernon", "10551": "Mount Vernon", "10552": "Mount Vernon", "10553": "Mount Vernon",

  // === NEW JERSEY ===
  "07001": "Avenel", "07002": "Bayonne", "07003": "Bloomfield",
  "07004": "Fairfield", "07005": "Boonton", "07006": "Caldwell",
  "07008": "Carteret", "07009": "Cedar Grove", "07010": "Cliffside Park",
  "07011": "Clifton", "07012": "Clifton", "07013": "Clifton", "07014": "Clifton",
  "07017": "East Orange", "07018": "East Orange", "07019": "East Orange",
  "07020": "Edgewater", "07021": "Essex Fells", "07022": "Fairview",
  "07023": "Fanwood", "07024": "Fort Lee", "07026": "Garfield",
  "07027": "Garwood", "07028": "Glen Ridge", "07029": "Harrison",
  "07030": "Hoboken", "07031": "North Arlington", "07032": "Kearny",
  "07033": "Kenilworth", "07034": "Lake Hiawatha", "07035": "Lincoln Park",
  "07036": "Linden", "07039": "Livingston", "07040": "Maplewood",
  "07041": "Millburn", "07042": "Montclair", "07043": "Montclair",
  "07044": "Verona", "07045": "Montville", "07046": "Mountain Lakes",
  "07047": "North Bergen", "07050": "Orange", "07052": "West Orange",
  "07054": "Parsippany", "07055": "Passaic", "07057": "Wallington",
  "07058": "Pine Brook", "07060": "Plainfield", "07062": "Plainfield",
  "07063": "Plainfield", "07064": "Port Reading", "07065": "Rahway",
  "07066": "Clark", "07067": "Colonia", "07068": "Roseland",
  "07070": "Rutherford", "07071": "Lyndhurst", "07072": "Carlstadt",
  "07073": "East Rutherford", "07074": "Moonachie", "07075": "Wood-Ridge",
  "07076": "Scotch Plains", "07077": "Sewaren", "07078": "Short Hills",
  "07079": "South Orange", "07080": "South Plainfield", "07081": "Springfield",
  "07083": "Union", "07086": "Weehawken", "07087": "Union City",
  "07088": "Vauxhall", "07090": "Westfield", "07093": "West New York",
  "07094": "Secaucus", "07095": "Woodbridge",
  // Newark
  "07101": "Newark", "07102": "Newark", "07103": "Newark", "07104": "Newark",
  "07105": "Newark", "07106": "Newark", "07107": "Newark", "07108": "Newark",
  "07109": "Belleville", "07110": "Nutley", "07111": "Irvington", "07112": "Newark",
  "07114": "Newark",
  // Jersey City
  "07301": "Jersey City", "07302": "Jersey City", "07303": "Jersey City",
  "07304": "Jersey City", "07305": "Jersey City", "07306": "Jersey City",
  "07307": "Jersey City", "07308": "Jersey City", "07310": "Jersey City", "07311": "Jersey City",
  // Paterson
  "07501": "Paterson", "07502": "Paterson", "07503": "Paterson", "07504": "Paterson", "07505": "Paterson", "07506": "Hawthorne", "07508": "Haledon", "07509": "Paterson", "07510": "Paterson", "07511": "Totowa", "07512": "Totowa", "07513": "Paterson", "07514": "Paterson",
  // Elizabeth
  "07201": "Elizabeth", "07202": "Elizabeth", "07206": "Elizabeth", "07207": "Elizabeth", "07208": "Elizabeth",
  // South Jersey
  "08001": "Alloway", "08002": "Cherry Hill", "08003": "Cherry Hill", "08004": "Atco",
  "08005": "Barnegat", "08006": "Barnegat Light", "08007": "Barrington",
  "08008": "Beach Haven", "08009": "Berlin", "08010": "Beverly",
  "08016": "Burlington", "08018": "Cedar Brook", "08019": "Chatsworth",
  "08020": "Clarksboro", "08021": "Clementon", "08022": "Columbus",
  "08023": "Deepwater", "08025": "Glassboro", "08026": "Gibbsboro",
  "08027": "Gibbstown", "08028": "Glassboro", "08029": "Glendora",
  "08030": "Gloucester City", "08031": "Bellmawr", "08032": "Grenloch",
  "08033": "Haddonfield", "08034": "Cherry Hill", "08035": "Haddon Heights",
  "08036": "Hainesport", "08037": "Hammonton", "08038": "Hancocks Bridge",
  "08039": "Harrisonville", "08041": "Jobstown", "08042": "Juliustown",
  "08043": "Voorhees", "08045": "Lawnside", "08046": "Willingboro",
  "08048": "Lumberton", "08049": "Magnolia", "08050": "Manahawkin",
  "08051": "Mantua", "08052": "Maple Shade", "08053": "Marlton",
  "08054": "Mount Laurel", "08055": "Medford", "08056": "Mickleton",
  "08057": "Moorestown", "08059": "Mount Ephraim", "08060": "Mount Holly",
  "08061": "Mount Royal", "08062": "Mullica Hill", "08063": "National Park",
  "08065": "Palmyra", "08066": "Paulsboro", "08067": "Pedricktown",
  "08068": "Pemberton", "08069": "Penns Grove", "08070": "Pennsville",
  "08071": "Pitman", "08072": "Richwood", "08073": "Rancocas",
  "08074": "Richwood", "08075": "Riverside", "08077": "Riverton",
  "08078": "Runnemede", "08079": "Salem", "08080": "Sewell",
  "08081": "Sicklerville", "08083": "Somerdale", "08084": "Stratford",
  "08085": "Swedesboro", "08086": "Thorofare", "08087": "Tuckerton",
  "08088": "Vincentown", "08089": "Waterford Works", "08090": "Wenonah",
  "08091": "West Berlin", "08092": "West Creek", "08093": "Westville",
  "08094": "Williamstown", "08095": "Winslow", "08096": "Woodbury",
  "08097": "Woodbury Heights", "08098": "Woodstown",
  // Trenton, Edison, Toms River, Lakewood
  "08601": "Trenton", "08602": "Trenton", "08608": "Trenton", "08609": "Trenton", "08610": "Trenton", "08611": "Trenton", "08618": "Trenton", "08619": "Trenton", "08620": "Trenton", "08625": "Trenton", "08628": "Trenton", "08629": "Trenton",
  "08817": "Edison", "08818": "Edison", "08820": "Edison", "08837": "Edison",
  "08753": "Toms River", "08754": "Toms River", "08755": "Toms River", "08756": "Toms River", "08757": "Toms River",
  "08701": "Lakewood",

  // === MARYLAND ===
  // Baltimore
  "21201": "Baltimore", "21202": "Baltimore", "21203": "Baltimore", "21204": "Baltimore",
  "21205": "Baltimore", "21206": "Baltimore", "21207": "Baltimore", "21208": "Baltimore",
  "21209": "Baltimore", "21210": "Baltimore", "21211": "Baltimore", "21212": "Baltimore",
  "21213": "Baltimore", "21214": "Baltimore", "21215": "Baltimore", "21216": "Baltimore",
  "21217": "Baltimore", "21218": "Baltimore", "21222": "Baltimore", "21223": "Baltimore",
  "21224": "Baltimore", "21225": "Baltimore", "21226": "Baltimore", "21227": "Baltimore",
  "21228": "Baltimore", "21229": "Baltimore", "21230": "Baltimore", "21231": "Baltimore",
  "21233": "Baltimore", "21234": "Baltimore", "21235": "Baltimore", "21236": "Baltimore",
  "21237": "Baltimore", "21239": "Baltimore", "21240": "Baltimore", "21241": "Baltimore",
  "21244": "Baltimore", "21250": "Baltimore", "21251": "Baltimore",
  // Columbia, Germantown, Silver Spring, Waldorf, Glen Burnie, Ellicott City, Frederick
  "21044": "Columbia", "21045": "Columbia", "21046": "Columbia",
  "20874": "Germantown", "20875": "Germantown", "20876": "Germantown",
  "20901": "Silver Spring", "20902": "Silver Spring", "20903": "Silver Spring",
  "20904": "Silver Spring", "20905": "Silver Spring", "20906": "Silver Spring",
  "20907": "Silver Spring", "20908": "Silver Spring", "20910": "Silver Spring",
  "20601": "Waldorf", "20602": "Waldorf", "20603": "Waldorf", "20604": "Waldorf",
  "21060": "Glen Burnie", "21061": "Glen Burnie",
  "21042": "Ellicott City", "21043": "Ellicott City",
  "21701": "Frederick", "21702": "Frederick", "21703": "Frederick", "21704": "Frederick",
  "20850": "Rockville", "20851": "Rockville", "20852": "Rockville", "20853": "Rockville",
  "20854": "Potomac", "20855": "Derwood", "20857": "Rockville",
  "20814": "Bethesda", "20815": "Chevy Chase", "20816": "Bethesda", "20817": "Bethesda",
  "20770": "Greenbelt", "20771": "Greenbelt",
  "20706": "Lanham", "20707": "Laurel", "20708": "Laurel",
  "20740": "College Park", "20741": "College Park", "20742": "College Park",
  "21401": "Annapolis", "21402": "Annapolis", "21403": "Annapolis", "21404": "Annapolis", "21405": "Annapolis",

  // === ILLINOIS ===
  // Chicago
  "60601": "Chicago", "60602": "Chicago", "60603": "Chicago", "60604": "Chicago",
  "60605": "Chicago", "60606": "Chicago", "60607": "Chicago", "60608": "Chicago",
  "60609": "Chicago", "60610": "Chicago", "60611": "Chicago", "60612": "Chicago",
  "60613": "Chicago", "60614": "Chicago", "60615": "Chicago", "60616": "Chicago",
  "60617": "Chicago", "60618": "Chicago", "60619": "Chicago", "60620": "Chicago",
  "60621": "Chicago", "60622": "Chicago", "60623": "Chicago", "60624": "Chicago",
  "60625": "Chicago", "60626": "Chicago", "60628": "Chicago", "60629": "Chicago",
  "60630": "Chicago", "60631": "Chicago", "60632": "Chicago", "60633": "Chicago",
  "60634": "Chicago", "60636": "Chicago", "60637": "Chicago", "60638": "Chicago",
  "60639": "Chicago", "60640": "Chicago", "60641": "Chicago", "60642": "Chicago",
  "60643": "Chicago", "60644": "Chicago", "60645": "Chicago", "60646": "Chicago",
  "60647": "Chicago", "60649": "Chicago", "60651": "Chicago", "60652": "Chicago",
  "60653": "Chicago", "60654": "Chicago", "60655": "Chicago", "60656": "Chicago",
  "60657": "Chicago", "60659": "Chicago", "60660": "Chicago", "60661": "Chicago",
  // Aurora, Naperville, Joliet, Rockford, Springfield, Elgin, Peoria
  "60502": "Aurora", "60504": "Aurora", "60505": "Aurora", "60506": "Aurora", "60507": "Aurora",
  "60540": "Naperville", "60563": "Naperville", "60564": "Naperville", "60565": "Naperville",
  "60431": "Joliet", "60432": "Joliet", "60433": "Joliet", "60434": "Joliet", "60435": "Joliet", "60436": "Joliet",
  "61101": "Rockford", "61102": "Rockford", "61103": "Rockford", "61104": "Rockford", "61107": "Rockford", "61108": "Rockford", "61109": "Rockford", "61112": "Rockford", "61114": "Rockford",
  "62701": "Springfield", "62702": "Springfield", "62703": "Springfield", "62704": "Springfield", "62707": "Springfield", "62711": "Springfield", "62712": "Springfield",
  "60120": "Elgin", "60121": "Elgin", "60123": "Elgin", "60124": "Elgin",
  "61601": "Peoria", "61602": "Peoria", "61603": "Peoria", "61604": "Peoria", "61605": "Peoria", "61606": "Peoria", "61607": "Peoria", "61614": "Peoria", "61615": "Peoria",
  "60091": "Wilmette", "60093": "Winnetka", "60201": "Evanston", "60202": "Evanston", "60203": "Evanston", "60204": "Evanston",
  "60301": "Oak Park", "60302": "Oak Park", "60303": "Oak Park", "60304": "Oak Park",
  "60402": "Berwyn", "60513": "Brookfield", "60514": "Clarendon Hills", "60515": "Downers Grove", "60516": "Downers Grove",
  "60525": "La Grange", "60526": "La Grange Park",

  // === CONNECTICUT ===
  // Bridgeport
  "06601": "Bridgeport", "06602": "Bridgeport", "06604": "Bridgeport", "06605": "Bridgeport", "06606": "Bridgeport", "06607": "Bridgeport", "06608": "Bridgeport", "06610": "Bridgeport",
  // New Haven
  "06501": "New Haven", "06502": "New Haven", "06503": "New Haven", "06504": "New Haven", "06505": "New Haven", "06506": "New Haven", "06507": "New Haven", "06508": "New Haven", "06509": "New Haven", "06510": "New Haven", "06511": "New Haven", "06512": "New Haven", "06513": "New Haven", "06515": "New Haven", "06519": "New Haven", "06520": "New Haven", "06521": "New Haven",
  // Hartford
  "06101": "Hartford", "06102": "Hartford", "06103": "Hartford", "06104": "Hartford", "06105": "Hartford", "06106": "Hartford", "06112": "Hartford", "06114": "Hartford", "06115": "Hartford", "06118": "Hartford", "06120": "Hartford",
  // Stamford
  "06901": "Stamford", "06902": "Stamford", "06903": "Stamford", "06904": "Stamford", "06905": "Stamford", "06906": "Stamford", "06907": "Stamford", "06910": "Stamford", "06911": "Stamford", "06912": "Stamford", "06913": "Stamford", "06914": "Stamford",
  // Waterbury, Norwalk, Danbury, New Britain
  "06701": "Waterbury", "06702": "Waterbury", "06703": "Waterbury", "06704": "Waterbury", "06705": "Waterbury", "06706": "Waterbury", "06708": "Waterbury", "06710": "Waterbury",
  "06850": "Norwalk", "06851": "Norwalk", "06852": "Norwalk", "06853": "Norwalk", "06854": "Norwalk", "06855": "Norwalk", "06856": "Norwalk", "06857": "Norwalk", "06858": "Norwalk", "06860": "Norwalk",
  "06810": "Danbury", "06811": "Danbury", "06813": "Danbury", "06814": "Danbury",
  "06050": "New Britain", "06051": "New Britain", "06052": "New Britain", "06053": "New Britain",
  "06401": "Ansonia", "06410": "Cheshire", "06418": "Derby", "06437": "Guilford",
  "06460": "Milford", "06461": "Milford", "06468": "Monroe",
  "06470": "Newtown", "06473": "North Haven", "06477": "Orange",
  "06478": "Oxford", "06480": "Portland", "06482": "Sandy Hook",
  "06484": "Shelton", "06488": "Southbury", "06489": "Southington",

  // === MASSACHUSETTS ===
  // Boston
  "02101": "Boston", "02102": "Boston", "02103": "Boston", "02104": "Boston",
  "02105": "Boston", "02106": "Boston", "02107": "Boston", "02108": "Boston",
  "02109": "Boston", "02110": "Boston", "02111": "Boston", "02112": "Boston",
  "02113": "Boston", "02114": "Boston", "02115": "Boston", "02116": "Boston",
  "02117": "Boston", "02118": "Boston", "02119": "Boston", "02120": "Boston",
  "02121": "Boston", "02122": "Boston", "02123": "Boston", "02124": "Boston",
  "02125": "Boston", "02126": "Boston", "02127": "Boston", "02128": "Boston",
  "02129": "Boston", "02130": "Boston", "02131": "Boston", "02132": "Boston",
  "02133": "Boston", "02134": "Boston", "02135": "Boston", "02136": "Boston",
  "02163": "Boston", "02196": "Boston", "02199": "Boston", "02201": "Boston",
  "02203": "Boston", "02204": "Boston", "02205": "Boston", "02206": "Boston",
  "02210": "Boston", "02211": "Boston", "02212": "Boston", "02215": "Boston",
  "02217": "Boston", "02222": "Boston", "02241": "Boston",
  // Worcester
  "01601": "Worcester", "01602": "Worcester", "01603": "Worcester", "01604": "Worcester",
  "01605": "Worcester", "01606": "Worcester", "01607": "Worcester", "01608": "Worcester",
  "01609": "Worcester", "01610": "Worcester",
  // Springfield
  "01101": "Springfield", "01102": "Springfield", "01103": "Springfield", "01104": "Springfield",
  "01105": "Springfield", "01106": "Springfield", "01107": "Springfield", "01108": "Springfield",
  "01109": "Springfield", "01111": "Springfield", "01115": "Springfield", "01118": "Springfield",
  "01119": "Springfield", "01128": "Springfield", "01129": "Springfield",
  // Cambridge, Lowell, Brockton, Quincy, Lynn
  "02138": "Cambridge", "02139": "Cambridge", "02140": "Cambridge", "02141": "Cambridge", "02142": "Cambridge",
  "01850": "Lowell", "01851": "Lowell", "01852": "Lowell", "01853": "Lowell", "01854": "Lowell",
  "02301": "Brockton", "02302": "Brockton", "02303": "Brockton", "02304": "Brockton", "02305": "Brockton",
  "02169": "Quincy", "02170": "Quincy", "02171": "Quincy",
  "01901": "Lynn", "01902": "Lynn", "01903": "Lynn", "01904": "Lynn", "01905": "Lynn",
  "02148": "Malden", "02149": "Everett", "02150": "Chelsea", "02151": "Revere",
  "02152": "Winthrop", "02155": "Medford", "02176": "Melrose", "02180": "Stoneham",
  "01801": "Woburn", "01803": "Burlington", "01810": "Andover", "01821": "Billerica",
  "01824": "Chelmsford", "01826": "Dracut", "01830": "Haverhill", "01831": "Haverhill",
  "01832": "Haverhill", "01835": "Haverhill", "01840": "Lawrence", "01841": "Lawrence",
  "01843": "Lawrence", "01844": "Methuen", "01845": "North Andover",
  "01960": "Peabody", "01970": "Salem", "01945": "Marblehead",
  "02740": "New Bedford", "02741": "New Bedford", "02742": "New Bedford", "02743": "New Bedford", "02744": "New Bedford", "02745": "New Bedford", "02746": "New Bedford",
  "02720": "Fall River", "02721": "Fall River", "02722": "Fall River", "02723": "Fall River", "02724": "Fall River", "02725": "Fall River", "02726": "Fall River",

  // === RHODE ISLAND ===
  // Providence
  "02901": "Providence", "02902": "Providence", "02903": "Providence", "02904": "Providence",
  "02905": "Providence", "02906": "Providence", "02907": "Providence", "02908": "Providence",
  "02909": "Providence", "02910": "Providence", "02911": "Providence", "02912": "Providence",
  "02918": "Providence", "02919": "Providence", "02940": "Providence",
  // Warwick
  "02886": "Warwick", "02887": "Warwick", "02888": "Warwick", "02889": "Warwick",
  // Cranston
  "02920": "Cranston", "02921": "Cranston",
  // Pawtucket
  "02860": "Pawtucket", "02861": "Pawtucket", "02862": "Pawtucket",
  // East Providence
  "02914": "East Providence", "02915": "East Providence", "02916": "East Providence",
  // Woonsocket
  "02895": "Woonsocket",
  // Other RI
  "02804": "Ashaway", "02806": "Barrington", "02807": "Block Island",
  "02808": "Bradford", "02809": "Bristol", "02812": "Carolina",
  "02813": "Charlestown", "02814": "Chepachet", "02815": "Clayville",
  "02816": "Coventry", "02817": "West Greenwich", "02818": "East Greenwich",
  "02822": "Exeter", "02825": "Foster", "02826": "Glendale",
  "02827": "Greene", "02828": "Greenville", "02829": "Harmony",
  "02830": "Harrisville", "02831": "Hope", "02832": "Hope Valley",
  "02833": "Hopkinton", "02835": "Jamestown", "02836": "Kenyon",
  "02837": "Little Compton", "02838": "Manville", "02839": "Mapleville",
  "02840": "Newport", "02841": "Newport", "02842": "Middletown",
  "02852": "North Kingstown", "02857": "North Scituate",
  "02858": "Oakland", "02859": "Pascoag", "02863": "Central Falls",
  "02864": "Cumberland", "02865": "Lincoln", "02871": "Portsmouth",
  "02872": "Prudence Island", "02874": "Saunderstown", "02875": "Shannock",
  "02876": "Slatersville", "02878": "Tiverton", "02879": "Wakefield",
  "02880": "Wakefield", "02881": "Kingston", "02882": "Narragansett",
  "02891": "Westerly", "02892": "West Kingston", "02893": "West Warwick",
  "02894": "Wood River Junction",

  // === NEW HAMPSHIRE ===
  // Manchester
  "03101": "Manchester", "03102": "Manchester", "03103": "Manchester", "03104": "Manchester", "03105": "Manchester", "03108": "Manchester", "03109": "Manchester",
  // Nashua
  "03060": "Nashua", "03061": "Nashua", "03062": "Nashua", "03063": "Nashua", "03064": "Nashua",
  // Concord
  "03301": "Concord", "03302": "Concord", "03303": "Concord", "03305": "Concord",
  // Derry, Rochester, Salem, Dover, Merrimack
  "03038": "Derry",
  "03801": "Portsmouth", "03802": "Portsmouth", "03803": "Portsmouth", "03804": "Portsmouth",
  "03820": "Dover", "03821": "Dover", "03822": "Dover",
  "03839": "Rochester", "03866": "Rochester", "03867": "Rochester", "03868": "Rochester",
  "03054": "Merrimack",
  "03079": "Salem",
  "03431": "Keene", "03435": "Keene",
  "03246": "Laconia", "03247": "Laconia",
  "03766": "Lebanon", "03784": "West Lebanon",
  "03755": "Hanover",
  "03743": "Claremont",
  "03570": "Berlin",

  // === MAINE ===
  // Portland
  "04101": "Portland", "04102": "Portland", "04103": "Portland", "04104": "Portland",
  // Lewiston
  "04240": "Lewiston", "04241": "Lewiston", "04243": "Lewiston",
  // Bangor
  "04401": "Bangor", "04402": "Bangor",
  // South Portland
  "04106": "South Portland",
  // Auburn
  "04210": "Auburn", "04211": "Auburn", "04212": "Auburn",
  // Biddeford
  "04005": "Biddeford",
  // Sanford
  "04073": "Sanford", "04074": "Scarborough",
  // Augusta
  "04330": "Augusta", "04332": "Augusta", "04333": "Augusta", "04336": "Augusta", "04338": "Augusta",
  // Other ME
  "04011": "Brunswick", "04043": "Kennebunk", "04046": "Kennebunkport",
  "04062": "Windham", "04064": "Old Orchard Beach", "04072": "Saco",
  "04084": "Standish", "04086": "Topsham", "04092": "Westbrook",
  "04105": "Falmouth", "04107": "Cape Elizabeth", "04108": "Peaks Island",
  "04110": "Cumberland Center", "04260": "New Gloucester", "04274": "Poland",
  "04345": "Gardiner", "04347": "Hallowell", "04350": "Litchfield",
  "04530": "Bath", "04605": "Ellsworth", "04609": "Bar Harbor",
  "04841": "Rockland", "04843": "Camden", "04901": "Waterville"
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
  return providers.map(p => p.name);
};

// Validate if provider exists in our system
export const isValidProvider = async (providerName) => {
  const providers = await fetchProviders();
  return providers.some(p => p.name === providerName);
};
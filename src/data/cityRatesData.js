/**
 * cityRatesData.js
 *
 * City-level electricity data powering the /electricity-rates/:state/:city pages.
 * Extracted from CityRates.jsx so the same data can be consumed by the build-time
 * SEO prerenderer (plain Node ESM) without pulling in the React component tree.
 *
 * Keys are "City-ST" (canonical) plus legacy bare "City" aliases.
 */

export const cityData = {
  // TEXAS CITIES
  "Houston-TX": {
    state: "Texas", stateCode: "TX", county: "Harris County", population: "2,300,000+",
    zipCodes: ["77002", "77019", "77024", "77027", "77056", "77063", "77098"],
    avgRate: "8.9¢/kWh", avgMonthlyBill: "$128", providers: 45,
    neighborhoods: ["Downtown Houston", "The Heights", "Montrose", "River Oaks", "Midtown", "Galleria", "Memorial"],
    description: "Houston, the largest city in Texas and the energy capital of the world, offers residents access to competing electricity suppliers in the deregulated market.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/b92baf13-dff3-4777-8e8a-b25f73b10b8d.jpg"
  },
  "Dallas-TX": {
    state: "Texas", stateCode: "TX", county: "Dallas County", population: "1,300,000+",
    zipCodes: ["75201", "75202", "75204", "75205", "75214", "75219", "75230"],
    avgRate: "9.1¢/kWh", avgMonthlyBill: "$132", providers: 42,
    neighborhoods: ["Downtown Dallas", "Uptown", "Deep Ellum", "Highland Park", "Oak Lawn", "Lake Highlands", "North Dallas"],
    description: "Dallas residents benefit from competitive electricity rates with access to competing suppliers offering a wide range of fixed and variable rate plans.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/8d19f65b-9e9f-4d66-b5f9-6d0cc6de9965.jpg"
  },
  "Austin-TX": {
    state: "Texas", stateCode: "TX", county: "Travis County", population: "978,000+",
    zipCodes: ["78701", "78702", "78703", "78704", "78731", "78745", "78757"],
    avgRate: "9.3¢/kWh", avgMonthlyBill: "$135", providers: 38,
    neighborhoods: ["Downtown Austin", "South Congress", "East Austin", "West Lake Hills", "Hyde Park", "Zilker", "Mueller"],
    description: "Austin, the state capital and tech hub, provides residents with competitive electricity rates and numerous green energy options from competing suppliers.",
    image: "https://images.unsplash.com/photo-1531218150217-54595bc2b934?w=400&h=300&fit=crop"
  },
  "San Antonio-TX": {
    state: "Texas", stateCode: "TX", county: "Bexar County", population: "1,500,000+",
    zipCodes: ["78201", "78209", "78212", "78216", "78232", "78249", "78258"],
    avgRate: "8.8¢/kWh", avgMonthlyBill: "$127", providers: 40,
    neighborhoods: ["Downtown San Antonio", "Alamo Heights", "Stone Oak", "The Dominion", "Southtown", "King William", "Medical Center"],
    description: "San Antonio offers some of the most competitive electricity rates in Texas, with competing suppliers serving the area's residential and commercial customers.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/136ff412-03e2-40c7-8934-8517d2404665.jpg"
  },
  "Fort Worth-TX": {
    state: "Texas", stateCode: "TX", county: "Tarrant County", population: "927,000+",
    zipCodes: ["76102", "76104", "76107", "76109", "76116", "76132", "76244"],
    avgRate: "9.0¢/kWh", avgMonthlyBill: "$130", providers: 41,
    neighborhoods: ["Downtown Fort Worth", "Cultural District", "Sundance Square", "West 7th", "Ridglea", "Tanglewood", "Alliance"],
    description: "Fort Worth residents enjoy access to competitive electricity rates from competing suppliers in the deregulated Texas energy market.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/87a80756-c4b5-44c5-bc05-259fef05ca68.jpg"
  },

  // ILLINOIS CITIES
  "Chicago-IL": {
    state: "Illinois", stateCode: "IL", county: "Cook County", population: "2,700,000+",
    zipCodes: ["60601", "60602", "60603", "60604", "60605", "60606", "60607"],
    avgRate: "9.8¢/kWh", avgMonthlyBill: "$142", providers: 36,
    neighborhoods: ["Downtown Chicago", "Lincoln Park", "Wicker Park", "River North", "Loop", "Gold Coast", "West Loop"],
    description: "Chicago residents have access to competitive electricity rates from competing suppliers in the ComEd service territory.",
  },
  "Aurora-IL": {
    state: "Illinois", stateCode: "IL", county: "Kane County", population: "180,000+",
    zipCodes: ["60502", "60503", "60504", "60505", "60506", "60507", "60519"],
    avgRate: "9.9¢/kWh", avgMonthlyBill: "$143", providers: 34,
    neighborhoods: ["Downtown Aurora", "Fox Valley", "Far East", "West Aurora", "North Aurora", "Indian Prairie", "Aurora Highlands"],
    description: "Aurora residents benefit from competitive electricity rates with competing suppliers in the western Chicago suburbs.",
  },
  "Naperville-IL": {
    state: "Illinois", stateCode: "IL", county: "DuPage County", population: "149,000+",
    zipCodes: ["60540", "60563", "60564", "60565", "60585"],
    avgRate: "9.7¢/kWh", avgMonthlyBill: "$140", providers: 35,
    neighborhoods: ["Downtown Naperville", "White Eagle", "Ashbury", "Springbrook", "College Hill", "Fort Hill", "Cress Creek"],
    description: "Naperville residents enjoy competitive electricity rates from competing suppliers in the affluent DuPage County area.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/403443a6-48b5-4052-ac9e-6600f43ab721.jpg"
  },
  "Joliet-IL": {
    state: "Illinois", stateCode: "IL", county: "Will County", population: "150,000+",
    zipCodes: ["60431", "60432", "60433", "60434", "60435", "60436"],
    avgRate: "9.8¢/kWh", avgMonthlyBill: "$141", providers: 33,
    neighborhoods: ["Cathedral Area", "Fairmont", "Pilcher Park", "Rockdale", "West Joliet", "Laraway", "Highland Park"],
    description: "Joliet residents have access to competitive electricity rates from competing suppliers in Will County.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/58463eb0-e880-4c1a-b78b-be40c42fb456.jpg"
  },

  // OHIO CITIES
  "Columbus-OH": {
    state: "Ohio", stateCode: "OH", county: "Franklin County", population: "905,000+",
    zipCodes: ["43085", "43201", "43202", "43203", "43204", "43205", "43206"],
    avgRate: "9.5¢/kWh", avgMonthlyBill: "$138", providers: 38,
    neighborhoods: ["Downtown Columbus", "German Village", "Short North", "Clintonville", "Victorian Village", "Arena District", "Brewery District"],
    description: "Columbus residents enjoy competitive electricity rates from competing suppliers in the AEP Ohio service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/03fe81c8-162d-4692-be26-32e20095399c.jpg"
  },
  "Cleveland-OH": {
    state: "Ohio", stateCode: "OH", county: "Cuyahoga County", population: "372,000+",
    zipCodes: ["44101", "44102", "44103", "44104", "44105", "44106", "44107"],
    avgRate: "9.6¢/kWh", avgMonthlyBill: "$139", providers: 37,
    neighborhoods: ["Downtown Cleveland", "Ohio City", "Tremont", "University Circle", "Detroit-Shoreway", "Edgewater", "Collinwood"],
    description: "Cleveland residents have access to competitive electricity rates from competing suppliers in the FirstEnergy service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/0566fb7e-4b0b-46d4-bdc4-04a2189962bf.jpg"
  },
  "Cincinnati-OH": {
    state: "Ohio", stateCode: "OH", county: "Hamilton County", population: "309,000+",
    zipCodes: ["45201", "45202", "45203", "45204", "45205", "45206", "45207"],
    avgRate: "9.7¢/kWh", avgMonthlyBill: "$140", providers: 36,
    neighborhoods: ["Downtown Cincinnati", "Over-the-Rhine", "Mount Adams", "Clifton", "Hyde Park", "Oakley", "Columbia-Tusculum"],
    description: "Cincinnati residents benefit from competitive electricity rates with competing suppliers in the Duke Energy Ohio territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/e1e2ce07-4723-4b43-b55c-8e6a0251d472.jpg"
  },
  "Toledo-OH": {
    state: "Ohio", stateCode: "OH", county: "Lucas County", population: "270,000+",
    zipCodes: ["43601", "43604", "43606", "43607", "43608", "43609", "43610"],
    avgRate: "9.6¢/kWh", avgMonthlyBill: "$139", providers: 35,
    neighborhoods: ["Downtown Toledo", "Old West End", "Ottawa Hills", "Sylvania", "Point Place", "Westgate", "South End"],
    description: "Toledo residents enjoy competitive electricity rates from competing suppliers in the FirstEnergy service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/c3d7d2f5-d102-4ed8-aa7f-f2e9c6e02764.jpg"
  },

  // PENNSYLVANIA CITIES
  "Philadelphia-PA": {
    state: "Pennsylvania", stateCode: "PA", county: "Philadelphia County", population: "1,600,000+",
    zipCodes: ["19102", "19103", "19104", "19106", "19107", "19111", "19114"],
    avgRate: "10.2¢/kWh", avgMonthlyBill: "$147", providers: 32,
    neighborhoods: ["Center City", "Old City", "Society Hill", "Rittenhouse Square", "University City", "Northern Liberties", "Fishtown"],
    description: "Philadelphia residents benefit from competitive electricity rates with competing suppliers in the PECO service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/01dc15fd-0434-4dd9-ac68-9123c6a14f33.jpg"
  },
  "Pittsburgh-PA": {
    state: "Pennsylvania", stateCode: "PA", county: "Allegheny County", population: "303,000+",
    zipCodes: ["15201", "15202", "15203", "15204", "15205", "15206", "15207"],
    avgRate: "10.1¢/kWh", avgMonthlyBill: "$146", providers: 30,
    neighborhoods: ["Downtown Pittsburgh", "Shadyside", "Squirrel Hill", "Oakland", "Lawrenceville", "South Side", "Strip District"],
    description: "Pittsburgh residents enjoy competitive electricity rates from competing suppliers in the Duquesne Light service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/162bc2ea-2c58-4a65-bab4-76e96955cc5c1.jpg"
  },
  "Allentown-PA": {
    state: "Pennsylvania", stateCode: "PA", county: "Lehigh County", population: "125,000+",
    zipCodes: ["18101", "18102", "18103", "18104", "18105", "18106", "18109"],
    avgRate: "10.3¢/kWh", avgMonthlyBill: "$148", providers: 28,
    neighborhoods: ["Downtown Allentown", "West Park", "Hanover Acres", "South Side", "East Side", "West End", "Cedar Crest"],
    description: "Allentown residents benefit from competitive electricity rates with competing suppliers in the PPL Electric service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/cfe7691c-4b4d-4429-966f-1475a915d13d.jpg"
  },

  // NEW YORK CITIES
  "New York City-NY": {
    state: "New York", stateCode: "NY", county: "New York County", population: "8,300,000+",
    zipCodes: ["10001", "10002", "10003", "10004", "10005", "10006", "10007"],
    avgRate: "11.5¢/kWh", avgMonthlyBill: "$165", providers: 28,
    neighborhoods: ["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island", "Lower East Side", "Upper West Side"],
    description: "NYC residents have access to competitive electricity rates from 28+ ESCOs in the Con Edison service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/b030ead7-1805-4ab1-9b11-5ef8764baa82.jpg"
  },
  "Buffalo-NY": {
    state: "New York", stateCode: "NY", county: "Erie County", population: "278,000+",
    zipCodes: ["14201", "14202", "14203", "14204", "14205", "14206", "14207"],
    avgRate: "10.8¢/kWh", avgMonthlyBill: "$155", providers: 25,
    neighborhoods: ["Downtown Buffalo", "Allentown", "Elmwood Village", "North Buffalo", "South Buffalo", "West Side", "Riverside"],
    description: "Buffalo residents enjoy competitive electricity rates from 25+ ESCOs in the National Grid service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/7c7a75cb-3931-4991-b608-275c44e5dd84.jpg"
  },
  "Rochester-NY": {
    state: "New York", stateCode: "NY", county: "Monroe County", population: "211,000+",
    zipCodes: ["14604", "14605", "14606", "14607", "14608", "14609", "14610"],
    avgRate: "10.9¢/kWh", avgMonthlyBill: "$157", providers: 24,
    neighborhoods: ["Downtown Rochester", "Park Avenue", "East End", "South Wedge", "Corn Hill", "NOTA", "Charlotte"],
    description: "Rochester residents benefit from competitive electricity rates with 24+ ESCOs in the RG&E service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/dfd8afa3-67b9-425f-9616-5dd340a3c534.jpg"
  },
  "Syracuse-NY": {
    state: "New York", stateCode: "NY", county: "Onondaga County", population: "148,000+",
    zipCodes: ["13201", "13202", "13203", "13204", "13205", "13206", "13207"],
    avgRate: "11.0¢/kWh", avgMonthlyBill: "$158", providers: 23,
    neighborhoods: ["Downtown Syracuse", "University Hill", "Eastwood", "Westcott", "Tipperary Hill", "Strathmore", "Sedgwick"],
    description: "Syracuse residents enjoy competitive electricity rates from 23+ ESCOs in the National Grid service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/8af97b79-9633-405b-a443-c8df9b48d0cf.jpg"
  },

  // NEW JERSEY CITIES
  "Newark-NJ": {
    state: "New Jersey", stateCode: "NJ", county: "Essex County", population: "311,000+",
    zipCodes: ["07102", "07103", "07104", "07105", "07106", "07107", "07108"],
    avgRate: "10.5¢/kWh", avgMonthlyBill: "$151", providers: 27,
    neighborhoods: ["Downtown Newark", "Ironbound", "Forest Hill", "North Ward", "Central Ward", "West Ward", "South Ward"],
    description: "Newark residents benefit from competitive electricity rates with competing suppliers in the PSE&G service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/1a6aeb64-6311-486c-baba-c7cff53a3d5c.jpg"
  },
  "Jersey City-NJ": {
    state: "New Jersey", stateCode: "NJ", county: "Hudson County", population: "292,000+",
    zipCodes: ["07302", "07304", "07305", "07306", "07307", "07310"],
    avgRate: "10.6¢/kWh", avgMonthlyBill: "$152", providers: 26,
    neighborhoods: ["Downtown Jersey City", "Journal Square", "The Heights", "Bergen-Lafayette", "Greenville", "McGinley Square", "Paulus Hook"],
    description: "Jersey City residents enjoy competitive electricity rates from competing suppliers in the PSE&G service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/29c455be-4263-4009-8e75-1475730b0b76.jpg"
  },
  "Paterson-NJ": {
    state: "New Jersey", stateCode: "NJ", county: "Passaic County", population: "159,000+",
    zipCodes: ["07501", "07502", "07503", "07504", "07505", "07510", "07514"],
    avgRate: "10.7¢/kWh", avgMonthlyBill: "$153", providers: 25,
    neighborhoods: ["Downtown Paterson", "Eastside", "Riverside", "Peoples Park", "Hillcrest", "Northside", "Wrigley Park"],
    description: "Paterson residents benefit from competitive electricity rates with competing suppliers in the PSE&G service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/8bb83b32-7b38-4635-9279-d5fe12f4d755.jpg"
  },

  // MARYLAND CITIES
  "Baltimore-MD": {
    state: "Maryland", stateCode: "MD", county: "Baltimore City", population: "576,000+",
    zipCodes: ["21201", "21202", "21205", "21206", "21207", "21208", "21209"],
    avgRate: "10.4¢/kWh", avgMonthlyBill: "$150", providers: 29,
    neighborhoods: ["Downtown Baltimore", "Federal Hill", "Fells Point", "Canton", "Inner Harbor", "Mount Vernon", "Charles Village"],
    description: "Baltimore residents enjoy competitive electricity rates from competing suppliers in the BGE service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/f10f5df1-6404-4618-b8c3-314d3f6a0d29.jpg"
  },
  "Frederick-MD": {
    state: "Maryland", stateCode: "MD", county: "Frederick County", population: "79,000+",
    zipCodes: ["21701", "21702", "21703", "21704", "21705"],
    avgRate: "10.5¢/kWh", avgMonthlyBill: "$151", providers: 27,
    neighborhoods: ["Downtown Frederick", "Ballenger Creek", "Hood College", "North Frederick", "South Frederick", "West Frederick", "East Frederick"],
    description: "Frederick residents benefit from competitive electricity rates with competing suppliers in the Potomac Edison service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/98350fd0-49c8-4087-8479-0d390c853bf3.jpg"
  },
  "Rockville-MD": {
    state: "Maryland", stateCode: "MD", county: "Montgomery County", population: "68,000+",
    zipCodes: ["20850", "20851", "20852", "20853", "20854", "20855"],
    avgRate: "10.3¢/kWh", avgMonthlyBill: "$148", providers: 28,
    neighborhoods: ["Downtown Rockville", "Twinbrook", "West End", "King Farm", "Lincoln Park", "Woodley Gardens", "Fallsgrove"],
    description: "Rockville residents enjoy competitive electricity rates from competing suppliers in the Pepco service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/46fe92cb-3aa8-4914-8974-bde36dd806af.jpg"
  },

  // MASSACHUSETTS CITIES
  "Boston-MA": {
    state: "Massachusetts", stateCode: "MA", county: "Suffolk County", population: "675,000+",
    zipCodes: ["02101", "02108", "02109", "02110", "02111", "02113", "02114"],
    avgRate: "11.2¢/kWh", avgMonthlyBill: "$161", providers: 22,
    neighborhoods: ["Downtown Boston", "Back Bay", "Beacon Hill", "North End", "South End", "Fenway", "Charlestown"],
    description: "Boston residents benefit from competitive electricity rates with competing suppliers across multiple utility territories.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/6e33a452-8111-4711-a6e7-b49128f6bc5a.jpg"
  },
  "Worcester-MA": {
    state: "Massachusetts", stateCode: "MA", county: "Worcester County", population: "206,000+",
    zipCodes: ["01601", "01602", "01603", "01604", "01605", "01606", "01607"],
    avgRate: "11.3¢/kWh", avgMonthlyBill: "$162", providers: 21,
    neighborhoods: ["Downtown Worcester", "Main South", "Tatnuck", "West Side", "East Side", "Shrewsbury Street", "Canal District"],
    description: "Worcester residents enjoy competitive electricity rates from competing suppliers in the National Grid service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/d4fa1135-c2c6-4c43-8184-540993ddd4db.jpg"
  },
  "Springfield-MA": {
    state: "Massachusetts", stateCode: "MA", county: "Hampden County", population: "155,000+",
    zipCodes: ["01101", "01103", "01104", "01105", "01107", "01108", "01109"],
    avgRate: "11.4¢/kWh", avgMonthlyBill: "$163", providers: 20,
    neighborhoods: ["Downtown Springfield", "Forest Park", "Sixteen Acres", "East Springfield", "South End", "Six Corners", "Metro Center"],
    description: "Springfield residents benefit from competitive electricity rates with competing suppliers in the Eversource service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/45362c2b-5e37-45ca-a6ab-ac06564ed343.jpg"
  },

  // CONNECTICUT CITIES
  "Hartford-CT": {
    state: "Connecticut", stateCode: "CT", county: "Hartford County", population: "121,000+",
    zipCodes: ["06101", "06103", "06105", "06106", "06107", "06112", "06114"],
    avgRate: "11.8¢/kWh", avgMonthlyBill: "$169", providers: 19,
    neighborhoods: ["Downtown Hartford", "South End", "Asylum Hill", "West End", "North End", "Parkville", "Frog Hollow"],
    description: "Hartford residents enjoy competitive electricity rates from competing suppliers in the Eversource service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/ottawa-street.jpg"
  },
  "New Haven-CT": {
    state: "Connecticut", stateCode: "CT", county: "New Haven County", population: "135,000+",
    zipCodes: ["06510", "06511", "06513", "06515", "06519", "06520"],
    avgRate: "11.7¢/kWh", avgMonthlyBill: "$168", providers: 19,
    neighborhoods: ["Downtown New Haven", "East Rock", "Wooster Square", "Fair Haven", "Westville", "Dixwell", "West River"],
    description: "New Haven residents benefit from competitive electricity rates with competing suppliers in the United Illuminating service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/ab8c9932-5234-436a-b781-91c450b67ab0.jpg"
  },
  "Bridgeport-CT": {
    state: "Connecticut", stateCode: "CT", county: "Fairfield County", population: "148,000+",
    zipCodes: ["06601", "06604", "06605", "06606", "06607", "06608", "06610"],
    avgRate: "11.9¢/kWh", avgMonthlyBill: "$170", providers: 18,
    neighborhoods: ["Downtown Bridgeport", "South End", "East End", "West End", "North End", "Black Rock", "Brooklawn"],
    description: "Bridgeport residents enjoy competitive electricity rates from competing suppliers in the United Illuminating service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/770d9cd5-f0df-4175-80a1-078211ed206a.jpg"
  },

  // MAINE CITIES
  "Portland-ME": {
    state: "Maine", stateCode: "ME", county: "Cumberland County", population: "68,000+",
    zipCodes: ["04101", "04102", "04103", "04104", "04105", "04106", "04107"],
    avgRate: "11.5¢/kWh", avgMonthlyBill: "$165", providers: 17,
    neighborhoods: ["Downtown Portland", "Old Port", "West End", "East End", "Munjoy Hill", "Libbytown", "Bayside"],
    description: "Portland residents benefit from competitive electricity rates with competing suppliers in the CMP service territory.",
    image: "https://images.unsplash.com/photo-1505761671935-60b3a7427bad?w=400&h=300&fit=crop"
  },
  "Lewiston-ME": {
    state: "Maine", stateCode: "ME", county: "Androscoggin County", population: "37,000+",
    zipCodes: ["04240", "04241", "04243"],
    avgRate: "11.6¢/kWh", avgMonthlyBill: "$166", providers: 16,
    neighborhoods: ["Downtown Lewiston", "College Street", "Bates College", "Tree Streets", "Webster Street", "East Avenue", "Sabattus Street"],
    description: "Lewiston residents enjoy competitive electricity rates from competing suppliers in the CMP service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/35c3c8a7-86a1-4171-93f9-2a876c9ff35a.jpg"
  },
  "Bangor-ME": {
    state: "Maine", stateCode: "ME", county: "Penobscot County", population: "32,000+",
    zipCodes: ["04401", "04402"],
    avgRate: "11.7¢/kWh", avgMonthlyBill: "$167", providers: 16,
    neighborhoods: ["Downtown Bangor", "Fairmount", "State Street", "Little City", "Broadway", "West Bangor", "East Side"],
    description: "Bangor residents benefit from competitive electricity rates with competing suppliers in the Emera Maine service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/f9cc9f9f-03e1-4bc8-bb2c-a8bdf40d7b5d.jpg"
  },

  // NEW HAMPSHIRE CITIES
  "Manchester-NH": {
    state: "New Hampshire", stateCode: "NH", county: "Hillsborough County", population: "115,000+",
    zipCodes: ["03101", "03102", "03103", "03104", "03109"],
    avgRate: "11.6¢/kWh", avgMonthlyBill: "$166", providers: 17,
    neighborhoods: ["Downtown Manchester", "North End", "South End", "West Side", "East Side", "Pinardville", "Piscataquog Village"],
    description: "Manchester residents enjoy competitive electricity rates from competing suppliers in the Eversource service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/b89134a8-4b49-4280-b376-c9c36d77a3a1.jpg"
  },
  "Nashua-NH": {
    state: "New Hampshire", stateCode: "NH", county: "Hillsborough County", population: "91,000+",
    zipCodes: ["03060", "03061", "03062", "03063", "03064"],
    avgRate: "11.7¢/kWh", avgMonthlyBill: "$167", providers: 16,
    neighborhoods: ["Downtown Nashua", "North End", "South End", "West Hollis Street", "Broad Street Parkway", "Daniel Webster", "Crown Hill"],
    description: "Nashua residents benefit from competitive electricity rates with competing suppliers in the Eversource service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/89e68724-f3a0-408a-b82b-21c7f26fe660.jpg"
  },
  "Concord-NH": {
    state: "New Hampshire", stateCode: "NH", county: "Merrimack County", population: "43,000+",
    zipCodes: ["03301", "03302", "03303"],
    avgRate: "11.8¢/kWh", avgMonthlyBill: "$169", providers: 16,
    neighborhoods: ["Downtown Concord", "Penacook", "West Concord", "East Concord", "Heights", "South End", "North End"],
    description: "Concord residents enjoy competitive electricity rates from competing suppliers in the Eversource service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/c2b6c002-b461-43af-873e-02caf45e467b.jpg"
  },

  // RHODE ISLAND CITIES
  "Providence-RI": {
    state: "Rhode Island", stateCode: "RI", county: "Providence County", population: "190,000+",
    zipCodes: ["02901", "02903", "02904", "02905", "02906", "02907", "02908"],
    avgRate: "11.9¢/kWh", avgMonthlyBill: "$170", providers: 15,
    neighborhoods: ["Downtown Providence", "Federal Hill", "Fox Point", "East Side", "West End", "Smith Hill", "Mount Pleasant"],
    description: "Providence residents benefit from competitive electricity rates with competing suppliers in the National Grid service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/3de2f374-e6c7-4415-a731-3588f4dc57b8.jpg"
  },
  "Warwick-RI": {
    state: "Rhode Island", stateCode: "RI", county: "Kent County", population: "83,000+",
    zipCodes: ["02886", "02888", "02889"],
    avgRate: "12.0¢/kWh", avgMonthlyBill: "$171", providers: 15,
    neighborhoods: ["Warwick Neck", "Oakland Beach", "Apponaug", "Gaspee", "Hillsgrove", "Pawtuxet Village", "Conimicut"],
    description: "Warwick residents enjoy competitive electricity rates from competing suppliers in the National Grid service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/a37c566e-4168-4be1-a823-20bf311f7ed9.jpg"
  },
  "Cranston-RI": {
    state: "Rhode Island", stateCode: "RI", county: "Providence County", population: "82,000+",
    zipCodes: ["02905", "02907", "02910", "02920", "02921"],
    avgRate: "12.0¢/kWh", avgMonthlyBill: "$171", providers: 14,
    neighborhoods: ["Edgewood", "Garden City", "Knightsville", "Meshanticut", "Park View", "Western Hills", "Pawtuxet"],
    description: "Cranston residents benefit from competitive electricity rates with competing suppliers in the National Grid service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/ccdd3a45-7050-4bd0-89d9-81c846e9fcdc.jpg"
  },

  // Handle variations without state codes for backwards compatibility
  "Houston": {
    state: "Texas", stateCode: "TX", county: "Harris County", population: "2,300,000+",
    zipCodes: ["77002", "77019", "77024", "77027", "77056", "77063", "77098"],
    avgRate: "8.9¢/kWh", avgMonthlyBill: "$128", providers: 45,
    neighborhoods: ["Downtown Houston", "The Heights", "Montrose", "River Oaks", "Midtown", "Galleria", "Memorial"],
    description: "Houston, the largest city in Texas and the energy capital of the world, offers residents access to competing electricity suppliers in the deregulated market.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/b92baf13-dff3-4777-8e8a-b25f73b10b8d.jpg"
  },
  "Dallas": {
    state: "Texas", stateCode: "TX", county: "Dallas County", population: "1,300,000+",
    zipCodes: ["75201", "75202", "75204", "75205", "75214", "75219", "75230"],
    avgRate: "9.1¢/kWh", avgMonthlyBill: "$132", providers: 42,
    neighborhoods: ["Downtown Dallas", "Uptown", "Deep Ellum", "Highland Park", "Oak Lawn", "Lake Highlands", "North Dallas"],
    description: "Dallas residents benefit from competitive electricity rates with access to competing suppliers offering a wide range of fixed and variable rate plans.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/8d19f65b-9e9f-4d66-b5f9-6d0cc6de9965.jpg"
  },
  "Austin": {
    state: "Texas", stateCode: "TX", county: "Travis County", population: "978,000+",
    zipCodes: ["78701", "78702", "78703", "78704", "78731", "78745", "78757"],
    avgRate: "9.3¢/kWh", avgMonthlyBill: "$135", providers: 38,
    neighborhoods: ["Downtown Austin", "South Congress", "East Austin", "West Lake Hills", "Hyde Park", "Zilker", "Mueller"],
    description: "Austin, the state capital and tech hub, provides residents with competitive electricity rates and numerous green energy options from competing suppliers.",
    image: "https://images.unsplash.com/photo-1531218150217-54595bc2b934?w=400&h=300&fit=crop"
  },
  "San Antonio": {
    state: "Texas", stateCode: "TX", county: "Bexar County", population: "1,500,000+",
    zipCodes: ["78201", "78209", "78212", "78216", "78232", "78249", "78258"],
    avgRate: "8.8¢/kWh", avgMonthlyBill: "$127", providers: 40,
    neighborhoods: ["Downtown San Antonio", "Alamo Heights", "Stone Oak", "The Dominion", "Southtown", "King William", "Medical Center"],
    description: "San Antonio offers some of the most competitive electricity rates in Texas, with competing suppliers serving the area's residential and commercial customers.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/136ff412-03e2-40c7-8934-8517d2404665.jpg"
  },
  "Fort Worth": {
    state: "Texas", stateCode: "TX", county: "Tarrant County", population: "927,000+",
    zipCodes: ["76102", "76104", "76107", "76109", "76116", "76132", "76244"],
    avgRate: "9.0¢/kWh", avgMonthlyBill: "$130", providers: 41,
    neighborhoods: ["Downtown Fort Worth", "Cultural District", "Sundance Square", "West 7th", "Ridglea", "Tanglewood", "Alliance"],
    description: "Fort Worth residents enjoy access to competitive electricity rates from competing suppliers in the deregulated Texas energy market.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/87a80756-c4b5-44c5-bc05-259fef05ca68.jpg"
  },
  "Chicago": {
    state: "Illinois", stateCode: "IL", county: "Cook County", population: "2,700,000+",
    zipCodes: ["60601", "60602", "60603", "60604", "60605", "60606", "60607"],
    avgRate: "9.8¢/kWh", avgMonthlyBill: "$142", providers: 36,
    neighborhoods: ["Downtown Chicago", "Lincoln Park", "Wicker Park", "River North", "Loop", "Gold Coast", "West Loop"],
    description: "Chicago residents have access to competitive electricity rates from competing suppliers in the ComEd service territory.",
  },
  "Aurora": {
    state: "Illinois", stateCode: "IL", county: "Kane County", population: "180,000+",
    zipCodes: ["60502", "60503", "60504", "60505", "60506", "60507", "60519"],
    avgRate: "9.9¢/kWh", avgMonthlyBill: "$143", providers: 34,
    neighborhoods: ["Downtown Aurora", "Fox Valley", "Far East", "West Aurora", "North Aurora", "Indian Prairie", "Aurora Highlands"],
    description: "Aurora residents benefit from competitive electricity rates with competing suppliers in the western Chicago suburbs.",
  },
  "Naperville": {
    state: "Illinois", stateCode: "IL", county: "DuPage County", population: "149,000+",
    zipCodes: ["60540", "60563", "60564", "60565", "60585"],
    avgRate: "9.7¢/kWh", avgMonthlyBill: "$140", providers: 35,
    neighborhoods: ["Downtown Naperville", "White Eagle", "Ashbury", "Springbrook", "College Hill", "Fort Hill", "Cress Creek"],
    description: "Naperville residents enjoy competitive electricity rates from competing suppliers in the affluent DuPage County area.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/403443a6-48b5-4052-ac9e-6600f43ab721.jpg"
  },
  "Joliet": {
    state: "Illinois", stateCode: "IL", county: "Will County", population: "150,000+",
    zipCodes: ["60431", "60432", "60433", "60434", "60435", "60436"],
    avgRate: "9.8¢/kWh", avgMonthlyBill: "$141", providers: 33,
    neighborhoods: ["Cathedral Area", "Fairmont", "Pilcher Park", "Rockdale", "West Joliet", "Laraway", "Highland Park"],
    description: "Joliet residents have access to competitive electricity rates from competing suppliers in Will County.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/58463eb0-e880-4c1a-b78b-be40c42fb456.jpg"
  },
  "Columbus": {
    state: "Ohio", stateCode: "OH", county: "Franklin County", population: "905,000+",
    zipCodes: ["43085", "43201", "43202", "43203", "43204", "43205", "43206"],
    avgRate: "9.5¢/kWh", avgMonthlyBill: "$138", providers: 38,
    neighborhoods: ["Downtown Columbus", "German Village", "Short North", "Clintonville", "Victorian Village", "Arena District", "Brewery District"],
    description: "Columbus residents enjoy competitive electricity rates from competing suppliers in the AEP Ohio service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/03fe81c8-162d-4692-be26-32e20095399c.jpg"
  },
  "Cleveland": {
    state: "Ohio", stateCode: "OH", county: "Cuyahoga County", population: "372,000+",
    zipCodes: ["44101", "44102", "44103", "44104", "44105", "44106", "44107"],
    avgRate: "9.6¢/kWh", avgMonthlyBill: "$139", providers: 37,
    neighborhoods: ["Downtown Cleveland", "Ohio City", "Tremont", "University Circle", "Detroit-Shoreway", "Edgewater", "Collinwood"],
    description: "Cleveland residents have access to competitive electricity rates from competing suppliers in the FirstEnergy service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/0566fb7e-4b0b-46d4-bdc4-04a2189962bf.jpg"
  },
  "Cincinnati": {
    state: "Ohio", stateCode: "OH", county: "Hamilton County", population: "309,000+",
    zipCodes: ["45201", "45202", "45203", "45204", "45205", "45206", "45207"],
    avgRate: "9.7¢/kWh", avgMonthlyBill: "$140", providers: 36,
    neighborhoods: ["Downtown Cincinnati", "Over-the-Rhine", "Mount Adams", "Clifton", "Hyde Park", "Oakley", "Columbia-Tusculum"],
    description: "Cincinnati residents benefit from competitive electricity rates with competing suppliers in the Duke Energy Ohio territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/e1e2ce07-4723-4b43-b55c-8e6a0251d472.jpg"
  },
  "Toledo": {
    state: "Ohio", stateCode: "OH", county: "Lucas County", population: "270,000+",
    zipCodes: ["43601", "43604", "43606", "43607", "43608", "43609", "43610"],
    avgRate: "9.6¢/kWh", avgMonthlyBill: "$139", providers: 35,
    neighborhoods: ["Downtown Toledo", "Old West End", "Ottawa Hills", "Sylvania", "Point Place", "Westgate", "South End"],
    description: "Toledo residents enjoy competitive electricity rates from competing suppliers in the FirstEnergy service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/c3d7d2f5-d102-4ed8-aa7f-f2e9c6e02764.jpg"
  },
  "Philadelphia": {
    state: "Pennsylvania", stateCode: "PA", county: "Philadelphia County", population: "1,600,000+",
    zipCodes: ["19102", "19103", "19104", "19106", "19107", "19111", "19114"],
    avgRate: "10.2¢/kWh", avgMonthlyBill: "$147", providers: 32,
    neighborhoods: ["Center City", "Old City", "Society Hill", "Rittenhouse Square", "University City", "Northern Liberties", "Fishtown"],
    description: "Philadelphia residents benefit from competitive electricity rates with competing suppliers in the PECO service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/01dc15fd-0434-4dd9-ac68-9123c6a14f33.jpg"
  },
  "Pittsburgh": {
    state: "Pennsylvania", stateCode: "PA", county: "Allegheny County", population: "303,000+",
    zipCodes: ["15201", "15202", "15203", "15204", "15205", "15206", "15207"],
    avgRate: "10.1¢/kWh", avgMonthlyBill: "$146", providers: 30,
    neighborhoods: ["Downtown Pittsburgh", "Shadyside", "Squirrel Hill", "Oakland", "Lawrenceville", "South Side", "Strip District"],
    description: "Pittsburgh residents enjoy competitive electricity rates from competing suppliers in the Duquesne Light service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/162bc2ea-2c58-4a65-bab4-76e96955cc5c1.jpg"
  },
  "Allentown": {
    state: "Pennsylvania", stateCode: "PA", county: "Lehigh County", population: "125,000+",
    zipCodes: ["18101", "18102", "18103", "18104", "18105", "18106", "18109"],
    avgRate: "10.3¢/kWh", avgMonthlyBill: "$148", providers: 28,
    neighborhoods: ["Downtown Allentown", "West Park", "Hanover Acres", "South Side", "East Side", "West End", "Cedar Crest"],
    description: "Allentown residents benefit from competitive electricity rates with competing suppliers in the PPL Electric service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/cfe7691c-4b4d-4429-966f-1475a915d13d.jpg"
  },
  "New York City": {
    state: "New York", stateCode: "NY", county: "New York County", population: "8,300,000+",
    zipCodes: ["10001", "10002", "10003", "10004", "10005", "10006", "10007"],
    avgRate: "11.5¢/kWh", avgMonthlyBill: "$165", providers: 28,
    neighborhoods: ["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island", "Lower East Side", "Upper West Side"],
    description: "NYC residents have access to competitive electricity rates from 28+ ESCOs in the Con Edison service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/b030ead7-1805-4ab1-9b11-5ef8764baa82.jpg"
  },
  "Buffalo": {
    state: "New York", stateCode: "NY", county: "Erie County", population: "278,000+",
    zipCodes: ["14201", "14202", "14203", "14204", "14205", "14206", "14207"],
    avgRate: "10.8¢/kWh", avgMonthlyBill: "$155", providers: 25,
    neighborhoods: ["Downtown Buffalo", "Allentown", "Elmwood Village", "North Buffalo", "South Buffalo", "West Side", "Riverside"],
    description: "Buffalo residents enjoy competitive electricity rates from 25+ ESCOs in the National Grid service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/7c7a75cb-3931-4991-b608-275c44e5dd84.jpg"
  },
  "Rochester": {
    state: "New York", stateCode: "NY", county: "Monroe County", population: "211,000+",
    zipCodes: ["14604", "14605", "14606", "14607", "14608", "14609", "14610"],
    avgRate: "10.9¢/kWh", avgMonthlyBill: "$157", providers: 24,
    neighborhoods: ["Downtown Rochester", "Park Avenue", "East End", "South Wedge", "Corn Hill", "NOTA", "Charlotte"],
    description: "Rochester residents benefit from competitive electricity rates with 24+ ESCOs in the RG&E service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/dfd8afa3-67b9-425f-9616-5dd340a3c534.jpg"
  },
  "Syracuse": {
    state: "New York", stateCode: "NY", county: "Onondaga County", population: "148,000+",
    zipCodes: ["13201", "13202", "13203", "13204", "13205", "13206", "13207"],
    avgRate: "11.0¢/kWh", avgMonthlyBill: "$158", providers: 23,
    neighborhoods: ["Downtown Syracuse", "University Hill", "Eastwood", "Westcott", "Tipperary Hill", "Strathmore", "Sedgwick"],
    description: "Syracuse residents enjoy competitive electricity rates from 23+ ESCOs in the National Grid service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/8af97b79-9633-405b-a443-c8df9b48d0cf.jpg"
  },
  "Newark": {
    state: "New Jersey", stateCode: "NJ", county: "Essex County", population: "311,000+",
    zipCodes: ["07102", "07103", "07104", "07105", "07106", "07107", "07108"],
    avgRate: "10.5¢/kWh", avgMonthlyBill: "$151", providers: 27,
    neighborhoods: ["Downtown Newark", "Ironbound", "Forest Hill", "North Ward", "Central Ward", "West Ward", "South Ward"],
    description: "Newark residents benefit from competitive electricity rates with competing suppliers in the PSE&G service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/1a6aeb64-6311-486c-baba-c7cff53a3d5c.jpg"
  },
  "Jersey City": {
    state: "New Jersey", stateCode: "NJ", county: "Hudson County", population: "292,000+",
    zipCodes: ["07302", "07304", "07305", "07306", "07307", "07310"],
    avgRate: "10.6¢/kWh", avgMonthlyBill: "$152", providers: 26,
    neighborhoods: ["Downtown Jersey City", "Journal Square", "The Heights", "Bergen-Lafayette", "Greenville", "McGinley Square", "Paulus Hook"],
    description: "Jersey City residents enjoy competitive electricity rates from competing suppliers in the PSE&G service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/29c455be-4263-4009-8e75-1475730b0b76.jpg"
  },
  "Paterson": {
    state: "New Jersey", stateCode: "NJ", county: "Passaic County", population: "159,000+",
    zipCodes: ["07501", "07502", "07503", "07504", "07505", "07510", "07514"],
    avgRate: "10.7¢/kWh", avgMonthlyBill: "$153", providers: 25,
    neighborhoods: ["Downtown Paterson", "Eastside", "Riverside", "Peoples Park", "Hillcrest", "Northside", "Wrigley Park"],
    description: "Paterson residents benefit from competitive electricity rates with competing suppliers in the PSE&G service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/8bb83b32-7b38-4635-9279-d5fe12f4d755.jpg"
  },
  "Baltimore": {
    state: "Maryland", stateCode: "MD", county: "Baltimore City", population: "576,000+",
    zipCodes: ["21201", "21202", "21205", "21206", "21207", "21208", "21209"],
    avgRate: "10.4¢/kWh", avgMonthlyBill: "$150", providers: 29,
    neighborhoods: ["Downtown Baltimore", "Federal Hill", "Fells Point", "Canton", "Inner Harbor", "Mount Vernon", "Charles Village"],
    description: "Baltimore residents enjoy competitive electricity rates from competing suppliers in the BGE service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/f10f5df1-6404-4618-b8c3-314d3f6a0d29.jpg"
  },
  "Frederick": {
    state: "Maryland", stateCode: "MD", county: "Frederick County", population: "79,000+",
    zipCodes: ["21701", "21702", "21703", "21704", "21705"],
    avgRate: "10.5¢/kWh", avgMonthlyBill: "$151", providers: 27,
    neighborhoods: ["Downtown Frederick", "Ballenger Creek", "Hood College", "North Frederick", "South Frederick", "West Frederick", "East Frederick"],
    description: "Frederick residents benefit from competitive electricity rates with competing suppliers in the Potomac Edison service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/98350fd0-49c8-4087-8479-0d390c853bf3.jpg"
  },
  "Rockville": {
    state: "Maryland", stateCode: "MD", county: "Montgomery County", population: "68,000+",
    zipCodes: ["20850", "20851", "20852", "20853", "20854", "20855"],
    avgRate: "10.3¢/kWh", avgMonthlyBill: "$148", providers: 28,
    neighborhoods: ["Downtown Rockville", "Twinbrook", "West End", "King Farm", "Lincoln Park", "Woodley Gardens", "Fallsgrove"],
    description: "Rockville residents enjoy competitive electricity rates from competing suppliers in the Pepco service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/46fe92cb-3aa8-4914-8974-bde36dd806af.jpg"
  },
  "Boston": {
    state: "Massachusetts", stateCode: "MA", county: "Suffolk County", population: "675,000+",
    zipCodes: ["02101", "02108", "02109", "02110", "02111", "02113", "02114"],
    avgRate: "11.2¢/kWh", avgMonthlyBill: "$161", providers: 22,
    neighborhoods: ["Downtown Boston", "Back Bay", "Beacon Hill", "North End", "South End", "Fenway", "Charlestown"],
    description: "Boston residents benefit from competitive electricity rates with competing suppliers across multiple utility territories.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/6e33a452-8111-4711-a6e7-b49128f6bc5a.jpg"
  },
  "Worcester": {
    state: "Massachusetts", stateCode: "MA", county: "Worcester County", population: "206,000+",
    zipCodes: ["01601", "01602", "01603", "01604", "01605", "01606", "01607"],
    avgRate: "11.3¢/kWh", avgMonthlyBill: "$162", providers: 21,
    neighborhoods: ["Downtown Worcester", "Main South", "Tatnuck", "West Side", "East Side", "Shrewsbury Street", "Canal District"],
    description: "Worcester residents enjoy competitive electricity rates from competing suppliers in the National Grid service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/d4fa1135-c2c6-4c43-8184-540993ddd4db.jpg"
  },
  "Springfield": {
    state: "Massachusetts", stateCode: "MA", county: "Hampden County", population: "155,000+",
    zipCodes: ["01101", "01103", "01104", "01105", "01107", "01108", "01109"],
    avgRate: "11.4¢/kWh", avgMonthlyBill: "$163", providers: 20,
    neighborhoods: ["Downtown Springfield", "Forest Park", "Sixteen Acres", "East Springfield", "South End", "Six Corners", "Metro Center"],
    description: "Springfield residents benefit from competitive electricity rates with competing suppliers in the Eversource service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/45362c2b-5e37-45ca-a6ab-ac06564ed343.jpg"
  },
  "Hartford": {
    state: "Connecticut", stateCode: "CT", county: "Hartford County", population: "121,000+",
    zipCodes: ["06101", "06103", "06105", "06106", "06107", "06112", "06114"],
    avgRate: "11.8¢/kWh", avgMonthlyBill: "$169", providers: 19,
    neighborhoods: ["Downtown Hartford", "South End", "Asylum Hill", "West End", "North End", "Parkville", "Frog Hollow"],
    description: "Hartford residents enjoy competitive electricity rates from competing suppliers in the Eversource service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/ottawa-street.jpg"
  },
  "New Haven": {
    state: "Connecticut", stateCode: "CT", county: "New Haven County", population: "135,000+",
    zipCodes: ["06510", "06511", "06513", "06515", "06519", "06520"],
    avgRate: "11.7¢/kWh", avgMonthlyBill: "$168", providers: 19,
    neighborhoods: ["Downtown New Haven", "East Rock", "Wooster Square", "Fair Haven", "Westville", "Dixwell", "West River"],
    description: "New Haven residents benefit from competitive electricity rates with competing suppliers in the United Illuminating service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/ab8c9932-5234-436a-b781-91c450b67ab0.jpg"
  },
  "Bridgeport": {
    state: "Connecticut", stateCode: "CT", county: "Fairfield County", population: "148,000+",
    zipCodes: ["06601", "06604", "06605", "06606", "06607", "06608", "06610"],
    avgRate: "11.9¢/kWh", avgMonthlyBill: "$170", providers: 18,
    neighborhoods: ["Downtown Bridgeport", "South End", "East End", "West End", "North End", "Black Rock", "Brooklawn"],
    description: "Bridgeport residents enjoy competitive electricity rates from competing suppliers in the United Illuminating service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/770d9cd5-f0df-4175-80a1-078211ed206a.jpg"
  },
  "Portland": {
    state: "Maine", stateCode: "ME", county: "Cumberland County", population: "68,000+",
    zipCodes: ["04101", "04102", "04103", "04104", "04105", "04106", "04107"],
    avgRate: "11.5¢/kWh", avgMonthlyBill: "$165", providers: 17,
    neighborhoods: ["Downtown Portland", "Old Port", "West End", "East End", "Munjoy Hill", "Libbytown", "Bayside"],
    description: "Portland residents benefit from competitive electricity rates with competing suppliers in the CMP service territory.",
    image: "https://images.unsplash.com/photo-1505761671935-60b3a7427bad?w=400&h=300&fit=crop"
  },
  "Lewiston": {
    state: "Maine", stateCode: "ME", county: "Androscoggin County", population: "37,000+",
    zipCodes: ["04240", "04241", "04243"],
    avgRate: "11.6¢/kWh", avgMonthlyBill: "$166", providers: 16,
    neighborhoods: ["Downtown Lewiston", "College Street", "Bates College", "Tree Streets", "Webster Street", "East Avenue", "Sabattus Street"],
    description: "Lewiston residents enjoy competitive electricity rates from competing suppliers in the CMP service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/35c3c8a7-86a1-4171-93f9-2a876c9ff35a.jpg"
  },
  "Bangor": {
    state: "Maine", stateCode: "ME", county: "Penobscot County", population: "32,000+",
    zipCodes: ["04401", "04402"],
    avgRate: "11.7¢/kWh", avgMonthlyBill: "$167", providers: 16,
    neighborhoods: ["Downtown Bangor", "Fairmount", "State Street", "Little City", "Broadway", "West Bangor", "East Side"],
    description: "Bangor residents benefit from competitive electricity rates with competing suppliers in the Emera Maine service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/f9cc9f9f-03e1-4bc8-bb2c-a8bdf40d7b5d.jpg"
  },
  "Manchester": {
    state: "New Hampshire", stateCode: "NH", county: "Hillsborough County", population: "115,000+",
    zipCodes: ["03101", "03102", "03103", "03104", "03109"],
    avgRate: "11.6¢/kWh", avgMonthlyBill: "$166", providers: 17,
    neighborhoods: ["Downtown Manchester", "North End", "South End", "West Side", "East Side", "Pinardville", "Piscataquog Village"],
    description: "Manchester residents enjoy competitive electricity rates from competing suppliers in the Eversource service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/b89134a8-4b49-4280-b376-c9c36d77a3a1.jpg"
  },
  "Nashua": {
    state: "New Hampshire", stateCode: "NH", county: "Hillsborough County", population: "91,000+",
    zipCodes: ["03060", "03061", "03062", "03063", "03064"],
    avgRate: "11.7¢/kWh", avgMonthlyBill: "$167", providers: 16,
    neighborhoods: ["Downtown Nashua", "North End", "South End", "West Hollis Street", "Broad Street Parkway", "Daniel Webster", "Crown Hill"],
    description: "Nashua residents benefit from competitive electricity rates with competing suppliers in the Eversource service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/89e68724-f3a0-408a-b82b-21c7f26fe660.jpg"
  },
  "Concord": {
    state: "New Hampshire", stateCode: "NH", county: "Merrimack County", population: "43,000+",
    zipCodes: ["03301", "03302", "03303"],
    avgRate: "11.8¢/kWh", avgMonthlyBill: "$169", providers: 16,
    neighborhoods: ["Downtown Concord", "Penacook", "West Concord", "East Concord", "Heights", "South End", "North End"],
    description: "Concord residents enjoy competitive electricity rates from competing suppliers in the Eversource service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/c2b6c002-b461-43af-873e-02caf45e467b.jpg"
  },
  "Providence": {
    state: "Rhode Island", stateCode: "RI", county: "Providence County", population: "190,000+",
    zipCodes: ["02901", "02903", "02904", "02905", "02906", "02907", "02908"],
    avgRate: "11.9¢/kWh", avgMonthlyBill: "$170", providers: 15,
    neighborhoods: ["Downtown Providence", "Federal Hill", "Fox Point", "East Side", "West End", "Smith Hill", "Mount Pleasant"],
    description: "Providence residents benefit from competitive electricity rates with competing suppliers in the National Grid service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/3de2f374-e6c7-4415-a731-3588f4dc57b8.jpg"
  },
  "Warwick": {
    state: "Rhode Island", stateCode: "RI", county: "Kent County", population: "83,000+",
    zipCodes: ["02886", "02888", "02889"],
    avgRate: "12.0¢/kWh", avgMonthlyBill: "$171", providers: 15,
    neighborhoods: ["Warwick Neck", "Oakland Beach", "Apponaug", "Gaspee", "Hillsgrove", "Pawtuxet Village", "Conimicut"],
    description: "Warwick residents enjoy competitive electricity rates from competing suppliers in the National Grid service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/a37c566e-4168-4be1-a823-20bf311f7ed9.jpg"
  },
  "Cranston": {
    state: "Rhode Island", stateCode: "RI", county: "Providence County", population: "82,000+",
    zipCodes: ["02905", "02907", "02910", "02920", "02921"],
    avgRate: "12.0¢/kWh", avgMonthlyBill: "$171", providers: 14,
    neighborhoods: ["Edgewood", "Garden City", "Knightsville", "Meshanticut", "Park View", "Western Hills", "Pawtuxet"],
    description: "Cranston residents benefit from competitive electricity rates with competing suppliers in the National Grid service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/ccdd3a45-7050-4bd0-89d9-81c846e9fcdc.jpg"
  },
  "Akron-OH": {
    state: "Ohio", stateCode: "OH", county: "Summit", population: "190,469+",
    zipCodes: ["44301", "44302", "44303", "44305", "44306"],
    avgRate: "9.5¢/kWh", avgMonthlyBill: "$110", providers: 30,
    neighborhoods: ["Merriman Valley", "Chapel Hill", "Highland Square", "Goodyear Heights", "Firestone Park", "Ellet"],
    description: "Akron has a deregulated electricity market, offering residents a choice of competing suppliers, leading to competitive rates and plans.",
  },
  "Annapolis-MD": {
    state: "Maryland", stateCode: "MD", county: "Anne Arundel", population: "40,812+",
    zipCodes: ["21401", "21403", "21409", "21402", "21404"],
    avgRate: "12.5¢/kWh", avgMonthlyBill: "$135", providers: 25,
    neighborhoods: ["Eastport", "West Annapolis", "Downtown Annapolis", "Admiral Heights", "Annapolis Roads", "Murray Hill"],
    description: "Annapolis residents can take advantage of Maryland's deregulated electricity market, choosing from over 25 retail electric suppliers to find competitive rates and plans.",
  },
  "Arlington-TX": {
    state: "Texas", stateCode: "TX", county: "Tarrant", population: "394,266+",
    zipCodes: ["76010", "76011", "76012", "76013", "76017"],
    avgRate: "9.2¢/kWh", avgMonthlyBill: "$110", providers: 40,
    neighborhoods: ["West Arlington", "North Arlington", "Southwest Arlington", "Southeast Arlington", "East Arlington", "Central Arlington"],
    description: "As part of Texas's deregulated electricity market, Arlington residents can choose from over 40 competing providers, ensuring a wide range of competitive energy plans.",
  },
  "Auburn-ME": {
    state: "Maine", stateCode: "ME", county: "Androscoggin", population: "24,000+",
    zipCodes: ["04210", "04211", "04212"],
    avgRate: "16.5¢/kWh", avgMonthlyBill: "$149", providers: 14,
    neighborhoods: ["Auburn Southeast", "Auburn Plains", "East Auburn", "Haskell Corner", "Lewiston Junction", "Stevens Mill"],
    description: "Electricity in Auburn is part of Maine's deregulated energy market, offering residents a choice among approximately 14 competitive electricity providers.",
  },
  "Augusta-ME": {
    state: "Maine", stateCode: "ME", county: "Kennebec County", population: "19,000+",
    zipCodes: ["04330", "04332", "04333", "04336", "04338"],
    avgRate: "16.5¢/kWh", avgMonthlyBill: "$135", providers: 14,
    neighborhoods: ["Pelton Hill", "Augusta East", "North Augusta", "Summerhaven", "City Center", "Augusta Northeast"],
    description: "As the capital of Maine, Augusta benefits from a deregulated electricity market, offering residents a choice of competing suppliers for competitive rates.",
  },
  "Biddeford-ME": {
    state: "Maine", stateCode: "ME", county: "York County", population: "22,000+",
    zipCodes: ["04005", "04006"],
    avgRate: "12.8¢/kWh", avgMonthlyBill: "$185", providers: 15,
    neighborhoods: ["Downtown Biddeford", "Pool", "Hills Beach", "Biddeford Pool", "West Street", "Alfred Road"],
    description: "Biddeford residents in York County can compare electricity rates from competing suppliers in Maine's deregulated energy market.",
  },
  "South Portland-ME": {
    state: "Maine", stateCode: "ME", county: "Cumberland County", population: "26,000+",
    zipCodes: ["04106"],
    avgRate: "12.5¢/kWh", avgMonthlyBill: "$181", providers: 16,
    neighborhoods: ["Mill Creek", "Willard Beach", "Knightville", "Cash Corner", "Redbank", "Ferry Village"],
    description: "South Portland residents benefit from competing electricity suppliers offering competitive rates in Cumberland County.",
  },
  "Bethlehem-PA": {
    state: "Pennsylvania", stateCode: "PA", county: "Northampton and Lehigh", population: "80,000+",
    zipCodes: ["18015", "18016", "18017", "18018", "18020"],
    avgRate: "10.5¢/kWh", avgMonthlyBill: "$95", providers: 30,
    neighborhoods: ["Historic Bethlehem", "South Bethlehem", "West Side", "East Side", "North Side", "Bethlehem Township"],
    description: "As a city in a deregulated state, Bethlehem residents can choose from over 30 competing electricity providers, ensuring a variety of rate options.",
  },
  "Cambridge-MA": {
    state: "Massachusetts", stateCode: "MA", county: "Middlesex County", population: "118,403+",
    zipCodes: ["02138", "02139", "02140", "02141", "02142"],
    avgRate: "19.5¢/kWh", avgMonthlyBill: "$173", providers: 20,
    neighborhoods: ["East Cambridge", "Cambridgeport", "Mid-Cambridge", "North Cambridge", "West Cambridge", "Riverside"],
    description: "As a city in a deregulated state, Cambridge residents can choose from competing electricity suppliers, fostering a competitive market for electricity rates.",
  },
  "Camden-NJ": {
    state: "New Jersey", stateCode: "NJ", county: "Camden", population: "71,791+",
    zipCodes: ["08102", "08103", "08104", "08105", "08109"],
    avgRate: "13.5¢/kWh", avgMonthlyBill: "$120", providers: 25,
    neighborhoods: ["Cooper Grant", "Cramer Hill", "Fairview", "Gateway", "Lanning Square", "Parkside"],
    description: "Camden has a deregulated electricity market with competing suppliers, offering residents a variety of choices for their energy needs.",
  },
  "Canton-OH": {
    state: "Ohio", stateCode: "OH", county: "Stark County", population: "70,000+",
    zipCodes: ["44702", "44703", "44704", "44705", "44706"],
    avgRate: "9.5¢/kWh", avgMonthlyBill: "$85", providers: 30,
    neighborhoods: ["Washington Square", "Avondale", "Martindale Park", "Historic Ridgewood", "Sippo Lake", "Meyers Lake"],
    description: "Canton's deregulated electricity market offers residents a choice of competing suppliers, fostering competitive rates and energy options.",
  },
  "Champaign-IL": {
    state: "Illinois", stateCode: "IL", county: "Champaign", population: "88,302+",
    zipCodes: ["61820", "61821", "61822", "61824", "61825"],
    avgRate: "10.5¢/kWh", avgMonthlyBill: "$115", providers: 34,
    neighborhoods: ["Robeson Meadows West-Prairie Ridge Place", "Pembroke Point", "Cherry Hills", "Ashland Park", "Boulder Ridge", "Clark Park"],
    description: "Champaign has a deregulated electricity market with competing suppliers, offering residents a wide range of choices for their energy needs.",
  },
  "Columbia-MD": {
    state: "Maryland", stateCode: "MD", county: "Howard County", population: "104,681+",
    zipCodes: ["21044", "21045", "21046", "21042", "21043"],
    avgRate: "12.5¢/kWh", avgMonthlyBill: "$113", providers: 25,
    neighborhoods: ["Allview Estates", "Banneker Place", "Beech Creek", "Clarys Forest", "Cross Fox", "Bryant Gardens"],
    description: "As part of Maryland's deregulated energy market, residents of Columbia can choose from over 25 competitive electricity providers, ensuring a variety of pricing and plan options.",
  },
  "Corpus Christi-TX": {
    state: "Texas", stateCode: "TX", county: "Nueces", population: "317,863+",
    zipCodes: ["78401", "78402", "78404", "78405", "78408"],
    avgRate: "9.5¢/kWh", avgMonthlyBill: "$98", providers: 40,
    neighborhoods: ["Downtown", "Calallen", "South Side", "North Padre Island", "Flour Bluff", "Bay Area"],
    description: "As a city in the deregulated Texas electricity market, Corpus Christi offers residents a choice of over 40 retail electricity providers, promoting competitive rates and plans.",
  },
  "Dayton-OH": {
    state: "Ohio", stateCode: "OH", county: "Montgomery", population: "136,000+",
    zipCodes: ["45402", "45403", "45404", "45405", "45406"],
    avgRate: "9.2¢/kWh", avgMonthlyBill: "$83", providers: 30,
    neighborhoods: ["Downtown Dayton", "Oregon District", "South Park", "Dayton View", "Huffman", "McPherson Town"],
    description: "Dayton has a deregulated electricity market with competing suppliers, offering residents a wide range of choices for their energy needs.",
  },
  "Dover-NH": {
    state: "New Hampshire", stateCode: "NH", county: "Strafford County", population: "32,741+",
    zipCodes: ["03820", "03821", "03822"],
    avgRate: "17.5¢/kWh", avgMonthlyBill: "$105", providers: 15,
    neighborhoods: ["Downtown Dover", "Garrison Village", "Bellamy Woods", "Back River Road Area", "Dover Point", "City Center"],
    description: "As a city in New Hampshire's deregulated electricity market, Dover residents can choose from over 15 competitive energy suppliers, fostering a variety of rate options.",
  },
  "East Providence-RI": {
    state: "Rhode Island", stateCode: "RI", county: "Providence", population: "47,139+",
    zipCodes: ["02914", "02915", "02916"],
    avgRate: "19.5¢/kWh", avgMonthlyBill: "$175", providers: 15,
    neighborhoods: ["Rumford", "Phillipsdale", "Boyden Heights", "Kent Heights", "Riverside", "Watchemoket"],
    description: "East Providence's deregulated electricity market offers residents a choice of competing suppliers, fostering competitive rates and energy options.",
  },
  "Edison-NJ": {
    state: "New Jersey", stateCode: "NJ", county: "Middlesex", population: "107,588+",
    zipCodes: ["08817", "08818", "08820", "08837", "08899"],
    avgRate: "13.5¢/kWh", avgMonthlyBill: "$120", providers: 25,
    neighborhoods: ["Clara Barton", "Oak Tree", "Menlo Park", "North Edison", "New Durham", "Stephenville"],
    description: "Edison has a deregulated electricity market with competing suppliers, offering residents a wide range of choices for their energy supply.",
  },
  "El Paso-TX": {
    state: "Texas", stateCode: "TX", county: "El Paso County", population: "865,657+",
    zipCodes: ["79936", "79938", "79928", "79912", "79924"],
    avgRate: "9.2¢/kWh", avgMonthlyBill: "$110", providers: 40,
    neighborhoods: ["Album Park", "Castner Heights", "Cielo Vista", "Mesa Hills", "North Hills", "Mountain View"],
    description: "El Paso has a deregulated electricity market with competing suppliers, giving residents the power to choose their energy supplier.",
  },
  "Elgin-IL": {
    "state": "Illinois", "stateCode": "IL", "county": "Kane County", "population": "114,797+",
    "zipCodes": ["60120", "60121", "60123", "60124", "60103"],
    "avgRate": "10.5¢/kWh", "avgMonthlyBill": "$115", "providers": 34,
    "neighborhoods": ["Bowes Creek", "Providence", "Randall Ridge", "Highland Woods", "Century Oaks", "Eagle Heights"],
    "description": "Elgin's deregulated electricity market offers residents a choice of competing suppliers, fostering competitive rates and energy options.",
    "image": "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=400&h=300&fit=crop"
  },
  "Erie-PA": {
    state: "Pennsylvania", stateCode: "PA", county: "Erie", population: "94,000+",
    zipCodes: ["16501", "16502", "16503", "16504", "16505"],
    avgRate: "10.5¢/kWh", avgMonthlyBill: "$95", providers: 30,
    neighborhoods: ["Downtown", "West Bayfront", "East Bayfront", "Glenwood", "Frontier", "Little Italy"],
    description: "As a city in Pennsylvania, Erie benefits from a deregulated electricity market, offering residents a choice from around 30 competitive providers.",
  },
  "Frisco-TX": {
    state: "Texas", stateCode: "TX", county: "Collin and Denton", population: "219,000+",
    zipCodes: ["75033", "75034", "75035", "75036", "75072"],
    avgRate: "9.2¢/kWh", avgMonthlyBill: "$110", providers: 40,
    neighborhoods: ["Starwood", "Phillips Creek Ranch", "Newman Village", "Trails of Frisco", "Panther Creek", "Chapel Creek"],
    description: "As part of Texas's deregulated electricity market, Frisco residents can choose from competing suppliers, fostering competitive rates and plans.",
  },
  "Germantown-MD": {
    state: "Maryland", stateCode: "MD", county: "Montgomery", population: "91,000+",
    zipCodes: ["20874", "20876", "20875", "20841", "20879"],
    avgRate: "12.5¢/kWh", avgMonthlyBill: "$115", providers: 25,
    neighborhoods: ["Germantown Estates", "Germantown Park", "Greenfield Commons", "Gunners Lake Village", "Kingsview Village", "Neelsville"],
    description: "As a city in a state with a deregulated electricity market, Germantown residents can choose from over 25 competing energy providers, fostering competitive rates.",
  },
  "Hoboken-NJ": {
    state: "New Jersey", stateCode: "NJ", county: "Hudson", population: "59,000+",
    zipCodes: ["07030"],
    avgRate: "13.5¢/kWh", avgMonthlyBill: "$120", providers: 25,
    neighborhoods: ["Castle Point", "Downtown Hoboken", "Southwest Hoboken", "The Waterfront", "Uptown Hoboken", "Midtown"],
    description: "Hoboken's deregulated electricity market offers residents a choice of competing suppliers, fostering competition and potentially lower rates.",
  },
  "Irving-TX": {
    state: "Texas", stateCode: "TX", county: "Dallas County", population: "256,684+",
    zipCodes: ["75014", "75015", "75016", "75038", "75039"],
    avgRate: "9.5¢/kWh", avgMonthlyBill: "$95", providers: 40,
    neighborhoods: ["Las Colinas", "Valley Ranch", "Hackberry Creek", "Song", "Lamar Brown", "University Hills"],
    description: "Irving is a city in the deregulated energy market of Texas, offering residents a choice of competing electricity suppliers.",
  },
  "Killeen-TX": {
    state: "Texas", stateCode: "TX", county: "Bell", population: "153,095+",
    zipCodes: ["76541", "76542", "76543", "76544", "76549"],
    avgRate: "9.5¢/kWh", avgMonthlyBill: "$112", providers: 40,
    neighborhoods: ["Yowell Ranch", "White Rock Estates", "Sunflower Estates", "Trimmier Estates", "The Highlands at Saegert", "Bellaire Heights"],
    description: "As a city in the deregulated Texas electricity market, Killeen offers residents a choice of competing suppliers, fostering competitive rates and plans.",
  },
  "Lancaster-PA": {
    state: "Pennsylvania", stateCode: "PA", county: "Lancaster", population: "58,039+",
    zipCodes: ["17601", "17602", "17603", "17604", "17608"],
    avgRate: "10.5¢/kWh", avgMonthlyBill: "$125", providers: 30,
    neighborhoods: ["West End", "Chestnut Hill", "Stadium District", "Cabbage Hill", "Southeast Lancaster", "Downtown"],
    description: "Lancaster has a deregulated electricity market, offering residents a choice among approximately 30 competitive suppliers for their energy needs.",
  },
  "Lowell-MA": {
    state: "Massachusetts", stateCode: "MA", county: "Middlesex", population: "120,418+",
    zipCodes: ["01850", "01851", "01852", "01854"],
    avgRate: "19.5¢/kWh", avgMonthlyBill: "$117", providers: 20,
    neighborhoods: ["Pawtucketville", "Centralville", "Highlands", "The Acre", "Downtown", "Belvidere"],
    description: "As a city in a state with a deregulated electricity market, Lowell offers residents a choice of around 20 competing energy providers, fostering competitive rates.",
  },
  "Lubbock-TX": {
    state: "Texas", stateCode: "TX", county: "Lubbock", population: "272,086+",
    zipCodes: ["79401", "79403", "79404", "79406", "79407"],
    avgRate: "9.2¢/kWh", avgMonthlyBill: "$110", providers: 40,
    neighborhoods: ["Tech Terrace", "Maxey Park", "Heart of Lubbock", "Wheelock and Monterey", "Maedgen Area", "Rush"],
    description: "In Lubbock, the deregulated electricity market offers residents a wide array of choices, with suppliers competing to offer competitive rates and plans.",
  },
  "McKinney-TX": {
    state: "Texas", stateCode: "TX", county: "Collin County", population: "200,000+",
    zipCodes: ["75069", "75070", "75071", "75072", "75454"],
    avgRate: "9.2¢/kWh", avgMonthlyBill: "$110", providers: 40,
    neighborhoods: ["Adriatica Villa District", "Arbor Glen", "Arbor Hollow", "Aspendale", "Auburn Hills", "Avalon"],
    description: "McKinney is a city in the deregulated energy market of Texas, offering residents a choice of competing electricity suppliers.",
  },
  "Midland-TX": {
    state: "Texas", stateCode: "TX", county: "Midland County", population: "170,000+",
    zipCodes: ["79701", "79703", "79705", "79706", "79707"],
    avgRate: "9.2¢/kWh", avgMonthlyBill: "$110", providers: 40,
    neighborhoods: ["Green Tree", "Grassland Estates", "Saddle Club", "Briarwood", "Trinity", "Kimber-Lea"],
    description: "Midland has a deregulated electricity market with competing suppliers, offering residents a wide range of competitive energy plans to choose from.",
  },
  "New Bedford-MA": {
    state: "Massachusetts", stateCode: "MA", county: "Bristol", population: "101,000+",
    zipCodes: ["02740", "02744", "02745", "02746", "02742"],
    avgRate: "20.5¢/kWh", avgMonthlyBill: "$185", providers: 22,
    neighborhoods: ["Acushnet Heights", "Far North End", "South End", "West End", "Downtown", "Clark's Point"],
    description: "Electricity in New Bedford is part of a deregulated market, offering residents a choice among approximately 22 competitive suppliers. This provides options for different rates and plans.",
  },
  "Brockton-MA": {
    state: "Massachusetts", stateCode: "MA", county: "Plymouth County", population: "105,000+",
    zipCodes: ["02301", "02302"],
    avgRate: "14.2¢/kWh", avgMonthlyBill: "$206", providers: 22,
    neighborhoods: ["Downtown Brockton", "Campello", "Montello", "East Side", "West Side", "Avon"],
    description: "Brockton residents in Plymouth County can compare electricity rates from competing suppliers to find savings on their energy bills.",
  },
  "Fall River-MA": {
    state: "Massachusetts", stateCode: "MA", county: "Bristol County", population: "93,000+",
    zipCodes: ["02720", "02721", "02722", "02723", "02724"],
    avgRate: "14.5¢/kWh", avgMonthlyBill: "$210", providers: 21,
    neighborhoods: ["Downtown Fall River", "Highlands", "Flint", "South End", "Steep Brook", "Globe Corners"],
    description: "Fall River residents in Bristol County benefit from competing electricity suppliers offering competitive alternatives to Eversource rates.",
  },
  "Quincy-MA": {
    state: "Massachusetts", stateCode: "MA", county: "Norfolk County", population: "101,000+",
    zipCodes: ["02169", "02170", "02171"],
    avgRate: "14.0¢/kWh", avgMonthlyBill: "$203", providers: 24,
    neighborhoods: ["Downtown Quincy", "Quincy Center", "Wollaston", "North Quincy", "South Quincy", "Marina Bay"],
    description: "Quincy, the City of Presidents, offers residents access to competing electricity suppliers with competitive rates south of Boston.",
  },
  "Somerville-MA": {
    state: "Massachusetts", stateCode: "MA", county: "Middlesex County", population: "81,000+",
    zipCodes: ["02143", "02144", "02145"],
    avgRate: "14.1¢/kWh", avgMonthlyBill: "$204", providers: 24,
    neighborhoods: ["Davis Square", "Union Square", "Assembly Row", "Ball Square", "Winter Hill", "East Somerville"],
    description: "Somerville residents near Boston benefit from competing electricity suppliers offering competitive rates in Middlesex County.",
  },
  "Norwalk-CT": {
    state: "Connecticut", stateCode: "CT", county: "Fairfield", population: "91,000+",
    zipCodes: ["06850", "06851", "06853", "06854", "06855"],
    avgRate: "22.8¢/kWh", avgMonthlyBill: "$161", providers: 18,
    neighborhoods: ["Broad River", "South Norwalk", "East Norwalk", "West Norwalk", "Silvermine", "Cranbury"],
    description: "Norwalk has a deregulated electricity market, offering residents a choice among 18 competitive providers for their energy needs.",
  },
  "Pawtucket-RI": {
    state: "Rhode Island", stateCode: "RI", county: "Providence", population: "75,604+",
    zipCodes: ["02860", "02861", "02862"],
    avgRate: "19.5¢/kWh", avgMonthlyBill: "$135", providers: 15,
    neighborhoods: ["Darlington", "Woodlawn", "Quality Hill", "Pleasant View", "Fairlawn", "Oak Hill"],
    description: "Electricity in Pawtucket is part of Rhode Island's deregulated energy market, offering residents a choice among approximately 15 competitive electric suppliers.",
  },
  "Newport-RI": {
    state: "Rhode Island", stateCode: "RI", county: "Newport County", population: "25,000+",
    zipCodes: ["02840", "02841"],
    avgRate: "13.8¢/kWh", avgMonthlyBill: "$200", providers: 18,
    neighborhoods: ["Downtown Newport", "Thames Street", "Bellevue Avenue", "Ocean Drive", "Middletown", "Portsmouth"],
    description: "Newport residents can compare electricity rates from competing suppliers to find savings in Rhode Island's deregulated energy market.",
  },
  "Woonsocket-RI": {
    state: "Rhode Island", stateCode: "RI", county: "Providence County", population: "44,000+",
    zipCodes: ["02895"],
    avgRate: "13.5¢/kWh", avgMonthlyBill: "$195", providers: 19,
    neighborhoods: ["Downtown Woonsocket", "Social", "Bernon", "Fairmount", "Globe", "Hamlet"],
    description: "Woonsocket residents in Providence County benefit from competing electricity suppliers with competitive rates in northern Rhode Island.",
  },
  "Peoria-IL": {
    state: "Illinois", stateCode: "IL", county: "Peoria", population: "113,150+",
    zipCodes: ["61602", "61603", "61604", "61605", "61606"],
    avgRate: "10.5¢/kWh", avgMonthlyBill: "$115", providers: 34,
    neighborhoods: ["Downtown", "North Peoria", "West Peoria", "East Peoria", "Morton", "Washington"],
    description: "As a resident of Peoria, you live in a deregulated electricity market, giving you the power to choose from over 34 different energy providers.",
  },
  "Plano-TX": {
    state: "Texas", stateCode: "TX", county: "Collin", population: "285,494+",
    zipCodes: ["75023", "75024", "75025", "75074", "75093"],
    avgRate: "9.2¢/kWh", avgMonthlyBill: "$110", providers: 38,
    neighborhoods: ["Willow Bend", "Whiffletree", "Normandy Estates", "Lakeside on Preston", "Indian Creek", "Gleneagles"],
    description: "Plano's deregulated electricity market offers residents a wide selection of energy plans from competing suppliers, ensuring competitive rates and options.",
  },
  "Amarillo-TX": {
    state: "Texas", stateCode: "TX", county: "Potter County", population: "200,000+",
    zipCodes: ["79101", "79102", "79106", "79107", "79109", "79110", "79119"],
    avgRate: "9.2¢/kWh", avgMonthlyBill: "$133", providers: 35,
    neighborhoods: ["Downtown Amarillo", "Wolflin", "Sleepy Hollow", "Westover", "Bivins", "San Jacinto", "Belmar"],
    description: "Amarillo, located in the Texas Panhandle, offers residents access to competing electricity suppliers with competitive rates in the deregulated market.",
  },
  "Beaumont-TX": {
    state: "Texas", stateCode: "TX", county: "Jefferson County", population: "115,000+",
    zipCodes: ["77701", "77702", "77703", "77705", "77706", "77707", "77708"],
    avgRate: "9.0¢/kWh", avgMonthlyBill: "$130", providers: 32,
    neighborhoods: ["Downtown Beaumont", "Old Town", "West End", "North End", "Pear Orchard", "Calder Highlands", "Amelia"],
    description: "Beaumont residents in the Golden Triangle region benefit from competitive electricity rates with competing suppliers serving Jefferson County.",
  },
  "Brownsville-TX": {
    state: "Texas", stateCode: "TX", county: "Cameron County", population: "186,000+",
    zipCodes: ["78520", "78521", "78526", "78550", "78575", "78578"],
    avgRate: "9.4¢/kWh", avgMonthlyBill: "$136", providers: 28,
    neighborhoods: ["Downtown Brownsville", "Los Ebanos", "West Brownsville", "Palm Boulevard", "Southmost", "Four Corners", "Rancho Viejo"],
    description: "Brownsville, at the southern tip of Texas, offers residents access to competing electricity suppliers with plans suited to the Rio Grande Valley climate.",
  },
  "Denton-TX": {
    state: "Texas", stateCode: "TX", county: "Denton County", population: "150,000+",
    zipCodes: ["76201", "76205", "76207", "76208", "76209", "76210", "76226"],
    avgRate: "9.1¢/kWh", avgMonthlyBill: "$131", providers: 40,
    neighborhoods: ["Downtown Denton", "Rayzor Ranch", "Robson Ranch", "Corinth", "Highland Village", "Argyle", "University"],
    description: "Denton, a vibrant college town north of Dallas, provides residents with competing electricity suppliers and some of the most competitive rates in North Texas.",
  },
  "Garland-TX": {
    state: "Texas", stateCode: "TX", county: "Dallas County", population: "246,000+",
    zipCodes: ["75040", "75041", "75042", "75043", "75044", "75046", "75048"],
    avgRate: "9.0¢/kWh", avgMonthlyBill: "$130", providers: 42,
    neighborhoods: ["Downtown Garland", "Firewheel", "Duck Creek", "Eastern Hills", "Buckingham", "Embree", "Spring Creek"],
    description: "Garland residents enjoy access to competing electricity suppliers in the Dallas-Fort Worth metroplex with competitive fixed and variable rate plans.",
  },
  "Grand Prairie-TX": {
    state: "Texas", stateCode: "TX", county: "Dallas County", population: "196,000+",
    zipCodes: ["75050", "75051", "75052", "75053", "75054", "75104"],
    avgRate: "9.0¢/kWh", avgMonthlyBill: "$130", providers: 41,
    neighborhoods: ["Downtown Grand Prairie", "Mira Lagos", "Lake Ridge", "Westchester", "Dalworth Park", "South Grand Prairie", "Lone Star Park"],
    description: "Grand Prairie, centrally located between Dallas and Fort Worth, offers residents competing electricity suppliers with diverse plan options.",
  },
  "Laredo-TX": {
    state: "Texas", stateCode: "TX", county: "Webb County", population: "261,000+",
    zipCodes: ["78040", "78041", "78043", "78045", "78046"],
    avgRate: "9.5¢/kWh", avgMonthlyBill: "$137", providers: 25,
    neighborhoods: ["Downtown Laredo", "Del Mar", "Heights", "Mines Road", "North Laredo", "Plantation", "Santa Rita"],
    description: "Laredo, one of the fastest-growing cities in Texas, provides residents with competing electricity suppliers and competitive rates along the border.",
  },
  "McAllen-TX": {
    state: "Texas", stateCode: "TX", county: "Hidalgo County", population: "142,000+",
    zipCodes: ["78501", "78503", "78504", "78539", "78541", "78572"],
    avgRate: "9.3¢/kWh", avgMonthlyBill: "$135", providers: 27,
    neighborhoods: ["Downtown McAllen", "North McAllen", "Sharyland", "Tres Lagos", "La Plaza Mall Area", "Nolana", "Trenton"],
    description: "McAllen residents in the Rio Grande Valley benefit from competing electricity suppliers offering plans designed for the South Texas climate.",
  },
  "Round Rock-TX": {
    state: "Texas", stateCode: "TX", county: "Williamson County", population: "133,000+",
    zipCodes: ["78664", "78665", "78681", "78717"],
    avgRate: "9.2¢/kWh", avgMonthlyBill: "$133", providers: 38,
    neighborhoods: ["Downtown Round Rock", "Old Settlers Park", "Brushy Creek", "Cat Hollow", "Teravista", "Forest Creek", "Paloma Lake"],
    description: "Round Rock, a thriving suburb of Austin, offers residents access to competing electricity suppliers with competitive rates in Williamson County.",
  },
  "Sugar Land-TX": {
    state: "Texas", stateCode: "TX", county: "Fort Bend County", population: "111,000+",
    zipCodes: ["77478", "77479", "77498"],
    avgRate: "8.9¢/kWh", avgMonthlyBill: "$128", providers: 43,
    neighborhoods: ["Sugar Land Town Square", "New Territory", "First Colony", "Telfair", "Riverstone", "Greatwood", "Commonwealth"],
    description: "Sugar Land, one of Houston's most affluent suburbs, provides residents with competing electricity suppliers and some of the best rates in Fort Bend County.",
  },
  "Reading-PA": {
    state: "Pennsylvania", stateCode: "PA", county: "Berks County", population: "95,112+",
    zipCodes: ["19601", "19602", "19604", "19606", "19611"],
    avgRate: "10.5¢/kWh", avgMonthlyBill: "$95", providers: 30,
    neighborhoods: ["East Reading", "Glenside", "College Heights", "Northwest Reading", "Northeast Reading", "Centre Park"],
    description: "Reading, located in Berks County, is a city with a deregulated electricity market, offering residents a choice from over 30 competitive energy providers.",
  },
  "Rochester-NH": {
    state: "New Hampshire", stateCode: "NH", county: "Strafford", population: "32,000+",
    zipCodes: ["03839", "03866", "03867", "03868"],
    avgRate: "17.5¢/kWh", avgMonthlyBill: "$155", providers: 15,
    neighborhoods: ["Gonic", "East Rochester", "North Rochester", "City Center", "Meaderboro Corner", "Rochester West"],
    description: "Rochester residents can take advantage of New Hampshire's deregulated electricity market, choosing from around 15 competitive providers for the best rates.",
  },
  "Keene-NH": {
    state: "New Hampshire", stateCode: "NH", county: "Cheshire County", population: "23,000+",
    zipCodes: ["03431"],
    avgRate: "12.0¢/kWh", avgMonthlyBill: "$174", providers: 14,
    neighborhoods: ["Downtown Keene", "West Keene", "East Side", "Swanzey", "Marlborough", "Colony Mill"],
    description: "Keene residents in Cheshire County can compare electricity rates from competing suppliers in New Hampshire's deregulated market.",
  },
  "Laconia-NH": {
    state: "New Hampshire", stateCode: "NH", county: "Belknap County", population: "17,000+",
    zipCodes: ["03246", "03247"],
    avgRate: "12.2¢/kWh", avgMonthlyBill: "$177", providers: 14,
    neighborhoods: ["Downtown Laconia", "Weirs Beach", "Lakeport", "The Weirs", "Gilford", "Belmont"],
    description: "Laconia residents in the Lakes Region benefit from competing electricity suppliers offering competitive rates in Belknap County.",
  },
  "Rockford-IL": {
    state: "Illinois", stateCode: "IL", county: "Winnebago", population: "148,000+",
    zipCodes: ["61101", "61102", "61103", "61104", "61107"],
    avgRate: "10.5¢/kWh", avgMonthlyBill: "$95", providers: 34,
    neighborhoods: ["Bello Reserve", "Beverly Park", "Central Park", "Chestnut", "Edgewater", "Fairgrounds"],
    description: "Rockford's deregulated electricity market offers residents a choice of competing suppliers, fostering competitive rates and energy options.",
  },
  "Schaumburg-IL": {
    state: "Illinois", stateCode: "IL", county: "Cook", population: "78,000+",
    zipCodes: ["60173", "60193", "60194", "60195", "60196"],
    avgRate: "10.5¢/kWh", avgMonthlyBill: "$105", providers: 34,
    neighborhoods: ["Weathersfield", "Timbercrest", "Stone Bridge Court", "Lions Gate", "Plumwood Estates", "Park St. Claire"],
    description: "Schaumburg's deregulated electricity market offers residents a choice of competing suppliers, fostering competitive rates and energy options.",
  },
  "Scranton-PA": {
    state: "Pennsylvania", stateCode: "PA", county: "Lackawanna County", population: "76,000+",
    zipCodes: ["18501", "18502", "18503", "18504", "18505"],
    avgRate: "10.5¢/kWh", avgMonthlyBill: "$125", providers: 30,
    neighborhoods: ["Downtown Scranton", "West Mountain", "East Mountain", "Greenridge", "Minooka", "Hill Section"],
    description: "As the county seat of Lackawanna County, Scranton boasts a deregulated electricity market with competing suppliers, offering residents a wide range of competitive energy choices.",
  },
  "Chester-PA": {
    state: "Pennsylvania", stateCode: "PA", county: "Delaware County", population: "34,000+",
    zipCodes: ["19013", "19014", "19015"],
    avgRate: "10.8¢/kWh", avgMonthlyBill: "$156", providers: 30,
    neighborhoods: ["Downtown Chester", "Sun Village", "Highland Gardens", "Chester Township", "Upland", "Brookhaven"],
    description: "Chester residents in Delaware County can compare electricity rates from competing suppliers in Pennsylvania's deregulated energy market.",
  },
  "Harrisburg-PA": {
    state: "Pennsylvania", stateCode: "PA", county: "Dauphin County", population: "50,000+",
    zipCodes: ["17101", "17102", "17103", "17104", "17109", "17110", "17111"],
    avgRate: "10.5¢/kWh", avgMonthlyBill: "$152", providers: 32,
    neighborhoods: ["Downtown Harrisburg", "Midtown", "Uptown", "Italian Lake", "Allison Hill", "Shipoke", "Penbrook"],
    description: "Harrisburg, the state capital, offers residents access to competing electricity suppliers with competitive rates in Dauphin County.",
  },
  "Norristown-PA": {
    state: "Pennsylvania", stateCode: "PA", county: "Montgomery County", population: "35,000+",
    zipCodes: ["19401", "19403", "19404"],
    avgRate: "10.6¢/kWh", avgMonthlyBill: "$153", providers: 31,
    neighborhoods: ["Downtown Norristown", "East Norriton", "West Norriton", "Plymouth Meeting", "Whitemarsh", "Bridgeport"],
    description: "Norristown residents in Montgomery County benefit from competing electricity suppliers offering competitive rates in the Philadelphia suburbs.",
  },
  "State College-PA": {
    state: "Pennsylvania", stateCode: "PA", county: "Centre County", population: "42,000+",
    zipCodes: ["16801", "16802", "16803"],
    avgRate: "10.3¢/kWh", avgMonthlyBill: "$149", providers: 26,
    neighborhoods: ["Downtown State College", "Penn State Campus", "Toftrees", "Park Forest", "Boalsburg", "Lemont"],
    description: "State College, home to Penn State University, provides residents with competing electricity suppliers and competitive rates in Centre County.",
  },
  "Wilkes-Barre-PA": {
    state: "Pennsylvania", stateCode: "PA", county: "Luzerne County", population: "44,000+",
    zipCodes: ["18701", "18702", "18705", "18706"],
    avgRate: "10.4¢/kWh", avgMonthlyBill: "$150", providers: 28,
    neighborhoods: ["Downtown Wilkes-Barre", "Heights", "South Wilkes-Barre", "Parsons", "Kingston", "Edwardsville"],
    description: "Wilkes-Barre residents in the Wyoming Valley benefit from competing electricity suppliers with competitive rates in Luzerne County.",
  },
  "York-PA": {
    state: "Pennsylvania", stateCode: "PA", county: "York County", population: "44,000+",
    zipCodes: ["17401", "17402", "17403", "17404"],
    avgRate: "10.5¢/kWh", avgMonthlyBill: "$152", providers: 30,
    neighborhoods: ["Downtown York", "Springettsbury", "West York", "North York", "Dallastown", "Red Lion"],
    description: "York residents benefit from competing electricity suppliers offering competitive fixed and variable rate plans in York County.",
  },
  "Silver Spring-MD": {
    state: "Maryland", stateCode: "MD", county: "Montgomery", population: "81,015+",
    zipCodes: ["20901", "20902", "20904", "20905", "20906"],
    avgRate: "12.5¢/kWh", avgMonthlyBill: "$125", providers: 25,
    neighborhoods: ["Woodmoor", "Indian Spring", "Downtown Silver Spring", "East Silver Spring", "Woodside", "Clifton Park Village"],
    description: "In Silver Spring's deregulated electricity market, residents can choose from competing suppliers, fostering competitive rates and energy options.",
  },
  "Bowie-MD": {
    state: "Maryland", stateCode: "MD", county: "Prince George's County", population: "58,000+",
    zipCodes: ["20715", "20716", "20720", "20721"],
    avgRate: "10.2¢/kWh", avgMonthlyBill: "$148", providers: 28,
    neighborhoods: ["Old Town Bowie", "Northview", "Pointer Ridge", "Whitehall", "Kenilworth", "Mitchellville"],
    description: "Bowie residents in Prince George's County can compare electricity rates from competing suppliers in Maryland's deregulated market.",
  },
  "Gaithersburg-MD": {
    state: "Maryland", stateCode: "MD", county: "Montgomery County", population: "68,000+",
    zipCodes: ["20877", "20878", "20879", "20882", "20886"],
    avgRate: "10.3¢/kWh", avgMonthlyBill: "$149", providers: 29,
    neighborhoods: ["Olde Towne", "Kentlands", "Lakeforest", "Quince Orchard", "Washingtonian Center", "Rio"],
    description: "Gaithersburg residents in Montgomery County benefit from competing electricity suppliers with competitive rates in the DC suburbs.",
  },
  "Hagerstown-MD": {
    state: "Maryland", stateCode: "MD", county: "Washington County", population: "44,000+",
    zipCodes: ["21740", "21742"],
    avgRate: "10.0¢/kWh", avgMonthlyBill: "$145", providers: 25,
    neighborhoods: ["Downtown Hagerstown", "North End", "South End", "West End", "Halfway", "Funkstown"],
    description: "Hagerstown residents in Western Maryland can compare electricity rates from competing suppliers in Washington County.",
  },
  "Waldorf-MD": {
    state: "Maryland", stateCode: "MD", county: "Charles County", population: "77,000+",
    zipCodes: ["20601", "20602", "20603"],
    avgRate: "10.1¢/kWh", avgMonthlyBill: "$146", providers: 27,
    neighborhoods: ["St. Charles", "Waldorf Center", "Pinefield", "Bennsville", "White Plains", "La Plata"],
    description: "Waldorf residents in Charles County benefit from competing electricity suppliers offering competitive rates south of Washington DC.",
  },
  "Springfield-IL": {
    state: "Illinois", stateCode: "IL", county: "Sangamon", population: "114,394+",
    zipCodes: ["62701", "62702", "62703", "62704", "62711"],
    avgRate: "10.5¢/kWh", avgMonthlyBill: "$115", providers: 34,
    neighborhoods: ["Washington Park", "Leland Grove", "Piper Glen", "Lake Pointe", "West Koke Mill", "Enos Park"],
    description: "As the state capital, Springfield benefits from Illinois's deregulated electricity market, offering residents a choice of over 34 energy providers and fostering competitive rates.",
  },
  "Bloomington-IL": {
    state: "Illinois", stateCode: "IL", county: "McLean County", population: "78,000+",
    zipCodes: ["61701", "61704", "61705", "61761"],
    avgRate: "10.1¢/kWh", avgMonthlyBill: "$146", providers: 30,
    neighborhoods: ["Downtown Bloomington", "Normal", "Towanda", "East Side", "West Side", "Miller Park", "Founders Grove"],
    description: "Bloomington-Normal residents benefit from competitive electricity rates with competing suppliers in the Ameren Illinois service territory.",
  },
  "Cicero-IL": {
    state: "Illinois", stateCode: "IL", county: "Cook County", population: "81,000+",
    zipCodes: ["60804"],
    avgRate: "9.8¢/kWh", avgMonthlyBill: "$142", providers: 35,
    neighborhoods: ["Downtown Cicero", "Grant Works", "Hawthorne Works", "Warren Park", "Clyde Park", "Liberty Park"],
    description: "Cicero residents in the Chicago suburbs have access to competing electricity suppliers in the ComEd service territory.",
  },
  "Decatur-IL": {
    state: "Illinois", stateCode: "IL", county: "Macon County", population: "70,000+",
    zipCodes: ["62521", "62522", "62526"],
    avgRate: "10.2¢/kWh", avgMonthlyBill: "$148", providers: 28,
    neighborhoods: ["Downtown Decatur", "South Shores", "Millikin", "Lakeshore", "Johns Hill", "Fairview", "East End"],
    description: "Decatur residents can compare electricity rates from competing suppliers serving the Ameren Illinois territory in Macon County.",
  },
  "Evanston-IL": {
    state: "Illinois", stateCode: "IL", county: "Cook County", population: "78,000+",
    zipCodes: ["60201", "60202", "60203", "60204", "60208"],
    avgRate: "9.7¢/kWh", avgMonthlyBill: "$140", providers: 36,
    neighborhoods: ["Downtown Evanston", "Central Evanston", "South Evanston", "North Evanston", "West Evanston", "Lakefront", "Northwestern"],
    description: "Evanston, home to Northwestern University, offers residents access to competing electricity suppliers with competitive rates in the ComEd territory.",
  },
  "Oak Park-IL": {
    state: "Illinois", stateCode: "IL", county: "Cook County", population: "52,000+",
    zipCodes: ["60301", "60302", "60303", "60304"],
    avgRate: "9.8¢/kWh", avgMonthlyBill: "$142", providers: 35,
    neighborhoods: ["Downtown Oak Park", "Frank Lloyd Wright District", "Ridgeland-Oak Park", "South Oak Park", "Gunderson", "Barrie Park"],
    description: "Oak Park, famous for its Frank Lloyd Wright architecture, provides residents with competing electricity suppliers in the ComEd service area.",
  },
  "Waukegan-IL": {
    state: "Illinois", stateCode: "IL", county: "Lake County", population: "89,000+",
    zipCodes: ["60085", "60087"],
    avgRate: "9.9¢/kWh", avgMonthlyBill: "$143", providers: 34,
    neighborhoods: ["Downtown Waukegan", "Lakehurst", "Glen Flora", "Clearview", "Bonnie Brook", "Beach Park"],
    description: "Waukegan residents in Lake County benefit from competing electricity suppliers offering competitive rates in the northern Chicago suburbs.",
  },
  "Stamford-CT": {
    state: "Connecticut", stateCode: "CT", county: "Fairfield", population: "139,000+",
    zipCodes: ["06901", "06902", "06903", "06905", "06906"],
    avgRate: "21.5¢/kWh", avgMonthlyBill: "$191", providers: 18,
    neighborhoods: ["Downtown", "Shippan", "Glenbrook", "Westover", "North Stamford", "Cove"],
    description: "Stamford's deregulated electricity market offers residents a choice of competing suppliers, fostering competitive rates and energy options.",
  },
  "Trenton-NJ": {
    state: "New Jersey", stateCode: "NJ", county: "Mercer", population: "83,000+",
    zipCodes: ["08608", "08609", "08610", "08611", "08618"],
    avgRate: "13.5¢/kWh", avgMonthlyBill: "$119", providers: 25,
    neighborhoods: ["Downtown", "South Trenton", "Mill Hill", "Hiltonia", "East Trenton", "Wilbur"],
    description: "As a city in a state with a deregulated electricity market, Trenton residents can choose from over 25 different providers, fostering competitive rates and energy options.",
  },
  "Atlantic City-NJ": {
    state: "New Jersey", stateCode: "NJ", county: "Atlantic County", population: "38,000+",
    zipCodes: ["08401", "08404"],
    avgRate: "11.5¢/kWh", avgMonthlyBill: "$166", providers: 24,
    neighborhoods: ["Boardwalk", "Chelsea", "Ducktown", "Inlet", "Marina District", "Ventnor"],
    description: "Atlantic City residents can compare electricity rates from competing suppliers to find savings in the Atlantic City Electric service territory.",
  },
  "Bayonne-NJ": {
    state: "New Jersey", stateCode: "NJ", county: "Hudson County", population: "71,000+",
    zipCodes: ["07002"],
    avgRate: "11.8¢/kWh", avgMonthlyBill: "$171", providers: 26,
    neighborhoods: ["Downtown Bayonne", "Bergen Point", "Constable Hook", "Centerville", "Saltersville", "East Side"],
    description: "Bayonne residents in Hudson County benefit from competing electricity suppliers offering competitive alternatives to PSE&G rates.",
  },
  "Clifton-NJ": {
    state: "New Jersey", stateCode: "NJ", county: "Passaic County", population: "89,000+",
    zipCodes: ["07011", "07012", "07013", "07014"],
    avgRate: "11.6¢/kWh", avgMonthlyBill: "$168", providers: 27,
    neighborhoods: ["Main Avenue", "Botany Village", "Allwood", "Delawanna", "Athenia", "Richfield"],
    description: "Clifton residents in Passaic County can compare electricity rates from competing suppliers in New Jersey's deregulated energy market.",
  },
  "Elizabeth-NJ": {
    state: "New Jersey", stateCode: "NJ", county: "Union County", population: "137,000+",
    zipCodes: ["07201", "07202", "07206", "07207", "07208"],
    avgRate: "11.7¢/kWh", avgMonthlyBill: "$169", providers: 27,
    neighborhoods: ["Downtown Elizabeth", "Elmora", "Bayway", "Peterstown", "Westminster", "North Elizabeth"],
    description: "Elizabeth, New Jersey's fourth-largest city, offers residents access to competing electricity suppliers with competitive rates in Union County.",
  },
  "Toms River-NJ": {
    state: "New Jersey", stateCode: "NJ", county: "Ocean County", population: "95,000+",
    zipCodes: ["08753", "08754", "08755", "08757"],
    avgRate: "11.4¢/kWh", avgMonthlyBill: "$165", providers: 25,
    neighborhoods: ["Downtown Toms River", "Silver Ridge", "Holiday City", "North Dover", "Silverton", "Pine Beach"],
    description: "Toms River residents in Ocean County benefit from competing electricity suppliers offering competitive rates at the Jersey Shore.",
  },
  "Waterbury-CT": {
    state: "Connecticut", stateCode: "CT", county: "New Haven", population: "114,403+",
    zipCodes: ["06702", "06704", "06705", "06706", "06708"],
    avgRate: "21.5¢/kWh", avgMonthlyBill: "$150", providers: 18,
    neighborhoods: ["Bunker Hill", "Bucks Hill", "Town Plot", "Waterville", "Brooklyn", "East End"],
    description: "As a city in a state with a deregulated electricity market, Waterbury offers residents a choice of over 18 energy providers, leading to competitive rates and plans.",
  },
  "Danbury-CT": {
    state: "Connecticut", stateCode: "CT", county: "Fairfield County", population: "86,000+",
    zipCodes: ["06810", "06811", "06813", "06814"],
    avgRate: "13.5¢/kWh", avgMonthlyBill: "$195", providers: 20,
    neighborhoods: ["Downtown Danbury", "Candlewood Lake", "Mill Plain", "Shelter Rock", "Great Plain", "Pembroke"],
    description: "Danbury residents in Fairfield County can compare electricity rates from competing suppliers in Connecticut's deregulated energy market.",
  },
  "Meriden-CT": {
    state: "Connecticut", stateCode: "CT", county: "New Haven County", population: "60,000+",
    zipCodes: ["06450", "06451"],
    avgRate: "13.8¢/kWh", avgMonthlyBill: "$200", providers: 19,
    neighborhoods: ["Downtown Meriden", "South Meriden", "East Side", "West Side", "North End", "Yalesville"],
    description: "Meriden residents in New Haven County benefit from competing electricity suppliers offering competitive alternatives to Eversource rates.",
  },
  "New Britain-CT": {
    state: "Connecticut", stateCode: "CT", county: "Hartford County", population: "74,000+",
    zipCodes: ["06050", "06051", "06052", "06053"],
    avgRate: "13.6¢/kWh", avgMonthlyBill: "$197", providers: 20,
    neighborhoods: ["Downtown New Britain", "East Side", "West End", "South Side", "Stanley Quarter", "Shuttle Meadow"],
    description: "New Britain residents in Hartford County can compare electricity rates from competing suppliers in the Eversource service territory.",
  },
  "Yonkers-NY": {
    state: "New York", stateCode: "NY", county: "Westchester", population: "211,569+",
    zipCodes: ["10701", "10705", "10704", "10710", "10703"],
    avgRate: "16.5¢/kWh", avgMonthlyBill: "$149", providers: 24,
    neighborhoods: ["Beech Hill", "Lawrence Park", "Cedar Knolls", "Crestwood", "Lincoln Park", "Colonial Heights"],
    description: "As a city in a state with a deregulated electricity market, Yonkers residents can choose from over 24 energy providers, ensuring competitive rates and plans.",
  },
  "Youngstown-OH": {
    state: "Ohio", stateCode: "OH", county: "Mahoning", population: "60,000+",
    zipCodes: ["44502", "44503", "44504", "44505", "44509"],
    avgRate: "9.5¢/kWh", avgMonthlyBill: "$105", providers: 30,
    neighborhoods: ["Brier Hill", "Brownlee Woods", "Downtown", "Hazelton", "Kirkmere", "Idora"],
    description: "Youngstown's deregulated electricity market offers residents a choice of competing suppliers, fostering competitive rates and energy options.",
  },
  "Dublin-OH": {
    state: "Ohio", stateCode: "OH", county: "Franklin County", population: "49,000+",
    zipCodes: ["43016", "43017"],
    avgRate: "9.4¢/kWh", avgMonthlyBill: "$136", providers: 30,
    neighborhoods: ["Historic Dublin", "Bridge Street District", "Muirfield Village", "Ballantrae", "Tartan Fields", "Glacier Ridge"],
    description: "Dublin, an affluent Columbus suburb, offers residents access to competing electricity suppliers with competitive rates in Franklin County.",
  },
  "Elyria-OH": {
    state: "Ohio", stateCode: "OH", county: "Lorain County", population: "54,000+",
    zipCodes: ["44035", "44036"],
    avgRate: "9.6¢/kWh", avgMonthlyBill: "$139", providers: 28,
    neighborhoods: ["Downtown Elyria", "West Elyria", "South Elyria", "Gates Mills", "Cascade Park", "Midway Mall Area"],
    description: "Elyria residents in Lorain County can compare electricity rates from competing suppliers in Ohio's deregulated energy market.",
  },
  "Hamilton-OH": {
    state: "Ohio", stateCode: "OH", county: "Butler County", population: "63,000+",
    zipCodes: ["45011", "45012", "45013", "45015"],
    avgRate: "9.5¢/kWh", avgMonthlyBill: "$137", providers: 29,
    neighborhoods: ["Downtown Hamilton", "German Village", "Lindenwald", "Ross", "Fairfield Township", "Beckett Ridge"],
    description: "Hamilton residents in Butler County benefit from competing electricity suppliers offering competitive fixed and variable rate plans.",
  },
  "Lakewood-OH": {
    state: "Ohio", stateCode: "OH", county: "Cuyahoga County", population: "50,000+",
    zipCodes: ["44107"],
    avgRate: "9.5¢/kWh", avgMonthlyBill: "$137", providers: 32,
    neighborhoods: ["Downtown Lakewood", "Birdtown", "Gold Coast", "Clifton Park", "Webb Road", "Madison Park"],
    description: "Lakewood, a vibrant Cleveland suburb, provides residents with competing electricity suppliers and competitive rates in Cuyahoga County.",
  },
  "Lorain-OH": {
    state: "Ohio", stateCode: "OH", county: "Lorain County", population: "65,000+",
    zipCodes: ["44052", "44053", "44055"],
    avgRate: "9.6¢/kWh", avgMonthlyBill: "$139", providers: 28,
    neighborhoods: ["Downtown Lorain", "South Lorain", "Oakwood", "Sheffield", "Black River Landing", "Lakeview Park"],
    description: "Lorain residents on Lake Erie benefit from competing electricity suppliers with competitive rates in the deregulated Ohio market.",
  },
  "Parma-OH": {
    state: "Ohio", stateCode: "OH", county: "Cuyahoga County", population: "81,000+",
    zipCodes: ["44129", "44130", "44134"],
    avgRate: "9.5¢/kWh", avgMonthlyBill: "$137", providers: 32,
    neighborhoods: ["Downtown Parma", "Parma Heights", "Seven Hills", "Ridgewood", "State Road", "Pleasant Valley"],
    description: "Parma, Cleveland's largest suburb, offers residents access to competing electricity suppliers with diverse plan options in Cuyahoga County.",
  },
  "Albany-NY": {
    state: "New York", stateCode: "NY", county: "Albany County", population: "99,000+",
    zipCodes: ["12201", "12202", "12203", "12204", "12205"],
    avgRate: "15.5¢/kWh", avgMonthlyBill: "$145", providers: 22,
    neighborhoods: ["Downtown Albany", "Center Square", "Pine Hills", "Buckingham Pond", "Delaware Avenue", "Lark Street"],
    description: "Albany, the capital of New York, offers residents access to competing electricity suppliers in the deregulated ESCO market, providing competitive rates and plan options.",
  },
  "Binghamton-NY": {
    state: "New York", stateCode: "NY", county: "Broome County", population: "47,000+",
    zipCodes: ["13901", "13902", "13903", "13905"],
    avgRate: "11.2¢/kWh", avgMonthlyBill: "$162", providers: 22,
    neighborhoods: ["Downtown Binghamton", "West Side", "North Side", "First Ward", "Prospect Terrace", "Chenango Bridge"],
    description: "Binghamton residents in the Southern Tier can compare electricity rates from competing suppliers in New York's deregulated energy market.",
  },
  "Hempstead-NY": {
    state: "New York", stateCode: "NY", county: "Nassau County", population: "55,000+",
    zipCodes: ["11549", "11550", "11551", "11553"],
    avgRate: "14.5¢/kWh", avgMonthlyBill: "$210", providers: 25,
    neighborhoods: ["Downtown Hempstead", "Garden City", "West Hempstead", "East Meadow", "Uniondale", "Roosevelt"],
    description: "Hempstead residents on Long Island benefit from competing electricity suppliers offering competitive alternatives to PSEG Long Island rates.",
  },
  "Long Beach-NY": {
    state: "New York", stateCode: "NY", county: "Nassau County", population: "34,000+",
    zipCodes: ["11561"],
    avgRate: "14.8¢/kWh", avgMonthlyBill: "$214", providers: 24,
    neighborhoods: ["West End", "East End", "North Park", "Canals", "Boardwalk Area", "City by the Sea"],
    description: "Long Beach residents on Long Island's barrier island can compare electricity rates from competing suppliers to find savings.",
  },
  "New Rochelle-NY": {
    state: "New York", stateCode: "NY", county: "Westchester County", population: "80,000+",
    zipCodes: ["10801", "10802", "10803", "10804", "10805"],
    avgRate: "13.2¢/kWh", avgMonthlyBill: "$191", providers: 26,
    neighborhoods: ["Downtown New Rochelle", "Wykagyl", "Larchmont", "Pelham", "North End", "Huguenot Park"],
    description: "New Rochelle residents in Westchester County benefit from competing electricity suppliers with competitive rates north of New York City.",
  },
  "Schenectady-NY": {
    state: "New York", stateCode: "NY", county: "Schenectady County", population: "67,000+",
    zipCodes: ["12301", "12302", "12303", "12304", "12305", "12306", "12307", "12308", "12309"],
    avgRate: "11.0¢/kWh", avgMonthlyBill: "$159", providers: 23,
    neighborhoods: ["Downtown Schenectady", "Stockade District", "GE Plot", "Woodlawn", "Mont Pleasant", "Bellevue"],
    description: "Schenectady residents in the Capital District can compare electricity rates from competing suppliers in the National Grid service area.",
  },
  "White Plains-NY": {
    state: "New York", stateCode: "NY", county: "Westchester County", population: "58,000+",
    zipCodes: ["10601", "10602", "10603", "10604", "10605", "10606", "10607"],
    avgRate: "13.5¢/kWh", avgMonthlyBill: "$195", providers: 26,
    neighborhoods: ["Downtown White Plains", "Battle Hill", "Gedney Farms", "Fisher Hill", "Highlands", "Mamaroneck Avenue"],
    description: "White Plains, the Westchester County seat, offers residents access to competing electricity suppliers with competitive rates.",
  },
};

export default cityData;

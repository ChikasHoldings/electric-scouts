import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ElectricityPlan } from "@/api/supabaseEntities";
import { useQuery } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Zap, TrendingDown, CheckCircle, 
  ArrowRight, DollarSign, Shield, Star, Leaf, ChevronDown 
} from "lucide-react";
import PlanCard from "../components/compare/PlanCard";
import { getProvidersForZipCode, getProviderDetails } from "../components/compare/providerAvailability";
import { calculateMonthlyBill } from "../components/compare/dataValidation";
import SEOHead, { getBreadcrumbSchema, getServiceSchema, getFAQSchema, getLocalBusinessSchema } from "../components/SEOHead";
import ValidatedZipInput from "../components/ValidatedZipInput";

// Comprehensive city data for all states
const cityData = {
  // TEXAS CITIES
  "Houston-TX": {
    state: "Texas", stateCode: "TX", county: "Harris County", population: "2,300,000+",
    zipCodes: ["77002", "77019", "77024", "77027", "77056", "77063", "77098"],
    avgRate: "8.9¢/kWh", avgMonthlyBill: "$128", providers: 45,
    neighborhoods: ["Downtown Houston", "The Heights", "Montrose", "River Oaks", "Midtown", "Galleria", "Memorial"],
    description: "Houston, the largest city in Texas and the energy capital of the world, offers residents access to over 45 electricity providers in the deregulated market.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/b92baf13-dff3-4777-8e8a-b25f73b10b8d.jpg"
  },
  "Dallas-TX": {
    state: "Texas", stateCode: "TX", county: "Dallas County", population: "1,300,000+",
    zipCodes: ["75201", "75202", "75204", "75205", "75214", "75219", "75230"],
    avgRate: "9.1¢/kWh", avgMonthlyBill: "$132", providers: 42,
    neighborhoods: ["Downtown Dallas", "Uptown", "Deep Ellum", "Highland Park", "Oak Lawn", "Lake Highlands", "North Dallas"],
    description: "Dallas residents benefit from competitive electricity rates with access to over 42 providers offering a wide range of fixed and variable rate plans.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/8d19f65b-9e9f-4d66-b5f9-6d0cc6de9965.jpg"
  },
  "Austin-TX": {
    state: "Texas", stateCode: "TX", county: "Travis County", population: "978,000+",
    zipCodes: ["78701", "78702", "78703", "78704", "78731", "78745", "78757"],
    avgRate: "9.3¢/kWh", avgMonthlyBill: "$135", providers: 38,
    neighborhoods: ["Downtown Austin", "South Congress", "East Austin", "West Lake Hills", "Hyde Park", "Zilker", "Mueller"],
    description: "Austin, the state capital and tech hub, provides residents with competitive electricity rates and numerous green energy options from 38+ providers.",
    image: "https://images.unsplash.com/photo-1531218150217-54595bc2b934?w=400&h=300&fit=crop"
  },
  "San Antonio-TX": {
    state: "Texas", stateCode: "TX", county: "Bexar County", population: "1,500,000+",
    zipCodes: ["78201", "78209", "78212", "78216", "78232", "78249", "78258"],
    avgRate: "8.8¢/kWh", avgMonthlyBill: "$127", providers: 40,
    neighborhoods: ["Downtown San Antonio", "Alamo Heights", "Stone Oak", "The Dominion", "Southtown", "King William", "Medical Center"],
    description: "San Antonio offers some of the most competitive electricity rates in Texas, with 40+ providers serving the area's residential and commercial customers.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/136ff412-03e2-40c7-8934-8517d2404665.jpg"
  },
  "Fort Worth-TX": {
    state: "Texas", stateCode: "TX", county: "Tarrant County", population: "927,000+",
    zipCodes: ["76102", "76104", "76107", "76109", "76116", "76132", "76244"],
    avgRate: "9.0¢/kWh", avgMonthlyBill: "$130", providers: 41,
    neighborhoods: ["Downtown Fort Worth", "Cultural District", "Sundance Square", "West 7th", "Ridglea", "Tanglewood", "Alliance"],
    description: "Fort Worth residents enjoy access to competitive electricity rates from 41+ providers in the deregulated Texas energy market.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/87a80756-c4b5-44c5-bc05-259fef05ca68.jpg"
  },

  // ILLINOIS CITIES
  "Chicago-IL": {
    state: "Illinois", stateCode: "IL", county: "Cook County", population: "2,700,000+",
    zipCodes: ["60601", "60602", "60603", "60604", "60605", "60606", "60607"],
    avgRate: "9.8¢/kWh", avgMonthlyBill: "$142", providers: 36,
    neighborhoods: ["Downtown Chicago", "Lincoln Park", "Wicker Park", "River North", "Loop", "Gold Coast", "West Loop"],
    description: "Chicago residents have access to competitive electricity rates from 36+ suppliers in the ComEd service territory.",
    image: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400&h=300&fit=crop"
  },
  "Aurora-IL": {
    state: "Illinois", stateCode: "IL", county: "Kane County", population: "180,000+",
    zipCodes: ["60502", "60503", "60504", "60505", "60506", "60507", "60519"],
    avgRate: "9.9¢/kWh", avgMonthlyBill: "$143", providers: 34,
    neighborhoods: ["Downtown Aurora", "Fox Valley", "Far East", "West Aurora", "North Aurora", "Indian Prairie", "Aurora Highlands"],
    description: "Aurora residents benefit from competitive electricity rates with 34+ suppliers in the western Chicago suburbs.",
    image: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=400&h=300&fit=crop"
  },
  "Naperville-IL": {
    state: "Illinois", stateCode: "IL", county: "DuPage County", population: "149,000+",
    zipCodes: ["60540", "60563", "60564", "60565", "60585"],
    avgRate: "9.7¢/kWh", avgMonthlyBill: "$140", providers: 35,
    neighborhoods: ["Downtown Naperville", "White Eagle", "Ashbury", "Springbrook", "College Hill", "Fort Hill", "Cress Creek"],
    description: "Naperville residents enjoy competitive electricity rates from 35+ suppliers in the affluent DuPage County area.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/403443a6-48b5-4052-ac9e-6600f43ab721.jpg"
  },
  "Joliet-IL": {
    state: "Illinois", stateCode: "IL", county: "Will County", population: "150,000+",
    zipCodes: ["60431", "60432", "60433", "60434", "60435", "60436"],
    avgRate: "9.8¢/kWh", avgMonthlyBill: "$141", providers: 33,
    neighborhoods: ["Cathedral Area", "Fairmont", "Pilcher Park", "Rockdale", "West Joliet", "Laraway", "Highland Park"],
    description: "Joliet residents have access to competitive electricity rates from 33+ suppliers in Will County.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/58463eb0-e880-4c1a-b78b-be40c42fb456.jpg"
  },

  // OHIO CITIES
  "Columbus-OH": {
    state: "Ohio", stateCode: "OH", county: "Franklin County", population: "905,000+",
    zipCodes: ["43085", "43201", "43202", "43203", "43204", "43205", "43206"],
    avgRate: "9.5¢/kWh", avgMonthlyBill: "$138", providers: 38,
    neighborhoods: ["Downtown Columbus", "German Village", "Short North", "Clintonville", "Victorian Village", "Arena District", "Brewery District"],
    description: "Columbus residents enjoy competitive electricity rates from 38+ suppliers in the AEP Ohio service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/03fe81c8-162d-4692-be26-32e20095399c.jpg"
  },
  "Cleveland-OH": {
    state: "Ohio", stateCode: "OH", county: "Cuyahoga County", population: "372,000+",
    zipCodes: ["44101", "44102", "44103", "44104", "44105", "44106", "44107"],
    avgRate: "9.6¢/kWh", avgMonthlyBill: "$139", providers: 37,
    neighborhoods: ["Downtown Cleveland", "Ohio City", "Tremont", "University Circle", "Detroit-Shoreway", "Edgewater", "Collinwood"],
    description: "Cleveland residents have access to competitive electricity rates from 37+ suppliers in the FirstEnergy service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/0566fb7e-4b0b-46d4-bdc4-04a2189962bf.jpg"
  },
  "Cincinnati-OH": {
    state: "Ohio", stateCode: "OH", county: "Hamilton County", population: "309,000+",
    zipCodes: ["45201", "45202", "45203", "45204", "45205", "45206", "45207"],
    avgRate: "9.7¢/kWh", avgMonthlyBill: "$140", providers: 36,
    neighborhoods: ["Downtown Cincinnati", "Over-the-Rhine", "Mount Adams", "Clifton", "Hyde Park", "Oakley", "Columbia-Tusculum"],
    description: "Cincinnati residents benefit from competitive electricity rates with 36+ suppliers in the Duke Energy Ohio territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/e1e2ce07-4723-4b43-b55c-8e6a0251d472.jpg"
  },
  "Toledo-OH": {
    state: "Ohio", stateCode: "OH", county: "Lucas County", population: "270,000+",
    zipCodes: ["43601", "43604", "43606", "43607", "43608", "43609", "43610"],
    avgRate: "9.6¢/kWh", avgMonthlyBill: "$139", providers: 35,
    neighborhoods: ["Downtown Toledo", "Old West End", "Ottawa Hills", "Sylvania", "Point Place", "Westgate", "South End"],
    description: "Toledo residents enjoy competitive electricity rates from 35+ suppliers in the FirstEnergy service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/c3d7d2f5-d102-4ed8-aa7f-f2e9c6e02764.jpg"
  },

  // PENNSYLVANIA CITIES
  "Philadelphia-PA": {
    state: "Pennsylvania", stateCode: "PA", county: "Philadelphia County", population: "1,600,000+",
    zipCodes: ["19102", "19103", "19104", "19106", "19107", "19111", "19114"],
    avgRate: "10.2¢/kWh", avgMonthlyBill: "$147", providers: 32,
    neighborhoods: ["Center City", "Old City", "Society Hill", "Rittenhouse Square", "University City", "Northern Liberties", "Fishtown"],
    description: "Philadelphia residents benefit from competitive electricity rates with 32+ suppliers in the PECO service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/01dc15fd-0434-4dd9-ac68-9123c6a14f33.jpg"
  },
  "Pittsburgh-PA": {
    state: "Pennsylvania", stateCode: "PA", county: "Allegheny County", population: "303,000+",
    zipCodes: ["15201", "15202", "15203", "15204", "15205", "15206", "15207"],
    avgRate: "10.1¢/kWh", avgMonthlyBill: "$146", providers: 30,
    neighborhoods: ["Downtown Pittsburgh", "Shadyside", "Squirrel Hill", "Oakland", "Lawrenceville", "South Side", "Strip District"],
    description: "Pittsburgh residents enjoy competitive electricity rates from 30+ suppliers in the Duquesne Light service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/162bc2ea-2c58-4a65-bab4-76e96955cc5c1.jpg"
  },
  "Allentown-PA": {
    state: "Pennsylvania", stateCode: "PA", county: "Lehigh County", population: "125,000+",
    zipCodes: ["18101", "18102", "18103", "18104", "18105", "18106", "18109"],
    avgRate: "10.3¢/kWh", avgMonthlyBill: "$148", providers: 28,
    neighborhoods: ["Downtown Allentown", "West Park", "Hanover Acres", "South Side", "East Side", "West End", "Cedar Crest"],
    description: "Allentown residents benefit from competitive electricity rates with 28+ suppliers in the PPL Electric service territory.",
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
    description: "Newark residents benefit from competitive electricity rates with 27+ suppliers in the PSE&G service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/1a6aeb64-6311-486c-baba-c7cff53a3d5c.jpg"
  },
  "Jersey City-NJ": {
    state: "New Jersey", stateCode: "NJ", county: "Hudson County", population: "292,000+",
    zipCodes: ["07302", "07304", "07305", "07306", "07307", "07310"],
    avgRate: "10.6¢/kWh", avgMonthlyBill: "$152", providers: 26,
    neighborhoods: ["Downtown Jersey City", "Journal Square", "The Heights", "Bergen-Lafayette", "Greenville", "McGinley Square", "Paulus Hook"],
    description: "Jersey City residents enjoy competitive electricity rates from 26+ suppliers in the PSE&G service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/29c455be-4263-4009-8e75-1475730b0b76.jpg"
  },
  "Paterson-NJ": {
    state: "New Jersey", stateCode: "NJ", county: "Passaic County", population: "159,000+",
    zipCodes: ["07501", "07502", "07503", "07504", "07505", "07510", "07514"],
    avgRate: "10.7¢/kWh", avgMonthlyBill: "$153", providers: 25,
    neighborhoods: ["Downtown Paterson", "Eastside", "Riverside", "Peoples Park", "Hillcrest", "Northside", "Wrigley Park"],
    description: "Paterson residents benefit from competitive electricity rates with 25+ suppliers in the PSE&G service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/8bb83b32-7b38-4635-9279-d5fe12f4d755.jpg"
  },

  // MARYLAND CITIES
  "Baltimore-MD": {
    state: "Maryland", stateCode: "MD", county: "Baltimore City", population: "576,000+",
    zipCodes: ["21201", "21202", "21205", "21206", "21207", "21208", "21209"],
    avgRate: "10.4¢/kWh", avgMonthlyBill: "$150", providers: 29,
    neighborhoods: ["Downtown Baltimore", "Federal Hill", "Fells Point", "Canton", "Inner Harbor", "Mount Vernon", "Charles Village"],
    description: "Baltimore residents enjoy competitive electricity rates from 29+ suppliers in the BGE service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/f10f5df1-6404-4618-b8c3-314d3f6a0d29.jpg"
  },
  "Frederick-MD": {
    state: "Maryland", stateCode: "MD", county: "Frederick County", population: "79,000+",
    zipCodes: ["21701", "21702", "21703", "21704", "21705"],
    avgRate: "10.5¢/kWh", avgMonthlyBill: "$151", providers: 27,
    neighborhoods: ["Downtown Frederick", "Ballenger Creek", "Hood College", "North Frederick", "South Frederick", "West Frederick", "East Frederick"],
    description: "Frederick residents benefit from competitive electricity rates with 27+ suppliers in the Potomac Edison service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/98350fd0-49c8-4087-8479-0d390c853bf3.jpg"
  },
  "Rockville-MD": {
    state: "Maryland", stateCode: "MD", county: "Montgomery County", population: "68,000+",
    zipCodes: ["20850", "20851", "20852", "20853", "20854", "20855"],
    avgRate: "10.3¢/kWh", avgMonthlyBill: "$148", providers: 28,
    neighborhoods: ["Downtown Rockville", "Twinbrook", "West End", "King Farm", "Lincoln Park", "Woodley Gardens", "Fallsgrove"],
    description: "Rockville residents enjoy competitive electricity rates from 28+ suppliers in the Pepco service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/46fe92cb-3aa8-4914-8974-bde36dd806af.jpg"
  },

  // MASSACHUSETTS CITIES
  "Boston-MA": {
    state: "Massachusetts", stateCode: "MA", county: "Suffolk County", population: "675,000+",
    zipCodes: ["02101", "02108", "02109", "02110", "02111", "02113", "02114"],
    avgRate: "11.2¢/kWh", avgMonthlyBill: "$161", providers: 22,
    neighborhoods: ["Downtown Boston", "Back Bay", "Beacon Hill", "North End", "South End", "Fenway", "Charlestown"],
    description: "Boston residents benefit from competitive electricity rates with 22+ suppliers across multiple utility territories.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/6e33a452-8111-4711-a6e7-b49128f6bc5a.jpg"
  },
  "Worcester-MA": {
    state: "Massachusetts", stateCode: "MA", county: "Worcester County", population: "206,000+",
    zipCodes: ["01601", "01602", "01603", "01604", "01605", "01606", "01607"],
    avgRate: "11.3¢/kWh", avgMonthlyBill: "$162", providers: 21,
    neighborhoods: ["Downtown Worcester", "Main South", "Tatnuck", "West Side", "East Side", "Shrewsbury Street", "Canal District"],
    description: "Worcester residents enjoy competitive electricity rates from 21+ suppliers in the National Grid service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/d4fa1135-c2c6-4c43-8184-540993ddd4db.jpg"
  },
  "Springfield-MA": {
    state: "Massachusetts", stateCode: "MA", county: "Hampden County", population: "155,000+",
    zipCodes: ["01101", "01103", "01104", "01105", "01107", "01108", "01109"],
    avgRate: "11.4¢/kWh", avgMonthlyBill: "$163", providers: 20,
    neighborhoods: ["Downtown Springfield", "Forest Park", "Sixteen Acres", "East Springfield", "South End", "Six Corners", "Metro Center"],
    description: "Springfield residents benefit from competitive electricity rates with 20+ suppliers in the Eversource service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/45362c2b-5e37-45ca-a6ab-ac06564ed343.jpg"
  },

  // CONNECTICUT CITIES
  "Hartford-CT": {
    state: "Connecticut", stateCode: "CT", county: "Hartford County", population: "121,000+",
    zipCodes: ["06101", "06103", "06105", "06106", "06107", "06112", "06114"],
    avgRate: "11.8¢/kWh", avgMonthlyBill: "$169", providers: 19,
    neighborhoods: ["Downtown Hartford", "South End", "Asylum Hill", "West End", "North End", "Parkville", "Frog Hollow"],
    description: "Hartford residents enjoy competitive electricity rates from 19+ suppliers in the Eversource service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/ottawa-street.jpg"
  },
  "New Haven-CT": {
    state: "Connecticut", stateCode: "CT", county: "New Haven County", population: "135,000+",
    zipCodes: ["06510", "06511", "06513", "06515", "06519", "06520"],
    avgRate: "11.7¢/kWh", avgMonthlyBill: "$168", providers: 19,
    neighborhoods: ["Downtown New Haven", "East Rock", "Wooster Square", "Fair Haven", "Westville", "Dixwell", "West River"],
    description: "New Haven residents benefit from competitive electricity rates with 19+ suppliers in the United Illuminating service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/ab8c9932-5234-436a-b781-91c450b67ab0.jpg"
  },
  "Bridgeport-CT": {
    state: "Connecticut", stateCode: "CT", county: "Fairfield County", population: "148,000+",
    zipCodes: ["06601", "06604", "06605", "06606", "06607", "06608", "06610"],
    avgRate: "11.9¢/kWh", avgMonthlyBill: "$170", providers: 18,
    neighborhoods: ["Downtown Bridgeport", "South End", "East End", "West End", "North End", "Black Rock", "Brooklawn"],
    description: "Bridgeport residents enjoy competitive electricity rates from 18+ suppliers in the United Illuminating service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/770d9cd5-f0df-4175-80a1-078211ed206a.jpg"
  },

  // MAINE CITIES
  "Portland-ME": {
    state: "Maine", stateCode: "ME", county: "Cumberland County", population: "68,000+",
    zipCodes: ["04101", "04102", "04103", "04104", "04105", "04106", "04107"],
    avgRate: "11.5¢/kWh", avgMonthlyBill: "$165", providers: 17,
    neighborhoods: ["Downtown Portland", "Old Port", "West End", "East End", "Munjoy Hill", "Libbytown", "Bayside"],
    description: "Portland residents benefit from competitive electricity rates with 17+ suppliers in the CMP service territory.",
    image: "https://images.unsplash.com/photo-1505761671935-60b3a7427bad?w=400&h=300&fit=crop"
  },
  "Lewiston-ME": {
    state: "Maine", stateCode: "ME", county: "Androscoggin County", population: "37,000+",
    zipCodes: ["04240", "04241", "04243"],
    avgRate: "11.6¢/kWh", avgMonthlyBill: "$166", providers: 16,
    neighborhoods: ["Downtown Lewiston", "College Street", "Bates College", "Tree Streets", "Webster Street", "East Avenue", "Sabattus Street"],
    description: "Lewiston residents enjoy competitive electricity rates from 16+ suppliers in the CMP service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/35c3c8a7-86a1-4171-93f9-2a876c9ff35a.jpg"
  },
  "Bangor-ME": {
    state: "Maine", stateCode: "ME", county: "Penobscot County", population: "32,000+",
    zipCodes: ["04401", "04402"],
    avgRate: "11.7¢/kWh", avgMonthlyBill: "$167", providers: 16,
    neighborhoods: ["Downtown Bangor", "Fairmount", "State Street", "Little City", "Broadway", "West Bangor", "East Side"],
    description: "Bangor residents benefit from competitive electricity rates with 16+ suppliers in the Emera Maine service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/f9cc9f9f-03e1-4bc8-bb2c-a8bdf40d7b5d.jpg"
  },

  // NEW HAMPSHIRE CITIES
  "Manchester-NH": {
    state: "New Hampshire", stateCode: "NH", county: "Hillsborough County", population: "115,000+",
    zipCodes: ["03101", "03102", "03103", "03104", "03109"],
    avgRate: "11.6¢/kWh", avgMonthlyBill: "$166", providers: 17,
    neighborhoods: ["Downtown Manchester", "North End", "South End", "West Side", "East Side", "Pinardville", "Piscataquog Village"],
    description: "Manchester residents enjoy competitive electricity rates from 17+ suppliers in the Eversource service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/b89134a8-4b49-4280-b376-c9c36d77a3a1.jpg"
  },
  "Nashua-NH": {
    state: "New Hampshire", stateCode: "NH", county: "Hillsborough County", population: "91,000+",
    zipCodes: ["03060", "03061", "03062", "03063", "03064"],
    avgRate: "11.7¢/kWh", avgMonthlyBill: "$167", providers: 16,
    neighborhoods: ["Downtown Nashua", "North End", "South End", "West Hollis Street", "Broad Street Parkway", "Daniel Webster", "Crown Hill"],
    description: "Nashua residents benefit from competitive electricity rates with 16+ suppliers in the Eversource service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/89e68724-f3a0-408a-b82b-21c7f26fe660.jpg"
  },
  "Concord-NH": {
    state: "New Hampshire", stateCode: "NH", county: "Merrimack County", population: "43,000+",
    zipCodes: ["03301", "03302", "03303"],
    avgRate: "11.8¢/kWh", avgMonthlyBill: "$169", providers: 16,
    neighborhoods: ["Downtown Concord", "Penacook", "West Concord", "East Concord", "Heights", "South End", "North End"],
    description: "Concord residents enjoy competitive electricity rates from 16+ suppliers in the Eversource service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/c2b6c002-b461-43af-873e-02caf45e467b.jpg"
  },

  // RHODE ISLAND CITIES
  "Providence-RI": {
    state: "Rhode Island", stateCode: "RI", county: "Providence County", population: "190,000+",
    zipCodes: ["02901", "02903", "02904", "02905", "02906", "02907", "02908"],
    avgRate: "11.9¢/kWh", avgMonthlyBill: "$170", providers: 15,
    neighborhoods: ["Downtown Providence", "Federal Hill", "Fox Point", "East Side", "West End", "Smith Hill", "Mount Pleasant"],
    description: "Providence residents benefit from competitive electricity rates with 15+ suppliers in the National Grid service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/3de2f374-e6c7-4415-a731-3588f4dc57b8.jpg"
  },
  "Warwick-RI": {
    state: "Rhode Island", stateCode: "RI", county: "Kent County", population: "83,000+",
    zipCodes: ["02886", "02888", "02889"],
    avgRate: "12.0¢/kWh", avgMonthlyBill: "$171", providers: 15,
    neighborhoods: ["Warwick Neck", "Oakland Beach", "Apponaug", "Gaspee", "Hillsgrove", "Pawtuxet Village", "Conimicut"],
    description: "Warwick residents enjoy competitive electricity rates from 15+ suppliers in the National Grid service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/a37c566e-4168-4be1-a823-20bf311f7ed9.jpg"
  },
  "Cranston-RI": {
    state: "Rhode Island", stateCode: "RI", county: "Providence County", population: "82,000+",
    zipCodes: ["02905", "02907", "02910", "02920", "02921"],
    avgRate: "12.0¢/kWh", avgMonthlyBill: "$171", providers: 14,
    neighborhoods: ["Edgewood", "Garden City", "Knightsville", "Meshanticut", "Park View", "Western Hills", "Pawtuxet"],
    description: "Cranston residents benefit from competitive electricity rates with 14+ suppliers in the National Grid service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/ccdd3a45-7050-4bd0-89d9-81c846e9fcdc.jpg"
  },

  // Handle variations without state codes for backwards compatibility
  "Houston": {
    state: "Texas", stateCode: "TX", county: "Harris County", population: "2,300,000+",
    zipCodes: ["77002", "77019", "77024", "77027", "77056", "77063", "77098"],
    avgRate: "8.9¢/kWh", avgMonthlyBill: "$128", providers: 45,
    neighborhoods: ["Downtown Houston", "The Heights", "Montrose", "River Oaks", "Midtown", "Galleria", "Memorial"],
    description: "Houston, the largest city in Texas and the energy capital of the world, offers residents access to over 45 electricity providers in the deregulated market.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/b92baf13-dff3-4777-8e8a-b25f73b10b8d.jpg"
  },
  "Dallas": {
    state: "Texas", stateCode: "TX", county: "Dallas County", population: "1,300,000+",
    zipCodes: ["75201", "75202", "75204", "75205", "75214", "75219", "75230"],
    avgRate: "9.1¢/kWh", avgMonthlyBill: "$132", providers: 42,
    neighborhoods: ["Downtown Dallas", "Uptown", "Deep Ellum", "Highland Park", "Oak Lawn", "Lake Highlands", "North Dallas"],
    description: "Dallas residents benefit from competitive electricity rates with access to over 42 providers offering a wide range of fixed and variable rate plans.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/8d19f65b-9e9f-4d66-b5f9-6d0cc6de9965.jpg"
  },
  "Austin": {
    state: "Texas", stateCode: "TX", county: "Travis County", population: "978,000+",
    zipCodes: ["78701", "78702", "78703", "78704", "78731", "78745", "78757"],
    avgRate: "9.3¢/kWh", avgMonthlyBill: "$135", providers: 38,
    neighborhoods: ["Downtown Austin", "South Congress", "East Austin", "West Lake Hills", "Hyde Park", "Zilker", "Mueller"],
    description: "Austin, the state capital and tech hub, provides residents with competitive electricity rates and numerous green energy options from 38+ providers.",
    image: "https://images.unsplash.com/photo-1531218150217-54595bc2b934?w=400&h=300&fit=crop"
  },
  "San Antonio": {
    state: "Texas", stateCode: "TX", county: "Bexar County", population: "1,500,000+",
    zipCodes: ["78201", "78209", "78212", "78216", "78232", "78249", "78258"],
    avgRate: "8.8¢/kWh", avgMonthlyBill: "$127", providers: 40,
    neighborhoods: ["Downtown San Antonio", "Alamo Heights", "Stone Oak", "The Dominion", "Southtown", "King William", "Medical Center"],
    description: "San Antonio offers some of the most competitive electricity rates in Texas, with 40+ providers serving the area's residential and commercial customers.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/136ff412-03e2-40c7-8934-8517d2404665.jpg"
  },
  "Fort Worth": {
    state: "Texas", stateCode: "TX", county: "Tarrant County", population: "927,000+",
    zipCodes: ["76102", "76104", "76107", "76109", "76116", "76132", "76244"],
    avgRate: "9.0¢/kWh", avgMonthlyBill: "$130", providers: 41,
    neighborhoods: ["Downtown Fort Worth", "Cultural District", "Sundance Square", "West 7th", "Ridglea", "Tanglewood", "Alliance"],
    description: "Fort Worth residents enjoy access to competitive electricity rates from 41+ providers in the deregulated Texas energy market.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/87a80756-c4b5-44c5-bc05-259fef05ca68.jpg"
  },
  "Chicago": {
    state: "Illinois", stateCode: "IL", county: "Cook County", population: "2,700,000+",
    zipCodes: ["60601", "60602", "60603", "60604", "60605", "60606", "60607"],
    avgRate: "9.8¢/kWh", avgMonthlyBill: "$142", providers: 36,
    neighborhoods: ["Downtown Chicago", "Lincoln Park", "Wicker Park", "River North", "Loop", "Gold Coast", "West Loop"],
    description: "Chicago residents have access to competitive electricity rates from 36+ suppliers in the ComEd service territory.",
    image: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400&h=300&fit=crop"
  },
  "Aurora": {
    state: "Illinois", stateCode: "IL", county: "Kane County", population: "180,000+",
    zipCodes: ["60502", "60503", "60504", "60505", "60506", "60507", "60519"],
    avgRate: "9.9¢/kWh", avgMonthlyBill: "$143", providers: 34,
    neighborhoods: ["Downtown Aurora", "Fox Valley", "Far East", "West Aurora", "North Aurora", "Indian Prairie", "Aurora Highlands"],
    description: "Aurora residents benefit from competitive electricity rates with 34+ suppliers in the western Chicago suburbs.",
    image: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=400&h=300&fit=crop"
  },
  "Naperville": {
    state: "Illinois", stateCode: "IL", county: "DuPage County", population: "149,000+",
    zipCodes: ["60540", "60563", "60564", "60565", "60585"],
    avgRate: "9.7¢/kWh", avgMonthlyBill: "$140", providers: 35,
    neighborhoods: ["Downtown Naperville", "White Eagle", "Ashbury", "Springbrook", "College Hill", "Fort Hill", "Cress Creek"],
    description: "Naperville residents enjoy competitive electricity rates from 35+ suppliers in the affluent DuPage County area.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/403443a6-48b5-4052-ac9e-6600f43ab721.jpg"
  },
  "Joliet": {
    state: "Illinois", stateCode: "IL", county: "Will County", population: "150,000+",
    zipCodes: ["60431", "60432", "60433", "60434", "60435", "60436"],
    avgRate: "9.8¢/kWh", avgMonthlyBill: "$141", providers: 33,
    neighborhoods: ["Cathedral Area", "Fairmont", "Pilcher Park", "Rockdale", "West Joliet", "Laraway", "Highland Park"],
    description: "Joliet residents have access to competitive electricity rates from 33+ suppliers in Will County.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/58463eb0-e880-4c1a-b78b-be40c42fb456.jpg"
  },
  "Columbus": {
    state: "Ohio", stateCode: "OH", county: "Franklin County", population: "905,000+",
    zipCodes: ["43085", "43201", "43202", "43203", "43204", "43205", "43206"],
    avgRate: "9.5¢/kWh", avgMonthlyBill: "$138", providers: 38,
    neighborhoods: ["Downtown Columbus", "German Village", "Short North", "Clintonville", "Victorian Village", "Arena District", "Brewery District"],
    description: "Columbus residents enjoy competitive electricity rates from 38+ suppliers in the AEP Ohio service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/03fe81c8-162d-4692-be26-32e20095399c.jpg"
  },
  "Cleveland": {
    state: "Ohio", stateCode: "OH", county: "Cuyahoga County", population: "372,000+",
    zipCodes: ["44101", "44102", "44103", "44104", "44105", "44106", "44107"],
    avgRate: "9.6¢/kWh", avgMonthlyBill: "$139", providers: 37,
    neighborhoods: ["Downtown Cleveland", "Ohio City", "Tremont", "University Circle", "Detroit-Shoreway", "Edgewater", "Collinwood"],
    description: "Cleveland residents have access to competitive electricity rates from 37+ suppliers in the FirstEnergy service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/0566fb7e-4b0b-46d4-bdc4-04a2189962bf.jpg"
  },
  "Cincinnati": {
    state: "Ohio", stateCode: "OH", county: "Hamilton County", population: "309,000+",
    zipCodes: ["45201", "45202", "45203", "45204", "45205", "45206", "45207"],
    avgRate: "9.7¢/kWh", avgMonthlyBill: "$140", providers: 36,
    neighborhoods: ["Downtown Cincinnati", "Over-the-Rhine", "Mount Adams", "Clifton", "Hyde Park", "Oakley", "Columbia-Tusculum"],
    description: "Cincinnati residents benefit from competitive electricity rates with 36+ suppliers in the Duke Energy Ohio territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/e1e2ce07-4723-4b43-b55c-8e6a0251d472.jpg"
  },
  "Toledo": {
    state: "Ohio", stateCode: "OH", county: "Lucas County", population: "270,000+",
    zipCodes: ["43601", "43604", "43606", "43607", "43608", "43609", "43610"],
    avgRate: "9.6¢/kWh", avgMonthlyBill: "$139", providers: 35,
    neighborhoods: ["Downtown Toledo", "Old West End", "Ottawa Hills", "Sylvania", "Point Place", "Westgate", "South End"],
    description: "Toledo residents enjoy competitive electricity rates from 35+ suppliers in the FirstEnergy service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/c3d7d2f5-d102-4ed8-aa7f-f2e9c6e02764.jpg"
  },
  "Philadelphia": {
    state: "Pennsylvania", stateCode: "PA", county: "Philadelphia County", population: "1,600,000+",
    zipCodes: ["19102", "19103", "19104", "19106", "19107", "19111", "19114"],
    avgRate: "10.2¢/kWh", avgMonthlyBill: "$147", providers: 32,
    neighborhoods: ["Center City", "Old City", "Society Hill", "Rittenhouse Square", "University City", "Northern Liberties", "Fishtown"],
    description: "Philadelphia residents benefit from competitive electricity rates with 32+ suppliers in the PECO service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/01dc15fd-0434-4dd9-ac68-9123c6a14f33.jpg"
  },
  "Pittsburgh": {
    state: "Pennsylvania", stateCode: "PA", county: "Allegheny County", population: "303,000+",
    zipCodes: ["15201", "15202", "15203", "15204", "15205", "15206", "15207"],
    avgRate: "10.1¢/kWh", avgMonthlyBill: "$146", providers: 30,
    neighborhoods: ["Downtown Pittsburgh", "Shadyside", "Squirrel Hill", "Oakland", "Lawrenceville", "South Side", "Strip District"],
    description: "Pittsburgh residents enjoy competitive electricity rates from 30+ suppliers in the Duquesne Light service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/162bc2ea-2c58-4a65-bab4-76e96955cc5c1.jpg"
  },
  "Allentown": {
    state: "Pennsylvania", stateCode: "PA", county: "Lehigh County", population: "125,000+",
    zipCodes: ["18101", "18102", "18103", "18104", "18105", "18106", "18109"],
    avgRate: "10.3¢/kWh", avgMonthlyBill: "$148", providers: 28,
    neighborhoods: ["Downtown Allentown", "West Park", "Hanover Acres", "South Side", "East Side", "West End", "Cedar Crest"],
    description: "Allentown residents benefit from competitive electricity rates with 28+ suppliers in the PPL Electric service territory.",
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
    description: "Newark residents benefit from competitive electricity rates with 27+ suppliers in the PSE&G service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/1a6aeb64-6311-486c-baba-c7cff53a3d5c.jpg"
  },
  "Jersey City": {
    state: "New Jersey", stateCode: "NJ", county: "Hudson County", population: "292,000+",
    zipCodes: ["07302", "07304", "07305", "07306", "07307", "07310"],
    avgRate: "10.6¢/kWh", avgMonthlyBill: "$152", providers: 26,
    neighborhoods: ["Downtown Jersey City", "Journal Square", "The Heights", "Bergen-Lafayette", "Greenville", "McGinley Square", "Paulus Hook"],
    description: "Jersey City residents enjoy competitive electricity rates from 26+ suppliers in the PSE&G service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/29c455be-4263-4009-8e75-1475730b0b76.jpg"
  },
  "Paterson": {
    state: "New Jersey", stateCode: "NJ", county: "Passaic County", population: "159,000+",
    zipCodes: ["07501", "07502", "07503", "07504", "07505", "07510", "07514"],
    avgRate: "10.7¢/kWh", avgMonthlyBill: "$153", providers: 25,
    neighborhoods: ["Downtown Paterson", "Eastside", "Riverside", "Peoples Park", "Hillcrest", "Northside", "Wrigley Park"],
    description: "Paterson residents benefit from competitive electricity rates with 25+ suppliers in the PSE&G service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/8bb83b32-7b38-4635-9279-d5fe12f4d755.jpg"
  },
  "Baltimore": {
    state: "Maryland", stateCode: "MD", county: "Baltimore City", population: "576,000+",
    zipCodes: ["21201", "21202", "21205", "21206", "21207", "21208", "21209"],
    avgRate: "10.4¢/kWh", avgMonthlyBill: "$150", providers: 29,
    neighborhoods: ["Downtown Baltimore", "Federal Hill", "Fells Point", "Canton", "Inner Harbor", "Mount Vernon", "Charles Village"],
    description: "Baltimore residents enjoy competitive electricity rates from 29+ suppliers in the BGE service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/f10f5df1-6404-4618-b8c3-314d3f6a0d29.jpg"
  },
  "Frederick": {
    state: "Maryland", stateCode: "MD", county: "Frederick County", population: "79,000+",
    zipCodes: ["21701", "21702", "21703", "21704", "21705"],
    avgRate: "10.5¢/kWh", avgMonthlyBill: "$151", providers: 27,
    neighborhoods: ["Downtown Frederick", "Ballenger Creek", "Hood College", "North Frederick", "South Frederick", "West Frederick", "East Frederick"],
    description: "Frederick residents benefit from competitive electricity rates with 27+ suppliers in the Potomac Edison service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/98350fd0-49c8-4087-8479-0d390c853bf3.jpg"
  },
  "Rockville": {
    state: "Maryland", stateCode: "MD", county: "Montgomery County", population: "68,000+",
    zipCodes: ["20850", "20851", "20852", "20853", "20854", "20855"],
    avgRate: "10.3¢/kWh", avgMonthlyBill: "$148", providers: 28,
    neighborhoods: ["Downtown Rockville", "Twinbrook", "West End", "King Farm", "Lincoln Park", "Woodley Gardens", "Fallsgrove"],
    description: "Rockville residents enjoy competitive electricity rates from 28+ suppliers in the Pepco service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/46fe92cb-3aa8-4914-8974-bde36dd806af.jpg"
  },
  "Boston": {
    state: "Massachusetts", stateCode: "MA", county: "Suffolk County", population: "675,000+",
    zipCodes: ["02101", "02108", "02109", "02110", "02111", "02113", "02114"],
    avgRate: "11.2¢/kWh", avgMonthlyBill: "$161", providers: 22,
    neighborhoods: ["Downtown Boston", "Back Bay", "Beacon Hill", "North End", "South End", "Fenway", "Charlestown"],
    description: "Boston residents benefit from competitive electricity rates with 22+ suppliers across multiple utility territories.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/6e33a452-8111-4711-a6e7-b49128f6bc5a.jpg"
  },
  "Worcester": {
    state: "Massachusetts", stateCode: "MA", county: "Worcester County", population: "206,000+",
    zipCodes: ["01601", "01602", "01603", "01604", "01605", "01606", "01607"],
    avgRate: "11.3¢/kWh", avgMonthlyBill: "$162", providers: 21,
    neighborhoods: ["Downtown Worcester", "Main South", "Tatnuck", "West Side", "East Side", "Shrewsbury Street", "Canal District"],
    description: "Worcester residents enjoy competitive electricity rates from 21+ suppliers in the National Grid service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/d4fa1135-c2c6-4c43-8184-540993ddd4db.jpg"
  },
  "Springfield": {
    state: "Massachusetts", stateCode: "MA", county: "Hampden County", population: "155,000+",
    zipCodes: ["01101", "01103", "01104", "01105", "01107", "01108", "01109"],
    avgRate: "11.4¢/kWh", avgMonthlyBill: "$163", providers: 20,
    neighborhoods: ["Downtown Springfield", "Forest Park", "Sixteen Acres", "East Springfield", "South End", "Six Corners", "Metro Center"],
    description: "Springfield residents benefit from competitive electricity rates with 20+ suppliers in the Eversource service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/45362c2b-5e37-45ca-a6ab-ac06564ed343.jpg"
  },
  "Hartford": {
    state: "Connecticut", stateCode: "CT", county: "Hartford County", population: "121,000+",
    zipCodes: ["06101", "06103", "06105", "06106", "06107", "06112", "06114"],
    avgRate: "11.8¢/kWh", avgMonthlyBill: "$169", providers: 19,
    neighborhoods: ["Downtown Hartford", "South End", "Asylum Hill", "West End", "North End", "Parkville", "Frog Hollow"],
    description: "Hartford residents enjoy competitive electricity rates from 19+ suppliers in the Eversource service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/ottawa-street.jpg"
  },
  "New Haven": {
    state: "Connecticut", stateCode: "CT", county: "New Haven County", population: "135,000+",
    zipCodes: ["06510", "06511", "06513", "06515", "06519", "06520"],
    avgRate: "11.7¢/kWh", avgMonthlyBill: "$168", providers: 19,
    neighborhoods: ["Downtown New Haven", "East Rock", "Wooster Square", "Fair Haven", "Westville", "Dixwell", "West River"],
    description: "New Haven residents benefit from competitive electricity rates with 19+ suppliers in the United Illuminating service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/ab8c9932-5234-436a-b781-91c450b67ab0.jpg"
  },
  "Bridgeport": {
    state: "Connecticut", stateCode: "CT", county: "Fairfield County", population: "148,000+",
    zipCodes: ["06601", "06604", "06605", "06606", "06607", "06608", "06610"],
    avgRate: "11.9¢/kWh", avgMonthlyBill: "$170", providers: 18,
    neighborhoods: ["Downtown Bridgeport", "South End", "East End", "West End", "North End", "Black Rock", "Brooklawn"],
    description: "Bridgeport residents enjoy competitive electricity rates from 18+ suppliers in the United Illuminating service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/770d9cd5-f0df-4175-80a1-078211ed206a.jpg"
  },
  "Portland": {
    state: "Maine", stateCode: "ME", county: "Cumberland County", population: "68,000+",
    zipCodes: ["04101", "04102", "04103", "04104", "04105", "04106", "04107"],
    avgRate: "11.5¢/kWh", avgMonthlyBill: "$165", providers: 17,
    neighborhoods: ["Downtown Portland", "Old Port", "West End", "East End", "Munjoy Hill", "Libbytown", "Bayside"],
    description: "Portland residents benefit from competitive electricity rates with 17+ suppliers in the CMP service territory.",
    image: "https://images.unsplash.com/photo-1505761671935-60b3a7427bad?w=400&h=300&fit=crop"
  },
  "Lewiston": {
    state: "Maine", stateCode: "ME", county: "Androscoggin County", population: "37,000+",
    zipCodes: ["04240", "04241", "04243"],
    avgRate: "11.6¢/kWh", avgMonthlyBill: "$166", providers: 16,
    neighborhoods: ["Downtown Lewiston", "College Street", "Bates College", "Tree Streets", "Webster Street", "East Avenue", "Sabattus Street"],
    description: "Lewiston residents enjoy competitive electricity rates from 16+ suppliers in the CMP service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/35c3c8a7-86a1-4171-93f9-2a876c9ff35a.jpg"
  },
  "Bangor": {
    state: "Maine", stateCode: "ME", county: "Penobscot County", population: "32,000+",
    zipCodes: ["04401", "04402"],
    avgRate: "11.7¢/kWh", avgMonthlyBill: "$167", providers: 16,
    neighborhoods: ["Downtown Bangor", "Fairmount", "State Street", "Little City", "Broadway", "West Bangor", "East Side"],
    description: "Bangor residents benefit from competitive electricity rates with 16+ suppliers in the Emera Maine service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/f9cc9f9f-03e1-4bc8-bb2c-a8bdf40d7b5d.jpg"
  },
  "Manchester": {
    state: "New Hampshire", stateCode: "NH", county: "Hillsborough County", population: "115,000+",
    zipCodes: ["03101", "03102", "03103", "03104", "03109"],
    avgRate: "11.6¢/kWh", avgMonthlyBill: "$166", providers: 17,
    neighborhoods: ["Downtown Manchester", "North End", "South End", "West Side", "East Side", "Pinardville", "Piscataquog Village"],
    description: "Manchester residents enjoy competitive electricity rates from 17+ suppliers in the Eversource service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/b89134a8-4b49-4280-b376-c9c36d77a3a1.jpg"
  },
  "Nashua": {
    state: "New Hampshire", stateCode: "NH", county: "Hillsborough County", population: "91,000+",
    zipCodes: ["03060", "03061", "03062", "03063", "03064"],
    avgRate: "11.7¢/kWh", avgMonthlyBill: "$167", providers: 16,
    neighborhoods: ["Downtown Nashua", "North End", "South End", "West Hollis Street", "Broad Street Parkway", "Daniel Webster", "Crown Hill"],
    description: "Nashua residents benefit from competitive electricity rates with 16+ suppliers in the Eversource service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/89e68724-f3a0-408a-b82b-21c7f26fe660.jpg"
  },
  "Concord": {
    state: "New Hampshire", stateCode: "NH", county: "Merrimack County", population: "43,000+",
    zipCodes: ["03301", "03302", "03303"],
    avgRate: "11.8¢/kWh", avgMonthlyBill: "$169", providers: 16,
    neighborhoods: ["Downtown Concord", "Penacook", "West Concord", "East Concord", "Heights", "South End", "North End"],
    description: "Concord residents enjoy competitive electricity rates from 16+ suppliers in the Eversource service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/c2b6c002-b461-43af-873e-02caf45e467b.jpg"
  },
  "Providence": {
    state: "Rhode Island", stateCode: "RI", county: "Providence County", population: "190,000+",
    zipCodes: ["02901", "02903", "02904", "02905", "02906", "02907", "02908"],
    avgRate: "11.9¢/kWh", avgMonthlyBill: "$170", providers: 15,
    neighborhoods: ["Downtown Providence", "Federal Hill", "Fox Point", "East Side", "West End", "Smith Hill", "Mount Pleasant"],
    description: "Providence residents benefit from competitive electricity rates with 15+ suppliers in the National Grid service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/3de2f374-e6c7-4415-a731-3588f4dc57b8.jpg"
  },
  "Warwick": {
    state: "Rhode Island", stateCode: "RI", county: "Kent County", population: "83,000+",
    zipCodes: ["02886", "02888", "02889"],
    avgRate: "12.0¢/kWh", avgMonthlyBill: "$171", providers: 15,
    neighborhoods: ["Warwick Neck", "Oakland Beach", "Apponaug", "Gaspee", "Hillsgrove", "Pawtuxet Village", "Conimicut"],
    description: "Warwick residents enjoy competitive electricity rates from 15+ suppliers in the National Grid service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/a37c566e-4168-4be1-a823-20bf311f7ed9.jpg"
  },
  "Cranston": {
    state: "Rhode Island", stateCode: "RI", county: "Providence County", population: "82,000+",
    zipCodes: ["02905", "02907", "02910", "02920", "02921"],
    avgRate: "12.0¢/kWh", avgMonthlyBill: "$171", providers: 14,
    neighborhoods: ["Edgewood", "Garden City", "Knightsville", "Meshanticut", "Park View", "Western Hills", "Pawtuxet"],
    description: "Cranston residents benefit from competitive electricity rates with 14+ suppliers in the National Grid service territory.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/ccdd3a45-7050-4bd0-89d9-81c846e9fcdc.jpg"
  },
  "Akron-OH": {
    state: "Ohio", stateCode: "OH", county: "Summit", population: "190,469+",
    zipCodes: ["44301", "44302", "44303", "44305", "44306"],
    avgRate: "9.5¢/kWh", avgMonthlyBill: "$110", providers: 30,
    neighborhoods: ["Merriman Valley", "Chapel Hill", "Highland Square", "Goodyear Heights", "Firestone Park", "Ellet"],
    description: "Akron has a deregulated electricity market, offering residents a choice of around 30 providers, leading to competitive rates and plans.",
    image: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=400&h=300&fit=crop"
  },
  "Annapolis-MD": {
    state: "Maryland", stateCode: "MD", county: "Anne Arundel", population: "40,812+",
    zipCodes: ["21401", "21403", "21409", "21402", "21404"],
    avgRate: "12.5¢/kWh", avgMonthlyBill: "$135", providers: 25,
    neighborhoods: ["Eastport", "West Annapolis", "Downtown Annapolis", "Admiral Heights", "Annapolis Roads", "Murray Hill"],
    description: "Annapolis residents can take advantage of Maryland's deregulated electricity market, choosing from over 25 retail electric suppliers to find competitive rates and plans.",
    image: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=400&h=300&fit=crop"
  },
  "Arlington-TX": {
    state: "Texas", stateCode: "TX", county: "Tarrant", population: "394,266+",
    zipCodes: ["76010", "76011", "76012", "76013", "76017"],
    avgRate: "9.2¢/kWh", avgMonthlyBill: "$110", providers: 40,
    neighborhoods: ["West Arlington", "North Arlington", "Southwest Arlington", "Southeast Arlington", "East Arlington", "Central Arlington"],
    description: "As part of Texas's deregulated electricity market, Arlington residents can choose from over 40 competing providers, ensuring a wide range of competitive energy plans.",
    image: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=400&h=300&fit=crop"
  },
  "Auburn-ME": {
    state: "Maine", stateCode: "ME", county: "Androscoggin", population: "24,000+",
    zipCodes: ["04210", "04211", "04212"],
    avgRate: "16.5¢/kWh", avgMonthlyBill: "$149", providers: 14,
    neighborhoods: ["Auburn Southeast", "Auburn Plains", "East Auburn", "Haskell Corner", "Lewiston Junction", "Stevens Mill"],
    description: "Electricity in Auburn is part of Maine's deregulated energy market, offering residents a choice among approximately 14 competitive electricity providers.",
    image: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=400&h=300&fit=crop"
  },
  "Augusta-ME": {
    state: "Maine", stateCode: "ME", county: "Kennebec County", population: "19,000+",
    zipCodes: ["04330", "04332", "04333", "04336", "04338"],
    avgRate: "16.5¢/kWh", avgMonthlyBill: "$135", providers: 14,
    neighborhoods: ["Pelton Hill", "Augusta East", "North Augusta", "Summerhaven", "City Center", "Augusta Northeast"],
    description: "As the capital of Maine, Augusta benefits from a deregulated electricity market, offering residents a choice among 14 providers for competitive rates.",
    image: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=400&h=300&fit=crop"
  },
  "Bethlehem-PA": {
    state: "Pennsylvania", stateCode: "PA", county: "Northampton and Lehigh", population: "80,000+",
    zipCodes: ["18015", "18016", "18017", "18018", "18020"],
    avgRate: "10.5¢/kWh", avgMonthlyBill: "$95", providers: 30,
    neighborhoods: ["Historic Bethlehem", "South Bethlehem", "West Side", "East Side", "North Side", "Bethlehem Township"],
    description: "As a city in a deregulated state, Bethlehem residents can choose from over 30 competing electricity providers, ensuring a variety of rate options.",
    image: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=400&h=300&fit=crop"
  },
  "Cambridge-MA": {
    state: "Massachusetts", stateCode: "MA", county: "Middlesex County", population: "118,403+",
    zipCodes: ["02138", "02139", "02140", "02141", "02142"],
    avgRate: "19.5¢/kWh", avgMonthlyBill: "$173", providers: 20,
    neighborhoods: ["East Cambridge", "Cambridgeport", "Mid-Cambridge", "North Cambridge", "West Cambridge", "Riverside"],
    description: "As a city in a deregulated state, Cambridge residents can choose from over 20 electricity providers, fostering a competitive market for electricity rates.",
    image: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=400&h=300&fit=crop"
  },
  "Camden-NJ": {
    state: "New Jersey", stateCode: "NJ", county: "Camden", population: "71,791+",
    zipCodes: ["08102", "08103", "08104", "08105", "08109"],
    avgRate: "13.5¢/kWh", avgMonthlyBill: "$120", providers: 25,
    neighborhoods: ["Cooper Grant", "Cramer Hill", "Fairview", "Gateway", "Lanning Square", "Parkside"],
    description: "Camden has a deregulated electricity market with around 25 providers, offering residents a variety of choices for their energy needs.",
    image: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=400&h=300&fit=crop"
  },
  "Canton-OH": {
    state: "Ohio", stateCode: "OH", county: "Stark County", population: "70,000+",
    zipCodes: ["44702", "44703", "44704", "44705", "44706"],
    avgRate: "9.5¢/kWh", avgMonthlyBill: "$85", providers: 30,
    neighborhoods: ["Washington Square", "Avondale", "Martindale Park", "Historic Ridgewood", "Sippo Lake", "Meyers Lake"],
    description: "Canton's deregulated electricity market offers residents a choice of over 30 providers, fostering competitive rates and energy options.",
    image: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=400&h=300&fit=crop"
  },
  "Champaign-IL": {
    state: "Illinois", stateCode: "IL", county: "Champaign", population: "88,302+",
    zipCodes: ["61820", "61821", "61822", "61824", "61825"],
    avgRate: "10.5¢/kWh", avgMonthlyBill: "$115", providers: 34,
    neighborhoods: ["Robeson Meadows West-Prairie Ridge Place", "Pembroke Point", "Cherry Hills", "Ashland Park", "Boulder Ridge", "Clark Park"],
    description: "Champaign has a deregulated electricity market with over 30 providers, offering residents a wide range of choices for their energy needs.",
    image: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=400&h=300&fit=crop"
  },
  "Columbia-MD": {
    state: "Maryland", stateCode: "MD", county: "Howard County", population: "104,681+",
    zipCodes: ["21044", "21045", "21046", "21042", "21043"],
    avgRate: "12.5¢/kWh", avgMonthlyBill: "$113", providers: 25,
    neighborhoods: ["Allview Estates", "Banneker Place", "Beech Creek", "Clarys Forest", "Cross Fox", "Bryant Gardens"],
    description: "As part of Maryland's deregulated energy market, residents of Columbia can choose from over 25 competitive electricity providers, ensuring a variety of pricing and plan options.",
    image: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=400&h=300&fit=crop"
  },
  "Corpus Christi-TX": {
    state: "Texas", stateCode: "TX", county: "Nueces", population: "317,863+",
    zipCodes: ["78401", "78402", "78404", "78405", "78408"],
    avgRate: "9.5¢/kWh", avgMonthlyBill: "$98", providers: 40,
    neighborhoods: ["Downtown", "Calallen", "South Side", "North Padre Island", "Flour Bluff", "Bay Area"],
    description: "As a city in the deregulated Texas electricity market, Corpus Christi offers residents a choice of over 40 retail electricity providers, promoting competitive rates and plans.",
    image: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=400&h=300&fit=crop"
  },
  "Dayton-OH": {
    state: "Ohio", stateCode: "OH", county: "Montgomery", population: "136,000+",
    zipCodes: ["45402", "45403", "45404", "45405", "45406"],
    avgRate: "9.2¢/kWh", avgMonthlyBill: "$83", providers: 30,
    neighborhoods: ["Downtown Dayton", "Oregon District", "South Park", "Dayton View", "Huffman", "McPherson Town"],
    description: "Dayton has a deregulated electricity market with around 30 providers, offering residents a wide range of choices for their energy needs.",
    image: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=400&h=300&fit=crop"
  },
  "Dover-NH": {
    state: "New Hampshire", stateCode: "NH", county: "Strafford County", population: "32,741+",
    zipCodes: ["03820", "03821", "03822"],
    avgRate: "17.5¢/kWh", avgMonthlyBill: "$105", providers: 15,
    neighborhoods: ["Downtown Dover", "Garrison Village", "Bellamy Woods", "Back River Road Area", "Dover Point", "City Center"],
    description: "As a city in New Hampshire's deregulated electricity market, Dover residents can choose from over 15 competitive energy suppliers, fostering a variety of rate options.",
    image: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=400&h=300&fit=crop"
  },
  "East Providence-RI": {
    state: "Rhode Island", stateCode: "RI", county: "Providence", population: "47,139+",
    zipCodes: ["02914", "02915", "02916"],
    avgRate: "19.5¢/kWh", avgMonthlyBill: "$175", providers: 15,
    neighborhoods: ["Rumford", "Phillipsdale", "Boyden Heights", "Kent Heights", "Riverside", "Watchemoket"],
    description: "East Providence's deregulated electricity market offers residents a choice of around 15 providers, fostering competitive rates and energy options.",
    image: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=400&h=300&fit=crop"
  },
  "Edison-NJ": {
    state: "New Jersey", stateCode: "NJ", county: "Middlesex", population: "107,588+",
    zipCodes: ["08817", "08818", "08820", "08837", "08899"],
    avgRate: "13.5¢/kWh", avgMonthlyBill: "$120", providers: 25,
    neighborhoods: ["Clara Barton", "Oak Tree", "Menlo Park", "North Edison", "New Durham", "Stephenville"],
    description: "Edison has a deregulated electricity market with over 20 providers, offering residents a wide range of choices for their energy supply.",
    image: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=400&h=300&fit=crop"
  },
  "El Paso-TX": {
    state: "Texas", stateCode: "TX", county: "El Paso County", population: "865,657+",
    zipCodes: ["79936", "79938", "79928", "79912", "79924"],
    avgRate: "9.2¢/kWh", avgMonthlyBill: "$110", providers: 40,
    neighborhoods: ["Album Park", "Castner Heights", "Cielo Vista", "Mesa Hills", "North Hills", "Mountain View"],
    description: "El Paso has a deregulated electricity market with over 40 providers, giving residents the power to choose their energy supplier.",
    image: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=400&h=300&fit=crop"
  },
  "Elgin-IL": {
    "state": "Illinois", "stateCode": "IL", "county": "Kane County", "population": "114,797+",
    "zipCodes": ["60120", "60121", "60123", "60124", "60103"],
    "avgRate": "10.5¢/kWh", "avgMonthlyBill": "$115", "providers": 34,
    "neighborhoods": ["Bowes Creek", "Providence", "Randall Ridge", "Highland Woods", "Century Oaks", "Eagle Heights"],
    "description": "Elgin's deregulated electricity market offers residents a choice from over 30 providers, fostering competitive rates and energy options.",
    "image": "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=400&h=300&fit=crop"
  },
  "Erie-PA": {
    state: "Pennsylvania", stateCode: "PA", county: "Erie", population: "94,000+",
    zipCodes: ["16501", "16502", "16503", "16504", "16505"],
    avgRate: "10.5¢/kWh", avgMonthlyBill: "$95", providers: 30,
    neighborhoods: ["Downtown", "West Bayfront", "East Bayfront", "Glenwood", "Frontier", "Little Italy"],
    description: "As a city in Pennsylvania, Erie benefits from a deregulated electricity market, offering residents a choice from around 30 competitive providers.",
    image: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=400&h=300&fit=crop"
  },
  "Frisco-TX": {
    state: "Texas", stateCode: "TX", county: "Collin and Denton", population: "219,000+",
    zipCodes: ["75033", "75034", "75035", "75036", "75072"],
    avgRate: "9.2¢/kWh", avgMonthlyBill: "$110", providers: 40,
    neighborhoods: ["Starwood", "Phillips Creek Ranch", "Newman Village", "Trails of Frisco", "Panther Creek", "Chapel Creek"],
    description: "As part of Texas's deregulated electricity market, Frisco residents can choose from over 40 providers, fostering competitive rates and plans.",
    image: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=400&h=300&fit=crop"
  },
  "Germantown-MD": {
    state: "Maryland", stateCode: "MD", county: "Montgomery", population: "91,000+",
    zipCodes: ["20874", "20876", "20875", "20841", "20879"],
    avgRate: "12.5¢/kWh", avgMonthlyBill: "$115", providers: 25,
    neighborhoods: ["Germantown Estates", "Germantown Park", "Greenfield Commons", "Gunners Lake Village", "Kingsview Village", "Neelsville"],
    description: "As a city in a state with a deregulated electricity market, Germantown residents can choose from over 25 competing energy providers, fostering competitive rates.",
    image: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=400&h=300&fit=crop"
  },
  "Hoboken-NJ": {
    state: "New Jersey", stateCode: "NJ", county: "Hudson", population: "59,000+",
    zipCodes: ["07030"],
    avgRate: "13.5¢/kWh", avgMonthlyBill: "$120", providers: 25,
    neighborhoods: ["Castle Point", "Downtown Hoboken", "Southwest Hoboken", "The Waterfront", "Uptown Hoboken", "Midtown"],
    description: "Hoboken's deregulated electricity market offers residents a choice of around 25 providers, fostering competition and potentially lower rates.",
    image: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=400&h=300&fit=crop"
  },
  "Irving-TX": {
    state: "Texas", stateCode: "TX", county: "Dallas County", population: "256,684+",
    zipCodes: ["75014", "75015", "75016", "75038", "75039"],
    avgRate: "9.5¢/kWh", avgMonthlyBill: "$95", providers: 40,
    neighborhoods: ["Las Colinas", "Valley Ranch", "Hackberry Creek", "Song", "Lamar Brown", "University Hills"],
    description: "Irving is a city in the deregulated energy market of Texas, offering residents a choice of over 40 electricity providers.",
    image: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=400&h=300&fit=crop"
  },
  "Killeen-TX": {
    state: "Texas", stateCode: "TX", county: "Bell", population: "153,095+",
    zipCodes: ["76541", "76542", "76543", "76544", "76549"],
    avgRate: "9.5¢/kWh", avgMonthlyBill: "$112", providers: 40,
    neighborhoods: ["Yowell Ranch", "White Rock Estates", "Sunflower Estates", "Trimmier Estates", "The Highlands at Saegert", "Bellaire Heights"],
    description: "As a city in the deregulated Texas electricity market, Killeen offers residents a choice of over 40 providers, fostering competitive rates and plans.",
    image: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=400&h=300&fit=crop"
  },
  "Lancaster-PA": {
    state: "Pennsylvania", stateCode: "PA", county: "Lancaster", population: "58,039+",
    zipCodes: ["17601", "17602", "17603", "17604", "17608"],
    avgRate: "10.5¢/kWh", avgMonthlyBill: "$125", providers: 30,
    neighborhoods: ["West End", "Chestnut Hill", "Stadium District", "Cabbage Hill", "Southeast Lancaster", "Downtown"],
    description: "Lancaster has a deregulated electricity market, offering residents a choice among approximately 30 competitive suppliers for their energy needs.",
    image: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=400&h=300&fit=crop"
  },
  "Lowell-MA": {
    state: "Massachusetts", stateCode: "MA", county: "Middlesex", population: "120,418+",
    zipCodes: ["01850", "01851", "01852", "01854"],
    avgRate: "19.5¢/kWh", avgMonthlyBill: "$117", providers: 20,
    neighborhoods: ["Pawtucketville", "Centralville", "Highlands", "The Acre", "Downtown", "Belvidere"],
    description: "As a city in a state with a deregulated electricity market, Lowell offers residents a choice of around 20 competing energy providers, fostering competitive rates.",
    image: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=400&h=300&fit=crop"
  },
  "Lubbock-TX": {
    state: "Texas", stateCode: "TX", county: "Lubbock", population: "272,086+",
    zipCodes: ["79401", "79403", "79404", "79406", "79407"],
    avgRate: "9.2¢/kWh", avgMonthlyBill: "$110", providers: 40,
    neighborhoods: ["Tech Terrace", "Maxey Park", "Heart of Lubbock", "Wheelock and Monterey", "Maedgen Area", "Rush"],
    description: "In Lubbock, the deregulated electricity market offers residents a wide array of choices, with around 40 providers competing to offer competitive rates and plans.",
    image: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=400&h=300&fit=crop"
  },
  "McKinney-TX": {
    state: "Texas", stateCode: "TX", county: "Collin County", population: "200,000+",
    zipCodes: ["75069", "75070", "75071", "75072", "75454"],
    avgRate: "9.2¢/kWh", avgMonthlyBill: "$110", providers: 40,
    neighborhoods: ["Adriatica Villa District", "Arbor Glen", "Arbor Hollow", "Aspendale", "Auburn Hills", "Avalon"],
    description: "McKinney is a city in the deregulated energy market of Texas, offering residents a choice of over 40 electricity providers.",
    image: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=400&h=300&fit=crop"
  },
  "Midland-TX": {
    state: "Texas", stateCode: "TX", county: "Midland County", population: "170,000+",
    zipCodes: ["79701", "79703", "79705", "79706", "79707"],
    avgRate: "9.2¢/kWh", avgMonthlyBill: "$110", providers: 40,
    neighborhoods: ["Green Tree", "Grassland Estates", "Saddle Club", "Briarwood", "Trinity", "Kimber-Lea"],
    description: "Midland has a deregulated electricity market with around 40 providers, offering residents a wide range of competitive energy plans to choose from.",
    image: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=400&h=300&fit=crop"
  },
  "New Bedford-MA": {
    state: "Massachusetts", stateCode: "MA", county: "Bristol", population: "101,000+",
    zipCodes: ["02740", "02744", "02745", "02746", "02742"],
    avgRate: "20.5¢/kWh", avgMonthlyBill: "$185", providers: 22,
    neighborhoods: ["Acushnet Heights", "Far North End", "South End", "West End", "Downtown", "Clark's Point"],
    description: "Electricity in New Bedford is part of a deregulated market, offering residents a choice among approximately 22 competitive suppliers. This provides options for different rates and plans.",
    image: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=400&h=300&fit=crop"
  },
  "Norwalk-CT": {
    state: "Connecticut", stateCode: "CT", county: "Fairfield", population: "91,000+",
    zipCodes: ["06850", "06851", "06853", "06854", "06855"],
    avgRate: "22.8¢/kWh", avgMonthlyBill: "$161", providers: 18,
    neighborhoods: ["Broad River", "South Norwalk", "East Norwalk", "West Norwalk", "Silvermine", "Cranbury"],
    description: "Norwalk has a deregulated electricity market, offering residents a choice among 18 competitive providers for their energy needs.",
    image: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=400&h=300&fit=crop"
  },
  "Pawtucket-RI": {
    state: "Rhode Island", stateCode: "RI", county: "Providence", population: "75,604+",
    zipCodes: ["02860", "02861", "02862"],
    avgRate: "19.5¢/kWh", avgMonthlyBill: "$135", providers: 15,
    neighborhoods: ["Darlington", "Woodlawn", "Quality Hill", "Pleasant View", "Fairlawn", "Oak Hill"],
    description: "Electricity in Pawtucket is part of Rhode Island's deregulated energy market, offering residents a choice among approximately 15 competitive electric suppliers.",
    image: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=400&h=300&fit=crop"
  },
  "Peoria-IL": {
    state: "Illinois", stateCode: "IL", county: "Peoria", population: "113,150+",
    zipCodes: ["61602", "61603", "61604", "61605", "61606"],
    avgRate: "10.5¢/kWh", avgMonthlyBill: "$115", providers: 34,
    neighborhoods: ["Downtown", "North Peoria", "West Peoria", "East Peoria", "Morton", "Washington"],
    description: "As a resident of Peoria, you live in a deregulated electricity market, giving you the power to choose from over 34 different energy providers.",
    image: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=400&h=300&fit=crop"
  },
  "Plano-TX": {
    state: "Texas", stateCode: "TX", county: "Collin", population: "285,494+",
    zipCodes: ["75023", "75024", "75025", "75074", "75093"],
    avgRate: "9.2¢/kWh", avgMonthlyBill: "$110", providers: 38,
    neighborhoods: ["Willow Bend", "Whiffletree", "Normandy Estates", "Lakeside on Preston", "Indian Creek", "Gleneagles"],
    description: "Plano's deregulated electricity market offers residents a wide selection of energy plans from over 38 providers, ensuring competitive rates and options.",
    image: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=400&h=300&fit=crop"
  },
  "Reading-PA": {
    state: "Pennsylvania", stateCode: "PA", county: "Berks County", population: "95,112+",
    zipCodes: ["19601", "19602", "19604", "19606", "19611"],
    avgRate: "10.5¢/kWh", avgMonthlyBill: "$95", providers: 30,
    neighborhoods: ["East Reading", "Glenside", "College Heights", "Northwest Reading", "Northeast Reading", "Centre Park"],
    description: "Reading, located in Berks County, is a city with a deregulated electricity market, offering residents a choice from over 30 competitive energy providers.",
    image: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=400&h=300&fit=crop"
  },
  "Rochester-NH": {
    state: "New Hampshire", stateCode: "NH", county: "Strafford", population: "32,000+",
    zipCodes: ["03839", "03866", "03867", "03868"],
    avgRate: "17.5¢/kWh", avgMonthlyBill: "$155", providers: 15,
    neighborhoods: ["Gonic", "East Rochester", "North Rochester", "City Center", "Meaderboro Corner", "Rochester West"],
    description: "Rochester residents can take advantage of New Hampshire's deregulated electricity market, choosing from around 15 competitive providers for the best rates.",
    image: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=400&h=300&fit=crop"
  },
  "Rockford-IL": {
    state: "Illinois", stateCode: "IL", county: "Winnebago", population: "148,000+",
    zipCodes: ["61101", "61102", "61103", "61104", "61107"],
    avgRate: "10.5¢/kWh", avgMonthlyBill: "$95", providers: 34,
    neighborhoods: ["Bello Reserve", "Beverly Park", "Central Park", "Chestnut", "Edgewater", "Fairgrounds"],
    description: "Rockford's deregulated electricity market offers residents a choice from over 30 providers, fostering competitive rates and energy options.",
    image: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=400&h=300&fit=crop"
  },
  "Schaumburg-IL": {
    state: "Illinois", stateCode: "IL", county: "Cook", population: "78,000+",
    zipCodes: ["60173", "60193", "60194", "60195", "60196"],
    avgRate: "10.5¢/kWh", avgMonthlyBill: "$105", providers: 34,
    neighborhoods: ["Weathersfield", "Timbercrest", "Stone Bridge Court", "Lions Gate", "Plumwood Estates", "Park St. Claire"],
    description: "Schaumburg's deregulated electricity market offers residents a choice of over 30 providers, fostering competitive rates and energy options.",
    image: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=400&h=300&fit=crop"
  },
  "Scranton-PA": {
    state: "Pennsylvania", stateCode: "PA", county: "Lackawanna County", population: "76,000+",
    zipCodes: ["18501", "18502", "18503", "18504", "18505"],
    avgRate: "10.5¢/kWh", avgMonthlyBill: "$125", providers: 30,
    neighborhoods: ["Downtown Scranton", "West Mountain", "East Mountain", "Greenridge", "Minooka", "Hill Section"],
    description: "As the county seat of Lackawanna County, Scranton boasts a deregulated electricity market with around 30 providers, offering residents a wide range of competitive energy choices.",
    image: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=400&h=300&fit=crop"
  },
  "Silver Spring-MD": {
    state: "Maryland", stateCode: "MD", county: "Montgomery", population: "81,015+",
    zipCodes: ["20901", "20902", "20904", "20905", "20906"],
    avgRate: "12.5¢/kWh", avgMonthlyBill: "$125", providers: 25,
    neighborhoods: ["Woodmoor", "Indian Spring", "Downtown Silver Spring", "East Silver Spring", "Woodside", "Clifton Park Village"],
    description: "In Silver Spring's deregulated electricity market, residents can choose from over 25 providers, fostering competitive rates and energy options.",
    image: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=400&h=300&fit=crop"
  },
  "Springfield-IL": {
    state: "Illinois", stateCode: "IL", county: "Sangamon", population: "114,394+",
    zipCodes: ["62701", "62702", "62703", "62704", "62711"],
    avgRate: "10.5¢/kWh", avgMonthlyBill: "$115", providers: 34,
    neighborhoods: ["Washington Park", "Leland Grove", "Piper Glen", "Lake Pointe", "West Koke Mill", "Enos Park"],
    description: "As the state capital, Springfield benefits from Illinois's deregulated electricity market, offering residents a choice of over 34 energy providers and fostering competitive rates.",
    image: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=400&h=300&fit=crop"
  },
  "Stamford-CT": {
    state: "Connecticut", stateCode: "CT", county: "Fairfield", population: "139,000+",
    zipCodes: ["06901", "06902", "06903", "06905", "06906"],
    avgRate: "21.5¢/kWh", avgMonthlyBill: "$191", providers: 18,
    neighborhoods: ["Downtown", "Shippan", "Glenbrook", "Westover", "North Stamford", "Cove"],
    description: "Stamford's deregulated electricity market offers residents a choice of around 18 providers, fostering competitive rates and energy options.",
    image: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=400&h=300&fit=crop"
  },
  "Trenton-NJ": {
    state: "New Jersey", stateCode: "NJ", county: "Mercer", population: "83,000+",
    zipCodes: ["08608", "08609", "08610", "08611", "08618"],
    avgRate: "13.5¢/kWh", avgMonthlyBill: "$119", providers: 25,
    neighborhoods: ["Downtown", "South Trenton", "Mill Hill", "Hiltonia", "East Trenton", "Wilbur"],
    description: "As a city in a state with a deregulated electricity market, Trenton residents can choose from over 25 different providers, fostering competitive rates and energy options.",
    image: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=400&h=300&fit=crop"
  },
  "Waterbury-CT": {
    state: "Connecticut", stateCode: "CT", county: "New Haven", population: "114,403+",
    zipCodes: ["06702", "06704", "06705", "06706", "06708"],
    avgRate: "21.5¢/kWh", avgMonthlyBill: "$150", providers: 18,
    neighborhoods: ["Bunker Hill", "Bucks Hill", "Town Plot", "Waterville", "Brooklyn", "East End"],
    description: "As a city in a state with a deregulated electricity market, Waterbury offers residents a choice of over 18 energy providers, leading to competitive rates and plans.",
    image: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=400&h=300&fit=crop"
  },
  "Yonkers-NY": {
    state: "New York", stateCode: "NY", county: "Westchester", population: "211,569+",
    zipCodes: ["10701", "10705", "10704", "10710", "10703"],
    avgRate: "16.5¢/kWh", avgMonthlyBill: "$149", providers: 24,
    neighborhoods: ["Beech Hill", "Lawrence Park", "Cedar Knolls", "Crestwood", "Lincoln Park", "Colonial Heights"],
    description: "As a city in a state with a deregulated electricity market, Yonkers residents can choose from over 24 energy providers, ensuring competitive rates and plans.",
    image: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=400&h=300&fit=crop"
  },
  "Youngstown-OH": {
    state: "Ohio", stateCode: "OH", county: "Mahoning", population: "60,000+",
    zipCodes: ["44502", "44503", "44504", "44505", "44509"],
    avgRate: "9.5¢/kWh", avgMonthlyBill: "$105", providers: 30,
    neighborhoods: ["Brier Hill", "Brownlee Woods", "Downtown", "Hazelton", "Kirkmere", "Idora"],
    description: "Youngstown's deregulated electricity market offers residents a choice of around 30 providers, fostering competitive rates and energy options.",
    image: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=400&h=300&fit=crop"
  },
  "Albany-NY": {
    state: "New York", stateCode: "NY", county: "Albany County", population: "99,000+",
    zipCodes: ["12201", "12202", "12203", "12204", "12205"],
    avgRate: "15.5¢/kWh", avgMonthlyBill: "$145", providers: 22,
    neighborhoods: ["Downtown Albany", "Center Square", "Pine Hills", "Buckingham Pond", "Delaware Avenue", "Lark Street"],
    description: "Albany, the capital of New York, offers residents access to over 22 electricity suppliers in the deregulated ESCO market, providing competitive rates and plan options.",
    image: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=400&h=300&fit=crop"
  },
};

class CityRatesErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error('CityRates crash:', error, info); }
  render() {
    if (this.state.hasError) return <div className="p-8 text-red-600"><h1>CityRates Error</h1><pre>{this.state.error?.toString()}</pre></div>;
    return this.props.children;
  }
}

function CityRatesInner() {
  const [zipCode, setZipCode] = useState("");
  const [usage, setUsage] = useState(1000);
  const [cityName, setCityName] = useState("");
  const [openFaq, setOpenFaq] = useState(null);
  const [isZipValid, setIsZipValid] = useState(false);
  const [searchParams] = useSearchParams();
  const cityParam = searchParams.get('city');
  const stateParam = searchParams.get('state');;

  // Get city and state from URL - update when URL changes
  useEffect(() => {
    if (cityParam && stateParam) {
      const cityKey = `${cityParam}-${stateParam}`;
      setCityName(cityKey);
    } else if (cityParam) {
      // Handle city-only param (backwards compatibility)
      setCityName(cityParam);
    } else {
      // Only default if no params at all
      setCityName('Houston-TX');
    }
  }, [cityParam, stateParam]);

  // Always prioritize the full city-state key, generate generic data if city doesn't exist
  const cityKey = cityName;
  const displayCityName = cityName.split('-')[0];
  const stateCode = cityName.split('-')[1] || 'TX';
  
  // State-level defaults for when specific city isn't in database
  const stateDefaults = {
    'TX': { avgRate: "9.0¢/kWh", avgMonthlyBill: "$130", providers: 40, state: "Texas", county: "Local County" },
    'IL': { avgRate: "9.8¢/kWh", avgMonthlyBill: "$142", providers: 35, state: "Illinois", county: "Local County" },
    'OH': { avgRate: "9.6¢/kWh", avgMonthlyBill: "$139", providers: 36, state: "Ohio", county: "Local County" },
    'PA': { avgRate: "10.2¢/kWh", avgMonthlyBill: "$147", providers: 30, state: "Pennsylvania", county: "Local County" },
    'NY': { avgRate: "11.0¢/kWh", avgMonthlyBill: "$158", providers: 25, state: "New York", county: "Local County" },
    'NJ': { avgRate: "10.6¢/kWh", avgMonthlyBill: "$152", providers: 26, state: "New Jersey", county: "Local County" },
    'MD': { avgRate: "10.4¢/kWh", avgMonthlyBill: "$150", providers: 28, state: "Maryland", county: "Local County" },
    'MA': { avgRate: "11.3¢/kWh", avgMonthlyBill: "$162", providers: 21, state: "Massachusetts", county: "Local County" },
    'CT': { avgRate: "11.8¢/kWh", avgMonthlyBill: "$169", providers: 19, state: "Connecticut", county: "Local County" },
    'ME': { avgRate: "11.6¢/kWh", avgMonthlyBill: "$166", providers: 16, state: "Maine", county: "Local County" },
    'NH': { avgRate: "11.7¢/kWh", avgMonthlyBill: "$167", providers: 16, state: "New Hampshire", county: "Local County" },
    'RI': { avgRate: "12.0¢/kWh", avgMonthlyBill: "$171", providers: 15, state: "Rhode Island", county: "Local County" }
  };
  
  const city = cityData[cityKey] || {
    ...stateDefaults[stateCode],
    stateCode: stateCode,
    population: "Local residents",
    zipCodes: ["00000"],
    neighborhoods: [`Downtown ${displayCityName}`, `North ${displayCityName}`, `South ${displayCityName}`, `East ${displayCityName}`, `West ${displayCityName}`],
    description: `${displayCityName} residents have access to competitive electricity rates in the deregulated ${stateDefaults[stateCode]?.state || 'energy'} market.`,
    image: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&q=80"
  };

  // Generate dynamic SEO data with city-specific details
  const seoTitle = `${displayCityName}, ${city.stateCode} Electricity Rates 2025 - Compare ${city.providers}+ Providers | ElectricScouts`;
  const seoDescription = `Compare ${displayCityName} electricity rates from ${city.providers}+ providers. Average ${city.avgRate} (est. ${city.avgMonthlyBill}/mo). Serving ${city.county}, population ${city.population}. ${city.description.substring(0, 100)}... Switch & save today - 100% free comparison.`;
  const seoKeywords = `${displayCityName} electricity rates, ${displayCityName} ${city.stateCode} electricity providers, cheap electricity ${displayCityName}, ${displayCityName} power companies, electricity rates ${city.county}, best electricity rates ${displayCityName}, compare electricity ${displayCityName}, ${displayCityName} energy plans, ${displayCityName.toLowerCase()} electric rates, ${city.state.toLowerCase()} electricity, ${displayCityName} fixed rate electricity, ${displayCityName} variable rate plans, renewable energy ${displayCityName}, ${city.neighborhoods.slice(0, 3).join(' electricity, ')} electricity`;

  const breadcrumbData = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "All Cities", url: "/all-cities" },
    { name: `${displayCityName}, ${city.stateCode}`, url: `/city-rates?city=${displayCityName}&state=${city.stateCode}` }
  ]);

  const serviceData = getServiceSchema(city.state);

  const cityFaqs = [
    {
      question: `What is the average electricity rate in ${displayCityName}, ${city.stateCode}?`,
      answer: `The average electricity rate in ${displayCityName} is approximately ${city.avgRate}, though rates vary by provider, plan type, and usage level. With ElectricScouts, you can compare rates from all ${city.providers}+ providers serving ${city.county} to find the best deal for your home.`
    },
    {
      question: `How do I switch electricity providers in ${displayCityName}?`,
      answer: `Switching electricity providers in ${displayCityName} is easy. Simply compare plans on ElectricScouts, select your preferred plan, and sign up online or by phone. Your new provider will handle the switch with your current provider, and your power will never be interrupted during the transition.`
    },
    {
      question: `Are there renewable energy options in ${displayCityName}?`,
      answer: `Yes! Many electricity providers in ${displayCityName} offer renewable energy plans sourced from wind and solar farms. Green energy plans are often competitively priced and help reduce your carbon footprint while supporting clean energy development in ${city.state}.`
    },
    {
      question: `What's the best electricity plan for ${displayCityName} residents?`,
      answer: `The best electricity plan depends on your usage, budget, and preferences. Fixed-rate plans offer price stability, while variable-rate plans may have lower rates but fluctuate monthly. For most ${displayCityName} residents, a 12 or 24-month fixed-rate plan provides the best balance of savings and predictability.`
    }
  ];
  
  const faqData = getFAQSchema(cityFaqs);
  const localBusinessData = getLocalBusinessSchema(displayCityName, city.state, city.county);

  const { data: plans, isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: () => ElectricityPlan.list(),
    initialData: [],
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  // Get available providers for first ZIP in city
  const cityZipCode = city.zipCodes[0];
  const [availableProviders, setAvailableProviders] = useState([]);
  
  useEffect(() => {
    let cancelled = false;
    getProvidersForZipCode(cityZipCode).then(providers => {
      if (!cancelled) setAvailableProviders(providers || []);
    }).catch(() => {
      if (!cancelled) setAvailableProviders([]);
    });
    return () => { cancelled = true; };
  }, [cityZipCode]);
  
  const availableProviderNames = availableProviders.map(p => p.name);
  
  // Filter plans by providers available in this city
  const cityPlans = plans.filter(plan => 
    availableProviderNames.includes(plan.provider_name)
  ).slice(0, 6);

  // Get provider logo
  const getProviderLogo = (providerName) => {
    const provider = getProviderDetails(providerName);
    return provider ? provider.logo : null;
  };

  return (
    <div className="min-h-screen bg-white">
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        keywords={seoKeywords}
        canonical={`/city-rates?city=${displayCityName}&state=${city.stateCode}`}
        image={city.image}
        structuredData={[breadcrumbData, serviceData, faqData, localBusinessData]}
      />

      {/* Hero Section - SEO Optimized */}
      <div className="relative bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <img src={city.image} alt={`${displayCityName} skyline`} className="w-full h-full object-cover" loading="lazy" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-3xl">
            {/* Breadcrumb for SEO */}
            <nav className="mb-4 text-xs">
              <Link to={createPageUrl("Home")} className="text-blue-200 hover:text-white">Home</Link>
              <span className="mx-2 text-blue-300">/</span>
              <Link to={createPageUrl("AllCities")} className="text-blue-200 hover:text-white">Service Areas</Link>
              <span className="mx-2 text-blue-300">/</span>
              <span className="text-white">{displayCityName}</span>
            </nav>

            <h1 className="text-3xl lg:text-4xl font-bold mb-3">
              Cheap Electricity Rates in {displayCityName}, {city.state}
            </h1>
            <p className="text-lg text-blue-100 mb-5">
              Compare electricity plans from {city.providers}+ providers serving {city.county}. 
              Average rates starting at {city.avgRate} with potential savings up to $800/year.
            </p>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <div className="text-xl font-bold mb-1">{city.avgRate}</div>
                <div className="text-xs text-blue-100">Avg. Rate</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <div className="text-xl font-bold mb-1">{city.providers}+</div>
                <div className="text-xs text-blue-100">Providers</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <div className="text-xl font-bold mb-1">{city.avgMonthlyBill}</div>
                <div className="text-xs text-blue-100">Avg. Bill</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <div className="text-xl font-bold mb-1">{city.population}</div>
                <div className="text-xs text-blue-100">Population</div>
              </div>
            </div>

            {/* CTA */}
            <div className="bg-white rounded-xl p-1.5 shadow-2xl max-w-2xl">
              <div className="flex flex-col sm:flex-row items-stretch gap-2">
                <div className="flex-1 px-4 py-3 bg-gray-50 rounded-lg">
                  <ValidatedZipInput
                    value={zipCode}
                    onChange={setZipCode}
                    placeholder={`Enter ${displayCityName} ZIP code`}
                    className="text-base"
                    onValidationChange={setIsZipValid}
                  />
                </div>
                <Link to={createPageUrl("CompareRates") + (zipCode ? `?zip=${zipCode}` : '')}>
                  <Button 
                    className="w-full sm:w-auto px-6 py-5 text-base font-bold rounded-lg bg-[#FF6B35] hover:bg-[#e55a2b] text-white h-full"
                    disabled={!isZipValid && zipCode.length > 0}
                  >
                    Compare Rates
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* About Section - SEO Content */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Electricity Providers in {displayCityName}, {city.stateCode}
          </h2>
          <div className="prose prose-lg max-w-none text-gray-600">
            <p className="text-lg leading-relaxed mb-4">
              {city.description} Finding the best electricity plan in {displayCityName} is easier than ever 
              with ElectricScouts' free comparison tool.
            </p>
            <p className="text-lg leading-relaxed">
              Whether you're moving to {displayCityName}, looking to switch providers, or simply want to reduce your 
              monthly electricity bill, our platform helps you compare plans from top-rated providers. We serve all neighborhoods in {city.county} 
              including {city.neighborhoods.slice(0, 3).join(", ")}, and beyond.
            </p>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Why Compare Electricity Plans in {displayCityName}?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-2 hover:border-[#FF6B35] transition-all">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Save Money</h3>
                <p className="text-gray-600">
                  {displayCityName} residents can save up to $800 per year by switching to a better electricity plan
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-[#FF6B35] transition-all">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">More Options</h3>
                <p className="text-gray-600">
                  Access {city.providers}+ providers with fixed, variable, and renewable energy plans
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-[#FF6B35] transition-all">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">No Risk</h3>
                <p className="text-gray-600">
                  Free comparison service with no credit checks, hidden fees, or obligations
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Featured Plans */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Top Electricity Plans in {displayCityName}
              </h2>
              <p className="text-gray-600">
                Current rates available in {city.county}
              </p>
            </div>
            <Link to={createPageUrl("CompareRates") + (zipCode ? `?zip=${zipCode}` : '')}>
              <Button variant="outline" className="hidden md:flex">
                View All Plans
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-6 border border-gray-200 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                      <tr>
                        <th className="px-5 py-3 text-left text-xs font-bold text-gray-700 uppercase">Provider</th>
                        <th className="px-5 py-3 text-left text-xs font-bold text-gray-700 uppercase">Plan</th>
                        <th className="px-5 py-3 text-left text-xs font-bold text-gray-700 uppercase">Rate</th>
                        <th className="px-5 py-3 text-left text-xs font-bold text-gray-700 uppercase">Est. Bill</th>
                        <th className="px-5 py-3 text-left text-xs font-bold text-gray-700 uppercase">Term</th>
                        <th className="px-5 py-3 text-left text-xs font-bold text-gray-700 uppercase">Rating</th>
                        <th className="px-5 py-3 text-center text-xs font-bold text-gray-700 uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {cityPlans.map((plan) => {
                        const monthlyBill = ((plan.rate_per_kwh / 100) * usage) + (plan.monthly_base_charge || 0);
                        return (
                          <tr key={plan.id} className="hover:bg-blue-50/50 transition-colors group">
                            <td className="px-5 py-3.5">
                              <div className="font-bold text-gray-900 text-sm">{plan.provider_name}</div>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="font-semibold text-gray-900 text-sm mb-1">{plan.plan_name}</div>
                              <div className="flex gap-1.5">
                                {plan.plan_type === 'fixed' && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800 capitalize">
                                    {plan.plan_type}
                                  </span>
                                )}
                                {plan.renewable_percentage >= 50 && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800">
                                    <Leaf className="w-3 h-3 mr-0.5" />
                                    Green
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="text-xl font-bold text-[#0A5C8C]">{plan.rate_per_kwh}¢</div>
                              <div className="text-xs text-gray-500">per kWh</div>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="text-base font-bold text-gray-900">${monthlyBill.toFixed(0)}</div>
                              <div className="text-xs text-gray-500">@ {usage} kWh</div>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="text-sm text-gray-900 font-semibold">{plan.contract_length || 'Variable'} mo</div>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                <span className="font-bold text-gray-900 text-sm">4.5</span>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-center">
                              <Link to={createPageUrl("CompareRates") + (zipCode ? `?zip=${zipCode}` : '')}>
                                <Button size="sm" className="bg-[#FF6B35] hover:bg-[#e55a2b] text-white text-xs px-4 whitespace-nowrap shadow-sm">
                                  View Plan
                                </Button>
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden space-y-3">
                {cityPlans.map((plan) => {
                  const monthlyBill = ((plan.rate_per_kwh / 100) * usage) + (plan.monthly_base_charge || 0);
                  return (
                    <Card key={plan.id} className="border hover:border-[#0A5C8C] hover:shadow-md transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2.5">
                          <div>
                            <div className="font-bold text-gray-900 text-base">{plan.provider_name}</div>
                            <div className="text-sm text-gray-600">{plan.plan_name}</div>
                          </div>
                          <div className="flex items-center gap-0.5 bg-yellow-50 px-2 py-1 rounded">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs font-bold text-gray-900">4.5</span>
                          </div>
                        </div>

                        <div className="flex gap-1.5 mb-3">
                          {plan.plan_type === 'fixed' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800 capitalize">
                              {plan.plan_type}
                            </span>
                          )}
                          {plan.renewable_percentage >= 50 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800">
                              <Leaf className="w-3 h-3 mr-0.5" />
                              Green
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-3 mb-3 bg-gray-50 rounded-lg p-3">
                          <div>
                            <div className="text-xs text-gray-500 mb-0.5">Rate</div>
                            <div className="text-base font-bold text-[#0A5C8C]">{plan.rate_per_kwh}¢</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-0.5">Est. Bill</div>
                            <div className="text-base font-bold text-gray-900">${monthlyBill.toFixed(0)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-0.5">Term</div>
                            <div className="text-sm font-semibold text-gray-900">{plan.contract_length || 'Var'} mo</div>
                          </div>
                        </div>

                        <Link to={createPageUrl("CompareRates") + (zipCode ? `?zip=${zipCode}` : '')}>
                          <Button size="sm" className="w-full bg-[#FF6B35] hover:bg-[#e55a2b] text-white text-sm">
                            View Plan
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}

          <div className="mt-6 text-center">
            <Link to={createPageUrl("CompareRates") + (zipCode ? `?zip=${zipCode}` : '')}>
              <Button variant="outline" className="lg:hidden w-full">
                View All Plans
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Neighborhoods Section - SEO Content */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            {displayCityName} Neighborhoods We Serve
          </h2>
          <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-xl p-8">
            <p className="text-gray-700 mb-4">
              ElectricScouts helps residents across all {displayCityName} neighborhoods find the best electricity rates:
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {city.neighborhoods.map((neighborhood, index) => (
                <div key={index} className="flex items-center gap-2 text-gray-700">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="font-medium">{neighborhood}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section - SEO Rich Content */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            {displayCityName} Electricity FAQs
          </h2>
          <div className="space-y-4">
            {cityFaqs.map((faq) => (
              <Card 
                key={faq.id} 
                className="border-2 hover:border-[#0A5C8C] transition-all cursor-pointer overflow-hidden"
                onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
              >
                <CardContent className="p-0">
                  <div className="flex items-center justify-between p-6">
                    <h3 className="text-lg font-bold text-gray-900 pr-4">
                      {faq.question}
                    </h3>
                    <ChevronDown 
                      className={`w-5 h-5 text-[#0A5C8C] flex-shrink-0 transition-transform duration-300 ${
                        openFaq === faq.id ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                  <div 
                    className={`transition-all duration-300 ease-in-out ${
                      openFaq === faq.id ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="px-6 pb-6 pt-0">
                      <p className="text-gray-600 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] rounded-3xl p-12 text-center text-white">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Ready to Save on Electricity in {displayCityName}?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of {displayCityName} residents who have saved money by comparing electricity rates
          </p>
          
          <div className="bg-white rounded-2xl p-1.5 shadow-2xl max-w-2xl mx-auto mb-6">
            <div className="flex flex-col sm:flex-row items-stretch gap-2">
              <div className="flex-1 px-5 py-4 bg-gray-50 rounded-xl">
                <ValidatedZipInput
                  value={zipCode}
                  onChange={setZipCode}
                  placeholder={`Enter your ${displayCityName} ZIP code`}
                  className="text-lg"
                  onValidationChange={setIsZipValid}
                />
              </div>
              <Link to={createPageUrl("CompareRates") + (zipCode ? `?zip=${zipCode}` : '')}>
                <Button 
                  className="w-full sm:w-auto px-10 py-6 text-lg font-bold rounded-xl bg-[#FF6B35] hover:bg-[#e55a2b] text-white h-full"
                  disabled={!isZipValid && zipCode.length > 0}
                >
                  Compare Now
                </Button>
              </Link>
            </div>
          </div>

          <div className="flex items-center justify-center gap-6 flex-wrap text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>100% Free Service</span>
            </div>
            <span className="text-blue-300">•</span>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>No Credit Check</span>
            </div>
            <span className="text-blue-300">•</span>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>Instant Comparison</span>
            </div>
          </div>
        </section>
      </div>

      {/* SEO Footer Content */}
      <div className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-sm max-w-none text-gray-600">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              About Electricity Service in {displayCityName}, {city.state}
            </h2>
            <p>
              As a resident of {displayCityName}, {city.county}, you have the power to choose your electricity provider 
              thanks to {city.state}'s deregulated energy market. This means you're not stuck with one utility company – 
              you can shop around and find the electricity plan that best fits your needs and budget. ElectricScouts 
              makes this process simple by allowing you to compare rates from {city.providers}+ providers in minutes.
            </p>
            <p>
              Whether you live in {city.neighborhoods[0]}, {city.neighborhoods[1]}, or any other {displayCityName} neighborhood, 
              you can access competitive rates, renewable energy options, and flexible contract terms. From short-term 
              month-to-month plans to long-term fixed-rate contracts, there's an electricity plan for every {displayCityName} 
              household. Start comparing today and see how much you could save on your electricity bill.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CityRates() {
  return <CityRatesErrorBoundary><CityRatesInner /></CityRatesErrorBoundary>;
}
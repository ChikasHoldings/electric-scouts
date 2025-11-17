import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
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
import SEOHead, { getBreadcrumbSchema, getServiceSchema, getFAQSchema } from "../components/SEOHead";
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
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/15b59cb95_b92baf13-dff3-4777-8e8a-b25f73b10b8d.jpg"
  },
  "Dallas-TX": {
    state: "Texas", stateCode: "TX", county: "Dallas County", population: "1,300,000+",
    zipCodes: ["75201", "75202", "75204", "75205", "75214", "75219", "75230"],
    avgRate: "9.1¢/kWh", avgMonthlyBill: "$132", providers: 42,
    neighborhoods: ["Downtown Dallas", "Uptown", "Deep Ellum", "Highland Park", "Oak Lawn", "Lake Highlands", "North Dallas"],
    description: "Dallas residents benefit from competitive electricity rates with access to over 42 providers offering a wide range of fixed and variable rate plans.",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/a6af53178_8d19f65b-9e9f-4d66-b5f9-6d0cc6de9965.jpg"
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
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/9afbd2a3e_136ff412-03e2-40c7-8934-8517d2404665.jpg"
  },
  "Fort Worth-TX": {
    state: "Texas", stateCode: "TX", county: "Tarrant County", population: "927,000+",
    zipCodes: ["76102", "76104", "76107", "76109", "76116", "76132", "76244"],
    avgRate: "9.0¢/kWh", avgMonthlyBill: "$130", providers: 41,
    neighborhoods: ["Downtown Fort Worth", "Cultural District", "Sundance Square", "West 7th", "Ridglea", "Tanglewood", "Alliance"],
    description: "Fort Worth residents enjoy access to competitive electricity rates from 41+ providers in the deregulated Texas energy market.",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/10a0998d3_87a80756-c4b5-44c5-bc05-259fef05ca68.jpg"
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
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/a29348055_403443a6-48b5-4052-ac9e-6600f43ab721.jpg"
  },
  "Joliet-IL": {
    state: "Illinois", stateCode: "IL", county: "Will County", population: "150,000+",
    zipCodes: ["60431", "60432", "60433", "60434", "60435", "60436"],
    avgRate: "9.8¢/kWh", avgMonthlyBill: "$141", providers: 33,
    neighborhoods: ["Cathedral Area", "Fairmont", "Pilcher Park", "Rockdale", "West Joliet", "Laraway", "Highland Park"],
    description: "Joliet residents have access to competitive electricity rates from 33+ suppliers in Will County.",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/214455956_58463eb0-e880-4c1a-b78b-be40c42fb456.jpg"
  },

  // OHIO CITIES
  "Columbus-OH": {
    state: "Ohio", stateCode: "OH", county: "Franklin County", population: "905,000+",
    zipCodes: ["43085", "43201", "43202", "43203", "43204", "43205", "43206"],
    avgRate: "9.5¢/kWh", avgMonthlyBill: "$138", providers: 38,
    neighborhoods: ["Downtown Columbus", "German Village", "Short North", "Clintonville", "Victorian Village", "Arena District", "Brewery District"],
    description: "Columbus residents enjoy competitive electricity rates from 38+ suppliers in the AEP Ohio service territory.",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/3a9213c53_03fe81c8-162d-4692-be26-32e20095399c.jpg"
  },
  "Cleveland-OH": {
    state: "Ohio", stateCode: "OH", county: "Cuyahoga County", population: "372,000+",
    zipCodes: ["44101", "44102", "44103", "44104", "44105", "44106", "44107"],
    avgRate: "9.6¢/kWh", avgMonthlyBill: "$139", providers: 37,
    neighborhoods: ["Downtown Cleveland", "Ohio City", "Tremont", "University Circle", "Detroit-Shoreway", "Edgewater", "Collinwood"],
    description: "Cleveland residents have access to competitive electricity rates from 37+ suppliers in the FirstEnergy service territory.",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/a29bc65bc_0566fb7e-4b0b-46d4-bdc4-04a2189962bf.jpg"
  },
  "Cincinnati-OH": {
    state: "Ohio", stateCode: "OH", county: "Hamilton County", population: "309,000+",
    zipCodes: ["45201", "45202", "45203", "45204", "45205", "45206", "45207"],
    avgRate: "9.7¢/kWh", avgMonthlyBill: "$140", providers: 36,
    neighborhoods: ["Downtown Cincinnati", "Over-the-Rhine", "Mount Adams", "Clifton", "Hyde Park", "Oakley", "Columbia-Tusculum"],
    description: "Cincinnati residents benefit from competitive electricity rates with 36+ suppliers in the Duke Energy Ohio territory.",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/25159c55a_e1e2ce07-4723-4b43-b55c-8e6a0251d472.jpg"
  },
  "Toledo-OH": {
    state: "Ohio", stateCode: "OH", county: "Lucas County", population: "270,000+",
    zipCodes: ["43601", "43604", "43606", "43607", "43608", "43609", "43610"],
    avgRate: "9.6¢/kWh", avgMonthlyBill: "$139", providers: 35,
    neighborhoods: ["Downtown Toledo", "Old West End", "Ottawa Hills", "Sylvania", "Point Place", "Westgate", "South End"],
    description: "Toledo residents enjoy competitive electricity rates from 35+ suppliers in the FirstEnergy service territory.",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/1d0dc8814_c3d7d2f5-d102-4ed8-aa7f-f2e9c6e02764.jpg"
  },

  // PENNSYLVANIA CITIES
  "Philadelphia-PA": {
    state: "Pennsylvania", stateCode: "PA", county: "Philadelphia County", population: "1,600,000+",
    zipCodes: ["19102", "19103", "19104", "19106", "19107", "19111", "19114"],
    avgRate: "10.2¢/kWh", avgMonthlyBill: "$147", providers: 32,
    neighborhoods: ["Center City", "Old City", "Society Hill", "Rittenhouse Square", "University City", "Northern Liberties", "Fishtown"],
    description: "Philadelphia residents benefit from competitive electricity rates with 32+ suppliers in the PECO service territory.",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/857445e3d_01dc15fd-0434-4dd9-ac68-9123c6a14f33.jpg"
  },
  "Pittsburgh-PA": {
    state: "Pennsylvania", stateCode: "PA", county: "Allegheny County", population: "303,000+",
    zipCodes: ["15201", "15202", "15203", "15204", "15205", "15206", "15207"],
    avgRate: "10.1¢/kWh", avgMonthlyBill: "$146", providers: 30,
    neighborhoods: ["Downtown Pittsburgh", "Shadyside", "Squirrel Hill", "Oakland", "Lawrenceville", "South Side", "Strip District"],
    description: "Pittsburgh residents enjoy competitive electricity rates from 30+ suppliers in the Duquesne Light service territory.",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/a1fa80de5_162bc2ea-2c58-4a65-bab4-76e96955cc5c1.jpg"
  },
  "Allentown-PA": {
    state: "Pennsylvania", stateCode: "PA", county: "Lehigh County", population: "125,000+",
    zipCodes: ["18101", "18102", "18103", "18104", "18105", "18106", "18109"],
    avgRate: "10.3¢/kWh", avgMonthlyBill: "$148", providers: 28,
    neighborhoods: ["Downtown Allentown", "West Park", "Hanover Acres", "South Side", "East Side", "West End", "Cedar Crest"],
    description: "Allentown residents benefit from competitive electricity rates with 28+ suppliers in the PPL Electric service territory.",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/b41923a04_cfe7691c-4b4d-4429-966f-1475a915d13d.jpg"
  },

  // NEW YORK CITIES
  "New York City-NY": {
    state: "New York", stateCode: "NY", county: "New York County", population: "8,300,000+",
    zipCodes: ["10001", "10002", "10003", "10004", "10005", "10006", "10007"],
    avgRate: "11.5¢/kWh", avgMonthlyBill: "$165", providers: 28,
    neighborhoods: ["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island", "Lower East Side", "Upper West Side"],
    description: "NYC residents have access to competitive electricity rates from 28+ ESCOs in the Con Edison service territory.",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/ee1816945_b030ead7-1805-4ab1-9b11-5ef8764baa82.jpg"
  },
  "Buffalo-NY": {
    state: "New York", stateCode: "NY", county: "Erie County", population: "278,000+",
    zipCodes: ["14201", "14202", "14203", "14204", "14205", "14206", "14207"],
    avgRate: "10.8¢/kWh", avgMonthlyBill: "$155", providers: 25,
    neighborhoods: ["Downtown Buffalo", "Allentown", "Elmwood Village", "North Buffalo", "South Buffalo", "West Side", "Riverside"],
    description: "Buffalo residents enjoy competitive electricity rates from 25+ ESCOs in the National Grid service territory.",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/d747b6596_7c7a75cb-3931-4991-b608-275c44e5dd84.jpg"
  },
  "Rochester-NY": {
    state: "New York", stateCode: "NY", county: "Monroe County", population: "211,000+",
    zipCodes: ["14604", "14605", "14606", "14607", "14608", "14609", "14610"],
    avgRate: "10.9¢/kWh", avgMonthlyBill: "$157", providers: 24,
    neighborhoods: ["Downtown Rochester", "Park Avenue", "East End", "South Wedge", "Corn Hill", "NOTA", "Charlotte"],
    description: "Rochester residents benefit from competitive electricity rates with 24+ ESCOs in the RG&E service territory.",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/9c65443c8_dfd8afa3-67b9-425f-9616-5dd340a3c534.jpg"
  },
  "Syracuse-NY": {
    state: "New York", stateCode: "NY", county: "Onondaga County", population: "148,000+",
    zipCodes: ["13201", "13202", "13203", "13204", "13205", "13206", "13207"],
    avgRate: "11.0¢/kWh", avgMonthlyBill: "$158", providers: 23,
    neighborhoods: ["Downtown Syracuse", "University Hill", "Eastwood", "Westcott", "Tipperary Hill", "Strathmore", "Sedgwick"],
    description: "Syracuse residents enjoy competitive electricity rates from 23+ ESCOs in the National Grid service territory.",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/d40d4c2a0_8af97b79-9633-405b-a443-c8df9b48d0cf.jpg"
  },

  // NEW JERSEY CITIES
  "Newark-NJ": {
    state: "New Jersey", stateCode: "NJ", county: "Essex County", population: "311,000+",
    zipCodes: ["07102", "07103", "07104", "07105", "07106", "07107", "07108"],
    avgRate: "10.5¢/kWh", avgMonthlyBill: "$151", providers: 27,
    neighborhoods: ["Downtown Newark", "Ironbound", "Forest Hill", "North Ward", "Central Ward", "West Ward", "South Ward"],
    description: "Newark residents benefit from competitive electricity rates with 27+ suppliers in the PSE&G service territory.",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/419f775bc_1a6aeb64-6311-486c-baba-c7cff53a3d5c.jpg"
  },
  "Jersey City-NJ": {
    state: "New Jersey", stateCode: "NJ", county: "Hudson County", population: "292,000+",
    zipCodes: ["07302", "07304", "07305", "07306", "07307", "07310"],
    avgRate: "10.6¢/kWh", avgMonthlyBill: "$152", providers: 26,
    neighborhoods: ["Downtown Jersey City", "Journal Square", "The Heights", "Bergen-Lafayette", "Greenville", "McGinley Square", "Paulus Hook"],
    description: "Jersey City residents enjoy competitive electricity rates from 26+ suppliers in the PSE&G service territory.",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/e04a9188b_29c455be-4263-4009-8e75-1475730b0b76.jpg"
  },
  "Paterson-NJ": {
    state: "New Jersey", stateCode: "NJ", county: "Passaic County", population: "159,000+",
    zipCodes: ["07501", "07502", "07503", "07504", "07505", "07510", "07514"],
    avgRate: "10.7¢/kWh", avgMonthlyBill: "$153", providers: 25,
    neighborhoods: ["Downtown Paterson", "Eastside", "Riverside", "Peoples Park", "Hillcrest", "Northside", "Wrigley Park"],
    description: "Paterson residents benefit from competitive electricity rates with 25+ suppliers in the PSE&G service territory.",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/58fce9716_8bb83b32-7b38-4635-9279-d5fe12f4d755.jpg"
  },

  // MARYLAND CITIES
  "Baltimore-MD": {
    state: "Maryland", stateCode: "MD", county: "Baltimore City", population: "576,000+",
    zipCodes: ["21201", "21202", "21205", "21206", "21207", "21208", "21209"],
    avgRate: "10.4¢/kWh", avgMonthlyBill: "$150", providers: 29,
    neighborhoods: ["Downtown Baltimore", "Federal Hill", "Fells Point", "Canton", "Inner Harbor", "Mount Vernon", "Charles Village"],
    description: "Baltimore residents enjoy competitive electricity rates from 29+ suppliers in the BGE service territory.",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/b957702cc_f10f5df1-6404-4618-b8c3-314d3f6a0d29.jpg"
  },
  "Frederick-MD": {
    state: "Maryland", stateCode: "MD", county: "Frederick County", population: "79,000+",
    zipCodes: ["21701", "21702", "21703", "21704", "21705"],
    avgRate: "10.5¢/kWh", avgMonthlyBill: "$151", providers: 27,
    neighborhoods: ["Downtown Frederick", "Ballenger Creek", "Hood College", "North Frederick", "South Frederick", "West Frederick", "East Frederick"],
    description: "Frederick residents benefit from competitive electricity rates with 27+ suppliers in the Potomac Edison service territory.",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/157b9914f_98350fd0-49c8-4087-8479-0d390c853bf3.jpg"
  },
  "Rockville-MD": {
    state: "Maryland", stateCode: "MD", county: "Montgomery County", population: "68,000+",
    zipCodes: ["20850", "20851", "20852", "20853", "20854", "20855"],
    avgRate: "10.3¢/kWh", avgMonthlyBill: "$148", providers: 28,
    neighborhoods: ["Downtown Rockville", "Twinbrook", "West End", "King Farm", "Lincoln Park", "Woodley Gardens", "Fallsgrove"],
    description: "Rockville residents enjoy competitive electricity rates from 28+ suppliers in the Pepco service territory.",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/dcbb7d9d2_46fe92cb-3aa8-4914-8974-bde36dd806af.jpg"
  },

  // MASSACHUSETTS CITIES
  "Boston-MA": {
    state: "Massachusetts", stateCode: "MA", county: "Suffolk County", population: "675,000+",
    zipCodes: ["02101", "02108", "02109", "02110", "02111", "02113", "02114"],
    avgRate: "11.2¢/kWh", avgMonthlyBill: "$161", providers: 22,
    neighborhoods: ["Downtown Boston", "Back Bay", "Beacon Hill", "North End", "South End", "Fenway", "Charlestown"],
    description: "Boston residents benefit from competitive electricity rates with 22+ suppliers across multiple utility territories.",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/44bb8debd_6e33a452-8111-4711-a6e7-b49128f6bc5a.jpg"
  },
  "Worcester-MA": {
    state: "Massachusetts", stateCode: "MA", county: "Worcester County", population: "206,000+",
    zipCodes: ["01601", "01602", "01603", "01604", "01605", "01606", "01607"],
    avgRate: "11.3¢/kWh", avgMonthlyBill: "$162", providers: 21,
    neighborhoods: ["Downtown Worcester", "Main South", "Tatnuck", "West Side", "East Side", "Shrewsbury Street", "Canal District"],
    description: "Worcester residents enjoy competitive electricity rates from 21+ suppliers in the National Grid service territory.",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/e90708aeb_d4fa1135-c2c6-4c43-8184-540993ddd4db.jpg"
  },
  "Springfield-MA": {
    state: "Massachusetts", stateCode: "MA", county: "Hampden County", population: "155,000+",
    zipCodes: ["01101", "01103", "01104", "01105", "01107", "01108", "01109"],
    avgRate: "11.4¢/kWh", avgMonthlyBill: "$163", providers: 20,
    neighborhoods: ["Downtown Springfield", "Forest Park", "Sixteen Acres", "East Springfield", "South End", "Six Corners", "Metro Center"],
    description: "Springfield residents benefit from competitive electricity rates with 20+ suppliers in the Eversource service territory.",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/081e45489_45362c2b-5e37-45ca-a6ab-ac06564ed343.jpg"
  },

  // CONNECTICUT CITIES
  "Hartford-CT": {
    state: "Connecticut", stateCode: "CT", county: "Hartford County", population: "121,000+",
    zipCodes: ["06101", "06103", "06105", "06106", "06107", "06112", "06114"],
    avgRate: "11.8¢/kWh", avgMonthlyBill: "$169", providers: 19,
    neighborhoods: ["Downtown Hartford", "South End", "Asylum Hill", "West End", "North End", "Parkville", "Frog Hollow"],
    description: "Hartford residents enjoy competitive electricity rates from 19+ suppliers in the Eversource service territory.",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/c2fba1722_ottawa-street.jpg"
  },
  "New Haven-CT": {
    state: "Connecticut", stateCode: "CT", county: "New Haven County", population: "135,000+",
    zipCodes: ["06510", "06511", "06513", "06515", "06519", "06520"],
    avgRate: "11.7¢/kWh", avgMonthlyBill: "$168", providers: 19,
    neighborhoods: ["Downtown New Haven", "East Rock", "Wooster Square", "Fair Haven", "Westville", "Dixwell", "West River"],
    description: "New Haven residents benefit from competitive electricity rates with 19+ suppliers in the United Illuminating service territory.",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/7add50838_ab8c9932-5234-436a-b781-91c450b67ab0.jpg"
  },
  "Bridgeport-CT": {
    state: "Connecticut", stateCode: "CT", county: "Fairfield County", population: "148,000+",
    zipCodes: ["06601", "06604", "06605", "06606", "06607", "06608", "06610"],
    avgRate: "11.9¢/kWh", avgMonthlyBill: "$170", providers: 18,
    neighborhoods: ["Downtown Bridgeport", "South End", "East End", "West End", "North End", "Black Rock", "Brooklawn"],
    description: "Bridgeport residents enjoy competitive electricity rates from 18+ suppliers in the United Illuminating service territory.",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/4e2eca8a2_770d9cd5-f0df-4175-80a1-078211ed206a.jpg"
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
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/e1656009b_35c3c8a7-86a1-4171-93f9-2a876c9ff35a.jpg"
  },
  "Bangor-ME": {
    state: "Maine", stateCode: "ME", county: "Penobscot County", population: "32,000+",
    zipCodes: ["04401", "04402"],
    avgRate: "11.7¢/kWh", avgMonthlyBill: "$167", providers: 16,
    neighborhoods: ["Downtown Bangor", "Fairmount", "State Street", "Little City", "Broadway", "West Bangor", "East Side"],
    description: "Bangor residents benefit from competitive electricity rates with 16+ suppliers in the Emera Maine service territory.",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/a83f5b033_f9cc9f9f-03e1-4bc8-bb2c-a8bdf40d7b5d.jpg"
  },

  // NEW HAMPSHIRE CITIES
  "Manchester-NH": {
    state: "New Hampshire", stateCode: "NH", county: "Hillsborough County", population: "115,000+",
    zipCodes: ["03101", "03102", "03103", "03104", "03109"],
    avgRate: "11.6¢/kWh", avgMonthlyBill: "$166", providers: 17,
    neighborhoods: ["Downtown Manchester", "North End", "South End", "West Side", "East Side", "Pinardville", "Piscataquog Village"],
    description: "Manchester residents enjoy competitive electricity rates from 17+ suppliers in the Eversource service territory.",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/9dba14695_b89134a8-4b49-4280-b376-c9c36d77a3a1.jpg"
  },
  "Nashua-NH": {
    state: "New Hampshire", stateCode: "NH", county: "Hillsborough County", population: "91,000+",
    zipCodes: ["03060", "03061", "03062", "03063", "03064"],
    avgRate: "11.7¢/kWh", avgMonthlyBill: "$167", providers: 16,
    neighborhoods: ["Downtown Nashua", "North End", "South End", "West Hollis Street", "Broad Street Parkway", "Daniel Webster", "Crown Hill"],
    description: "Nashua residents benefit from competitive electricity rates with 16+ suppliers in the Eversource service territory.",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/0497c3089_89e68724-f3a0-408a-b82b-21c7f26fe660.jpg"
  },
  "Concord-NH": {
    state: "New Hampshire", stateCode: "NH", county: "Merrimack County", population: "43,000+",
    zipCodes: ["03301", "03302", "03303"],
    avgRate: "11.8¢/kWh", avgMonthlyBill: "$169", providers: 16,
    neighborhoods: ["Downtown Concord", "Penacook", "West Concord", "East Concord", "Heights", "South End", "North End"],
    description: "Concord residents enjoy competitive electricity rates from 16+ suppliers in the Eversource service territory.",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/63646130e_c2b6c002-b461-43af-873e-02caf45e467b.jpg"
  },

  // RHODE ISLAND CITIES
  "Providence-RI": {
    state: "Rhode Island", stateCode: "RI", county: "Providence County", population: "190,000+",
    zipCodes: ["02901", "02903", "02904", "02905", "02906", "02907", "02908"],
    avgRate: "11.9¢/kWh", avgMonthlyBill: "$170", providers: 15,
    neighborhoods: ["Downtown Providence", "Federal Hill", "Fox Point", "East Side", "West End", "Smith Hill", "Mount Pleasant"],
    description: "Providence residents benefit from competitive electricity rates with 15+ suppliers in the National Grid service territory.",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/3a56f40c4_3de2f374-e6c7-4415-a731-3588f4dc57b8.jpg"
  },
  "Warwick-RI": {
    state: "Rhode Island", stateCode: "RI", county: "Kent County", population: "83,000+",
    zipCodes: ["02886", "02888", "02889"],
    avgRate: "12.0¢/kWh", avgMonthlyBill: "$171", providers: 15,
    neighborhoods: ["Warwick Neck", "Oakland Beach", "Apponaug", "Gaspee", "Hillsgrove", "Pawtuxet Village", "Conimicut"],
    description: "Warwick residents enjoy competitive electricity rates from 15+ suppliers in the National Grid service territory.",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/d9b752924_a37c566e-4168-4be1-a823-20bf311f7ed9.jpg"
  },
  "Cranston-RI": {
    state: "Rhode Island", stateCode: "RI", county: "Providence County", population: "82,000+",
    zipCodes: ["02905", "02907", "02910", "02920", "02921"],
    avgRate: "12.0¢/kWh", avgMonthlyBill: "$171", providers: 14,
    neighborhoods: ["Edgewood", "Garden City", "Knightsville", "Meshanticut", "Park View", "Western Hills", "Pawtuxet"],
    description: "Cranston residents benefit from competitive electricity rates with 14+ suppliers in the National Grid service territory.",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/c4af296bf_ccdd3a45-7050-4bd0-89d9-81c846e9fcdc.jpg"
  },

  // Handle variations without state codes for backwards compatibility
  "Houston": {
    state: "Texas", stateCode: "TX", county: "Harris County", population: "2,300,000+",
    zipCodes: ["77002", "77019", "77024", "77027", "77056", "77063", "77098"],
    avgRate: "8.9¢/kWh", avgMonthlyBill: "$128", providers: 45,
    neighborhoods: ["Downtown Houston", "The Heights", "Montrose", "River Oaks", "Midtown", "Galleria", "Memorial"],
    description: "Houston, the largest city in Texas and the energy capital of the world, offers residents access to over 45 electricity providers in the deregulated market.",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/15b59cb95_b92baf13-dff3-4777-8e8a-b25f73b10b8d.jpg"
  },
  "Dallas": {
    state: "Texas", stateCode: "TX", county: "Dallas County", population: "1,300,000+",
    zipCodes: ["75201", "75202", "75204", "75205", "75214", "75219", "75230"],
    avgRate: "9.1¢/kWh", avgMonthlyBill: "$132", providers: 42,
    neighborhoods: ["Downtown Dallas", "Uptown", "Deep Ellum", "Highland Park", "Oak Lawn", "Lake Highlands", "North Dallas"],
    description: "Dallas residents benefit from competitive electricity rates with access to over 42 providers offering a wide range of fixed and variable rate plans.",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/a6af53178_8d19f65b-9e9f-4d66-b5f9-6d0cc6de9965.jpg"
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
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/9afbd2a3e_136ff412-03e2-40c7-8934-8517d2404665.jpg"
  },
  "Fort Worth": {
    state: "Texas", stateCode: "TX", county: "Tarrant County", population: "927,000+",
    zipCodes: ["76102", "76104", "76107", "76109", "76116", "76132", "76244"],
    avgRate: "9.0¢/kWh", avgMonthlyBill: "$130", providers: 41,
    neighborhoods: ["Downtown Fort Worth", "Cultural District", "Sundance Square", "West 7th", "Ridglea", "Tanglewood", "Alliance"],
    description: "Fort Worth residents enjoy access to competitive electricity rates from 41+ providers in the deregulated Texas energy market.",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/10a0998d3_87a80756-c4b5-44c5-bc05-259fef05ca68.jpg"
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
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/a29348055_403443a6-48b5-4052-ac9e-6600f43ab721.jpg"
  },
  "Joliet": {
    state: "Illinois", stateCode: "IL", county: "Will County", population: "150,000+",
    zipCodes: ["60431", "60432", "60433", "60434", "60435", "60436"],
    avgRate: "9.8¢/kWh", avgMonthlyBill: "$141", providers: 33,
    neighborhoods: ["Cathedral Area", "Fairmont", "Pilcher Park", "Rockdale", "West Joliet", "Laraway", "Highland Park"],
    description: "Joliet residents have access to competitive electricity rates from 33+ suppliers in Will County.",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/214455956_58463eb0-e880-4c1a-b78b-be40c42fb456.jpg"
  },
  "Columbus": {
    state: "Ohio", stateCode: "OH", county: "Franklin County", population: "905,000+",
    zipCodes: ["43085", "43201", "43202", "43203", "43204", "43205", "43206"],
    avgRate: "9.5¢/kWh", avgMonthlyBill: "$138", providers: 38,
    neighborhoods: ["Downtown Columbus", "German Village", "Short North", "Clintonville", "Victorian Village", "Arena District", "Brewery District"],
    description: "Columbus residents enjoy competitive electricity rates from 38+ suppliers in the AEP Ohio service territory.",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/3a9213c53_03fe81c8-162d-4692-be26-32e20095399c.jpg"
  },
  "Cleveland": {
    state: "Ohio", stateCode: "OH", county: "Cuyahoga County", population: "372,000+",
    zipCodes: ["44101", "44102", "44103", "44104", "44105", "44106", "44107"],
    avgRate: "9.6¢/kWh", avgMonthlyBill: "$139", providers: 37,
    neighborhoods: ["Downtown Cleveland", "Ohio City", "Tremont", "University Circle", "Detroit-Shoreway", "Edgewater", "Collinwood"],
    description: "Cleveland residents have access to competitive electricity rates from 37+ suppliers in the FirstEnergy service territory.",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/a29bc65bc_0566fb7e-4b0b-46d4-bdc4-04a2189962bf.jpg"
  },
  "Cincinnati": {
    state: "Ohio", stateCode: "OH", county: "Hamilton County", population: "309,000+",
    zipCodes: ["45201", "45202", "45203", "45204", "45205", "45206", "45207"],
    avgRate: "9.7¢/kWh", avgMonthlyBill: "$140", providers: 36,
    neighborhoods: ["Downtown Cincinnati", "Over-the-Rhine", "Mount Adams", "Clifton", "Hyde Park", "Oakley", "Columbia-Tusculum"],
    description: "Cincinnati residents benefit from competitive electricity rates with 36+ suppliers in the Duke Energy Ohio territory.",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/25159c55a_e1e2ce07-4723-4b43-b55c-8e6a0251d472.jpg"
  },
  "Toledo": {
    state: "Ohio", stateCode: "OH", county: "Lucas County", population: "270,000+",
    zipCodes: ["43601", "43604", "43606", "43607", "43608", "43609", "43610"],
    avgRate: "9.6¢/kWh", avgMonthlyBill: "$139", providers: 35,
    neighborhoods: ["Downtown Toledo", "Old West End", "Ottawa Hills", "Sylvania", "Point Place", "Westgate", "South End"],
    description: "Toledo residents enjoy competitive electricity rates from 35+ suppliers in the FirstEnergy service territory.",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/1d0dc8814_c3d7d2f5-d102-4ed8-aa7f-f2e9c6e02764.jpg"
  },
  "Philadelphia": {
    state: "Pennsylvania", stateCode: "PA", county: "Philadelphia County", population: "1,600,000+",
    zipCodes: ["19102", "19103", "19104", "19106", "19107", "19111", "19114"],
    avgRate: "10.2¢/kWh", avgMonthlyBill: "$147", providers: 32,
    neighborhoods: ["Center City", "Old City", "Society Hill", "Rittenhouse Square", "University City", "Northern Liberties", "Fishtown"],
    description: "Philadelphia residents benefit from competitive electricity rates with 32+ suppliers in the PECO service territory.",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/857445e3d_01dc15fd-0434-4dd9-ac68-9123c6a14f33.jpg"
  },
  "Pittsburgh": {
    state: "Pennsylvania", stateCode: "PA", county: "Allegheny County", population: "303,000+",
    zipCodes: ["15201", "15202", "15203", "15204", "15205", "15206", "15207"],
    avgRate: "10.1¢/kWh", avgMonthlyBill: "$146", providers: 30,
    neighborhoods: ["Downtown Pittsburgh", "Shadyside", "Squirrel Hill", "Oakland", "Lawrenceville", "South Side", "Strip District"],
    description: "Pittsburgh residents enjoy competitive electricity rates from 30+ suppliers in the Duquesne Light service territory.",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/a1fa80de5_162bc2ea-2c58-4a65-bab4-76e96955cc5c1.jpg"
  },
  "Allentown": {
    state: "Pennsylvania", stateCode: "PA", county: "Lehigh County", population: "125,000+",
    zipCodes: ["18101", "18102", "18103", "18104", "18105", "18106", "18109"],
    avgRate: "10.3¢/kWh", avgMonthlyBill: "$148", providers: 28,
    neighborhoods: ["Downtown Allentown", "West Park", "Hanover Acres", "South Side", "East Side", "West End", "Cedar Crest"],
    description: "Allentown residents benefit from competitive electricity rates with 28+ suppliers in the PPL Electric service territory.",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/b41923a04_cfe7691c-4b4d-4429-966f-1475a915d13d.jpg"
  },
  "New York City": {
    state: "New York", stateCode: "NY", county: "New York County", population: "8,300,000+",
    zipCodes: ["10001", "10002", "10003", "10004", "10005", "10006", "10007"],
    avgRate: "11.5¢/kWh", avgMonthlyBill: "$165", providers: 28,
    neighborhoods: ["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island", "Lower East Side", "Upper West Side"],
    description: "NYC residents have access to competitive electricity rates from 28+ ESCOs in the Con Edison service territory.",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/ee1816945_b030ead7-1805-4ab1-9b11-5ef8764baa82.jpg"
  },
  "Buffalo": {
    state: "New York", stateCode: "NY", county: "Erie County", population: "278,000+",
    zipCodes: ["14201", "14202", "14203", "14204", "14205", "14206", "14207"],
    avgRate: "10.8¢/kWh", avgMonthlyBill: "$155", providers: 25,
    neighborhoods: ["Downtown Buffalo", "Allentown", "Elmwood Village", "North Buffalo", "South Buffalo", "West Side", "Riverside"],
    description: "Buffalo residents enjoy competitive electricity rates from 25+ ESCOs in the National Grid service territory.",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/d747b6596_7c7a75cb-3931-4991-b608-275c44e5dd84.jpg"
  },
  "Rochester": {
    state: "New York", stateCode: "NY", county: "Monroe County", population: "211,000+",
    zipCodes: ["14604", "14605", "14606", "14607", "14608", "14609", "14610"],
    avgRate: "10.9¢/kWh", avgMonthlyBill: "$157", providers: 24,
    neighborhoods: ["Downtown Rochester", "Park Avenue", "East End", "South Wedge", "Corn Hill", "NOTA", "Charlotte"],
    description: "Rochester residents benefit from competitive electricity rates with 24+ ESCOs in the RG&E service territory.",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/9c65443c8_dfd8afa3-67b9-425f-9616-5dd340a3c534.jpg"
  },
  "Syracuse": {
    state: "New York", stateCode: "NY", county: "Onondaga County", population: "148,000+",
    zipCodes: ["13201", "13202", "13203", "13204", "13205", "13206", "13207"],
    avgRate: "11.0¢/kWh", avgMonthlyBill: "$158", providers: 23,
    neighborhoods: ["Downtown Syracuse", "University Hill", "Eastwood", "Westcott", "Tipperary Hill", "Strathmore", "Sedgwick"],
    description: "Syracuse residents enjoy competitive electricity rates from 23+ ESCOs in the National Grid service territory.",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/d40d4c2a0_8af97b79-9633-405b-a443-c8df9b48d0cf.jpg"
  },
  "Newark": {
    state: "New Jersey", stateCode: "NJ", county: "Essex County", population: "311,000+",
    zipCodes: ["07102", "07103", "07104", "07105", "07106", "07107", "07108"],
    avgRate: "10.5¢/kWh", avgMonthlyBill: "$151", providers: 27,
    neighborhoods: ["Downtown Newark", "Ironbound", "Forest Hill", "North Ward", "Central Ward", "West Ward", "South Ward"],
    description: "Newark residents benefit from competitive electricity rates with 27+ suppliers in the PSE&G service territory.",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/419f775bc_1a6aeb64-6311-486c-baba-c7cff53a3d5c.jpg"
  },
  "Jersey City": {
    state: "New Jersey", stateCode: "NJ", county: "Hudson County", population: "292,000+",
    zipCodes: ["07302", "07304", "07305", "07306", "07307", "07310"],
    avgRate: "10.6¢/kWh", avgMonthlyBill: "$152", providers: 26,
    neighborhoods: ["Downtown Jersey City", "Journal Square", "The Heights", "Bergen-Lafayette", "Greenville", "McGinley Square", "Paulus Hook"],
    description: "Jersey City residents enjoy competitive electricity rates from 26+ suppliers in the PSE&G service territory.",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/e04a9188b_29c455be-4263-4009-8e75-1475730b0b76.jpg"
  },
  "Paterson": {
    state: "New Jersey", stateCode: "NJ", county: "Passaic County", population: "159,000+",
    zipCodes: ["07501", "07502", "07503", "07504", "07505", "07510", "07514"],
    avgRate: "10.7¢/kWh", avgMonthlyBill: "$153", providers: 25,
    neighborhoods: ["Downtown Paterson", "Eastside", "Riverside", "Peoples Park", "Hillcrest", "Northside", "Wrigley Park"],
    description: "Paterson residents benefit from competitive electricity rates with 25+ suppliers in the PSE&G service territory.",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/58fce9716_8bb83b32-7b38-4635-9279-d5fe12f4d755.jpg"
  },
  "Baltimore": {
    state: "Maryland", stateCode: "MD", county: "Baltimore City", population: "576,000+",
    zipCodes: ["21201", "21202", "21205", "21206", "21207", "21208", "21209"],
    avgRate: "10.4¢/kWh", avgMonthlyBill: "$150", providers: 29,
    neighborhoods: ["Downtown Baltimore", "Federal Hill", "Fells Point", "Canton", "Inner Harbor", "Mount Vernon", "Charles Village"],
    description: "Baltimore residents enjoy competitive electricity rates from 29+ suppliers in the BGE service territory.",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/b957702cc_f10f5df1-6404-4618-b8c3-314d3f6a0d29.jpg"
  },
  "Frederick": {
    state: "Maryland", stateCode: "MD", county: "Frederick County", population: "79,000+",
    zipCodes: ["21701", "21702", "21703", "21704", "21705"],
    avgRate: "10.5¢/kWh", avgMonthlyBill: "$151", providers: 27,
    neighborhoods: ["Downtown Frederick", "Ballenger Creek", "Hood College", "North Frederick", "South Frederick", "West Frederick", "East Frederick"],
    description: "Frederick residents benefit from competitive electricity rates with 27+ suppliers in the Potomac Edison service territory.",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/157b9914f_98350fd0-49c8-4087-8479-0d390c853bf3.jpg"
  },
  "Rockville": {
    state: "Maryland", stateCode: "MD", county: "Montgomery County", population: "68,000+",
    zipCodes: ["20850", "20851", "20852", "20853", "20854", "20855"],
    avgRate: "10.3¢/kWh", avgMonthlyBill: "$148", providers: 28,
    neighborhoods: ["Downtown Rockville", "Twinbrook", "West End", "King Farm", "Lincoln Park", "Woodley Gardens", "Fallsgrove"],
    description: "Rockville residents enjoy competitive electricity rates from 28+ suppliers in the Pepco service territory.",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/dcbb7d9d2_46fe92cb-3aa8-4914-8974-bde36dd806af.jpg"
  },
  "Boston": {
    state: "Massachusetts", stateCode: "MA", county: "Suffolk County", population: "675,000+",
    zipCodes: ["02101", "02108", "02109", "02110", "02111", "02113", "02114"],
    avgRate: "11.2¢/kWh", avgMonthlyBill: "$161", providers: 22,
    neighborhoods: ["Downtown Boston", "Back Bay", "Beacon Hill", "North End", "South End", "Fenway", "Charlestown"],
    description: "Boston residents benefit from competitive electricity rates with 22+ suppliers across multiple utility territories.",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/44bb8debd_6e33a452-8111-4711-a6e7-b49128f6bc5a.jpg"
  },
  "Worcester": {
    state: "Massachusetts", stateCode: "MA", county: "Worcester County", population: "206,000+",
    zipCodes: ["01601", "01602", "01603", "01604", "01605", "01606", "01607"],
    avgRate: "11.3¢/kWh", avgMonthlyBill: "$162", providers: 21,
    neighborhoods: ["Downtown Worcester", "Main South", "Tatnuck", "West Side", "East Side", "Shrewsbury Street", "Canal District"],
    description: "Worcester residents enjoy competitive electricity rates from 21+ suppliers in the National Grid service territory.",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/e90708aeb_d4fa1135-c2c6-4c43-8184-540993ddd4db.jpg"
  },
  "Springfield": {
    state: "Massachusetts", stateCode: "MA", county: "Hampden County", population: "155,000+",
    zipCodes: ["01101", "01103", "01104", "01105", "01107", "01108", "01109"],
    avgRate: "11.4¢/kWh", avgMonthlyBill: "$163", providers: 20,
    neighborhoods: ["Downtown Springfield", "Forest Park", "Sixteen Acres", "East Springfield", "South End", "Six Corners", "Metro Center"],
    description: "Springfield residents benefit from competitive electricity rates with 20+ suppliers in the Eversource service territory.",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/081e45489_45362c2b-5e37-45ca-a6ab-ac06564ed343.jpg"
  },
  "Hartford": {
    state: "Connecticut", stateCode: "CT", county: "Hartford County", population: "121,000+",
    zipCodes: ["06101", "06103", "06105", "06106", "06107", "06112", "06114"],
    avgRate: "11.8¢/kWh", avgMonthlyBill: "$169", providers: 19,
    neighborhoods: ["Downtown Hartford", "South End", "Asylum Hill", "West End", "North End", "Parkville", "Frog Hollow"],
    description: "Hartford residents enjoy competitive electricity rates from 19+ suppliers in the Eversource service territory.",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/c2fba1722_ottawa-street.jpg"
  },
  "New Haven": {
    state: "Connecticut", stateCode: "CT", county: "New Haven County", population: "135,000+",
    zipCodes: ["06510", "06511", "06513", "06515", "06519", "06520"],
    avgRate: "11.7¢/kWh", avgMonthlyBill: "$168", providers: 19,
    neighborhoods: ["Downtown New Haven", "East Rock", "Wooster Square", "Fair Haven", "Westville", "Dixwell", "West River"],
    description: "New Haven residents benefit from competitive electricity rates with 19+ suppliers in the United Illuminating service territory.",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/7add50838_ab8c9932-5234-436a-b781-91c450b67ab0.jpg"
  },
  "Bridgeport": {
    state: "Connecticut", stateCode: "CT", county: "Fairfield County", population: "148,000+",
    zipCodes: ["06601", "06604", "06605", "06606", "06607", "06608", "06610"],
    avgRate: "11.9¢/kWh", avgMonthlyBill: "$170", providers: 18,
    neighborhoods: ["Downtown Bridgeport", "South End", "East End", "West End", "North End", "Black Rock", "Brooklawn"],
    description: "Bridgeport residents enjoy competitive electricity rates from 18+ suppliers in the United Illuminating service territory.",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/4e2eca8a2_770d9cd5-f0df-4175-80a1-078211ed206a.jpg"
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
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/e1656009b_35c3c8a7-86a1-4171-93f9-2a876c9ff35a.jpg"
  },
  "Bangor": {
    state: "Maine", stateCode: "ME", county: "Penobscot County", population: "32,000+",
    zipCodes: ["04401", "04402"],
    avgRate: "11.7¢/kWh", avgMonthlyBill: "$167", providers: 16,
    neighborhoods: ["Downtown Bangor", "Fairmount", "State Street", "Little City", "Broadway", "West Bangor", "East Side"],
    description: "Bangor residents benefit from competitive electricity rates with 16+ suppliers in the Emera Maine service territory.",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/a83f5b033_f9cc9f9f-03e1-4bc8-bb2c-a8bdf40d7b5d.jpg"
  },
  "Manchester": {
    state: "New Hampshire", stateCode: "NH", county: "Hillsborough County", population: "115,000+",
    zipCodes: ["03101", "03102", "03103", "03104", "03109"],
    avgRate: "11.6¢/kWh", avgMonthlyBill: "$166", providers: 17,
    neighborhoods: ["Downtown Manchester", "North End", "South End", "West Side", "East Side", "Pinardville", "Piscataquog Village"],
    description: "Manchester residents enjoy competitive electricity rates from 17+ suppliers in the Eversource service territory.",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/9dba14695_b89134a8-4b49-4280-b376-c9c36d77a3a1.jpg"
  },
  "Nashua": {
    state: "New Hampshire", stateCode: "NH", county: "Hillsborough County", population: "91,000+",
    zipCodes: ["03060", "03061", "03062", "03063", "03064"],
    avgRate: "11.7¢/kWh", avgMonthlyBill: "$167", providers: 16,
    neighborhoods: ["Downtown Nashua", "North End", "South End", "West Hollis Street", "Broad Street Parkway", "Daniel Webster", "Crown Hill"],
    description: "Nashua residents benefit from competitive electricity rates with 16+ suppliers in the Eversource service territory.",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/0497c3089_89e68724-f3a0-408a-b82b-21c7f26fe660.jpg"
  },
  "Concord": {
    state: "New Hampshire", stateCode: "NH", county: "Merrimack County", population: "43,000+",
    zipCodes: ["03301", "03302", "03303"],
    avgRate: "11.8¢/kWh", avgMonthlyBill: "$169", providers: 16,
    neighborhoods: ["Downtown Concord", "Penacook", "West Concord", "East Concord", "Heights", "South End", "North End"],
    description: "Concord residents enjoy competitive electricity rates from 16+ suppliers in the Eversource service territory.",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/63646130e_c2b6c002-b461-43af-873e-02caf45e467b.jpg"
  },
  "Providence": {
    state: "Rhode Island", stateCode: "RI", county: "Providence County", population: "190,000+",
    zipCodes: ["02901", "02903", "02904", "02905", "02906", "02907", "02908"],
    avgRate: "11.9¢/kWh", avgMonthlyBill: "$170", providers: 15,
    neighborhoods: ["Downtown Providence", "Federal Hill", "Fox Point", "East Side", "West End", "Smith Hill", "Mount Pleasant"],
    description: "Providence residents benefit from competitive electricity rates with 15+ suppliers in the National Grid service territory.",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/3a56f40c4_3de2f374-e6c7-4415-a731-3588f4dc57b8.jpg"
  },
  "Warwick": {
    state: "Rhode Island", stateCode: "RI", county: "Kent County", population: "83,000+",
    zipCodes: ["02886", "02888", "02889"],
    avgRate: "12.0¢/kWh", avgMonthlyBill: "$171", providers: 15,
    neighborhoods: ["Warwick Neck", "Oakland Beach", "Apponaug", "Gaspee", "Hillsgrove", "Pawtuxet Village", "Conimicut"],
    description: "Warwick residents enjoy competitive electricity rates from 15+ suppliers in the National Grid service territory.",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/d9b752924_a37c566e-4168-4be1-a823-20bf311f7ed9.jpg"
  },
  "Cranston": {
    state: "Rhode Island", stateCode: "RI", county: "Providence County", population: "82,000+",
    zipCodes: ["02905", "02907", "02910", "02920", "02921"],
    avgRate: "12.0¢/kWh", avgMonthlyBill: "$171", providers: 14,
    neighborhoods: ["Edgewood", "Garden City", "Knightsville", "Meshanticut", "Park View", "Western Hills", "Pawtuxet"],
    description: "Cranston residents benefit from competitive electricity rates with 14+ suppliers in the National Grid service territory.",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/c4af296bf_ccdd3a45-7050-4bd0-89d9-81c846e9fcdc.jpg"
  }
};

export default function CityRates() {
  const [zipCode, setZipCode] = useState("");
  const [usage, setUsage] = useState(1000);
  const [cityName, setCityName] = useState("");
  const [openFaq, setOpenFaq] = useState(null);
  const [isZipValid, setIsZipValid] = useState(false);

  // Get city and state from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const cityParam = urlParams.get('city') || 'Houston';
    const stateParam = urlParams.get('state') || 'TX';
    const cityKey = `${cityParam}-${stateParam}`;
    setCityName(cityKey);
  }, []);

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
  const seoTitle = `${displayCityName}, ${city.stateCode} Electricity Rates 2025 - Compare ${city.providers}+ Providers | Power Scouts`;
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
      answer: `The average electricity rate in ${displayCityName} is approximately ${city.avgRate}, though rates vary by provider, plan type, and usage level. With Power Scouts, you can compare rates from all ${city.providers}+ providers serving ${city.county} to find the best deal for your home.`
    },
    {
      question: `How do I switch electricity providers in ${displayCityName}?`,
      answer: `Switching electricity providers in ${displayCityName} is easy. Simply compare plans on Power Scouts, select your preferred plan, and sign up online or by phone. Your new provider will handle the switch with your current provider, and your power will never be interrupted during the transition.`
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
    queryFn: () => base44.entities.ElectricityPlan.list(),
    initialData: [],
  });

  // Get available providers for first ZIP in city
  const cityZipCode = city.zipCodes[0];
  const availableProviders = getProvidersForZipCode(cityZipCode);
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
          <img src={city.image} alt={`${displayCityName} skyline`} className="w-full h-full object-cover" />
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
              with Power Scouts' free comparison tool.
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
              Power Scouts helps residents across all {displayCityName} neighborhoods find the best electricity rates:
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {city.neighborhoods.map((neighborhood, index) => (
                <div key={index} className="flex items-center gap-2 text-gray-700">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="font-medium">{neighborhood}</span>
                </div>
              ))}
            </div>
            <p className="text-gray-600 mt-6 text-sm">
              Common ZIP codes: {city.zipCodes.join(", ")}, and more
            </p>
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
              you can shop around and find the electricity plan that best fits your needs and budget. Power Scouts 
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
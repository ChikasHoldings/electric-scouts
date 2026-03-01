/**
 * pages.config.js
 * 
 * Lazy-loaded page registry for optimal code splitting and fast initial load.
 * Only the Home page is eagerly loaded; all other pages are lazy-loaded.
 */

import { lazy } from 'react';
import Home from './pages/Home';
import __Layout from './Layout.jsx';

// Lazy-loaded pages — each gets its own chunk for faster initial load
const AboutUs = lazy(() => import('./pages/AboutUs'));
const AllCities = lazy(() => import('./pages/AllCities'));
const AllProviders = lazy(() => import('./pages/AllProviders'));
const AllStates = lazy(() => import('./pages/AllStates'));
const ArticleDetail = lazy(() => import('./pages/ArticleDetail'));
const BillAnalyzer = lazy(() => import('./pages/BillAnalyzer'));
const BusinessCompareRates = lazy(() => import('./pages/BusinessCompareRates'));
const BusinessElectricity = lazy(() => import('./pages/BusinessElectricity'));
const BusinessHub = lazy(() => import('./pages/BusinessHub'));
const BusinessQuoteDashboard = lazy(() => import('./pages/BusinessQuoteDashboard'));
const CityRates = lazy(() => import('./pages/CityRates'));
const CompareRates = lazy(() => import('./pages/CompareRates'));
const ConnecticutElectricity = lazy(() => import('./pages/ConnecticutElectricity'));
const FAQ = lazy(() => import('./pages/FAQ'));
const HomeConcierge = lazy(() => import('./pages/HomeConcierge'));
const IllinoisElectricity = lazy(() => import('./pages/IllinoisElectricity'));
const Landing = lazy(() => import('./pages/Landing'));
const LearningCenter = lazy(() => import('./pages/LearningCenter'));
const MaineElectricity = lazy(() => import('./pages/MaineElectricity'));
const MarylandElectricity = lazy(() => import('./pages/MarylandElectricity'));
const MassachusettsElectricity = lazy(() => import('./pages/MassachusettsElectricity'));
const NewHampshireElectricity = lazy(() => import('./pages/NewHampshireElectricity'));
const NewJerseyElectricity = lazy(() => import('./pages/NewJerseyElectricity'));
const NewYorkElectricity = lazy(() => import('./pages/NewYorkElectricity'));
const NotFound = lazy(() => import('./pages/NotFound'));
const OhioElectricity = lazy(() => import('./pages/OhioElectricity'));
const PennsylvaniaElectricity = lazy(() => import('./pages/PennsylvaniaElectricity'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const ProviderDetails = lazy(() => import('./pages/ProviderDetails'));
const RenewableCompareRates = lazy(() => import('./pages/RenewableCompareRates'));
const RenewableEnergy = lazy(() => import('./pages/RenewableEnergy'));
const RhodeIslandElectricity = lazy(() => import('./pages/RhodeIslandElectricity'));
const Robots = lazy(() => import('./pages/Robots'));
const SavingsCalculator = lazy(() => import('./pages/SavingsCalculator'));
const Sitemap = lazy(() => import('./pages/Sitemap'));
const SitemapXML = lazy(() => import('./pages/SitemapXML'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const TexasElectricity = lazy(() => import('./pages/TexasElectricity'));

export const PAGES = {
    "AboutUs": AboutUs,
    "AllCities": AllCities,
    "AllProviders": AllProviders,
    "AllStates": AllStates,
    "ArticleDetail": ArticleDetail,
    "BillAnalyzer": BillAnalyzer,
    "BusinessCompareRates": BusinessCompareRates,
    "BusinessElectricity": BusinessElectricity,
    "BusinessHub": BusinessHub,
    "BusinessQuoteDashboard": BusinessQuoteDashboard,
    "CityRates": CityRates,
    "CompareRates": CompareRates,
    "ConnecticutElectricity": ConnecticutElectricity,
    "FAQ": FAQ,
    "Home": Home,
    "HomeConcierge": HomeConcierge,
    "IllinoisElectricity": IllinoisElectricity,
    "Landing": Landing,
    "LearningCenter": LearningCenter,
    "MaineElectricity": MaineElectricity,
    "MarylandElectricity": MarylandElectricity,
    "MassachusettsElectricity": MassachusettsElectricity,
    "NewHampshireElectricity": NewHampshireElectricity,
    "NewJerseyElectricity": NewJerseyElectricity,
    "NewYorkElectricity": NewYorkElectricity,
    "NotFound": NotFound,
    "OhioElectricity": OhioElectricity,
    "PennsylvaniaElectricity": PennsylvaniaElectricity,
    "PrivacyPolicy": PrivacyPolicy,
    "ProviderDetails": ProviderDetails,
    "RenewableCompareRates": RenewableCompareRates,
    "RenewableEnergy": RenewableEnergy,
    "RhodeIslandElectricity": RhodeIslandElectricity,
    "Robots": Robots,
    "SavingsCalculator": SavingsCalculator,
    "Sitemap": Sitemap,
    "SitemapXML": SitemapXML,
    "TermsOfService": TermsOfService,
    "TexasElectricity": TexasElectricity,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};

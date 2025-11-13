import Home from './pages/Home';
import CompareRates from './pages/CompareRates';
import AboutUs from './pages/AboutUs';
import FAQ from './pages/FAQ';
import BusinessRates from './pages/BusinessRates';
import HomeConcierge from './pages/HomeConcierge';
import AllProviders from './pages/AllProviders';
import Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "CompareRates": CompareRates,
    "AboutUs": AboutUs,
    "FAQ": FAQ,
    "BusinessRates": BusinessRates,
    "HomeConcierge": HomeConcierge,
    "AllProviders": AllProviders,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: Layout,
};
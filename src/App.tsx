import { Routes, Route } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import { initializeServerHealthMonitoring } from './utils/serverHealth';

import { LoadingSpinner } from './components/ui/LoadingSpinner';

// Layouts - keep these non-lazy for better UX
import { AdminLayout } from './components/admin/layout/AdminLayout';
import { Layout as FrontendLayout } from './components/layout/frontend/Layout';

// Components that are used on the homepage - keep these non-lazy for better UX
import { AuroraBackgroundDemo } from './components/ui/AuroraBackgroundDemo';
import { CTA } from './components/ui/call-to-action';
import { HomePage } from './components/HomePage';

// Lazily loaded admin pages
const DashboardPage = lazy(() => import('./pages/admin/DashboardPage').then(module => ({ default: module.DashboardPage })));
const ManageUsersPage = lazy(() => import('./pages/admin/ManageUsersPage').then(module => ({ default: module.ManageUsersPage })));
const ManageListingsPage = lazy(() => import('./pages/admin/ManageListingsPage').then(module => ({ default: module.ManageListingsPage })));
// const EditListingPage = lazy(() => import('./pages/admin/EditListingPage').then(module => ({ default: module.EditListingPage })));
// const EditListingPageSimplified = lazy(() => import('./pages/admin/EditListingPageSimplified').then(module => ({ default: module.EditListingPageSimplified })));
const EditListingPageFixed = lazy(() => import('./pages/admin/EditListingPageFixed').then(module => ({ default: module.EditListingPageFixed })));
const TestQueryPage = lazy(() => import('./pages/admin/TestQueryPage').then(module => ({ default: module.TestQueryPage })));
const ManageSectionsPage = lazy(() => import('./pages/admin/ManageSectionsPage').then(module => ({ default: module.ManageSectionsPage })));
const ManageMenusPage = lazy(() => import('./pages/admin/ManageMenusPage').then(module => ({ default: module.ManageMenusPage })));
const ManageBlogPostsPage = lazy(() => import('./pages/admin/ManageBlogPostsPage').then(module => ({ default: module.ManageBlogPostsPage })));
const ManageContentPagesPage = lazy(() => import('./pages/admin/ManageContentPagesPage').then(module => ({ default: module.ManageContentPagesPage })));
const ManageCategoriesPage = lazy(() => import('./pages/admin/ManageCategoriesPage').then(module => ({ default: module.ManageCategoriesPage })));
const ListingCategoriesPage = lazy(() => import('./pages/admin/ListingCategoriesPage').then(module => ({ default: module.ListingCategoriesPage })));
const ManageApiKeysPage = lazy(() => import('./pages/admin/ManageApiKeysPage').then(module => ({ default: module.ManageApiKeysPage })));
const ImportListingsPage = lazy(() => import('./pages/admin/ImportListingsPage').then(module => ({ default: module.ImportListingsPage })));
const ApiImporterPage = lazy(() => import('./pages/admin/ApiImporterPage').then(module => ({ default: module.ApiImporterPage })));
const AIPromptsPage = lazy(() => import('./pages/admin/AIPromptsPage').then(module => ({ default: module.AIPromptsPage })));
const EnhanceFAQPage = lazy(() => import('./pages/admin/EnhanceFAQPage').then(module => ({ default: module.EnhanceFAQPage })));
const FeaturedListingsPage = lazy(() => import('./pages/admin/FeaturedListingsPageFixed2').then(module => ({ default: module.FeaturedListingsPageFixed2 })));
const HomepageCustomizePage = lazy(() => import('./pages/admin/HomepageCustomizePage'));
const SettingsPage = lazy(() => import('./pages/admin/SettingsPage').then(module => ({ default: module.SettingsPage })));
const ApiSettingsPage = lazy(() => import('./pages/admin/settings/ApiSettingsPage'));

// Lazily loaded frontend pages
const ListingsPage = lazy(() => import('./pages/frontend/ListingsPage').then(module => ({ default: module.ListingsPage })));
const ListingDetailPage = lazy(() => import('./pages/frontend/ListingDetailPage').then(module => ({ default: module.ListingDetailPage })));
const CategoryPage = lazy(() => import('./pages/frontend/CategoryPage').then(module => ({ default: module.CategoryPage })));
const BusinessTypePage = lazy(() => import('./pages/frontend/BusinessTypePage').then(module => ({ default: module.BusinessTypePage })));
const FrontendFeaturedListingsPage = lazy(() => import('./pages/frontend/FeaturedListingsPage').then(module => ({ default: module.FeaturedListingsPage })));
const FaqPage = lazy(() => import('./pages/FaqPage').then(module => ({ default: module.FaqPage })));
const Blog7 = lazy(() => import('./components/ui/blog7').then(module => ({ default: module.Blog7 })));
const AboutUsPage = lazy(() => import('./pages/AboutUsPage').then(module => ({ default: module.AboutUsPage })));
const ContactPage = lazy(() => import('./pages/ContactPage'));

import './index.css';

function App() {
  // Initialize server health monitoring on app startup
  useEffect(() => {
    initializeServerHealthMonitoring();
  }, []);

  // Define a fallback loading component for Suspense
  const fallback = <LoadingSpinner message="Loading page..." />;

  return (
    <Routes>
      {/* Admin Routes - all under /admin */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={
          <Suspense fallback={fallback}>
            <DashboardPage />
          </Suspense>
        } />
        <Route path="manage-users" element={
          <Suspense fallback={fallback}>
            <ManageUsersPage />
          </Suspense>
        } />
        <Route path="manage-listings" element={
          <Suspense fallback={fallback}>
            <ManageListingsPage />
          </Suspense>
        } />
        <Route path="listings/edit/:id" element={
          <Suspense fallback={fallback}>
            <EditListingPageFixed />
          </Suspense>
        } />
        <Route path="listings/edit-simple/:id" element={
          <Suspense fallback={fallback}>
            <EditListingPageFixed />
          </Suspense>
        } />
        <Route path="test-query" element={
          <Suspense fallback={fallback}>
            <TestQueryPage />
          </Suspense>
        } />
        <Route path="manage-sections" element={
          <Suspense fallback={fallback}>
            <ManageSectionsPage />
          </Suspense>
        } />
        <Route path="manage-menus" element={
          <Suspense fallback={fallback}>
            <ManageMenusPage />
          </Suspense>
        } />
        <Route path="manage-blog-posts" element={
          <Suspense fallback={fallback}>
            <ManageBlogPostsPage />
          </Suspense>
        } />
        <Route path="manage-content-pages" element={
          <Suspense fallback={fallback}>
            <ManageContentPagesPage />
          </Suspense>
        } />
        <Route path="manage-categories" element={
          <Suspense fallback={fallback}>
            <ManageCategoriesPage />
          </Suspense>
        } />
        <Route path="listing-categories" element={
          <Suspense fallback={fallback}>
            <ListingCategoriesPage />
          </Suspense>
        } />
        <Route path="manage-api-keys" element={
          <Suspense fallback={fallback}>
            <ManageApiKeysPage />
          </Suspense>
        } />
        <Route path="import-listings" element={
          <Suspense fallback={fallback}>
            <ImportListingsPage />
          </Suspense>
        } />
        <Route path="api-importer" element={
          <Suspense fallback={fallback}>
            <ApiImporterPage />
          </Suspense>
        } />
        <Route path="ai-prompts" element={
          <Suspense fallback={fallback}>
            <AIPromptsPage />
          </Suspense>
        } />
        <Route path="enhance-faq" element={
          <Suspense fallback={fallback}>
            <EnhanceFAQPage />
          </Suspense>
        } />
        <Route path="featured" element={
          <Suspense fallback={fallback}>
            <FeaturedListingsPage />
          </Suspense>
        } />
        <Route path="customise/home" element={
          <Suspense fallback={fallback}>
            <HomepageCustomizePage />
          </Suspense>
        } />
        <Route path="settings" element={
          <Suspense fallback={fallback}>
            <SettingsPage />
          </Suspense>
        } />
        <Route path="settings/manage-apis" element={
          <Suspense fallback={fallback}>
            <ApiSettingsPage />
          </Suspense>
        } />
      </Route>

      {/* Frontend Routes - starting from root */}
      <Route path="/" element={<FrontendLayout />}>
        <Route index element={ // Renders at / (root)
          <Suspense fallback={fallback}>
            <HomePage />
          </Suspense>
        } />
        {/* Add route for all listings */}
        <Route path="listings" element={
          <Suspense fallback={fallback}>
            <ListingsPage />
          </Suspense>
        } />
        {/* SEO-friendly URL with ID and business name */}
        <Route path="listings/:id/:slug" element={
          <Suspense fallback={fallback}>
            <ListingDetailPage />
          </Suspense>
        } />
        {/* Keep the ID-only route for backward compatibility */}
        <Route path="listings/:id" element={
          <Suspense fallback={fallback}>
            <ListingDetailPage />
          </Suspense>
        } />
        {/* Category pages */}
        <Route path="category/:slug" element={
          <Suspense fallback={fallback}>
            <CategoryPage />
          </Suspense>
        } />
        {/* Business type pages */}
        <Route path="business-type/:type" element={
          <Suspense fallback={fallback}>
            <BusinessTypePage />
          </Suspense>
        } />
        {/* Featured listings page */}
        <Route path="featured" element={
          <Suspense fallback={fallback}>
            <FrontendFeaturedListingsPage />
          </Suspense>
        } />
        <Route path="faq" element={
          <Suspense fallback={fallback}>
            <FaqPage />
          </Suspense>
        } />
        <Route path="blog" element={
          <Suspense fallback={fallback}>
            <Blog7 />
          </Suspense>
        } />
        <Route path="about-us" element={
          <Suspense fallback={fallback}>
            <AboutUsPage />
          </Suspense>
        } />
        <Route path="contact" element={
          <Suspense fallback={fallback}>
            <ContactPage />
          </Suspense>
        } />
      </Route>

      {/* Consider adding a NotFoundPage component for unmatched routes */}
      {/* <Route path="*" element={<NotFoundPage />} /> */}
    </Routes>
  );
}

export default App;

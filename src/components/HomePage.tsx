import { useState, useEffect } from 'react';
import { Suspense, lazy } from 'react';
import { Link } from 'react-router-dom';
import { homepageService, HomepageContent } from '@/services/homepageService';
import { AuroraBackgroundDemo } from './ui/AuroraBackgroundDemo';
import { CTA } from './ui/call-to-action';

// Lazy-loaded components
const Blog7 = lazy(() => import('./ui/blog7').then(module => ({ default: module.Blog7 })));
const ListingsPage = lazy(() => import('../pages/frontend/ListingsPage').then(module => ({ default: module.ListingsPage })));

// Fallback loading component
const LoadingSpinner = () => (
  <div className="flex justify-center items-center p-8">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

export function HomePage() {
  const [content, setContent] = useState<HomepageContent>({});
  // Loading state for content - can be used to show loading indicators if needed
  const [isLoading, setIsLoading] = useState(true);

  // Fetch homepage content
  useEffect(() => {
    const fetchContent = async () => {
      setIsLoading(true);
      try {
        const data = await homepageService.getContent();
        setContent(data);
      } catch (error) {
        console.error('Error loading homepage content:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, []);

  // Default content as fallbacks
  const headerDefaults = {
    title: 'Find Your Perfect Local Business',
    subtitle: 'Discover and connect with the best local businesses in your area',
    buttonText: 'Explore Now',
  };

  const featureListingsDefaults = {
    title: 'Featured Listings',
    subtitle: 'Explore our top-rated local businesses',
  };

  const blogDefaults = {
    title: 'Latest Updates',
    subtitle: 'From our blog',
    description: 'Stay updated with the latest news and tips from local businesses',
    buttonText: 'View All Articles',
  };

  const getStartedDefaults = {
    title: 'Try Our Platform',
    description: 'Join thousands of happy users discovering local businesses with our platform',
    primaryButtonText: 'Get Started',
    secondaryButtonText: 'Learn More',
  };

  // Get content with fallbacks
  const header = homepageService.getSection(content, 'header', headerDefaults);
  const featureListings = homepageService.getSection(content, 'featureListings', featureListingsDefaults);
  const blog = homepageService.getSection(content, 'blog', blogDefaults);
  const getStarted = homepageService.getSection(content, 'getStarted', getStartedDefaults);

  // Show loading indicator while content is loading
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  return (
    <>
      {/* Hero Section with Aurora Background */}
      <div className="relative">
        <AuroraBackgroundDemo />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center px-4 sm:px-6 lg:px-8 max-w-3xl">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white drop-shadow-lg mb-6">
              {header.title}
            </h1>
            <p className="text-xl sm:text-2xl text-white mb-8 drop-shadow-md">
              {header.subtitle}
            </p>
            <Link
              to="/listings"
              className="inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition duration-300"
            >
              {header.buttonText}
            </Link>
          </div>
        </div>
      </div>

      {/* Featured Listings Section */}
      <section className="py-16 bg-gray-50 dark:bg-slate-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-3">
              {featureListings.title}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              {featureListings.subtitle}
            </p>
          </div>
          <Suspense fallback={<LoadingSpinner />}>
            <ListingsPage />
          </Suspense>
        </div>
      </section>

      {/* Blog Section */}
      <Suspense fallback={<LoadingSpinner />}>
        <section className="blog-section">
          <div className="container mx-auto px-4 py-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-3">
                {blog.title}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                {blog.subtitle}
              </p>
              <p className="text-base text-gray-500 dark:text-gray-400 mt-2 max-w-2xl mx-auto">
                {blog.description}
              </p>
            </div>
          </div>
          <Blog7 buttonText={blog.buttonText} />
        </section>
      </Suspense>

      {/* Call to Action */}
      <section className="py-16 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">{getStarted.title}</h2>
          <p className="text-xl max-w-2xl mx-auto mb-8">{getStarted.description}</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/register"
              className="px-6 py-3 bg-white text-blue-600 font-medium rounded-md hover:bg-gray-100 transition duration-300"
            >
              {getStarted.primaryButtonText}
            </Link>
            <Link
              to="/about"
              className="px-6 py-3 border-2 border-white text-white font-medium rounded-md hover:bg-white/10 transition duration-300"
            >
              {getStarted.secondaryButtonText}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

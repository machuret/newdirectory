import { useState, useEffect } from 'react';
import { Page } from '../types/page'; // Assuming your Page type is here

const API_URL_PAGES = 'http://localhost:3002/pages';

export function AboutUsPage() {
  const [page, setPage] = useState<Page | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPageData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch page by its seoUrl (slug)
        const response = await fetch(`${API_URL_PAGES}?seoUrl=about-us`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: Page[] = await response.json();
        if (data.length > 0) {
          setPage(data[0]); // Expecting only one page with this slug
        } else {
          throw new Error('About Us page not found.');
        }
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError('An unknown error occurred');
        }
      }
      setIsLoading(false);
    };

    fetchPageData();
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-xl text-gray-700 dark:text-gray-300">Loading About Us page...</p>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-xl text-red-500">Error loading page: {error || 'Page data is missing.'}</p>
        <p className="text-md text-gray-600 dark:text-gray-400">
          Please ensure the About Us page exists in the database and the API server (json-server) is running.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 prose dark:prose-invert lg:prose-xl">
      <h1>{page.title}</h1>
      {/* Render HTML content safely */}
      <div dangerouslySetInnerHTML={{ __html: page.content }} />
    </div>
  );
}

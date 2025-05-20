import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Listing } from '../../types/listing';
import { ListingCard } from '../../components/frontend/ListingCard';
import { ChevronLeft } from 'lucide-react';

export function BusinessTypePage() {
  const { type } = useParams<{ type: string }>();
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Format the business type for display (convert dashes to spaces and capitalize)
  const formattedType = type 
    ? type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    : '';

  // API URL - using the real backend API
  const API_URL = 'http://localhost:3001/api/listings';

  useEffect(() => {
    if (type) {
      fetchListingsByBusinessType(type, currentPage);
    }
  }, [type, currentPage]);

  const fetchListingsByBusinessType = async (businessType: string, page: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Add timestamp to prevent caching issues
      const timestamp = new Date().getTime();
      const url = `${API_URL}/by-type/${businessType}?page=${page}&limit=12&_t=${timestamp}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Error fetching listings: ${response.status}`);
      }
      
      const data = await response.json();
      
      setListings(data.listings || []);
      setTotalPages(data.pagination?.totalPages || 1);
      
      // If no listings found but no error occurred
      if (data.listings?.length === 0) {
        console.log('No listings found for this business type');
      }
    } catch (err) {
      console.error('Error fetching listings by business type:', err);
      setError('Failed to load listings. Please try again later.');
      
      // Use mock data for development if API fails
      if (process.env.NODE_ENV === 'development') {
        console.log('Using mock data for development');
        const mockListings = Array(8).fill(null).map((_, i) => ({
          id: i + 1,
          google_place_id: `mock-${i}`,
          name: `${formattedType} Business ${i + 1}`,
          formatted_address: `${123 + i} Main St, Sydney NSW 2000`,
          main_type: businessType.replace(/-/g, '_'),
          rating: 4 + Math.random(),
          user_ratings_total: Math.floor(Math.random() * 100) + 10
        }));
        
        setListings(mockListings as Listing[]);
        setTotalPages(3); // Mock pagination
        setError(null); // Clear error when using mock data
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0); // Scroll to top when changing pages
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">Loading listings...</div>
      </div>
    );
  }

  if (error && listings.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center text-red-500">Error: {error}</div>
        <div className="mt-4 text-center">
          <Link to="/" className="text-blue-600 hover:underline">
            &larr; Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-6">
        <Link to="/" className="inline-flex items-center text-blue-600 hover:underline">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to home
        </Link>
      </div>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {formattedType} Businesses
        </h1>
        <p className="text-gray-600 dark:text-gray-300 max-w-3xl">
          Browse all {formattedType.toLowerCase()} businesses in our directory.
        </p>
      </div>
      
      {listings.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
            No listings found for this business type
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Try searching for a different business type or check back later
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <nav className="inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                    currentPage === 1
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">Previous</span>
                  <ChevronLeft className="h-5 w-5" />
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`relative inline-flex items-center px-4 py-2 border ${
                      currentPage === page
                        ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    } text-sm font-medium`}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                    currentPage === totalPages
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">Next</span>
                  <svg
                    className="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </nav>
            </div>
          )}
        </>
      )}
    </div>
  );
}

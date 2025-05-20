import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Listing } from '@/types/listing';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StarIcon, MapPin, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { listingsApi } from '@/services/apiService';

export function FeaturedListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Use centralized API configuration

  useEffect(() => {
    const fetchFeaturedListings = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log('Fetching featured listings, page:', page);
        
        // Use our centralized API service
        const data = await listingsApi.getFeaturedListings({
          page: page,
          limit: 12
        });
        
        console.log('Featured listings data:', data);
        
        // Handle different response formats
        setListings(data.listings || data.data || []);
        setTotalPages(data.pagination?.totalPages || 1);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'An unknown error occurred');
        console.error('Error fetching featured listings:', error);
        
        // For development, use mock data if API fails
        if (process.env.NODE_ENV === 'development') {
          const mockListings = Array(8).fill(null).map((_, i) => ({
            id: i + 1,
            google_place_id: `mock-${i}`,
            name: `Featured Business ${i + 1}`,
            formatted_address: `${123 + i} Main St, Sydney NSW 2000`,
            main_type: ['restaurant', 'cafe', 'bar', 'hotel'][i % 4],
            rating: 4 + Math.random(),
            user_ratings_total: Math.floor(Math.random() * 100) + 10,
            is_featured: true
          }));
          
          setListings(mockListings as Listing[]);
          setTotalPages(3); // Mock pagination
          setError(null); // Clear error when using mock data
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeaturedListings();
  }, [page]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo(0, 0);
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Featured Listings</h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Discover our handpicked selection of top-rated businesses and services.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">{error}</p>
          <Button asChild>
            <Link to="/">Return to Home</Link>
          </Button>
        </div>
      ) : (
        <>
          {listings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 mb-4">No featured listings found.</p>
              <Button asChild>
                <Link to="/">Return to Home</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map((listing) => (
                  <Card key={listing.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <CardContent className="p-0">
                      <div className="relative">
                        {/* Featured Badge */}
                        <div className="absolute top-4 left-4 z-10">
                          <Badge className="bg-yellow-400 text-yellow-900 px-3 py-1 flex items-center">
                            <StarIcon className="h-4 w-4 mr-1" />
                            Featured
                          </Badge>
                        </div>
                        
                        {/* Listing Image */}
                        <div className="h-48 bg-gray-200 dark:bg-gray-700">
                          {listing.main_image_url ? (
                            <img 
                              src={listing.main_image_url} 
                              alt={listing.name} 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x200?text=No+Image';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              No Image Available
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="p-5">
                        <h3 className="text-xl font-bold mb-2 truncate">{listing.name}</h3>
                        
                        {listing.rating && (
                          <div className="flex items-center mb-2">
                            <StarIcon className="h-4 w-4 text-yellow-500 mr-1" />
                            <span className="text-sm font-medium">
                              {typeof listing.rating === 'number' 
                                ? listing.rating.toFixed(1) 
                                : parseFloat(String(listing.rating)).toFixed(1)}
                            </span>
                            {listing.user_ratings_total && (
                              <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                                ({listing.user_ratings_total})
                              </span>
                            )}
                          </div>
                        )}
                        
                        <div className="flex items-start gap-1 text-gray-600 dark:text-gray-300 mb-2">
                          <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span className="text-sm truncate">{listing.formatted_address}</span>
                        </div>
                        
                        {listing.main_type && (
                          <div className="mb-4">
                            <Link to={`/business-type/${listing.main_type.toLowerCase().replace(/\s+/g, '-')}`}>
                              <Badge variant="outline" className="hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                {listing.main_type}
                              </Badge>
                            </Link>
                          </div>
                        )}
                        
                        <Button asChild className="w-full mt-2">
                          <Link to={`/listings/${listing.id}`} className="flex items-center justify-center">
                            View Details
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-8">
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      onClick={() => handlePageChange(page - 1)} 
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                      <Button
                        key={pageNum}
                        variant={pageNum === page ? "default" : "outline"}
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    ))}
                    
                    <Button 
                      variant="outline" 
                      onClick={() => handlePageChange(page + 1)} 
                      disabled={page === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

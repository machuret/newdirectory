import { useState, useEffect } from 'react';
import { Listing } from '@/types/listing';
import { ListingsGrid } from '@/components/frontend/ListingsGrid';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, SortAsc } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listingsApi } from '@/services/apiService';

export function ListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [sortOption, setSortOption] = useState<string>('recent');

  // Now using centralized API service instead of direct URL

  const fetchListings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('Fetching listings with params:', { 
        search: searchTerm, 
        page: currentPage,
        limit: 12,
        sort: sortOption 
      });
      
      // Use our centralized API service
      const data = await listingsApi.getAllListings({
        search: searchTerm,
        page: currentPage,
        limit: 12
      });
      
      console.log('Successfully fetched listings data:', data);
      // Handle different response formats
      if (Array.isArray(data)) {
        setListings(data);
        // If we don't have pagination info in this format, estimate it
        setTotalPages(Math.ceil(data.length / 12) || 1);
      } else {
        // Handle structured response with data and pagination
        setListings(data.data || data.listings || []);
        setTotalPages(data.pagination?.totalPages || Math.ceil((data.total || data.data?.length || 0) / 12) || 1);
      }
    } catch (err) { 
      let errorMessageToShow;
      if (err instanceof Error) {
        errorMessageToShow = err.message;
        console.error('fetchListings caught an Error instance:');
        console.error('Error Name:', err.name);
        console.error('Error Message:', err.message);
        console.error('Error Stack:', err.stack);
      } else {
        errorMessageToShow = 'An unknown error occurred while fetching listings.';
        console.error('fetchListings caught a non-Error instance:', err);
        try {
          console.error('Stringified non-Error object:', JSON.stringify(err));
        } catch (stringifyError) {
          console.error('Could not stringify the non-Error object:', stringifyError);
        }
      }
      setError(errorMessageToShow); 
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [currentPage, searchTerm, sortOption]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page when searching
    fetchListings();
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Directory Listings</h1>
      
      <form onSubmit={handleSearch} className="max-w-lg mx-auto mb-8">
        <div className="flex gap-2 flex-col sm:flex-row">
          <div className="relative flex-grow">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="flex gap-2">
            <div className="w-40">
              <Select
                value={sortOption}
                onValueChange={(value) => setSortOption(value)}
              >
                <SelectTrigger>
                  <SortAsc className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Recent</SelectItem>
                  <SelectItem value="a-z">A to Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit">Search</Button>
          </div>
        </div>
      </form>
      
      <ListingsGrid 
        listings={listings} 
        isLoading={isLoading} 
        error={error} 
      />
      
      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <Button 
            variant="outline" 
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || isLoading}
          >
            Previous
          </Button>
          
          <div className="flex items-center px-4 font-medium">
            Page {currentPage} of {totalPages}
          </div>
          
          <Button 
            variant="outline" 
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || isLoading}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

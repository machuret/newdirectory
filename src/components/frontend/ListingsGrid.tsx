// React is imported via JSX transform
import { Listing } from '@/types/listing';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StarIcon } from 'lucide-react';

interface ListingsGridProps {
  listings: Listing[];
  isLoading?: boolean;
  error?: string | null;
}

export function ListingsGrid({ listings, isLoading = false, error = null }: ListingsGridProps) {
  if (isLoading) {
    return <div className="my-12 text-center">Loading listings...</div>;
  }

  if (error) {
    return <div className="my-12 text-center text-red-500">Error: {error}</div>;
  }

  if (!listings || listings.length === 0) {
    return <div className="my-12 text-center">No listings found.</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 my-6">
      {listings.map((listing) => (
        <Card key={listing.id} className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg font-semibold line-clamp-2">
                {listing.name}
              </CardTitle>
              
              {listing.rating && (
                <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-950 px-2 py-1 rounded-md">
                  <StarIcon className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium">
                    {typeof listing.rating === 'number' 
                      ? listing.rating.toFixed(1) 
                      : parseFloat(listing.rating).toFixed(1)}
                  </span>
                  {listing.user_ratings_total && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      ({listing.user_ratings_total})
                    </span>
                  )}
                </div>
              )}
            </div>
            
            {listing.main_type && (
              <Badge variant="outline" className="mt-1">
                {listing.main_type}
              </Badge>
            )}
          </CardHeader>
          
          <CardContent>
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">
              {listing.formatted_address}
            </div>
            
            {listing.phone_number && (
              <div className="text-sm mt-2">
                <span className="font-medium">Phone:</span> {listing.phone_number}
              </div>
            )}
            
            {listing.website && (
              <div className="text-sm mt-1 truncate">
                <span className="font-medium">Website:</span>{' '}
                <a 
                  href={listing.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {listing.website.replace(/^https?:\/\//, '')}
                </a>
              </div>
            )}
          </CardContent>
          
          <CardFooter>
            <Link 
              to={`/listings/${listing.id}/${encodeURIComponent((listing.name || 'listing').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''))}`} 
              className="w-full text-center bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md text-sm font-medium"
            >
              View Details
            </Link>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

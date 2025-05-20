import { Link } from 'react-router-dom';
import { Listing } from '../../types/listing';
import { MapPin, Star } from 'lucide-react';
import { Badge } from '../ui/badge';

interface ListingCardProps {
  listing: Listing;
}

export function ListingCard({ listing }: ListingCardProps) {
  // Generate slug from name for SEO-friendly URLs
  const slug = listing.name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  // Get primary category or first category if available
  const category = listing.primary_category || (listing.categories && listing.categories.length > 0 
    ? listing.categories[0] 
    : null);
  
  // Fallback to main_type if no categories
  const categoryName = category ? category.name : listing.main_type;
  const categorySlug = category ? category.slug : null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden flex flex-col h-full">
      {/* Image */}
      <div className="relative h-48 bg-gray-100 dark:bg-gray-700">
        <img
          src={listing.main_photo_url || listing.main_image_url || 'https://via.placeholder.com/400x300?text=No+Image'}
          alt={listing.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            // If image fails to load, set a placeholder
            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=No+Image';
          }}
        />
        
        {/* Rating badge */}
        {listing.rating && (
          <div className="absolute top-2 right-2 bg-white dark:bg-gray-800 rounded-full px-2 py-1 flex items-center shadow-md">
            <Star className="h-3 w-3 text-yellow-500 mr-1" />
            <span className="text-xs font-medium">
              {typeof listing.rating === 'number' 
                ? listing.rating.toFixed(1) 
                : parseFloat(String(listing.rating)).toFixed(1)}
            </span>
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="p-4 flex-grow flex flex-col">
        <h3 className="font-semibold text-lg mb-1 text-gray-900 dark:text-white">
          <Link to={`/listings/${listing.id}/${slug}`} className="hover:text-blue-600 dark:hover:text-blue-400">
            {listing.name}
          </Link>
        </h3>
        
        {/* Location */}
        {listing.formatted_address && (
          <div className="flex items-start text-sm text-gray-500 dark:text-gray-400 mb-2">
            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 mr-1" />
            <span className="line-clamp-1">{listing.formatted_address}</span>
          </div>
        )}
        
        {/* Category */}
        <div className="mt-auto pt-3">
          {categoryName && (
            categorySlug ? (
              <Link to={`/category/${categorySlug}`}>
                <Badge variant="outline" className="hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  {categoryName}
                </Badge>
              </Link>
            ) : (
              <Badge variant="outline">{categoryName}</Badge>
            )
          )}
        </div>
      </div>
    </div>
  );
}

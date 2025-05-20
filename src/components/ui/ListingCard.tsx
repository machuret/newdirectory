import type { ListingItem } from '../../lib/types';

interface ListingCardProps {
  listing: ListingItem;
}

// Helper to generate a short description (e.g., first two sentences)
const getShortDescription = (text?: string | null, maxLength = 120): string => {
  if (!text) return 'No description available.';
  // Simple split by sentence, take first two, then trim by length.
  // A more robust solution might involve more complex sentence detection.
  const sentences = text.split(/[.!?]/);
  let shortDesc = sentences.slice(0, 2).join('. ') + (sentences.length > 2 ? '.' : '');
  if (shortDesc.length > maxLength) {
    shortDesc = shortDesc.substring(0, maxLength - 3) + '...';
  }
  return shortDesc.trim() || 'No description available.';
};

export function ListingCard({ listing }: ListingCardProps) {
  const shortDescription = getShortDescription(listing.description);
  const placeholderImage = 'https://via.placeholder.com/300x200.png?text=No+Image';

  return (
    <a href={`#/listing/${listing.id}`} className="block bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transition-transform duration-300 hover:scale-105">
      <img 
        src={listing.main_image_url || placeholderImage} 
        alt={`Photo of ${listing.title}`}
        className="w-full h-48 object-cover"
        onError={(e) => { (e.target as HTMLImageElement).src = placeholderImage; }}
      />
      <div className="p-4">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1 truncate" title={listing.title}>{listing.title}</h3>
        
        {listing.average_rating !== null && listing.average_rating !== undefined && (
          <div className="flex items-center mb-2">
            {[...Array(5)].map((_, i) => (
              <span 
                key={i} 
                className={`text-xl ${i < Math.round(listing.average_rating || 0) ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
              >
                ★
              </span>
            ))}
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">({listing.average_rating?.toFixed(1)})</span>
          </div>
        )}

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 h-20 overflow-hidden">
          {shortDescription}
        </p>

        {(listing.city || listing.state_province) && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
                {listing.city}{listing.city && listing.state_province ? ', ' : ''}{listing.state_province}
            </div>
        )}
      </div>
    </a>
  );
}

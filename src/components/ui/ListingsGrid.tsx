import type { ListingItem } from '../../lib/types';
import { ListingCard } from './ListingCard';

// Mock data - replace with API call later
const mockListings: ListingItem[] = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  title: `Awesome Business Title ${i + 1} - Featuring a Long Name to Test Truncation Capabilities`,
  main_image_url: i % 3 === 0 ? null : `https://source.unsplash.com/random/300x200?sig=${i}`,
  average_rating: (Math.random() * 4 + 1),
  description: `This is a compelling description for business ${i + 1}. It aims to attract customers by highlighting unique selling points and providing essential information. We offer great services and fantastic products. Come visit us soon! We guarantee satisfaction and a memorable experience. This is sentence three. This is sentence four. This is sentence five, just in case the short description logic needs more text to play with and to see how overflow is handled within the card itself as it might get very long.`,
  city: `Cityville ${i % 4}`,
  state_province: `State ${String.fromCharCode(65 + i % 4)}`,
}));

export function ListingsGrid() {
  // In a real app, you'd fetch listings here, perhaps with useEffect and useState
  const listings = mockListings;

  return (
    <section className="py-8 bg-gray-50 dark:bg-slate-900">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-12">Featured Listings</h2>
        {listings.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400">No listings available at the moment.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {listings.map(listing => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

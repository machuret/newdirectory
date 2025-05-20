import React from 'react';
import type { ListingItem } from '../lib/types'; // Assuming we might expand ListingItem or use a more detailed type later
import { Star, Phone, Globe, MapPin, Clock, Tag, CheckCircle, ExternalLink, Image as ImageIcon } from 'lucide-react';

// Expanded mock data for a single detailed listing
const mockDetailedListing: ListingItem & { // Using intersection type for additional fields for mock
  full_address?: string;
  website?: string;
  phone?: string;
  review_count?: number;
  is_claimed?: boolean;
  google_image_urls_json?: string[]; 
  google_opening_hours_json?: { open_now?: boolean; weekday_text?: string[] };
  price_details?: string;
  primary_category?: string;
} = {
  id: 1,
  title: 'Gourmet Burger Haven & Exquisite Shakes Emporium',
  main_image_url: 'https://source.unsplash.com/random/800x600?restaurant',
  average_rating: 4.7,
  description: 'Discover a world of flavor at Gourmet Burger Haven, where culinary craftsmanship meets casual dining. Our chefs use only the freshest, locally-sourced ingredients to create mouth-watering burgers that redefine the classics. From our signature Angus beef patties to innovative vegetarian options, every bite is an adventure. Don\u2019t forget to pair your meal with one of our hand-spun, exquisite shakes, available in a variety of creative flavors. Our vibrant atmosphere and friendly staff make us the perfect spot for family dinners, casual lunches, or a treat-yourself moment. We are committed to providing an exceptional dining experience with every visit. Come hungry, leave happy!',
  city: 'Metropolis',
  state_province: 'NY',
  full_address: '123 Culinary Avenue, Metropolis, NY, 10001',
  website: 'https://www.gourmetburgerhaven.com',
  phone: '+1 (555) 123-4567',
  review_count: 287,
  is_claimed: true,
  google_image_urls_json: [
    'https://source.unsplash.com/random/600x400?burger',
    'https://source.unsplash.com/random/600x400?shakes',
    'https://source.unsplash.com/random/600x400?restaurantinterior',
    'https://source.unsplash.com/random/600x400?food',
    'https://source.unsplash.com/random/600x400?dining'
  ],
  google_opening_hours_json: {
    open_now: true,
    weekday_text: [
      "Monday: 11:00 AM – 10:00 PM",
      "Tuesday: 11:00 AM – 10:00 PM",
      "Wednesday: 11:00 AM – 10:00 PM",
      "Thursday: 11:00 AM – 10:00 PM",
      "Friday: 11:00 AM – 11:00 PM",
      "Saturday: 10:00 AM – 11:00 PM",
      "Sunday: 10:00 AM – 9:00 PM"
    ]
  },
  price_details: '$$ (Moderately Priced)',
  primary_category: 'Restaurant / Burger Joint',
};

const Section: React.FC<{ title: string; icon?: React.ReactNode; children: React.ReactNode; className?: string }> = ({ title, icon, children, className }) => (
  <div className={`mb-8 p-6 bg-white dark:bg-gray-800 shadow-lg rounded-lg ${className}`}>
    <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
      {icon && <span className="mr-3 text-blue-500">{icon}</span>}
      {title}
    </h2>
    {children}
  </div>
);

export function ListingDetailPage() {
  // In a real app, you'd fetch this data based on an ID from the URL
  const listing = mockDetailedListing;

  return (
    <div className="bg-gray-50 dark:bg-slate-900 py-8 px-4 md:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header Section: Title, Main Image, Basic Info */}
        <div className="mb-8 p-6 bg-white dark:bg-gray-800 shadow-xl rounded-lg">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">{listing.title}</h1>
          {listing.main_image_url && (
            <img 
              src={listing.main_image_url} 
              alt={`Main view of ${listing.title}`} 
              className="w-full h-auto max-h-[500px] object-cover rounded-md mb-6 shadow-md"
            />
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-gray-700 dark:text-gray-300">
            {listing.primary_category && (
              <div className="flex items-center">
                <Tag size={20} className="mr-2 text-blue-500" /> 
                <span>{listing.primary_category}</span>
              </div>
            )}
            {listing.average_rating !== undefined && listing.average_rating !== null && (
              <div className="flex items-center">
                <Star size={20} className="mr-2 text-yellow-400" /> 
                <span>{(listing.average_rating as number).toFixed(1)} ({listing.review_count || 0} reviews)</span>
              </div>
            )}
            {listing.full_address && (
              <div className="flex items-center">
                <MapPin size={20} className="mr-2 text-green-500" /> 
                <span>{listing.full_address}</span>
              </div>
            )}
            {listing.price_details && (
              <div className="flex items-center">
                 <span className="mr-2 text-lg font-semibold text-blue-500">$</span> {/* Simple dollar icon proxy */}
                <span>{listing.price_details}</span>
              </div>
            )}
            {listing.is_claimed && (
                <div className="flex items-center text-green-600 dark:text-green-400">
                    <CheckCircle size={20} className="mr-2" />
                    <span>Verified Listing</span>
                </div>
            )}
          </div>
        </div>

        {/* Description Section */}
        {listing.description && (
          <Section title="About This Business" icon={<ImageIcon size={24}/>}>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
              {listing.description}
            </p>
          </Section>
        )}

        {/* Photo Gallery Section */}
        {listing.google_image_urls_json && listing.google_image_urls_json.length > 0 && (
          <Section title="Photo Gallery" icon={<ImageIcon size={24}/>}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {listing.google_image_urls_json.map((url, index) => (
                <a href={url} target="_blank" rel="noopener noreferrer" key={index} className="block group">
                  <img 
                    src={url} 
                    alt={`Gallery image ${index + 1} for ${listing.title}`} 
                    className="w-full h-40 object-cover rounded-md shadow-sm transition-transform duration-300 group-hover:scale-105"
                  />
                </a>
              ))}
            </div>
          </Section>
        )}

        {/* Opening Hours Section */}
        {listing.google_opening_hours_json?.weekday_text && (
          <Section title="Opening Hours" icon={<Clock size={24}/>}>
            <ul className="list-disc pl-5 text-gray-700 dark:text-gray-300 space-y-1">
              {listing.google_opening_hours_json.weekday_text.map((line, index) => (
                <li key={index}>{line}</li>
              ))}
            </ul>
            {listing.google_opening_hours_json.open_now !== undefined && (
                <p className={`mt-3 font-semibold ${listing.google_opening_hours_json.open_now ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {listing.google_opening_hours_json.open_now ? 'Open now' : 'Closed now'}
                </p>
            )}
          </Section>
        )}

        {/* Contact & Links Section */}
        {(listing.phone || listing.website) && (
          <Section title="Contact & Visit" icon={<ExternalLink size={24}/>}>
            <div className="space-y-3">
              {listing.phone && (
                <div className="flex items-center">
                  <Phone size={20} className="mr-3 text-blue-500" /> 
                  <a href={`tel:${listing.phone}`} className="text-blue-600 dark:text-blue-400 hover:underline">{listing.phone}</a>
                </div>
              )}
              {listing.website && (
                <div className="flex items-center">
                  <Globe size={20} className="mr-3 text-blue-500" /> 
                  <a href={listing.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Visit Website</a>
                </div>
              )}
            </div>
          </Section>
        )}
        
        {/* TODO: Add sections for Reviews, Map, etc. later */}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Listing, Review } from '@/types/listing';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StarIcon, MapPin, Phone, Globe, Clock, ChevronLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import ContactForm from '@/components/frontend/listings/ContactForm';
import { useListing } from '@/hooks/useListings';

export function ListingDetailPageRefactored() {
  const { id, slug } = useParams<{ id: string; slug?: string }>();
  const navigate = useNavigate();
  const [newImageUrl, setNewImageUrl] = useState<string>('');
  
  // Use React Query hook to fetch listing data
  const { 
    data: listing,
    isLoading, 
    error 
  } = useListing(id!);

  // Redirect to SEO-friendly URL if needed
  if (listing && !slug) {
    const generatedSlug = listing.name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    navigate(`/listings/${id}/${generatedSlug}`, { replace: true });
  }

  // Extract coordinates for map
  const latitude = listing?.latitude || listing?.geometry?.location?.lat;
  const longitude = listing?.longitude || listing?.geometry?.location?.lng;
  const hasValidCoordinates = !!(latitude && longitude);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading listing details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center text-red-500">
          Error: {error instanceof Error ? error.message : 'Failed to load listing'}
        </div>
        <div className="mt-4 text-center">
          <Link to="/listings" className="text-blue-600 hover:underline">
            &larr; Back to listings
          </Link>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">Listing not found</div>
        <div className="mt-4 text-center">
          <Link to="/listings" className="text-blue-600 hover:underline">
            &larr; Back to listings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link to="/listings" className="text-blue-600 hover:underline flex items-center">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Listings
        </Link>
      </div>
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{listing.name}</h1>
        
        <div className="flex flex-wrap items-center gap-4 mb-4">
          {listing.main_type && (
            <Badge variant="outline" className="text-sm">
              {listing.main_type}
            </Badge>
          )}
          
          {listing.rating && (
            <div className="flex items-center">
              <StarIcon className="h-4 w-4 text-yellow-500 mr-1" />
              <span className="font-medium">{listing.rating.toFixed(1)}</span>
              {listing.user_ratings_total && (
                <span className="text-gray-500 text-sm ml-1">
                  ({listing.user_ratings_total} reviews)
                </span>
              )}
            </div>
          )}
          
          {listing.formatted_address && (
            <div className="flex items-center text-gray-600">
              <MapPin className="h-4 w-4 mr-1" />
              <span>{listing.formatted_address}</span>
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap gap-4">
          {listing.phone_number && (
            <Button variant="outline" size="sm" asChild>
              <a href={`tel:${listing.phone_number}`}>
                <Phone className="h-4 w-4 mr-2" />
                {listing.phone_number}
              </a>
            </Button>
          )}
          
          {listing.website && (
            <Button variant="outline" size="sm" asChild>
              <a href={listing.website} target="_blank" rel="noopener noreferrer">
                <Globe className="h-4 w-4 mr-2" />
                Website
              </a>
            </Button>
          )}
        </div>
      </div>
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2">
          {/* Description Section */}
          {listing.description && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">About {listing.name}</h2>
              <div className="prose max-w-none dark:prose-invert">
                {listing.description.split('\n').map((paragraph, idx) => (
                  paragraph.trim() ? <p key={idx}>{paragraph}</p> : null
                ))}
              </div>
            </div>
          )}

          {/* FAQ Section */}
          {listing.faq && listing.faq.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Frequently Asked Questions</h2>
              <div className="space-y-4">
                {listing.faq.map((item, idx) => (
                  <div key={idx} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                    <h3 className="font-medium text-lg mb-2">{item.question}</h3>
                    <p className="text-gray-700 dark:text-gray-300">{item.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Photos Section */}
          {listing.photos && listing.photos.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Photos</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {listing.photos.map((photo, index) => (
                  <div key={index} className="rounded-lg overflow-hidden h-48 bg-gray-100 dark:bg-gray-800">
                    <img
                      src={photo.photo_url || `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=YOUR_API_KEY`}
                      alt={`${listing.name} - Photo ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // If image fails to load, set a placeholder
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=No+Image';
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Reviews Section */}
          {listing.reviews && listing.reviews.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Reviews</h2>
              <div className="space-y-4">
                {listing.reviews.map((review: Review, index) => (
                  <Card key={index}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {review.profile_photo_url && (
                            <img
                              src={review.profile_photo_url}
                              alt={review.author_name}
                              className="w-10 h-10 rounded-full"
                              onError={(e) => {
                                // If image fails to load, set a placeholder
                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/40x40?text=User';
                              }}
                            />
                          )}
                          <div>
                            <div className="font-medium">{review.author_name}</div>
                            <div className="text-sm text-gray-500">{review.relative_time_description}</div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <StarIcon className="h-4 w-4 text-yellow-500 mr-1" />
                          <span>{review.rating.toFixed(1)}</span>
                        </div>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300">{review.text}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Sidebar */}
        <div>
          {/* Contact Form */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <ContactForm listingId={Number(id)} listingName={listing.name} />
            </CardContent>
          </Card>

          {/* Business Hours */}
          {listing.opening_hours && listing.opening_hours.periods && listing.opening_hours.periods.length > 0 && (
            <Card className="mb-6">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Business Hours
                </h3>
                <div className="space-y-2">
                  {listing.opening_hours.weekday_text ? (
                    // If we have formatted weekday text, use it
                    listing.opening_hours.weekday_text.map((day, index) => (
                      <div key={index} className="flex justify-between">
                        <span>{day}</span>
                      </div>
                    ))
                  ) : (
                    // Otherwise, try to format from periods
                    ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, idx) => {
                      const period = listing.opening_hours?.periods?.find(p => p.open?.day === idx);
                      return (
                        <div key={idx} className="flex justify-between">
                          <span>{day}</span>
                          <span>
                            {period ? (
                              `${formatTime(period.open?.time)} - ${period.close ? formatTime(period.close.time) : 'Closed'}`
                            ) : (
                              'Closed'
                            )}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Map */}
          {hasValidCoordinates && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-3">Location</h3>
                <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-md overflow-hidden">
                  <img 
                    src={`https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=15&size=600x300&markers=color:red%7C${latitude},${longitude}&key=YOUR_API_KEY`}
                    alt={`Map showing location of ${listing.name}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // If map fails to load, show a placeholder with address
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/600x300?text=Map+Unavailable';
                    }}
                  />
                </div>
                <div className="mt-3">
                  <Button className="w-full" asChild>
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}&query_place_id=${listing.place_id || listing.google_place_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View on Google Maps
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper function to format time from "0900" to "9:00 AM"
function formatTime(time?: string): string {
  if (!time) return 'Unknown';
  
  const hours = parseInt(time.substring(0, 2), 10);
  const minutes = time.substring(2, 4);
  
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  
  return `${hour12}:${minutes} ${period}`;
}

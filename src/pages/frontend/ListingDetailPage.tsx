import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Listing, Review } from '@/types/listing';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StarIcon, MapPin, Phone, Globe, Clock, ChevronLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import ContactForm from '@/components/frontend/listings/ContactForm';
import { listingsApi } from '@/services/apiService';

export function ListingDetailPage() {
  const { id, slug } = useParams<{ id: string; slug?: string }>();
  const navigate = useNavigate();
  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Now using centralized API service instead of direct URL

  useEffect(() => {
    const fetchListing = async () => {
      if (!id) return;
      
      setIsLoading(true);
      setError(null);
      try {
        console.log(`Fetching listing with ID: ${id}`);
        
        // Use our centralized API service
        const data = await listingsApi.getListing(id);
        
        // Add detailed logging to help debug what data we're getting
        console.log('Listing data:', data);
        console.log('Description available:', !!data.description);
        console.log('Description generated:', !!data.description_generated);
        console.log('FAQs available:', !!data.faqs, Array.isArray(data.faqs) ? data.faqs.length : 0);
        console.log('Legacy FAQ available:', !!data.faq, Array.isArray(data.faq) ? data.faq.length : 0);
        console.log('FAQs generated:', !!data.faqs_generated);
        
        // Ensure data is properly structured
        const processedData = {
          ...data,
          // Ensure faqs is always an array if it exists
          faqs: data.faqs ? (Array.isArray(data.faqs) ? data.faqs : JSON.parse(data.faqs as unknown as string)) : undefined,
          // If we have legacy faq property but no faqs, copy it over
          ...((!data.faqs && data.faq) ? { faqs: data.faq } : {})
        };
        
        console.log('Processed listing data:', processedData);
        setListing(processedData);
        
        // If we have the listing data and we're on the ID-only route,
        // redirect to the SEO-friendly URL
        if (data && !slug) {
          const generatedSlug = data.name.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
          
          // Only redirect if we're not already on the correct URL
          navigate(`/listings/${id}/${generatedSlug}`, { replace: true });
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'An unknown error occurred');
        console.error('Error fetching listing:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchListing();
    }
  }, [id, slug, navigate]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">Loading listing details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center text-red-500">Error: {error}</div>
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

  // Format phone number for display if it exists
  const formattedPhone = listing.phone_number || 'Not available';
  
  // Determine if we have valid coordinates to show a map
  const hasValidCoordinates = 
    (listing.latitude && listing.longitude) || 
    (listing.geometry?.location?.lat && listing.geometry?.location?.lng);
  
  // Get lat/long from either direct properties or from geometry
  const latitude = listing.latitude || listing.geometry?.location?.lat;
  const longitude = listing.longitude || listing.geometry?.location?.lng;

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-6">
        <Link to="/listings" className="inline-flex items-center text-blue-600 hover:underline">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to listings
        </Link>
      </div>
      
      {/* Listing Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{listing.name}</h1>
        
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {/* Display categories if available */}
          {listing.categories && listing.categories.length > 0 && (
            listing.categories.map(category => (
              <Link key={category.id} to={`/category/${category.slug}`}>
                <Badge 
                  variant="outline" 
                  className={`hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${category.id === listing.primary_category?.id ? 'border-indigo-500 dark:border-indigo-400' : ''}`}
                >
                  {category.name}
                </Badge>
              </Link>
            ))
          )}
          
          {/* Always show business type/main_type as clickable */}
          {listing.main_type && (
            <Link to={`/business-type/${listing.main_type.toLowerCase().replace(/\s+/g, '-')}`}>
              <Badge 
                variant="secondary"
                className="hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                {listing.main_type}
              </Badge>
            </Link>
          )}
          
          {listing.rating && (
            <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-950 px-2 py-1 rounded-md">
              <StarIcon className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">
                {typeof listing.rating === 'number' 
                  ? listing.rating.toFixed(1) 
                  : parseFloat(String(listing.rating)).toFixed(1)}
              </span>
              {listing.user_ratings_total && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  ({listing.user_ratings_total})
                </span>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-start gap-1 text-gray-600 dark:text-gray-300 mb-2">
          <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <span>{listing.formatted_address}</span>
        </div>
        
        {listing.phone_number && (
          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-300 mb-2">
            <Phone className="h-5 w-5 flex-shrink-0" />
            <span>{formattedPhone}</span>
          </div>
        )}
        
        {listing.website && (
          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-300 mb-2">
            <Globe className="h-5 w-5 flex-shrink-0" />
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
      </div>
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2">
          {/* Description Section */}
          {listing.description ? (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">
                About {listing.name}
                {listing.description_generated && (
                  <Badge className="ml-2 bg-green-100 text-green-800 border-green-200">
                    AI Generated
                  </Badge>
                )}
              </h2>
              <div className="prose max-w-none dark:prose-invert">
                {listing.description.split('\n').map((paragraph, idx) => (
                  paragraph.trim() ? <p key={idx}>{paragraph}</p> : null
                ))}
              </div>
            </div>
          ) : (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">About {listing.name}</h2>
              <p className="text-gray-500 italic">
                No description available. Visit the AI Prompts page to generate a description.
              </p>
            </div>
          )}

          {/* FAQ Section */}
          {listing && (() => {
            // Get the available FAQs array, handling both property names and potential string format
            let faqsArray: Array<{question: string, answer: string}> = [];
            
            // Check for faqs property first (preferred format)
            if (listing.faqs) {
              if (Array.isArray(listing.faqs)) {
                faqsArray = listing.faqs;
                console.log('Using array faqs:', faqsArray.length);
              } else if (typeof listing.faqs === 'string') {
                // Handle JSON string format
                try {
                  faqsArray = JSON.parse(listing.faqs as string);
                  console.log('Parsed faqs from string:', faqsArray.length);
                } catch (e) {
                  console.error('Error parsing faqs string:', e);
                }
              }
            } 
            // Fallback to legacy faq property if needed
            else if (listing.faq && Array.isArray(listing.faq)) {
              faqsArray = listing.faq;
              console.log('Using legacy faq array:', faqsArray.length);
            }
            
            console.log('Final FAQs array:', faqsArray);
            
            if (faqsArray.length > 0) {
              return (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold mb-4">
                    Frequently Asked Questions
                    {listing.faqs_generated && (
                      <Badge className="ml-2 bg-green-100 text-green-800 border-green-200">
                        AI Generated
                      </Badge>
                    )}
                  </h2>
                  <div className="space-y-4">
                    {faqsArray.map((item: {question: string, answer: string}, idx: number) => (
                      <div key={idx} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                        <h3 className="font-medium text-lg mb-2">{item.question}</h3>
                        <p className="text-gray-700 dark:text-gray-300">{item.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            } else {
              return (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold mb-4">Frequently Asked Questions</h2>
                  <p className="text-gray-500 italic">
                    No FAQs available. Visit the AI Prompts page to generate FAQs.
                  </p>
                </div>
              );
            }
          })()}

          {/* Photos Section */}
          {listing && listing.photos && listing.photos.length > 0 && (
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
          {listing && listing.reviews && listing.reviews.length > 0 && (
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

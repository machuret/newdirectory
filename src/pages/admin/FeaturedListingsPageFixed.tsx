import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Loader2, Star, Edit, ChevronLeft } from 'lucide-react';
import { Listing } from '@/types/listing';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

// API URL configuration
const useLocalProxy = true;
const localProxyUrl = 'http://localhost:8080/api/proxy';
const directApiUrl = 'http://localhost:3001';

const getApiUrl = (endpoint: string) => {
  if (useLocalProxy) {
    // Make sure the endpoint starts with a slash
    const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${localProxyUrl}${formattedEndpoint}`;
  } else {
    return `${directApiUrl}${endpoint}`;
  }
};

// Helper functions
const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString();
};

const truncateText = (text?: string, maxLength = 50) => {
  if (!text) return '';
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
};

export function FeaturedListingsPageFixed() {
  // State for all listings
  const [listings, setListings] = useState<Listing[]>([]);
  const [featuredListings, setFeaturedListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedListings, setSelectedListings] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>('all');

  // Log the API URLs for debugging
  console.log('Featured Listings - API URL:', getApiUrl('/api/listings'));

  // Fetch all listings
  const fetchListings = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(getApiUrl('/api/listings'));
      
      if (!response.ok) {
        throw new Error(`Error fetching listings: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Listings response data:', data);
      
      // Handle different response formats
      if (Array.isArray(data)) {
        setListings(data);
      } else if (data.data && Array.isArray(data.data)) {
        setListings(data.data);
      } else if (data.listings && Array.isArray(data.listings)) {
        setListings(data.listings);
      } else {
        setListings([]);
        console.warn('Unexpected response format:', data);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      console.error('Error fetching listings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Use a simpler approach to get featured listings by filtering all listings
  const fetchFeaturedListings = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Instead of using a separate endpoint that's causing errors,
      // we'll fetch all listings and filter them client-side
      if (listings.length === 0) {
        // If we don't have listings yet, fetch them first
        await fetchListings();
      }
      
      console.log('Filtering featured listings from all listings');
      
      // Filter listings that have is_featured set to true
      const featured = listings.filter(listing => listing.is_featured === true);
      console.log(`Found ${featured.length} featured listings`);
      
      setFeaturedListings(featured);
    } catch (error) {
      console.error('Error getting featured listings:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      // Set empty array to avoid undefined errors
      setFeaturedListings([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load data when component mounts or tab changes
  useEffect(() => {
    if (activeTab === 'all') {
      fetchListings();
    } else {
      fetchFeaturedListings();
    }
  }, [activeTab]);

  // Handle checkbox selection
  const handleSelectListing = (listingId: string) => {
    setSelectedListings(prev => {
      if (prev.includes(listingId)) {
        return prev.filter(id => id !== listingId);
      } else {
        return [...prev, listingId];
      }
    });
  };

  // Handle select all checkbox
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const currentListings = activeTab === 'all' ? listings : featuredListings;
      // Convert any number IDs to strings to ensure type safety
      setSelectedListings(currentListings.map(listing => listing.id ? String(listing.id) : ''));
    } else {
      setSelectedListings([]);
    }
  };

  // Update featured status for selected listings
  const updateFeaturedStatus = async (isFeatured: boolean) => {
    if (selectedListings.length === 0) {
      setError('No listings selected');
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      // Update each listing individually with better error handling
      let successCount = 0;
      let failureCount = 0;
      let lastError = null;
      
      console.log(`Updating ${selectedListings.length} listings to featured=${isFeatured}`);
      
      for (const listingId of selectedListings) {
        try {
          const url = getApiUrl(`/api/listings/${listingId}`);
          console.log(`Updating listing ${listingId} at URL: ${url}`);
          
          // First, get the current listing data to preserve all fields
          const getResponse = await fetch(url);
          
          if (!getResponse.ok) {
            const errorText = await getResponse.text();
            console.error(`Error fetching listing ${listingId}:`, errorText);
            throw new Error(`Failed to fetch listing data: ${getResponse.status}`);
          }
          
          // Parse the listing data
          const listingData = await getResponse.json();
          console.log(`Retrieved current data for listing ${listingId}:`, listingData);
          
          // Update only the is_featured field while preserving all other fields
          const updatedData = {
            ...listingData,
            is_featured: isFeatured
          };
          
          // Now update the listing with all fields intact
          const response = await fetch(url, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify(updatedData),
          });
          
          // Log the response status
          console.log(`Update response for listing ${listingId}: ${response.status}`);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Error updating listing ${listingId}:`, errorText);
            failureCount++;
            lastError = `HTTP ${response.status}: ${errorText}`;
          } else {
            successCount++;
            // Try to parse the response as JSON
            try {
              const responseData = await response.json();
              console.log(`Update success for listing ${listingId}:`, responseData);
            } catch (jsonError) {
              console.log(`Non-JSON response for listing ${listingId}`);
            }
          }
        } catch (error) {
          console.error(`Exception updating listing ${listingId}:`, error);
          failureCount++;
          lastError = error instanceof Error ? error.message : 'Unknown error';
        }
      }
      
      // Report results
      if (failureCount > 0) {
        if (successCount > 0) {
          setSuccessMessage(`Successfully updated ${successCount} listing(s), but failed to update ${failureCount} listing(s).`);
        }
        throw new Error(`Failed to update ${failureCount} listing(s). Last error: ${lastError}`);
      }
      
      // Update the listings in the state
      if (activeTab === 'all') {
        setListings(prevListings => 
          prevListings.map(listing => 
            listing.id && selectedListings.includes(String(listing.id)) 
              ? { ...listing, is_featured: isFeatured } 
              : listing
          )
        );
      }
      
      // Refresh the featured listings if we're on that tab
      if (activeTab === 'featured') {
        fetchFeaturedListings();
      } else {
        // Refresh all listings if we're on the all tab
        fetchListings();
      }
      
      setSuccessMessage(`Featured status updated for ${selectedListings.length} listings`);
      setSelectedListings([]);
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      console.error('Error updating featured status:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading && !listings.length && !featuredListings.length) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>Loading listings...</span>
        </div>
      </div>
    );
  }

  const currentListings = activeTab === 'all' ? listings : featuredListings;
  const allSelected = currentListings.length > 0 && selectedListings.length === currentListings.length;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Featured Listings</h1>
        <Button variant="outline" asChild>
          <Link to="/admin/dashboard">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert className="mb-6 bg-green-50 text-green-800 border-green-200">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Featured Listings Management</CardTitle>
          <CardDescription>
            Select listings to mark as featured. Featured listings will appear at the top of search results
            and on the featured listings page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Listings</TabsTrigger>
              <TabsTrigger value="featured">Featured Listings</TabsTrigger>
            </TabsList>
            
            <div className="flex justify-between mb-4">
              <div className="space-x-2">
                <Button 
                  onClick={() => updateFeaturedStatus(true)} 
                  disabled={isProcessing || selectedListings.length === 0}
                  size="sm"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Star className="h-4 w-4 mr-2" />
                      Mark as Featured
                    </>
                  )}
                </Button>
                
                <Button 
                  onClick={() => updateFeaturedStatus(false)} 
                  disabled={isProcessing || selectedListings.length === 0}
                  variant="outline"
                  size="sm"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Star className="h-4 w-4 mr-2" />
                      Remove Featured
                    </>
                  )}
                </Button>
              </div>
              
              <div>
                <span className="text-sm text-muted-foreground">
                  {selectedListings.length} of {currentListings.length} selected
                </span>
              </div>
            </div>
            
            <TabsContent value="all">
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox 
                          checked={allSelected}
                          onCheckedChange={handleSelectAll}
                          aria-label="Select all"
                        />
                      </TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Featured</TableHead>
                      <TableHead>Date Created</TableHead>
                      <TableHead className="w-12">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {listings.map(listing => (
                      <TableRow key={listing.id}>
                        <TableCell>
                          <Checkbox 
                            checked={listing.id ? selectedListings.includes(String(listing.id)) : false}
                            onCheckedChange={() => listing.id && handleSelectListing(String(listing.id))}
                            aria-label={`Select ${listing.name}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{truncateText(listing.name, 30)}</TableCell>
                        <TableCell>{listing.category || 'Uncategorized'}</TableCell>
                        <TableCell>
                          <Badge variant={listing.status === 'active' ? 'default' : 'secondary'}>
                            {listing.status || 'Draft'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={listing.is_featured ? 'default' : 'outline'}>
                            {listing.is_featured ? 'Featured' : 'Not Featured'}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(listing.created_at)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" asChild>
                            <Link to={`/admin/listings/${listing.id}`}>
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            
            <TabsContent value="featured">
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox 
                          checked={allSelected}
                          onCheckedChange={handleSelectAll}
                          aria-label="Select all"
                        />
                      </TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date Created</TableHead>
                      <TableHead className="w-12">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {featuredListings.map(listing => (
                      <TableRow key={listing.id}>
                        <TableCell>
                          <Checkbox 
                            checked={listing.id ? selectedListings.includes(String(listing.id)) : false}
                            onCheckedChange={() => listing.id && handleSelectListing(String(listing.id))}
                            aria-label={`Select ${listing.name}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{truncateText(listing.name, 30)}</TableCell>
                        <TableCell>{listing.category || 'Uncategorized'}</TableCell>
                        <TableCell>
                          <Badge variant={listing.status === 'active' ? 'default' : 'secondary'}>
                            {listing.status || 'Draft'}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(listing.created_at)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" asChild>
                            <Link to={`/admin/listings/${listing.id}`}>
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default FeaturedListingsPageFixed;

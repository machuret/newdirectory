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

const FeaturedListingsPage: React.FC = () => {
  // State for all listings
  const [featuredListings, setFeaturedListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedListings, setSelectedListings] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'featured'>('all');
  const [listings, setListings] = useState<Listing[]>([]);

  // Fetch all listings
  const fetchListings = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const url = getApiUrl('/api/listings');
      console.log('Featured Listings - API URL:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Get the response as text first for debugging
      const responseText = await response.text();
      
      // Try to parse the JSON
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('Listings response data:', data);
      } catch (jsonError) {
        console.error('Error parsing listings JSON:', jsonError);
        throw new Error('Invalid JSON response from listings endpoint');
      }
      
      // Handle different response formats
      if (Array.isArray(data)) {
        setListings(data);
      } else if (data.data && Array.isArray(data.data)) {
        setListings(data.data);
      } else if (data.listings && Array.isArray(data.listings)) {
        setListings(data.listings);
      } else {
        console.warn('Unexpected listings response format:', data);
        setListings([]);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      console.error('Error fetching listings:', error);
      setListings([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch featured listings
  const fetchFeaturedListings = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const url = getApiUrl('/api/listings?is_featured=true');
      console.log('Featured Listings - API URL:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Get the response as text first for debugging
      const responseText = await response.text();
      
      // Try to parse the JSON
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('Featured Listings response data:', data);
      } catch (jsonError) {
        console.error('Error parsing featured listings JSON:', jsonError);
        throw new Error('Invalid JSON response from featured listings endpoint');
      }
      
      // Handle different response formats
      if (Array.isArray(data)) {
        setFeaturedListings(data);
      } else if (data.data && Array.isArray(data.data)) {
        setFeaturedListings(data.data);
      } else if (data.listings && Array.isArray(data.listings)) {
        setFeaturedListings(data.listings);
      } else {
        console.warn('Unexpected featured listings response format:', data);
        setFeaturedListings([]);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      console.error('Error fetching featured listings:', error);
      setFeaturedListings([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    if (activeTab === 'all') {
      fetchListings();
    } else {
      fetchFeaturedListings();
    }
  }, [activeTab]);

  // Handle selecting a listing
  const handleSelectListing = (id: string) => {
    setSelectedListings(prev => {
      if (prev.includes(id)) {
        return prev.filter(listingId => listingId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Handle select all listings
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = (activeTab === 'all' ? listings : featuredListings).map(listing => listing.id);
      setSelectedListings(allIds);
    } else {
      setSelectedListings([]);
    }
  };

  // Update featured status for multiple listings
  const updateFeaturedStatus = async (isFeatured: boolean) => {
    if (selectedListings.length === 0) {
      setError('Please select at least one listing');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);
      setSuccessMessage(null);

      console.log(`Updating ${selectedListings.length} listings to featured=${isFeatured}`);

      // Process each listing
      let successCount = 0;
      let errorCount = 0;

      for (const listingId of selectedListings) {
        try {
          const url = getApiUrl(`/api/listings/${listingId}`);
          console.log(`Updating listing ${listingId} at URL: ${url}`);
          
          const response = await fetch(url, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({ is_featured: isFeatured }),
          });
          
          console.log(`Update response for listing ${listingId}: ${response.status}`);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Error updating listing ${listingId}:`, errorText);
            throw new Error(`Failed to update listing: ${response.status}`);
          }
          
          const responseData = await response.json();
          console.log(`Update success for listing ${listingId}:`, responseData);
          successCount++;
        } catch (err) {
          console.error(`Error updating listing ${listingId}:`, err);
          errorCount++;
        }
      }

      // Set success message
      setSuccessMessage(`Successfully updated ${successCount} listings`);
      
      // Refresh the appropriate list based on active tab
      if (activeTab === 'featured') {
        setListings(prevListings => {
          return prevListings.map(listing => {
            if (selectedListings.includes(listing.id)) {
              return { ...listing, is_featured: isFeatured };
            }
            return listing;
          });
        });
        
        // If we're unfeaturing items from the featured tab, we need to refresh
        if (!isFeatured) {
          fetchFeaturedListings();
        }
      } else {
        // We're on the all tab, just update the listing data
        fetchListings();
      }
      
      setSuccessMessage(`Successfully ${isFeatured ? 'featured' : 'unfeatured'} ${selectedListings.length} listings`);
      setSelectedListings([]);
      
    } catch (error) {
      console.error('Error updating featured status:', error);
      setSuccessMessage(null);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Featured Listings</h1>
        <Link to="/admin/dashboard" className="text-blue-500 hover:underline">
          Back to Dashboard
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <p>{successMessage}</p>
        </div>
      )}

      <div className="mb-4">
        <TabList>
          <Tab 
            isActive={activeTab === 'all'} 
            onClick={() => setActiveTab('all')}
          >
            All Listings
          </Tab>
          <Tab 
            isActive={activeTab === 'featured'} 
            onClick={() => setActiveTab('featured')}
          >
            Featured Listings
          </Tab>
        </TabList>
      </div>

      <div className="mb-4 flex justify-between">
        <div>
          <Button 
            onClick={() => updateFeaturedStatus(true)} 
            disabled={isProcessing || selectedListings.length === 0}
            className="mr-2"
          >
            Feature Selected
          </Button>
          <Button 
            onClick={() => updateFeaturedStatus(false)} 
            disabled={isProcessing || selectedListings.length === 0}
            className="mr-2"
          >
            Unfeature Selected
          </Button>
        </div>
        <div>
          <span className="mr-2">
            {selectedListings.length} selected
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <p>Loading listings...</p>
        </div>
      ) : (
        <TabPanel>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <Checkbox 
                    checked={
                      (activeTab === 'all' ? listings : featuredListings).length > 0 && 
                      selectedListings.length === (activeTab === 'all' ? listings : featuredListings).length
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Featured</TableCell>
                <TableCell>Date Created</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(activeTab === 'all' ? listings : featuredListings).map(listing => (
                <TableRow key={listing.id}>
                  <TableCell>
                    <Checkbox 
                      checked={selectedListings.includes(listing.id)}
                      onChange={() => handleSelectListing(listing.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Link to={`/admin/listings/${listing.id}`} className="text-blue-500 hover:underline">
                      {truncateText(listing.name, 30)}
                    </Link>
                  </TableCell>
                  <TableCell>{listing.category || 'Uncategorized'}</TableCell>
                  <TableCell>
                    <Badge color={listing.status === 'active' ? 'green' : 'gray'}>
                      {listing.status || 'Draft'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge color={listing.is_featured ? 'purple' : 'gray'}>
                      {listing.is_featured ? 'Featured' : 'Not Featured'}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(listing.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabPanel>
      )}
                    </>
                  )}
                </Button>
              </div>
              
              <div>
                <span className="text-sm text-gray-500">
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
                        />
                      </TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {listings.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center">No listings found</TableCell>
                      </TableRow>
                    ) : (
                      listings.map(listing => (
                        <TableRow key={listing.id}>
                          <TableCell>
                            <Checkbox 
                              checked={selectedListings.includes(listing.id!)}
                              onCheckedChange={() => handleSelectListing(listing.id!)}
                            />
                          </TableCell>
                          <TableCell>{listing.name}</TableCell>
                          <TableCell>
                            {listing.main_type || (listing.primary_category?.name || 'Unknown')}
                          </TableCell>
                          <TableCell>
                            {listing.is_featured ? (
                              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                                <Star className="h-3 w-3 mr-1" />
                                Featured
                              </Badge>
                            ) : (
                              <Badge variant="outline">
                                Standard
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              asChild
                            >
                              <Link to={`/admin/listings/edit/${listing.id}`}>
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
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
                        />
                      </TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {featuredListings.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center">No featured listings found</TableCell>
                      </TableRow>
                    ) : (
                      featuredListings.map(listing => (
                        <TableRow key={listing.id}>
                          <TableCell>
                            <Checkbox 
                              checked={selectedListings.includes(listing.id!)}
                              onCheckedChange={() => handleSelectListing(listing.id!)}
                            />
                          </TableCell>
                          <TableCell>{listing.name}</TableCell>
                          <TableCell>
                            {listing.main_type || (listing.primary_category?.name || 'Unknown')}
                          </TableCell>
                          <TableCell>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              asChild
                            >
                              <Link to={`/admin/listings/edit/${listing.id}`}>
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
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

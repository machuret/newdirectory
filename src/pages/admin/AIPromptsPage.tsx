import { useState, useEffect } from 'react';
import { API_CONFIG } from '@/config/api.config';
import { Link } from 'react-router-dom';
import { Listing } from '@/types/listing';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Loader2, RefreshCw, HelpCircle, ChevronLeft } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Import the centralized API services
import { listingsApi } from '@/services/apiService';

// Define tabs for the page
type TabType = 'description' | 'faq';

export function AIPromptsPage() {
  // Define possible processing statuses
  type ProcessingStatus = 'idle' | 'processing' | 'success' | 'error';
  
  // Extend Listing type with processing status
  type ListingWithStatus = Listing & {
    processing_status?: ProcessingStatus;
  };
  
  // State for listings and selection
  const [listings, setListings] = useState<ListingWithStatus[]>([]);
  const [selectedListingIds, setSelectedListingIds] = useState<number[]>([]);
  
  // Loading and processing states
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [processingListingId, setProcessingListingId] = useState<number | null>(null);
  const [isVerifyingOpenAI, setIsVerifyingOpenAI] = useState<boolean>(false);
  const [openAIStatus, setOpenAIStatus] = useState<'unknown' | 'connected' | 'error'>('unknown');
  
  // UI state
  const [activeTab, setActiveTab] = useState<TabType>('description');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Track if all listings are selected
  const [selectAll, setSelectAll] = useState<boolean>(false);

  // Fetch all listings
  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = async () => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      // Use our centralized API service to fetch listings
      const data = await listingsApi.getAllListings();
      console.log('API response:', data);
      
      // Handle different response formats
      let listingsData;
      if (Array.isArray(data)) {
        listingsData = data;
      } else {
        listingsData = data.data || data.listings || [];
      }
      
      setListings(listingsData);
      console.log(`Successfully loaded ${listingsData.length} listings`);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      console.error('Error loading listings:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Toggle selection of a listing
  const toggleListingSelection = (listingId: number) => {
    setSelectedListingIds(prev => 
      prev.includes(listingId)
        ? prev.filter(id => id !== listingId)
        : [...prev, listingId]
    );
  };
  
  // Toggle selection of all listings
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedListingIds([]);
    } else {
      const ids = listings
        .map(listing => listing.id)
        .filter((id): id is number => id !== undefined);
      setSelectedListingIds(ids);
    }
    setSelectAll(!selectAll);
  };
  
  // Verify OpenAI connection before generating content
  const verifyOpenAIConnection = async () => {
    setIsVerifyingOpenAI(true);
    setError(null);
    
    try {
      // Use the API endpoint for verification
      const response = await fetch(`${API_CONFIG.getBaseUrl()}/verify-openai`);
      
      if (!response.ok) {
        throw new Error(`Error verifying OpenAI connection: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status === 'connected') {
        setOpenAIStatus('connected');
        setSuccessMessage('OpenAI connection verified successfully!');
        return true;
      } else {
        setOpenAIStatus('error');
        setError(data.message || 'Could not connect to OpenAI API. Please check your API key.');
        return false;
      }
    } catch (error) {
      setOpenAIStatus('error');
      setError(error instanceof Error ? error.message : 'An unknown error occurred verifying OpenAI connection');
      console.error('Error verifying OpenAI connection:', error);
      return false;
    } finally {
      setIsVerifyingOpenAI(false);
    }
  };
  
  // Generate AI descriptions for selected listings
  const generateDescriptions = async () => {
    if (selectedListingIds.length === 0) {
      setError('Please select at least one listing');
      return;
    }
    
    // Verify OpenAI connection first
    if (openAIStatus !== 'connected') {
      const isConnected = await verifyOpenAIConnection();
      if (!isConnected) {
        return;
      }
    }
    
    setError(null);
    setSuccessMessage(null);
    
    // Initialize progress tracking
    const total = selectedListingIds.length;
    let completed = 0;
    
    // Create a progress update function
    const updateProgress = (id: number, success: boolean) => {
      completed++;
      const percentComplete = Math.round((completed / total) * 100);
      
      setSuccessMessage(
        `Progress: ${completed}/${total} listings processed (${percentComplete}%)`
      );
      
      // Update the listing's visual status in the UI
      setListings(prev => 
        prev.map(l => l.id === id ? {
          ...l,
          processing_status: success ? 'success' : 'error'
        } : l)
      );
    };
    
    // Set all selected listings to 'processing' status
    setListings(prev => 
      prev.map(l => selectedListingIds.includes(l.id || 0) ? {
        ...l,
        processing_status: 'processing'
      } : l)
    );
    
    // Process all selected listings
    for (const listingId of selectedListingIds) {
      try {
        await generateSingleDescription(listingId);
        updateProgress(listingId, true);
      } catch (error) {
        console.error(`Error processing listing ${listingId}:`, error);
        updateProgress(listingId, false);
      }
    }
    
    // Final success message
    setSuccessMessage(`Completed AI description generation for ${completed}/${total} listings`);
  };
  
  // Generate description for a single listing using our enhanced centralized API
  const generateSingleDescription = async (listingId: number) => {
    setProcessingListingId(listingId);
    setError(null);
    
    try {
      console.log(`Generating description for listing ID: ${listingId}`);
      
      // Use our centralized API service with enhanced error handling and auto-saving
      const result = await listingsApi.generateDescription(listingId.toString());
      console.log('Description generation result:', result);
      
      if (result.description) {
        // The API service already handled updating the listing in the database
        // Now we need to update our local state
        setListings(prev => 
          prev.map(l => 
            l.id === listingId
              ? { 
                  ...l, 
                  description: result.description,
                  description_generated: true 
                }
              : l
          )
        );
        
        setSuccessMessage(`Successfully generated and saved description for listing ${listingId}`);
      } else {
        throw new Error('Failed to generate description. No content returned.');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      console.error('Error generating description:', error);
    } finally {
      setProcessingListingId(null);
    }
  };
  
  // Generate FAQs for selected listings
  const generateFAQs = async () => {
    if (selectedListingIds.length === 0) {
      setError('Please select at least one listing');
      return;
    }
    
    // Verify OpenAI connection first
    if (openAIStatus !== 'connected') {
      const isConnected = await verifyOpenAIConnection();
      if (!isConnected) {
        return;
      }
    }
    
    setError(null);
    setSuccessMessage(null);
    
    // Initialize progress tracking
    const total = selectedListingIds.length;
    let completed = 0;
    
    // Create a progress update function
    const updateProgress = (id: number, success: boolean) => {
      completed++;
      const percentComplete = Math.round((completed / total) * 100);
      
      setSuccessMessage(
        `Progress: ${completed}/${total} listings processed (${percentComplete}%)`
      );
      
      // Update the listing's visual status in the UI
      setListings(prev => 
        prev.map(l => l.id === id ? {
          ...l,
          processing_status: success ? 'success' : 'error'
        } : l)
      );
    };
    
    // Set all selected listings to 'processing' status
    setListings(prev => 
      prev.map(l => selectedListingIds.includes(l.id || 0) ? {
        ...l,
        processing_status: 'processing'
      } : l)
    );
    
    // Process all selected listings
    for (const listingId of selectedListingIds) {
      try {
        await generateSingleFAQ(listingId);
        updateProgress(listingId, true);
      } catch (error) {
        console.error(`Error processing listing ${listingId}:`, error);
        updateProgress(listingId, false);
      }
    }
    
    // Final success message
    setSuccessMessage(`Completed AI FAQ generation for ${completed}/${total} listings`);
  };
  
  // Generate FAQs for a single listing using our enhanced centralized API
  const generateSingleFAQ = async (listingId: number) => {
    setProcessingListingId(listingId);
    setError(null);
    
    try {
      console.log(`Generating FAQs for listing ID: ${listingId}`);
      
      // Use our centralized API service with enhanced error handling and auto-saving
      const result = await listingsApi.generateFAQs(listingId.toString());
      console.log('FAQ generation result:', result);
      
      if (result.faqs && Array.isArray(result.faqs)) {
        // The API service already handled updating the listing in the database
        // Now we need to update our local state
        setListings(prev => 
          prev.map(l => 
            l.id === listingId
              ? { 
                  ...l, 
                  faqs: result.faqs,
                  faqs_generated: true 
                }
              : l
          )
        );
        
        setSuccessMessage(`Successfully generated and saved ${result.faqs.length} FAQs for listing ${listingId}`);
      } else {
        throw new Error('Failed to generate FAQs. No content returned or invalid format.');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      console.error('Error generating FAQs:', error);
    } finally {
      setProcessingListingId(null);
    }
  };

  // Render UI
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">AI Content Generator</h1>
          <p className="text-muted-foreground">Generate AI-powered descriptions and FAQs for your listings</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={verifyOpenAIConnection} 
            disabled={isVerifyingOpenAI}
          >
            {isVerifyingOpenAI ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Verify OpenAI Connection
              </>
            )}
          </Button>
          <Button variant="outline" asChild>
            <Link to="/admin/listings">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Listings
            </Link>
          </Button>
        </div>
      </div>
      
      {/* OpenAI Status */}
      {openAIStatus === 'connected' && (
        <Alert className="mb-6 bg-green-50 text-green-800 border-green-200">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Connected to OpenAI</AlertTitle>
          <AlertDescription>Your OpenAI API connection is working properly.</AlertDescription>
        </Alert>
      )}

      {/* Alert messages */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-600">Success</AlertTitle>
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Generate AI Content</CardTitle>
          <CardDescription>
            Select the listings you want to generate content for and choose the content type.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabType)}>
            <TabsList className="mb-4">
              <TabsTrigger value="description">Descriptions</TabsTrigger>
              <TabsTrigger value="faq">FAQs</TabsTrigger>
            </TabsList>

            <TabsContent value="description">
              <div className="flex justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="select-all" 
                    checked={selectAll} 
                    onCheckedChange={() => toggleSelectAll()} 
                  />
                  <label htmlFor="select-all" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Select All
                  </label>
                </div>
                <Button 
                  onClick={generateDescriptions} 
                  disabled={isLoading || selectedListingIds.length === 0}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Generate Descriptions
                    </>
                  )}
                </Button>
              </div>

              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {listings.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          {isLoading ? 'Loading listings...' : 'No listings found'}
                        </TableCell>
                      </TableRow>
                    )}

                    {listings.map((listing) => (
                      <TableRow key={listing.id}>
                        <TableCell>
                          <Checkbox 
                            checked={selectedListingIds.includes(listing.id || 0)} 
                            onCheckedChange={() => toggleListingSelection(listing.id || 0)}
                            disabled={processingListingId === listing.id || listing.processing_status === 'processing'}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {listing.processing_status === 'processing' && (
                              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                            )}
                            {listing.processing_status === 'success' && (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                            {listing.processing_status === 'error' && (
                              <AlertCircle className="h-4 w-4 text-red-500" />
                            )}
                            {listing.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          {listing.processing_status === 'processing' ? (
                            <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                              Processing...
                            </Badge>
                          ) : listing.description_generated ? (
                            <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                              Generated
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">
                              Not Generated
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => generateSingleDescription(listing.id || 0)}
                            disabled={processingListingId === listing.id || listing.processing_status === 'processing'}
                          >
                            {processingListingId === listing.id || listing.processing_status === 'processing' ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="faq">
              <div className="flex justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="select-all-faq" 
                    checked={selectAll} 
                    onCheckedChange={() => toggleSelectAll()} 
                  />
                  <label htmlFor="select-all-faq" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Select All
                  </label>
                </div>
                <Button 
                  onClick={generateFAQs} 
                  disabled={isLoading || selectedListingIds.length === 0}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading
                    </>
                  ) : (
                    <>
                      <HelpCircle className="mr-2 h-4 w-4" />
                      Generate FAQs
                    </>
                  )}
                </Button>
              </div>

              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {listings.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          {isLoading ? 'Loading listings...' : 'No listings found'}
                        </TableCell>
                      </TableRow>
                    )}

                    {listings.map((listing) => (
                      <TableRow key={listing.id}>
                        <TableCell>
                          <Checkbox 
                            checked={selectedListingIds.includes(listing.id || 0)} 
                            onCheckedChange={() => toggleListingSelection(listing.id || 0)}
                            disabled={processingListingId === listing.id || listing.processing_status === 'processing'}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {listing.processing_status === 'processing' && (
                              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                            )}
                            {listing.processing_status === 'success' && (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                            {listing.processing_status === 'error' && (
                              <AlertCircle className="h-4 w-4 text-red-500" />
                            )}
                            {listing.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          {listing.processing_status === 'processing' ? (
                            <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                              Processing...
                            </Badge>
                          ) : listing.faqs_generated ? (
                            <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                              Generated
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">
                              Not Generated
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => generateSingleFAQ(listing.id || 0)}
                            disabled={processingListingId === listing.id || listing.processing_status === 'processing'}
                          >
                            {processingListingId === listing.id || listing.processing_status === 'processing' ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <HelpCircle className="h-4 w-4" />
                            )}
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

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle, CheckCircle, Loader2, RefreshCw, HelpCircle, ChevronLeft } from 'lucide-react';
import { Listing } from '@/types/listing';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

export function EnhanceFAQPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [processingListingId, setProcessingListingId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ current: number, total: number } | null>(null);
  
  // API URL configuration
  const useLocalProxy = true;
  const localProxyUrl = 'http://localhost:8080/api/proxy';
  const directApiUrl = 'http://localhost:3001';
  
  const getApiUrl = (endpoint: string) => {
    if (useLocalProxy) {
      return `${localProxyUrl}${endpoint}`;
    } else {
      return `${directApiUrl}${endpoint}`;
    }
  };

  // Fetch all listings
  useEffect(() => {
    const fetchListings = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(getApiUrl('/api/listings'));
        
        if (!response.ok) {
          throw new Error(`Error fetching listings: ${response.status}`);
        }
        
        const data = await response.json();
        setListings(data.listings || []);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'An unknown error occurred');
        console.error('Error fetching listings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchListings();
  }, []);

  // Generate FAQs for a single listing
  const generateFAQs = async (listingId: number) => {
    setProcessingListingId(listingId);
    setError(null);
    setSuccessMessage(null);
    
    try {
      const response = await fetch(getApiUrl(`/api/ai/faq/${listingId}`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Error generating FAQs: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Update the listing in the state
      setListings(prevListings => 
        prevListings.map(listing => 
          listing.id === listingId 
            ? { ...listing, faq: data.faqs } 
            : listing
        )
      );
      
      setSuccessMessage(`FAQs for "${listings.find(l => l.id === listingId)?.name}" generated successfully!`);
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      console.error('Error generating FAQs:', error);
    } finally {
      setProcessingListingId(null);
    }
  };

  // Generate FAQs for all listings in bulk
  const generateAllFAQs = async () => {
    if (!window.confirm('This will generate FAQs for all listings. This may take some time. Continue?')) {
      return;
    }
    
    setError(null);
    setSuccessMessage(null);
    
    // Filter listings that don't have FAQs or have empty FAQs
    const listingsToProcess = listings.filter(listing => 
      !listing.faq || !Array.isArray(listing.faq) || listing.faq.length === 0
    );
    
    if (listingsToProcess.length === 0) {
      setSuccessMessage('All listings already have FAQs!');
      return;
    }
    
    setProgress({ current: 0, total: listingsToProcess.length });
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < listingsToProcess.length; i++) {
      const listing = listingsToProcess[i];
      setProcessingListingId(listing.id!);
      setProgress({ current: i + 1, total: listingsToProcess.length });
      
      try {
        const response = await fetch(getApiUrl(`/api/ai/faq/${listing.id}`), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          errorCount++;
          continue;
        }
        
        const data = await response.json();
        
        // Update the listing in the state
        setListings(prevListings => 
          prevListings.map(l => 
            l.id === listing.id 
              ? { ...l, faq: data.faqs } 
              : l
          )
        );
        
        successCount++;
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error generating FAQs for listing ${listing.id}:`, error);
        errorCount++;
      }
    }
    
    setProcessingListingId(null);
    setProgress(null);
    setSuccessMessage(`Bulk FAQ generation complete! Success: ${successCount}, Failed: ${errorCount}`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>Loading listings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Enhance FAQs with AI</h1>
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
          <CardTitle>FAQ Generator</CardTitle>
          <CardDescription>
            Generate frequently asked questions (FAQs) for your business listings using AI. 
            The AI will create 4 relevant questions and answers based on the business information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p>
                Generate FAQs for all listings that don't have them yet. This will use OpenAI to create
                relevant questions and answers based on the business information.
              </p>
              <Button 
                onClick={generateAllFAQs}
                disabled={processingListingId !== null}
              >
                {processingListingId !== null && progress ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Processing {progress.current}/{progress.total}
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Generate All FAQs
                  </>
                )}
              </Button>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Has FAQs</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">No listings found</TableCell>
                  </TableRow>
                ) : (
                  listings.map(listing => (
                    <TableRow key={listing.id}>
                      <TableCell>{listing.name}</TableCell>
                      <TableCell>
                        {listing.main_type || (listing.primary_category?.name || 'Unknown')}
                      </TableCell>
                      <TableCell>
                        {listing.faq && Array.isArray(listing.faq) && listing.faq.length > 0 ? (
                          <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
                            Yes ({listing.faq.length})
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-50 text-red-800 border-red-200">
                            No
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button 
                          size="sm" 
                          onClick={() => generateFAQs(listing.id!)}
                          disabled={processingListingId === listing.id}
                        >
                          {processingListingId === listing.id ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <HelpCircle className="h-4 w-4 mr-2" />
                              Generate FAQs
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import * as React from 'react';
import { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Listing, Review, OpeningHours } from '../../types/listing'; // Using the correct type
import { importApi } from '@/services/apiService';

export function ImportListingsPage() {
  const [urlInput, setUrlInput] = useState<string>('');
  const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false);
  const [previewData, setPreviewData] = useState<Listing[] | null>(null);
  const [fullFetchedData, setFullFetchedData] = useState<Listing[] | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);

  // Stats state
  const [numBusinesses, setNumBusinesses] = useState(0);
  const [numTotalReviews, setNumTotalReviews] = useState(0);
  const [numTotalPhotos, setNumTotalPhotos] = useState(0);

  const handleFetchAndPreview = async () => {
    console.log('[Importer] handleFetchAndPreview called. Current urlInput:', urlInput);

    if (!urlInput || !urlInput.trim()) {
      console.error('[Importer] urlInput is empty or only whitespace.');
      setPreviewError('Please enter a valid URL.');
      setIsLoadingPreview(false); // Stop loading if input is invalid
      return;
    }

    setIsLoadingPreview(true);
    setPreviewData(null);
    setFullFetchedData(null);
    setPreviewError(null);
    setImportError(null);
    setImportSuccessMessage(null);
    // Clear previous stats
    setNumBusinesses(0);
    setNumTotalReviews(0);
    setNumTotalPhotos(0);

    try {
      console.log('[Importer] Step 1: Preparing to fetch URL. Input:', urlInput);
      const fetchUrl = urlInput; // Using urlInput directly
      console.log('[Importer] Step 2: Final fetchUrl to be used:', fetchUrl);

      const response = await fetch(fetchUrl);
      console.log('[Importer] Step 3: Got response from proxy. Status:', response.status, 'OK:', response.ok);

      if (!response.ok) {
        let errorData = { message: 'Failed to parse error response from proxy server.' };
        try {
          errorData = await response.json();
        } catch (e) {
          console.error('[Importer] Could not parse JSON error response from proxy:', e);
        }
        console.error('[Importer] Proxy request failed. Status:', response.status, 'Error Data:', errorData);
        throw new Error(`Proxy request failed: ${response.status} ${response.statusText} - ${errorData.message || JSON.stringify(errorData)}`);
      }

      console.log('[Importer] Step 4: Attempting to parse response.json()');
      const rawData = await response.json();
      console.log('[Importer] Step 5: Parsed rawData. Type:', Array.isArray(rawData) ? 'array' : typeof rawData, 'Length:', rawData?.length);

      if (!Array.isArray(rawData)) {
        console.error('[Importer] Fetched data is not an array. Data:', rawData);
        setPreviewError('Fetched data is not an array. Please check the URL and data format.');
        setIsLoadingPreview(false);
        return;
      }
      if (rawData.length === 0) {
        console.log('[Importer] Fetched data is an empty array.');
        setPreviewData([]);
        setIsLoadingPreview(false);
        return;
      }

      console.log('[Importer] Step 6: Starting mapping process for all', rawData.length, 'items.');
      const allMappedItems: Listing[] = rawData.map((item: any, index: number) => {
        // console.log(`[Importer] Mapping item at index: ${index}`); // Uncomment for very verbose item-by-item logging
        const sourceReviews = Array.isArray(item.reviews) ? item.reviews : [];
        const mappedReviews: Review[] = sourceReviews.map((review: any) => ({
          reviewerId: review.reviewerId,
          reviewerUrl: review.reviewerUrl,
          name: review.name || 'Anonymous',
          reviewerNumberOfReviews: review.reviewerNumberOfReviews,
          isLocalGuide: review.isLocalGuide,
          stars: review.stars ?? null,
          text: review.text,
          publishedAtDate: review.publishedAtDate,
          likesCount: review.likesCount,
          responseFromOwnerText: review.responseFromOwnerText,
          responseFromOwnerDate: review.responseFromOwnerDate,
          reviewImageUrls: Array.isArray(review.reviewImageUrls) ? review.reviewImageUrls : [],
          reviewId: review.reviewId,
        }));

        const sourceOpeningHours = Array.isArray(item.openingHours) ? item.openingHours : [];
        const mappedOpeningHours: OpeningHours[] = sourceOpeningHours.map((oh: any) => ({
          day: oh.day || '',
          hours: oh.hours || 'N/A',
        }));

        return {
          id: item.placeId || `temp-preview-${Date.now()}-${index}`,
          title: item.title || 'No Title Provided',
          price: item.price ?? null,
          categoryName: item.categoryName || undefined,
          address: item.address || undefined,
          street: item.street || undefined,
          city: item.city || undefined,
          postalCode: item.postalCode || undefined,
          state: item.state || undefined,
          countryCode: item.countryCode || undefined,
          location: item.location ? { lat: item.location.lat, lng: item.location.lng } : undefined,
          totalScore: item.totalScore ?? null,
          permanentlyClosed: item.permanentlyClosed || false,
          temporarilyClosed: item.temporarilyClosed || false,
          placeId: item.placeId || undefined,
          categories: Array.isArray(item.categories) ? item.categories : [],
          reviewsCount: item.reviewsCount ?? 0,
          phone: item.phone || item.phoneUnformatted || undefined,
          website: item.website || undefined,
          openingHours: mappedOpeningHours,
          imageUrl: item.imageUrl || null,
          imageUrls: Array.isArray(item.imageUrls) ? item.imageUrls : (item.imageUrl ? [item.imageUrl] : []),
          reviews: mappedReviews,
          importedAt: new Date().toISOString(),
          sourceUrl: urlInput,
          cid: item.cid || undefined,
          fid: item.fid || undefined,
          additionalInfo: typeof item.additionalInfo === 'object' && item.additionalInfo !== null ? item.additionalInfo : undefined,
          scrapedAt: item.scrapedAt || undefined,
        };
      });
      console.log('[Importer] Step 7: Finished mapping all items.');

      setFullFetchedData(allMappedItems);
      setPreviewData(allMappedItems.slice(0, 10));

      // Calculate stats based on all mapped items
      let totalReviews = 0;
      let totalPhotos = 0;
      allMappedItems.forEach(listing => {
        totalReviews += listing.reviews?.length || 0;
        totalPhotos += listing.imageUrls?.length || 0; // Assuming 'imageUrls' is an array of photo URLs
      });

      setNumBusinesses(allMappedItems.length);
      setNumTotalReviews(totalReviews);
      setNumTotalPhotos(totalPhotos);

    } catch (error: any) {
      console.error('[Importer] CRITICAL ERROR in handleFetchAndPreview:', error);
      // Log the fetchUrl that was attempted if possible, though it's outside this direct scope
      // Consider if PROXY_SERVER_URL or urlInput were problematic leading to a bad fetchUrl
      console.error(`[Importer] Attempted to fetch: ${urlInput} (values at time of error)`);
      if (error.name) console.error('[Importer] Error Name:', error.name);
      if (error.message) console.error('[Importer] Error Message:', error.message);
      if (error.stack) console.error('[Importer] Error Stack:', error.stack);
      // Attempt to log response status if available and relevant contextually (response variable won't be in scope here from the try block)
      // Consider adding a check if the error originated from the fetch response directly
      setPreviewError(error instanceof Error ? error.message : 'An unknown error occurred. Check console for details.');
    }
    setIsLoadingPreview(false);
  };

  // Function to import listings to the database
  const handleImportListings = async () => {
    if (!fullFetchedData || fullFetchedData.length === 0) {
      setImportError('No data to import');
      return;
    }

    setIsImporting(true);
    setImportError(null);
    setImportSuccessMessage(null);

    try {
      console.log('Importing listings using centralized API service');
      // Use our centralized API service
      const data = await importApi.importListings(fullFetchedData);
      console.log('[Importer] API Import Success Response:', data);
      setImportSuccessMessage(`Import complete! Processed: ${data.processed}, Inserted: ${data.inserted}, Updated: ${data.updated}, Failed: ${data.failed}.`);
      if (data.errors && data.errors.length > 0) {
        console.warn('[Importer] Errors during import:', data.errors);
        // Optionally, display these errors more prominently in the UI
        setImportError(`Some items failed to import. Check console for details. Failed count: ${data.failed}`);
      } else if (data.failed > 0) {
        setImportError(`Import completed with ${data.failed} failures. Check API logs or details if not provided.`);
      }

    } catch (error: any) {
      console.error('[Importer] CRITICAL ERROR in handleImportListings:', error);
      setImportError(error.message || 'An unknown error occurred during import.');
    } finally {
      setIsImporting(false);
    }
  };

  // A simple Label component if you don't have one from a UI library
  const Label = ({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) => (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      {children}
    </label>
  );

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-3xl font-semibold text-gray-800 dark:text-white mb-6">
        Import Listings from JSON URL
      </h1>

      <div className="mb-6 p-4 bg-white dark:bg-gray-800 shadow-md rounded-lg">
        <Label htmlFor="json-url">JSON Feed URL</Label>
        <div className="flex space-x-2 mt-1">
          <Input
            id="json-url"
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://api.example.com/data.json"
            className="flex-grow"
            disabled={isLoadingPreview || isImporting}
          />
          <Button
            onClick={handleFetchAndPreview}
            disabled={isLoadingPreview || isImporting || !urlInput.trim()}
          >
            {isLoadingPreview ? 'Fetching...' : 'Fetch & Preview'}
          </Button>
        </div>
        {previewError && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{previewError}</p>}
      </div>

      {isLoadingPreview && (
        <div className="text-center p-4 my-4">
          <p className="text-lg text-gray-700 dark:text-gray-300">Loading preview...</p>
        </div>
      )}

      {previewData && previewData.length > 0 && (
        <div className="mb-6 p-4 bg-white dark:bg-gray-800 shadow-md rounded-lg">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">
            Preview Data ({previewData.length} item(s) found)
          </h2>
          <div className="max-h-96 overflow-y-auto mb-4 border border-gray-200 dark:border-gray-700 rounded p-2 text-sm">
            {previewData.map((item, index) => (
              <div key={item.id || index} className={`p-2 ${index < previewData.length - 1 ? 'border-b dark:border-gray-600' : ''}`}>
                <p className="font-medium text-gray-900 dark:text-white">{item.title || 'N/A'}</p>
                <p className="text-gray-600 dark:text-gray-400">{item.categoryName || 'N/A'} - {item.address || 'N/A'}</p>
              </div>
            ))}
          </div>
          <div className="mb-4 p-4 border rounded-md bg-slate-50">
            <h3 className="text-lg font-semibold mb-2">Import Summary:</h3>
            <p>Number of Businesses: <strong>{numBusinesses}</strong></p>
            <p>Total Number of Reviews: <strong>{numTotalReviews}</strong></p>
            <p>Total Number of Photos: <strong>{numTotalPhotos}</strong></p>
          </div>
          <div className="flex justify-end mt-4">
            <Button
              onClick={handleImportListings}
              disabled={isImporting}
              className="ml-2 bg-green-600 hover:bg-green-700"
            >
              {isImporting ? 'Importing...' : 'Import Data to Database'}
            </Button>
          </div>
        </div>
      )}
      {importSuccessMessage && (
        <div className="my-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          <p>{importSuccessMessage}</p>
        </div>
      )}
      
      {importError && (
        <div className="my-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          <p><strong>Import Error:</strong> {importError}</p>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Listing } from '@/types/listing';

// WARNING: THIS IS FOR LOCAL TESTING ONLY. DO NOT COMMIT/DEPLOY WITH API TOKEN IN FRONTEND CODE.
// EXPOSING API KEYS CLIENT-SIDE IS A MAJOR SECURITY RISK.
const APIFY_API_TOKEN = 'apify_api_PSC5f5i6CXseLHByMfYouPfC1y53r92zxvDl'; 
const LISTINGS_DB_URL = 'http://localhost:3001/listings';

export function ApiImporterPage() {
  const [datasetId, setDatasetId] = useState<string>('WxVD2zQWeHZ6Kgb2Z');
  const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false);
  const [previewData, setPreviewData] = useState<Listing[] | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);

  const handleFetchAndPreview = async () => {
    if (!datasetId.trim()) {
      setPreviewError('Please enter a valid Apify Dataset ID.');
      return;
    }
    if (!APIFY_API_TOKEN) {
      setPreviewError('CRITICAL: APIFY_API_TOKEN is not set. This is a placeholder for testing only and should not be deployed.');
      alert('CRITICAL: APIFY_API_TOKEN is not set. This is a placeholder for testing only and should not be deployed. Check component code.');
      return;
    }

    setIsLoadingPreview(true);
    setPreviewData(null);
    setPreviewError(null);
    setImportSuccessMessage(null);
    setImportError(null);

    const directApifyUrl = `https://api.apify.com/v2/datasets/${encodeURIComponent(datasetId.trim())}/items?token=${APIFY_API_TOKEN}&clean=true&format=json`;
    console.log('[Importer] Attempting direct fetch from Apify:', directApifyUrl);

    try {
      const response = await fetch(directApifyUrl);
      if (!response.ok) {
        let errorDetails = `Request failed with status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorDetails += ` - ${errorData.error?.message || JSON.stringify(errorData)}`;
        } catch (e) {
          errorDetails += ` - ${await response.text()}`;
        }
        throw new Error(errorDetails);
      }
      const rawData = await response.json();

      console.log('Raw data from Apify (direct):', rawData);
      if (!Array.isArray(rawData)) {
        throw new Error('Data from Apify is not an array as expected.');
      }

      const mappedItems: Listing[] = rawData.map((item: any, index: number) => ({
        id: item.placeId || `temp-api-preview-${Date.now()}-${index}`,
        title: item.title || 'No Title Provided',
        placeId: item.placeId,
        address: item.address,
        categoryName: item.categoryName,
        website: item.website,
        phone: item.phone,
        location: item.location,
        totalScore: item.totalScore,
        reviewsCount: item.reviewsCount,
        openingHours: item.openingHours || [],
        imageUrls: item.imageUrls || [],
        reviews: item.reviews || [],
        importedAt: new Date().toISOString(),
        sourceUrl: `apify_dataset://${datasetId}`,
        // Ensure all fields from your Listing type are considered here, matching the provided example data structure
        subTitle: item.subTitle,
        description: item.description,
        price: item.price,
        neighborhood: item.neighborhood,
        street: item.street,
        city: item.city,
        postalCode: item.postalCode,
        state: item.state,
        countryCode: item.countryCode,
        permanentlyClosed: item.permanentlyClosed || false,
        temporarilyClosed: item.temporarilyClosed || false,
        categories: item.categories || [],
        // ... any other fields that align with your Listing model and Apify output
      }));
      setPreviewData(mappedItems.slice(0, 10)); // Show preview of first 10

    } catch (error: any) {
      setPreviewError(`Direct Apify Fetch Error: ${error.message}`);
      console.error('Error fetching or previewing Apify data (direct):', error);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleImportData = async () => {
    if (!previewData || previewData.length === 0) {
      setImportError('No data to import. Please fetch and preview data first.');
      return;
    }
    setIsImporting(true);
    setImportError(null);
    setImportSuccessMessage(null);
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Fetch existing listings to check for duplicates by placeId
    let existingPlaceIds = new Set<string>();
    try {
      const existingListingsResponse = await fetch(LISTINGS_DB_URL);
      console.log('[Importer-Debug] Existing listings response status:', existingListingsResponse.status);
      if (existingListingsResponse.ok) {
        const existingListings: Listing[] = await existingListingsResponse.json();
        console.log('[Importer-Debug] Fetched existing listings for duplicate check:', existingListings);
        existingListings.forEach(l => {
          if (l.placeId) existingPlaceIds.add(l.placeId);
        });
        console.log('[Importer-Debug] Constructed existingPlaceIds Set:', Array.from(existingPlaceIds));
      } else {
        console.warn('[Importer-Debug] Failed to fetch existing listings, status:', existingListingsResponse.status);
      }
    } catch (e: any) {
      console.warn('[Importer-Debug] Could not fetch existing listings for duplicate check:', e.message);
    }

    for (const item of previewData) {
      console.log(`[Importer-Debug] Checking item for import: ${item.title}, placeId: ${item.placeId}`);
      try {
        if (item.placeId && existingPlaceIds.has(item.placeId)) {
          console.log(`[Importer-Debug] Item with placeId ${item.placeId} found in existingPlaceIds. Skipping.`);
          continue; // Skip import if placeId already exists
        }

        console.log(`[Importer-Debug] Attempting to POST item: ${item.title}`);
        const response = await fetch(LISTINGS_DB_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...item, id: undefined }), // Let json-server generate ID
        });
        if (response.ok) {
          successCount++;
        } else {
          errorCount++;
          const errorText = await response.text();
          errors.push(`Failed to import '${item.title}': ${response.status} ${errorText}`);
          console.error(`[Importer] Error importing item ${item.title}:`, errorText);
        }
      } catch (e: any) {
        errorCount++;
        errors.push(`Exception importing '${item.title}': ${e.message}`);
        console.error(`[Importer] Exception importing item ${item.title}:`, e);
      }
    }

    let message = `Import process completed. Successful: ${successCount}.`;
    if (errorCount > 0) {
      message += ` Failed: ${errorCount}.`;
      setImportError(`Some items failed to import. Errors: ${errors.join('; ')}`);
    }
    if (previewData.length - successCount - errorCount > 0) {
        message += ` Skipped (duplicates): ${previewData.length - successCount - errorCount}.`;
    }
    setImportSuccessMessage(message);
    setIsImporting(false);
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Apify Google Listings Importer (Direct Fetch)</h1>
      <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6" role="alert">
        <p className="font-bold">Security & CORS Warning</p>
        <p>This page is configured for **direct API calls to Apify for testing only**.</p>
        <ul className="list-disc pl-5 mt-2">
          <li>Exposing your API token (as done here) in client-side code is a **MAJOR SECURITY RISK**. Do not deploy this code to production.</li>
          <li>Direct calls may fail due to CORS (Cross-Origin Resource Sharing) restrictions if Apify does not explicitly allow requests from your current domain ({window.location.origin}).</li>
          <li>A backend proxy is the recommended secure approach for production.</li>
        </ul>
      </div>
      
      <div className="bg-card p-6 rounded-lg shadow-sm mb-8">
        <h2 className="text-xl font-semibold mb-4">Fetch Data from Apify Dataset</h2>
        <div className="mb-4">
          <label htmlFor="datasetId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Apify Dataset ID:
          </label>
          <Input 
            type="text" 
            id="datasetId"
            value={datasetId}
            onChange={(e) => setDatasetId(e.target.value)}
            placeholder="e.g., WxVD2zQWeHZ6Kgb2Z"
            className="w-full md:w-1/2"
          />
        </div>
        <Button onClick={handleFetchAndPreview} disabled={isLoadingPreview || isImporting}>
          {isLoadingPreview ? 'Fetching directly...' : 'Fetch & Preview Data (Direct)'}
        </Button>
        {previewError && <p className="text-red-500 mt-4">Error: {previewError}</p>}
      </div>

      {previewData && previewData.length > 0 && (
        <div className="bg-card p-6 rounded-lg shadow-sm mb-8">
          <h2 className="text-xl font-semibold mb-4">Preview (First 10 Items)</h2>
          <ul className="list-disc pl-5">
            {previewData.map(item => (
              <li key={item.id} className="mb-1">{item.title} ({item.address || 'No address'}) - PlaceID: {item.placeId || 'N/A'}</li>
            ))}
          </ul>
          <Button onClick={handleImportData} disabled={isImporting || isLoadingPreview} className="mt-4">
            {isImporting ? 'Importing...' : `Import ${previewData.length} Previewed Items to DB`}
          </Button>
          {importError && <p className="text-red-500 mt-4">Import Error: {importError}</p>}
          {importSuccessMessage && <p className="text-green-500 mt-4">{importSuccessMessage}</p>}
        </div>
      )}
      {previewData && previewData.length === 0 && !isLoadingPreview && (
         <p className="text-center">No items found in the dataset or after mapping.</p>
      )}

    </div>
  );
}

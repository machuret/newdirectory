/**
 * Test script to fetch listings from the API
 * This will test our updated API service configuration
 */

import { listingsApi } from './services/apiService';

async function testListingsApi() {
  console.log('Testing listingsApi.getAllListings()...');
  
  try {
    // Attempt to fetch listings
    const result = await listingsApi.getAllListings();
    console.log('SUCCESS! Listings fetched successfully.');
    console.log(`Retrieved ${Array.isArray(result) ? result.length : (result.data?.length || 0)} listings.`);
    console.log('First few listings:', Array.isArray(result) ? result.slice(0, 2) : (result.data?.slice(0, 2) || []));
    return true;
  } catch (error) {
    console.error('FAILED to fetch listings:', error);
    return false;
  }
}

// Run the test
testListingsApi().then(success => {
  console.log(`Test ${success ? 'PASSED ✅' : 'FAILED ❌'}`);
});

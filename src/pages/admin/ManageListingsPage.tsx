import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Listing } from '@/types/listing'; 
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckSquare, Square } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'; 
import { listingsApi } from '@/services/apiService';

export function ManageListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [selectedListings, setSelectedListings] = useState<number[]>([]);
  const [bulkAction, setBulkAction] = useState<string>('');

  const fetchListings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('Fetching listings from API service');
      const data = await listingsApi.getAllListings();
      console.log('Received listings data:', data);
      
      // Handle different API response structures
      let listingsData;
      if (Array.isArray(data)) {
        listingsData = data;
      } else {
        listingsData = data.data || data.listings || [];
      }
      
      if (Array.isArray(listingsData)) {
        setListings(listingsData);
      } else {
        console.error('Unexpected data format:', data);
        throw new Error('Received data in unexpected format');
      }
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError('An unknown error occurred');
      }
      console.error("Failed to fetch listings:", e);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleAddNewListing = () => {
    // Navigate to a new listing form page
    window.location.href = '/admin/listings/new';
  };

  const handleDeleteListing = async (listingId: number) => {
    if (!window.confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
      return;
    }
    
    setDeleteError(null);
    
    try {
      await listingsApi.deleteListing(listingId.toString());
      
      // Refresh the listings after successful deletion
      fetchListings();
      // Clear selection after deletion
      setSelectedListings([]);
    } catch (e) {
      if (e instanceof Error) {
        setDeleteError(e.message);
      } else {
        setDeleteError('An unknown error occurred during delete.');
      }
      console.error("Failed to delete listing:", e);
    }
  };
  
  // Handle bulk deletion of listings
  const handleBulkDelete = async () => {
    if (selectedListings.length === 0) {
      setDeleteError('No listings selected for deletion');
      return;
    }
    
    if (!window.confirm(`Are you sure you want to delete ${selectedListings.length} listing(s)? This action cannot be undone.`)) {
      return;
    }
    
    setDeleteError(null);
    
    try {
      // Delete each selected listing
      const deletePromises = selectedListings.map(async (id) => {
        try {
          await listingsApi.deleteListing(id.toString());
          return { id, success: true };
        } catch (error) {
          console.error(`Failed to delete listing ${id}:`, error);
          return { id, success: false };
        }
      });

      const results = await Promise.all(deletePromises);
      const failures = results.filter(r => !r.success).map(r => r.id);

      if (failures.length > 0) {
        setDeleteError(`Failed to delete some listings: ${failures.join(', ')}`);
      }

      // Filter out the successfully deleted listings from state
      const successfulDeletes = results.filter(r => r.success).map(r => r.id);
      setListings(prev => prev.filter(listing => !successfulDeletes.includes(Number(listing.id))));
      setSelectedListings([]);
    } catch (e) {
      if (e instanceof Error) {
        setDeleteError(e.message);
      } else {
        setDeleteError('An unknown error occurred during bulk delete.');
      }
      console.error("Failed to delete listings:", e);
    }
  };
  
  // Handle selection of a single listing
  const toggleListingSelection = (listingId: number) => {
    setSelectedListings(prev => 
      prev.includes(listingId)
        ? prev.filter(id => id !== listingId)
        : [...prev, listingId]
    );
  };
  
  // Handle selection of all listings
  const toggleSelectAll = () => {
    if (selectedListings.length === listings.length) {
      // If all are selected, deselect all
      setSelectedListings([]);
    } else {
      // Otherwise, select all
      setSelectedListings(listings.map(listing => listing.id || 0).filter(id => id !== 0));
    }
  };
  
  // Handle bulk action execution
  const executeBulkAction = () => {
    if (!bulkAction || selectedListings.length === 0) {
      return;
    }
    
    switch (bulkAction) {
      case 'delete':
        handleBulkDelete();
        break;
      default:
        console.warn('Unknown bulk action:', bulkAction);
    }
  };
  
  // Handle adding a new listing
  const handleAddNew = () => {
    handleAddNewListing();
  }

  if (isLoading) { 
    return <div className="p-6">Loading listings...</div>;
  }

  if (error) { 
    return <div className="p-6 text-red-500">Error fetching listings: {error}</div>;
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-800 dark:text-white">
          Manage Listings
        </h1>
        <div className="flex gap-2">
          <Button onClick={handleAddNew}>
            Add New Listing
          </Button>
        </div>
      </div>
      
      {/* Bulk actions bar */}
      {listings.length > 0 && (
        <div className="flex items-center gap-2 mb-4 p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={toggleSelectAll}
            className="flex items-center gap-1"
          >
            {selectedListings.length === listings.length ? (
              <>
                <CheckSquare className="h-4 w-4" />
                Deselect All
              </>
            ) : (
              <>
                <Square className="h-4 w-4" />
                Select All
              </>
            )}
          </Button>
          
          <div className="flex-1 text-sm text-gray-500 dark:text-gray-400">
            {selectedListings.length > 0 ? (
              <span>{selectedListings.length} listing(s) selected</span>
            ) : (
              <span>No listings selected</span>
            )}
          </div>
          
          {selectedListings.length > 0 && (
            <div className="flex items-center gap-2">
              <Select
                value={bulkAction}
                onValueChange={setBulkAction}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Bulk Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="delete">Delete Selected</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={executeBulkAction}
                disabled={!bulkAction}
              >
                Apply
              </Button>
            </div>
          )}
        </div>
      )}

      {deleteError && (
        <div className="p-4 mb-6 bg-red-100 border border-red-400 text-red-700 rounded">
          <p><strong>Error:</strong> {deleteError}</p>
        </div>
      )}

      {listings.length === 0 && !isLoading ? (
        <p className="text-gray-600 dark:text-gray-300">
          No listings found. Click "Add New Listing" to create one.
        </p>
      ) : (
        <div className="overflow-x-auto bg-white dark:bg-gray-800 shadow-md rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listings.map((listing) => (
                <TableRow key={listing.id}>
                  <TableCell>
                    <Checkbox 
                      checked={listing.id ? selectedListings.includes(listing.id) : false}
                      onCheckedChange={() => listing.id && toggleListingSelection(listing.id)}
                    />
                  </TableCell>
                  <TableCell>{listing.name}</TableCell>
                  <TableCell>{listing.formatted_address}</TableCell>
                  <TableCell>{listing.rating ? `${listing.rating}/5 (${listing.user_ratings_total})` : 'No ratings'}</TableCell>
                  <TableCell>{listing.phone_number || 'None'}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      asChild
                    >
                      <Link to={`/admin/listings/edit/${listing.id}`}>Edit</Link>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      asChild
                    >
                      <Link to={`/listings/${listing.id}/${listing.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} target="_blank">Preview</Link>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-red-600 hover:text-red-800"
                      onClick={() => listing.id ? handleDeleteListing(listing.id) : undefined}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

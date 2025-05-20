import React, { useState, useEffect } from 'react';
import { Listing } from '@/types/listing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ListingFormProps {
  listing?: Listing | null;
  onSave: (listingData: Omit<Listing, 'id' | 'importedAt' | 'scrapedAt' | 'location' | 'openingHours' | 'reviews' | 'imageUrls' | 'categories' | 'additionalInfo'> | Listing) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  submissionError?: string | null;
}

// Define the shape for a new listing, excluding system-managed fields and complex types for now
const emptyListingData: Omit<Listing, 'id' | 'importedAt' | 'scrapedAt' | 'location' | 'openingHours' | 'reviews' | 'imageUrls' | 'categories' | 'additionalInfo' | 'totalScore' | 'reviewsCount' | 'placeId' | 'cid' | 'fid'> & { title: string; sourceUrl: string } = {
  title: '',
  price: '',
  categoryName: '',
  address: '',
  street: '',
  city: '',
  postalCode: '',
  state: '',
  countryCode: '',
  permanentlyClosed: false,
  temporarilyClosed: false,
  phone: '',
  website: '',
  imageUrl: '',
  featureImageURL: '',
  sourceUrl: '',
};

export function ListingForm({ 
  listing,
  onSave,
  onCancel,
  isSubmitting = false,
  submissionError = null 
}: ListingFormProps) {
  const [formData, setFormData] = useState<typeof emptyListingData | Listing>(listing || emptyListingData);

  useEffect(() => {
    if (listing) {
      // Ensure all fields in emptyListingData are present in listing or provide defaults
      const populatedListing = { ...emptyListingData, ...listing };
      setFormData(populatedListing);
    } else {
      setFormData(emptyListingData);
    }
  }, [listing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox' && e.target instanceof HTMLInputElement;
    setFormData(prev => ({ 
      ...prev, 
      [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value 
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
      alert('Title is required.');
      return;
    }
    // Type assertion needed here as onSave expects a specific Omit type or Listing
    onSave(formData as Omit<Listing, 'id' | 'importedAt' | 'scrapedAt' | 'location' | 'openingHours' | 'reviews' | 'imageUrls' | 'categories' | 'additionalInfo'> | Listing);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-gray-800 p-6 md:p-8 rounded-lg shadow-md mb-8">
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">
        {listing ? 'Edit Listing' : 'Add New Listing'}
      </h2>

      {submissionError && (
        <div className="p-3 mb-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <p><strong>Error:</strong> {submissionError}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" value={formData.title} onChange={handleChange} required disabled={isSubmitting} />
        </div>
        <div>
          <Label htmlFor="price">Price (e.g., $, $$, or 25.99)</Label>
          <Input id="price" name="price" value={formData.price || ''} onChange={handleChange} disabled={isSubmitting} />
        </div>
      </div>

      <div>
        <Label htmlFor="categoryName">Category Name</Label>
        <Input id="categoryName" name="categoryName" value={formData.categoryName || ''} onChange={handleChange} placeholder="e.g., Restaurant, Park" disabled={isSubmitting} />
      </div>
      
      <div>
        <Label htmlFor="address">Full Address</Label>
        <Input id="address" name="address" value={formData.address || ''} onChange={handleChange} placeholder="e.g., 123 Main St, Anytown, USA" disabled={isSubmitting} />
      </div>

      <div>
        <Label htmlFor="featureImageURL">Feature Image URL</Label>
        <Input 
          id="featureImageURL" 
          name="featureImageURL" 
          value={formData.featureImageURL || ''} 
          onChange={handleChange} 
          placeholder="e.g., https://example.com/image.jpg" 
          disabled={isSubmitting} 
        />
      </div>

      <div>
        <Label htmlFor="sourceUrl">Source URL (e.g., Google Maps, Yelp)</Label>
        <Input 
          id="sourceUrl" 
          name="sourceUrl" 
          value={formData.sourceUrl || ''} 
          onChange={handleChange} 
          placeholder="e.g., https://maps.google.com/?cid=12345" 
          disabled={isSubmitting} 
        />
      </div>

      {/* Add more fields as needed: street, city, postalCode, state, countryCode, phone, website, imageUrl etc. */}
      {/* Example for a boolean (checkbox) field */}
      {/* <div className="flex items-center space-x-2">
        <Input type="checkbox" id="permanentlyClosed" name="permanentlyClosed" checked={formData.permanentlyClosed || false} onChange={handleChange} disabled={isSubmitting} className="h-4 w-4" />
        <Label htmlFor="permanentlyClosed">Permanently Closed</Label>
      </div> */}

      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : (listing ? 'Save Changes' : 'Create Listing')}
        </Button>
      </div>
    </form>
  );
}

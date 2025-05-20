import * as React from 'react';
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Listing } from '@/types/listing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { AlertCircle, Save, Trash2, ArrowLeft, Upload, Image as ImageIcon, Star, HelpCircle, Plus, X } from 'lucide-react';

// Alert components for notifications
const Alert = ({ variant, className = "", children }: { variant?: string, className?: string, children: React.ReactNode }) => {
  const bgColor = variant === 'destructive' ? 'bg-red-50 border-red-200 text-red-800' : className;
  return <div className={`p-4 rounded border ${bgColor}`}>{children}</div>;
};
const AlertTitle = ({ children }: { children: React.ReactNode }) => <h4 className="font-bold">{children}</h4>;
const AlertDescription = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;

export function EditListingPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('basic');
  const [newImageUrl, setNewImageUrl] = useState<string>('');
  const [faqItems, setFaqItems] = useState<Array<{question: string, answer: string}>>([]);

  // API URL configuration
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
  const useLocalProxy = true;
  const localProxyUrl = 'http://localhost:8080/api/proxy';
  
  const getApiUrl = (endpoint: string) => {
    if (useLocalProxy) {
      // Make sure the endpoint starts with a slash
      const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      return `${localProxyUrl}${formattedEndpoint}`;
    } else {
      return `${API_BASE_URL || 'https://newdirectory-8xry0lg17-gabriel-machurets-projects.vercel.app'}${endpoint}`;
    }
  };
  
  // Log the API URLs for debugging
  console.log('API Base URL:', API_BASE_URL);
  console.log('Local Proxy URL:', localProxyUrl);
  console.log('Example API URL:', getApiUrl(`/api/listings/${id}`));

  // Fetch the listing data
  useEffect(() => {
    const fetchListing = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(getApiUrl(`/api/listings/${id}`));
        if (!response.ok) {
          throw new Error(`Error fetching listing: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Initialize google_image_urls_json as empty array if it doesn't exist
        if (!data.google_image_urls_json) {
          data.google_image_urls_json = JSON.stringify([]);
        }
        
        setListing(data);
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
  }, [id]);

  // Handle form field changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (!listing) return;
    
    console.log(`Updating field: ${name} with value: ${value}`);
    
    // Create a deep copy of the listing to avoid reference issues
    const updatedListing = {
      ...listing,
      [name]: value,
    };
    
    console.log('Updated listing:', updatedListing);
    setListing(updatedListing);
  };
  
  // Handle switch toggle changes
  const handleSwitchChange = (name: string, checked: boolean) => {
    if (!listing) return;
    
    setListing({
      ...listing,
      [name]: checked,
    });
  };
  
  // Handle FAQ item changes
  const handleFaqChange = (index: number, field: 'question' | 'answer', value: string) => {
    const updatedFaqs = [...faqItems];
    updatedFaqs[index][field] = value;
    setFaqItems(updatedFaqs);
  };
  
  // Add a new FAQ item
  const addFaqItem = () => {
    setFaqItems([...faqItems, { question: '', answer: '' }]);
  };
  
  // Remove an FAQ item
  const removeFaqItem = (index: number) => {
    const updatedFaqs = [...faqItems];
    updatedFaqs.splice(index, 1);
    setFaqItems(updatedFaqs);
  };
  
  // Generate FAQs using OpenAI
  const generateFaqs = async () => {
    if (!listing || !listing.id) return;
    
    setIsSaving(true);
    setSaveError(null);
    
    try {
      const response = await fetch(getApiUrl(`/api/ai/faq/${listing.id}`), {
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
      
      if (data.faqs && Array.isArray(data.faqs)) {
        setFaqItems(data.faqs);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'An unknown error occurred');
      console.error('Error generating FAQs:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listing) return;
    
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    
    try {
      // Prepare the data to send
      const dataToSend = {
        ...listing,
        faqs: faqItems.length > 0 ? faqItems : undefined,
      };
      
      // Log the data being sent and the URL
      const url = getApiUrl(`/api/listings/${id}`);
      console.log('Updating listing at URL:', url);
      console.log('Data being sent:', dataToSend);
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(dataToSend),
      });
      
      // Log the response status
      console.log(`Update response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error response: ${errorText}`);
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.error || `Error saving listing: ${response.status}`);
        } catch (parseError) {
          throw new Error(`Error saving listing: ${response.status} - ${errorText.substring(0, 100)}`);
        }
      }
      
      // Get response as text first for debugging
      const responseText = await response.text();
      console.log('Response text:', responseText.substring(0, 200));
      
      // Parse the JSON if possible
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('Parsed response data:', data);
      } catch (jsonError) {
        console.warn('Response is not valid JSON, but the update may have succeeded');
        setSaveSuccess(true);
        return;
      }
      
      setSaveSuccess(true);
      
      // Update the listing with the returned data
      if (data && data.id) {
        setListing(data);
      }
      
      // Scroll to top to show success message
      window.scrollTo(0, 0);
    } catch (error) {
      console.error('Error saving listing:', error);
      setSaveError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle listing deletion
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
      return;
    }
    
    setIsSaving(true);
    setSaveError(null);
    
    try {
      const response = await fetch(getApiUrl(`/api/listings/${id}`), {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `Error deleting listing: ${response.status}`);
      }
      
      // Redirect to listings page after successful deletion
      navigate('/admin/listings');
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'An unknown error occurred');
      console.error('Error deleting listing:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle adding a new image to the gallery
  const handleAddGalleryImage = () => {
    if (!listing || !newImageUrl) return;
    
    try {
      const currentImages = listing.google_image_urls_json 
        ? JSON.parse(listing.google_image_urls_json as string) 
        : [];
      
      setListing({
        ...listing,
        google_image_urls_json: JSON.stringify([...currentImages, newImageUrl])
      });
      
      setNewImageUrl('');
    } catch (error) {
      console.error('Error adding image:', error);
    }
  };
  
  // Handle removing an image from the gallery
  const handleRemoveGalleryImage = (index: number) => {
    if (!listing || !listing.google_image_urls_json) return;
    
    try {
      const images = JSON.parse(listing.google_image_urls_json as string);
      images.splice(index, 1);
      
      setListing({
        ...listing,
        google_image_urls_json: JSON.stringify(images)
      });
    } catch (error) {
      console.error('Error removing image:', error);
    }
  };
  
  // Handle setting the feature image
  const handleSetFeatureImage = () => {
    if (!listing || !newImageUrl) return;
    
    setListing({
      ...listing,
      main_image_url: newImageUrl
    });
    
    setNewImageUrl('');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading listing details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="text-center mt-4">
          <Button variant="outline" asChild>
            <Link to="/admin/listings">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Listings
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Listing not found</div>
        <div className="text-center mt-4">
          <Button variant="outline" asChild>
            <Link to="/admin/listings">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Listings
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Edit Listing</h1>
        <Button variant="outline" asChild>
          <Link to="/admin/listings">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Listings
          </Link>
        </Button>
      </div>

      {saveError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{saveError}</AlertDescription>
        </Alert>
      )}

      {saveSuccess && (
        <Alert className="mb-6 bg-green-50 text-green-800 border-green-200">
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>Listing updated successfully</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <div>
          {/* Tabs navigation */}
          <div className="flex space-x-2 mb-6 overflow-x-auto">
            <button 
              type="button"
              className={`px-4 py-2 border rounded ${activeTab === 'basic' ? 'bg-primary text-primary-foreground' : ''}`}
              onClick={() => setActiveTab('basic')}
            >
              Basic Information
            </button>
            <button 
              type="button"
              className={`px-4 py-2 border rounded ${activeTab === 'contact' ? 'bg-primary text-primary-foreground' : ''}`}
              onClick={() => setActiveTab('contact')}
            >
              Contact & Location
            </button>
            <button 
              type="button"
              className={`px-4 py-2 border rounded ${activeTab === 'additional' ? 'bg-primary text-primary-foreground' : ''}`}
              onClick={() => setActiveTab('additional')}
            >
              Additional Info
            </button>
            <button 
              type="button"
              className={`px-4 py-2 border rounded ${activeTab === 'seo' ? 'bg-primary text-primary-foreground' : ''}`}
              onClick={() => setActiveTab('seo')}
            >
              SEO
            </button>
            <button 
              type="button"
              className={`px-4 py-2 border rounded ${activeTab === 'images' ? 'bg-primary text-primary-foreground' : ''}`}
              onClick={() => setActiveTab('images')}
            >
              Images
            </button>
            <button 
              type="button"
              className={`px-4 py-2 border rounded ${activeTab === 'faq' ? 'bg-primary text-primary-foreground' : ''}`}
              onClick={() => setActiveTab('faq')}
            >
              FAQ
            </button>
          </div>

          {/* Basic Information Tab */}
          <div style={{ display: activeTab === 'basic' ? 'block' : 'none' }}>
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Business Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={listing.name || ''}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="main_type">Primary Category</Label>
                    <Input
                      id="main_type"
                      name="main_type"
                      value={listing.main_type || ''}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={listing.description || ''}
                      onChange={handleInputChange}
                      rows={5}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between space-x-2 border p-4 rounded-md bg-gray-50 dark:bg-gray-800">
                    <div className="flex items-center space-x-2">
                      <Star className="h-5 w-5 text-yellow-500" />
                      <div>
                        <Label htmlFor="is_featured" className="text-base">Featured Listing</Label>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Featured listings appear at the top of search results and on the featured page
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="is_featured"
                      checked={listing.is_featured || false}
                      onCheckedChange={(checked) => handleSwitchChange('is_featured', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact & Location Tab */}
          <div style={{ display: activeTab === 'contact' ? 'block' : 'none' }}>
            <Card>
              <CardHeader>
                <CardTitle>Contact & Location</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone_number">Phone Number</Label>
                    <Input
                      id="phone_number"
                      name="phone_number"
                      value={listing.phone_number || ''}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      name="website"
                      value={listing.website || ''}
                      onChange={handleInputChange}
                      type="url"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="formatted_address">Full Address</Label>
                  <Input
                    id="formatted_address"
                    name="formatted_address"
                    value={listing.formatted_address || ''}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input
                      id="latitude"
                      name="latitude"
                      value={listing.latitude || ''}
                      onChange={handleInputChange}
                      type="number"
                      step="any"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input
                      id="longitude"
                      name="longitude"
                      value={listing.longitude || ''}
                      onChange={handleInputChange}
                      type="number"
                      step="any"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Info Tab */}
          <div style={{ display: activeTab === 'additional' ? 'block' : 'none' }}>
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rating">Rating</Label>
                    <Input
                      id="rating"
                      name="rating"
                      value={listing.rating || ''}
                      onChange={handleInputChange}
                      type="number"
                      min="0"
                      max="5"
                      step="0.1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="user_ratings_total">Number of Reviews</Label>
                    <Input
                      id="user_ratings_total"
                      name="user_ratings_total"
                      value={listing.user_ratings_total || ''}
                      onChange={handleInputChange}
                      type="number"
                      min="0"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="google_place_id">Google Place ID</Label>
                  <Input
                    id="google_place_id"
                    name="google_place_id"
                    value={listing.google_place_id || ''}
                    onChange={handleInputChange}
                    disabled
                  />
                  <p className="text-sm text-gray-500">This field cannot be edited</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* SEO Tab */}
          <div style={{ display: activeTab === 'seo' ? 'block' : 'none' }}>
            <Card>
              <CardHeader>
                <CardTitle>SEO Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="seo_title">SEO Title</Label>
                  <Input
                    id="seo_title"
                    name="seo_title"
                    value={listing.seo_title || ''}
                    onChange={handleInputChange}
                    placeholder="SEO optimized title (leave blank to use business name)"
                  />
                  <p className="text-xs text-gray-500">If left blank, the business name will be used</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="seo_description">Meta Description</Label>
                  <Textarea
                    id="seo_description"
                    name="seo_description"
                    value={listing.seo_description || ''}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="SEO meta description (150-160 characters recommended)"
                  />
                  <p className="text-xs text-gray-500">
                    {(listing.seo_description?.length || 0)} characters 
                    {(listing.seo_description?.length || 0) > 160 && 
                      <span className="text-red-500"> (too long)</span>}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="seo_keywords">Meta Keywords</Label>
                  <Input
                    id="seo_keywords"
                    name="seo_keywords"
                    value={listing.seo_keywords || ''}
                    onChange={handleInputChange}
                    placeholder="Comma-separated keywords"
                  />
                  <p className="text-xs text-gray-500">Separate keywords with commas</p>
                </div>

                <div className="space-y-2">
                  <Label>SEO-Friendly URL</Label>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded border">
                    <code className="text-sm">
                      /listings/{listing.id}/{listing.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')}
                    </code>
                  </div>
                  <p className="text-xs text-gray-500">This URL is automatically generated from the business name</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Images Tab */}
          <div style={{ display: activeTab === 'images' ? 'block' : 'none' }}>
            <Card>
              <CardHeader>
                <CardTitle>Images</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="main_image_url">Main Image URL</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="main_image_url"
                      name="main_image_url"
                      value={listing.main_image_url || ''}
                      onChange={handleInputChange}
                      placeholder="https://example.com/image.jpg"
                      className="flex-1"
                    />
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => {
                        if (listing.main_image_url) {
                          setNewImageUrl(listing.main_image_url);
                        }
                      }}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                  </div>
                </div>
                
                {newImageUrl && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium mb-2">Image Preview</h3>
                    <div className="border rounded-md overflow-hidden">
                      <img 
                        src={newImageUrl} 
                        alt="Preview" 
                        className="max-h-64 mx-auto"
                        onError={(e) => {
                          // If image fails to load, show a placeholder
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Invalid+Image+URL';
                        }}
                      />
                    </div>
                  </div>
                )}
                
                <div className="flex gap-2">
                    <Input
                      placeholder="Enter image URL"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      className="flex-1"
                    />
                    <Button 
                      type="button" 
                      onClick={handleSetFeatureImage}
                      disabled={!newImageUrl}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Set Feature Image
                    </Button>
                  </div>
                </div>

                {/* Gallery Images Section */}
                <div>
                  <h3 className="text-lg font-medium mb-2">Gallery Images</h3>
                  <p className="text-sm text-gray-500 mb-4">These images will be displayed in the gallery on the detail page</p>
                  
                  {listing.google_image_urls_json && JSON.parse(listing.google_image_urls_json as string)?.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
                      {JSON.parse(listing.google_image_urls_json as string).map((imageUrl: string, index: number) => (
                        <div key={index} className="relative">
                          <img 
                            src={imageUrl} 
                            alt={`Gallery image ${index + 1}`} 
                            className="rounded-md border object-cover w-full h-32"
                          />
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            className="absolute top-2 right-2 h-6 w-6 p-0"
                            type="button"
                            onClick={() => handleRemoveGalleryImage(index)}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="border border-dashed rounded-md p-8 text-center bg-gray-50 dark:bg-gray-800 mb-4">
                      <ImageIcon className="h-12 w-12 mx-auto text-gray-400" />
                      <p className="mt-2 text-sm text-gray-500">No gallery images available</p>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter image URL"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      className="flex-1"
                    />
                    <Button 
                      type="button" 
                      onClick={handleAddGalleryImage}
                      disabled={!newImageUrl}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Add to Gallery
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-6 flex justify-between">
          <Button 
            type="button" 
            variant="destructive" 
            onClick={handleDelete}
            disabled={isSaving}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Listing
          </Button>
          
          <Button 
            type="submit" 
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

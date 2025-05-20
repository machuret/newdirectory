import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Listing } from '../../types/listing';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { AlertCircle, Save, Trash2, ArrowLeft, Upload, Image as ImageIcon, Star } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';

// Alert components for notifications
const Alert = ({ variant, className = "", children }: { variant?: string, className?: string, children: React.ReactNode }) => {
  const bgColor = variant === 'destructive' ? 'bg-red-50 border-red-200 text-red-800' : className;
  return <div className={`p-4 rounded border ${bgColor}`}>{children}</div>;
};
const AlertTitle = ({ children }: { children: React.ReactNode }) => <h4 className="font-bold">{children}</h4>;
const AlertDescription = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;

export function EditListingPageFixed() {
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

  // API URL configuration
  const useLocalProxy = true;
  const localProxyUrl = 'http://localhost:8080/api/proxy';
  
  const getApiUrl = (endpoint: string) => {
    if (useLocalProxy) {
      // Make sure the endpoint starts with a slash
      const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      return `${localProxyUrl}${formattedEndpoint}`;
    } else {
      return `/api${endpoint}`;
    }
  };
  
  // Fetch listing data
  useEffect(() => {
    const fetchListing = async () => {
      if (!id) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const url = getApiUrl(`/api/listings/${id}`);
        console.log('Fetching listing from:', url);
        
        const response = await fetch(url);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Error fetching listing (${response.status}):`, errorText);
          throw new Error(`Error fetching listing: ${response.status}`);
        }
        
        // Get response as text first for debugging
        const responseText = await response.text();
        console.log('Listing response text:', responseText.substring(0, 200));
        
        // Parse the JSON
        let data;
        try {
          data = JSON.parse(responseText);
          console.log('Parsed listing data:', data);
        } catch (jsonError) {
          console.error('Error parsing listing JSON:', jsonError);
          throw new Error('Invalid JSON response from listing endpoint');
        }
        
        // Handle different response formats
        let listingData;
        if (data && data.id) {
          listingData = data;
        } else if (data && data.data && data.data.id) {
          listingData = data.data;
        } else {
          console.warn('Unexpected listing response format:', data);
          throw new Error('Unexpected listing response format');
        }
        
        setListing(listingData);
      } catch (e) {
        console.error('Error in fetchListing:', e);
        setError(e instanceof Error ? e.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchListing();
  }, [id]);
  
  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (!listing) return;
    
    console.log(`Updating field: ${name} with value: ${value}`);
    
    setListing({
      ...listing,
      [name]: value,
    });
  };
  
  // Handle switch toggle changes
  const handleSwitchChange = (name: string, checked: boolean) => {
    if (!listing) return;
    
    console.log(`Toggling ${name} to ${checked}`);
    
    setListing({
      ...listing,
      [name]: checked,
    });
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listing) return;
    
    // Validate required fields
    if (!listing.name || listing.name.trim() === '') {
      setSaveError('Name is required');
      window.scrollTo(0, 0);
      return;
    }
    
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    
    try {
      // Ensure all required fields are included
      const dataToSend = {
        ...listing,
        name: listing.name.trim(), // Ensure name is trimmed
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
        throw new Error(`Error saving listing: ${response.status}`);
      }
      
      // Get response as text first for debugging
      const responseText = await response.text();
      console.log('Response text:', responseText.substring(0, 200));
      
      // Parse the JSON if possible
      let data;
      try {
        if (responseText.trim()) {
          data = JSON.parse(responseText);
          console.log('Parsed response data:', data);
        }
      } catch (jsonError) {
        console.warn('Response is not valid JSON, but the update may have succeeded');
      }
      
      setSaveSuccess(true);
      
      // Update the listing with the returned data if available
      if (data && data.id) {
        setListing(data);
      }
      
      // Scroll to top to show success message
      window.scrollTo(0, 0);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error saving listing:', error);
      setSaveError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle delete
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
        throw new Error(`Error deleting listing: ${response.status}`);
      }
      
      // Redirect to listings page
      navigate('/admin/listings');
    } catch (error) {
      console.error('Error deleting listing:', error);
      setSaveError(error instanceof Error ? error.message : 'An unknown error occurred');
      setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p>Loading listing...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button asChild variant="outline">
            <Link to="/admin/listings"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Listings</Link>
          </Button>
        </div>
      </div>
    );
  }
  
  if (!listing) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Listing not found</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button asChild variant="outline">
            <Link to="/admin/listings"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Listings</Link>
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Edit Listing: {listing.name}</h1>
        <Button asChild variant="outline">
          <Link to="/admin/listings"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Listings</Link>
        </Button>
      </div>
      
      {saveSuccess && (
        <Alert className="bg-green-50 border-green-200 text-green-800">
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>Listing updated successfully!</AlertDescription>
        </Alert>
      )}
      
      {saveError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{saveError}</AlertDescription>
        </Alert>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="basic">Basic Information</TabsTrigger>
            <TabsTrigger value="contact">Contact & Location</TabsTrigger>
            <TabsTrigger value="media">Media & SEO</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="space-y-4 pt-4">
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
          </TabsContent>
          
          <TabsContent value="contact" className="space-y-4 pt-4">
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
          </TabsContent>
          
          <TabsContent value="media" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Media & SEO</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="main_image_url">Main Image URL</Label>
                  <Input
                    id="main_image_url"
                    name="main_image_url"
                    value={listing.main_image_url || ''}
                    onChange={handleInputChange}
                    type="url"
                  />
                  {listing.main_image_url && (
                    <div className="mt-2 border rounded-md overflow-hidden">
                      <img 
                        src={listing.main_image_url} 
                        alt={listing.name} 
                        className="w-full h-auto max-h-40 object-cover"
                      />
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="seo_title">SEO Title</Label>
                  <Input
                    id="seo_title"
                    name="seo_title"
                    value={listing.seo_title || ''}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="seo_description">SEO Description</Label>
                  <Textarea
                    id="seo_description"
                    name="seo_description"
                    value={listing.seo_description || ''}
                    onChange={handleInputChange}
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="seo_keywords">SEO Keywords</Label>
                  <Input
                    id="seo_keywords"
                    name="seo_keywords"
                    value={listing.seo_keywords || ''}
                    onChange={handleInputChange}
                    placeholder="keyword1, keyword2, keyword3"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-between">
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={isSaving}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Listing
          </Button>
          
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                Saving...
              </>
            ) : (
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

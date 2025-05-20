import * as React from 'react';
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Listing } from '@/types/listing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { AlertCircle, Save, Trash2, ArrowLeft, Plus, X } from 'lucide-react';

// Alert components for notifications
const Alert = ({ variant, className = "", children }: { variant?: string, className?: string, children: React.ReactNode }) => {
  const bgColor = variant === 'destructive' ? 'bg-red-50 border-red-200 text-red-800' : className;
  return <div className={`p-4 rounded border ${bgColor}`}>{children}</div>;
};
const AlertTitle = ({ children }: { children: React.ReactNode }) => <h4 className="font-bold">{children}</h4>;
const AlertDescription = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;

export function EditListingPageSimplified() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('faq');
  const [faqItems, setFaqItems] = useState<Array<{question: string, answer: string}>>([]);

  // API URL configuration
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
  const useLocalProxy = true;
  const localProxyUrl = 'http://localhost:8080/api/proxy/api';
  
  const getApiUrl = (endpoint: string) => {
    if (useLocalProxy) {
      return `${localProxyUrl}${endpoint}`;
    } else {
      return `${API_BASE_URL || 'https://api.example.com'}${endpoint}`;
    }
  };

  // Fetch the listing data
  useEffect(() => {
    const fetchListing = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(getApiUrl(`/listings/${id}`));
        
        if (!response.ok) {
          throw new Error(`Failed to fetch listing: ${response.statusText}`);
        }
        
        const data = await response.json();
        setListing(data);
        
        // Initialize FAQ items if they exist
        if (data.faq && Array.isArray(data.faq)) {
          setFaqItems(data.faq);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (id) {
      fetchListing();
    }
  }, [id]);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (listing) {
      setListing({
        ...listing,
        [name]: value
      });
    }
  };

  // Handle FAQ item changes
  const handleFaqChange = (index: number, field: 'question' | 'answer', value: string) => {
    const updatedFaqItems = [...faqItems];
    updatedFaqItems[index][field] = value;
    setFaqItems(updatedFaqItems);
  };

  // Add a new FAQ item
  const addFaqItem = () => {
    setFaqItems([...faqItems, { question: '', answer: '' }]);
  };

  // Remove an FAQ item
  const removeFaqItem = (index: number) => {
    const updatedFaqItems = [...faqItems];
    updatedFaqItems.splice(index, 1);
    setFaqItems(updatedFaqItems);
  };

  // Generate FAQs using AI
  const generateFaqs = async () => {
    if (!listing || !id) return;
    
    try {
      setIsSaving(true);
      const response = await fetch(getApiUrl(`/ai/generate-faqs/${id}`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to generate FAQs: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.faqs) {
        setFaqItems(data.faqs);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to generate FAQs');
      setTimeout(() => setSaveError(null), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!listing || !id) return;
    
    try {
      setIsSaving(true);
      setSaveError(null);
      
      // Prepare the updated listing data with FAQs
      const updatedListing = {
        ...listing,
        faq: faqItems
      };
      
      const response = await fetch(getApiUrl(`/listings/${id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedListing)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update listing: ${response.statusText}`);
      }
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading listing details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button asChild>
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
        <Alert variant="destructive">
          <AlertTitle>Not Found</AlertTitle>
          <AlertDescription>The requested listing could not be found.</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button asChild>
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
        <h1 className="text-2xl font-bold">Edit Listing: {listing.name}</h1>
        <Button asChild variant="outline">
          <Link to="/admin/listings">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Listings
          </Link>
        </Button>
      </div>
      
      {saveError && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{saveError}</AlertDescription>
        </Alert>
      )}
      
      {saveSuccess && (
        <Alert className="mb-4 bg-green-50 border-green-200 text-green-800">
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>Listing updated successfully!</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <div>
          {/* Tabs navigation */}
          <div className="flex space-x-2 mb-6 overflow-x-auto">
            <button 
              type="button"
              className={`px-4 py-2 border rounded ${activeTab === 'faq' ? 'bg-primary text-primary-foreground' : ''}`}
              onClick={() => setActiveTab('faq')}
            >
              FAQ
            </button>
          </div>

          {/* FAQ Tab */}
          <div style={{ display: activeTab === 'faq' ? 'block' : 'none' }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>Frequently Asked Questions</span>
                  <Button 
                    type="button" 
                    onClick={generateFaqs}
                    disabled={isSaving}
                  >
                    Generate FAQs with AI
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {faqItems.map((faq, index) => (
                    <div key={index} className="border p-4 rounded-md">
                      <div className="flex justify-between mb-2">
                        <h3 className="font-medium">FAQ Item #{index + 1}</h3>
                        <Button 
                          type="button" 
                          variant="destructive" 
                          size="sm"
                          onClick={() => removeFaqItem(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor={`faq-question-${index}`}>Question</Label>
                          <Input
                            id={`faq-question-${index}`}
                            value={faq.question}
                            onChange={(e) => handleFaqChange(index, 'question', e.target.value)}
                            placeholder="Enter a question"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor={`faq-answer-${index}`}>Answer</Label>
                          <Textarea
                            id={`faq-answer-${index}`}
                            value={faq.answer}
                            onChange={(e) => handleFaqChange(index, 'answer', e.target.value)}
                            placeholder="Enter an answer"
                            rows={3}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={addFaqItem}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add FAQ Item
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
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

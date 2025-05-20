import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
// Import alert components for notifications
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Save } from 'lucide-react';
import { API_CONFIG } from '@/config/api.config';

// Dummy AdminLayout component - replace with actual component from your project
const AdminLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="admin-layout">{children}</div>
);

// Interfaces
interface ContentItem {
  content: string;
  isDirty: boolean;
}

interface HomepageContent {
  [sectionId: string]: {
    [contentKey: string]: ContentItem;
  };
}

interface SectionDefinition {
  id: string;
  label: string;
  fields: {
    key: string;
    label: string;
    type: 'input' | 'textarea';
    placeholder?: string;
  }[];
}

// Define the structure of our homepage sections
const homepageSections: SectionDefinition[] = [
  {
    id: 'header',
    label: 'Header',
    fields: [
      { key: 'title', label: 'Title', type: 'input', placeholder: 'Find Your Perfect Local Business' },
      { key: 'subtitle', label: 'Subtitle', type: 'textarea', placeholder: 'Discover and connect with the best local businesses in your area' },
      { key: 'buttonText', label: 'Button Text', type: 'input', placeholder: 'Explore Now' },
    ],
  },
  {
    id: 'featureListings',
    label: 'Featured Listings',
    fields: [
      { key: 'title', label: 'Section Title', type: 'input', placeholder: 'Featured Listings' },
      { key: 'subtitle', label: 'Section Subtitle', type: 'input', placeholder: 'Explore our top-rated local businesses' },
    ],
  },
  {
    id: 'directory',
    label: 'Directory',
    fields: [
      { key: 'title', label: 'Section Title', type: 'input', placeholder: 'Browse Our Directory' },
      { key: 'subtitle', label: 'Section Subtitle', type: 'input', placeholder: 'Find businesses by category' },
    ],
  },
  {
    id: 'blog',
    label: 'Blog Section',
    fields: [
      { key: 'title', label: 'Main Title', type: 'input', placeholder: 'Latest Updates' },
      { key: 'subtitle', label: 'Subtitle', type: 'input', placeholder: 'From our blog' },
      { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Stay updated with the latest news and tips from local businesses' },
      { key: 'buttonText', label: 'Button Text', type: 'input', placeholder: 'View All Articles' },
    ],
  },
  {
    id: 'getStarted',
    label: 'Call to Action',
    fields: [
      { key: 'title', label: 'Title', type: 'input', placeholder: 'Try Our Platform' },
      { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Join thousands of happy users discovering local businesses with our platform' },
      { key: 'primaryButtonText', label: 'Primary Button Text', type: 'input', placeholder: 'Get Started' },
      { key: 'secondaryButtonText', label: 'Secondary Button Text', type: 'input', placeholder: 'Learn More' },
    ],
  },
  {
    id: 'footer',
    label: 'Footer',
    fields: [
      { key: 'copyright', label: 'Copyright Text', type: 'input', placeholder: '© 2025 Local Business Directory. All rights reserved.' },
    ],
  },
];

export default function HomepageCustomizePage() {
  const [content, setContent] = useState<HomepageContent>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(homepageSections[0].id);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info' | null;
    message: string;
  }>({ type: null, message: '' });
  
  // Show a notification message
  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    // Auto-hide notification after 5 seconds
    setTimeout(() => {
      setNotification({ type: null, message: '' });
    }, 5000);
  };

  // Fetch all homepage content
  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_CONFIG.getBaseUrl()}/homepage?grouped=true`);
        if (!response.ok) {
          throw new Error('Failed to fetch homepage content');
        }
        
          
          if (result.ok) {
            const data = await result.json();
            const formattedContent: HomepageContent = {};
            
            // Process the data into our expected format
            if (Array.isArray(data)) {
              data.forEach(item => {
                if (!formattedContent[item.section_id]) {
                  formattedContent[item.section_id] = {};
                }
                
                formattedContent[item.section_id][item.content_key] = item.content;
              });
            } else {
              // If data is already in the right format
              Object.assign(formattedContent, data);
            }
            
            // Store in local storage for future use
            localStorage.setItem('homepageContent', JSON.stringify(formattedContent));
            setContent(formattedContent);
            return; // Exit function if API fetch works
          }
        } catch (apiError) {
          console.log('API fetch failed, using local storage backup', apiError);
        }
        
        // If the API fetch fails, try local storage
        const storedContent = localStorage.getItem('homepageContent');
        if (storedContent) {
          const parsedContent = JSON.parse(storedContent);
          setContent(parsedContent);
          showNotification('info', 'Using saved homepage content from your browser.');
          return;
        }
        
        // If neither API nor local storage works, use default content
        const defaultContent: HomepageContent = {
          header: {
            title: 'Find Your Perfect Local Business',
            subtitle: 'Discover and connect with the best local businesses in your area',
            buttonText: 'Explore Now'
          },
          featureListings: {
            title: 'Featured Listings',
            subtitle: 'Explore our top-rated local businesses'
          },
          directory: {
            title: 'Browse Our Directory',
            subtitle: 'Find businesses by category'
          },
          blog: {
            title: 'Latest Updates',
            subtitle: 'From our blog',
            description: 'Stay updated with the latest news and tips from local businesses',
            buttonText: 'View All Articles'
          },
          getStarted: {
            title: 'Try Our Platform',
            description: 'Join thousands of happy users discovering local businesses with our platform',
            primaryButtonText: 'Get Started',
            secondaryButtonText: 'Learn More'
          },
          footer: {
            copyright: ' 2025 Local Business Directory. All rights reserved.'
          }
        };
        
        setContent(defaultContent);
        localStorage.setItem('homepageContent', JSON.stringify(defaultContent));
        showNotification('info', 'Using default homepage content. Your changes will be saved locally.');
      } catch (error) {
        console.error('Error loading homepage content:', error);
        showNotification('error', 'Failed to load homepage content.');
      } finally {
        setLoading(false);
      }
    }
    
    loadHomepageContent();
  }, []);

  // Handle content changes
  const handleContentChange = (sectionId: string, contentKey: string, value: string) => {
    setContent(prevContent => ({
      ...prevContent,
      [sectionId]: {
        ...prevContent[sectionId],
        [contentKey]: {
          content: value,
          isDirty: true
        }
      }
    }));
  };

  // Save changes to the homepage content
  const saveChanges = async () => {
    setSaving(true);
    
    try {
      // Find all dirty fields and prepare updates
      const updates = [];
      
      Object.entries(content).forEach(([sectionId, sectionContent]) => {
        Object.entries(sectionContent).forEach(([contentKey, contentItem]) => {
          if (contentItem.isDirty) {
            updates.push({
              section_id: sectionId, // Use snake_case for API compatibility
              content_key: contentKey, // Use snake_case for API compatibility
              content: contentItem.content
            });
          }
        });
      });
      
      if (updates.length === 0) {
        showNotification('info', 'No changes to save.');
        setSaving(false);
        return;
      }
      
      console.log('Sending updates:', updates);
      
      // Send updates to API with proper structure
      const response = await fetch(`${API_CONFIG.getBaseUrl()}/homepage`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ updates }) // Wrap updates in an object
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        throw new Error(`Failed to save: ${response.status}`);
      }
      
      // Update all dirty flags to false
      const updatedContent = { ...content };
      
      updates.forEach((update) => {
        const { section_id, content_key } = update;
        if (updatedContent[section_id] && updatedContent[section_id][content_key]) {
          updatedContent[section_id][content_key].isDirty = false;
        }
      });
      
      setContent(updatedContent);
      
      showNotification('success', 'Homepage content updated successfully.');
    } catch (error) {
      console.error('Error saving homepage content:', error);
      showNotification('error', 'Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Render the input field based on its type
  const renderField = (section: SectionDefinition, field: SectionDefinition['fields'][0]) => {
    const contentItem = content[section.id]?.[field.key] || { content: '', isDirty: false };
    
    return (
      <div className="space-y-2 mb-6" key={`${section.id}-${field.key}`}>
        <div className="flex items-center">
          <Label htmlFor={`${section.id}-${field.key}`} className="text-sm font-medium">
            {field.label}
          </Label>
          {contentItem.isDirty && (
            <span className="ml-2 text-xs px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full">
              Modified
            </span>
          )}
        </div>
        
        {field.type === 'textarea' ? (
          <Textarea
            id={`${section.id}-${field.key}`}
            placeholder={field.placeholder}
            value={contentItem.content}
            onChange={(e) => handleContentChange(section.id, field.key, e.target.value)}
            className="min-h-[100px]"
          />
        ) : (
          <Input
            id={`${section.id}-${field.key}`}
            placeholder={field.placeholder}
            value={contentItem.content}
            onChange={(e) => handleContentChange(section.id, field.key, e.target.value)}
          />
        )}
      </div>
    );
  };

  // Check if any fields have been modified
  const hasChanges = () => {
    return Object.values(content).some(section => 
      Object.values(section).some(field => field.isDirty)
    );
  };

  return (
    <AdminLayout>
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between border-b pb-3">
            <div>
              <CardTitle>Customize Homepage</CardTitle>
              <CardDescription>
                Edit the content displayed on the homepage
              </CardDescription>
            </div>
            
            {/* Notification alerts */}
            {notification.type && (
              <Alert className={`mb-4 ${notification.type === 'error' ? 'bg-red-50 text-red-800 border-red-200' : notification.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-blue-50 text-blue-800 border-blue-200'}`}>
                <AlertTitle className="text-sm font-medium">
                  {notification.type === 'error' ? 'Error' : notification.type === 'success' ? 'Success' : 'Information'}
                </AlertTitle>
                <AlertDescription className="text-sm">
                  {notification.message}
                </AlertDescription>
              </Alert>
            )}
            <Button 
              onClick={saveChanges} 
              disabled={loading || saving || !hasChanges()}
              className="flex items-center"
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
          </CardHeader>
          
          <CardContent className="pt-6">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-6">
                  {homepageSections.map((section) => (
                    <TabsTrigger key={section.id} value={section.id}>
                      {section.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                {homepageSections.map((section) => (
                  <TabsContent key={section.id} value={section.id} className="space-y-4">
                    <div className="p-1">
                      {section.fields.map((field) => renderField(section, field))}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

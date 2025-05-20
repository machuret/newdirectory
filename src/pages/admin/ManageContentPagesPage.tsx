import { useState, useEffect } from 'react';
import { Page } from '../../types/page'; 
import { Button } from '../../components/ui/button'; 
import { PlusCircle, Edit, Trash2 } from 'lucide-react'; 
import { PageForm } from '../../components/admin/forms/PageForm'; 
import { contentPagesApi } from '../../services/apiService';

export function ManageContentPagesPage() {
  const [pages, setPages] = useState<Page[]>([]);
  const [isLoading, setIsLoading] = useState(true); 
  const [isSubmitting, setIsSubmitting] = useState(false); 
  const [error, setError] = useState<string | null>(null); // submissionError for the form
  const [showForm, setShowForm] = useState(false); 
  const [editingPage, setEditingPage] = useState<Page | null>(null); 

  const handleAddNewPage = () => {
    setEditingPage(null); 
    setError(null); // Clear previous errors when opening form
    setShowForm(true); 
  };

  const handleEditPage = (page: Page) => {
    setEditingPage(page); 
    setError(null); // Clear previous errors
    setShowForm(true); 
  };

  // Function to fetch pages from the API
  const fetchPages = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('Fetching content pages using API service');
      
      const data = await contentPagesApi.getAllPages();
      console.log('Fetched pages:', data);
      
      setPages(data);
    } catch (error) {
      console.error('Error fetching pages:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to delete a page
  const deletePage = async (pageId: string) => {
    if (!window.confirm('Are you sure you want to delete this page?')) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      await contentPagesApi.deletePage(pageId);
      console.log('Page deleted successfully');
      // Remove the deleted page from state
      setPages(pages.filter(page => page.id !== pageId));
    } catch (error) {
      console.error('Error deleting page:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to save a page (create or update)
  const savePage = async (pageData: Omit<Page, 'id' | 'created_at' | 'updated_at'> & { id?: string }) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const isEditing = !!pageData.id;
      console.log(`${isEditing ? 'Updating' : 'Creating'} page with data:`, pageData);

      let savedPage;
      if (isEditing && pageData.id) {
        savedPage = await contentPagesApi.updatePage(pageData.id, pageData);
      } else {
        savedPage = await contentPagesApi.createPage(pageData);
      }
      
      console.log('Page saved successfully:', savedPage);
      
      // Update the local state
      if (isEditing) {
        setPages(pages.map(p => p.id === savedPage.id ? savedPage : p));
      } else {
        setPages([...pages, savedPage]);
      }
      
      setShowForm(false);
      setEditingPage(null);
    } catch (error) {
      console.error('Error saving page:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingPage(null);
    setError(null); // Clear errors on cancel
  };

  useEffect(() => {
    fetchPages(); 
  }, []); 

  if (isLoading && pages.length === 0) { 
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-xl text-gray-700 dark:text-gray-300">Loading pages...</p>
      </div>
    );
  }

  // Error display for initial load failure - keep as is
  if (error && pages.length === 0 && !showForm) { 
    return (
      <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
        <h2 className="font-bold">Error Loading Pages</h2>
        <p>{error}</p>
        {/* <p>Please ensure the API server is running and accessible.</p> */}
      </div>
    );
  }

  if (showForm) {
    return <PageForm page={editingPage} onSubmit={savePage} onCancel={handleCancelForm} isSubmitting={isSubmitting} submissionError={error} />;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold text-gray-800 dark:text-white">Manage Content Pages</h1>
        <Button onClick={handleAddNewPage} className="flex items-center">
          <PlusCircle className="mr-2 h-5 w-5" /> Add New Page
        </Button>
      </div>

      {/* Display a general error message (e.g. from save operation) if form is not shown */}
      {error && !showForm && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <p><strong>Operation Error:</strong> {error} <Button variant="link" onClick={() => setError(null)} className="text-red-700">Dismiss</Button></p>
        </div>
      )}

      {pages.length === 0 && !isLoading ? (
        <p className="text-gray-600 dark:text-gray-300">No pages found. Click "Add New Page" to create one.</p>
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Title
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Slug (SEO URL)
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Last Updated
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {pages.map((page) => (
                <tr key={page.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {page.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    /{page.slug} {/* Changed from page.seoUrl to page.slug */}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {page.updated_at ? new Date(page.updated_at).toLocaleDateString() : (page.created_at ? new Date(page.created_at).toLocaleDateString() : 'N/A')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleEditPage(page)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                      <Edit className="h-4 w-4 mr-1" /> Edit
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deletePage(page.id)}>
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

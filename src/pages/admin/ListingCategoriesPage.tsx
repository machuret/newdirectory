import { useState, useEffect, Fragment } from 'react';
import { Link } from 'react-router-dom';
import { Category } from '../../types/category';
import { AlertCircle, Check, Pencil, Trash2, Plus, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ListingCategoryForm } from '../../components/admin/forms/ListingCategoryForm';
import { categoriesApi } from '@/services/apiService';

export function ListingCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Category | undefined>(undefined);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Using centralized API service for categories

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Clear success message after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const fetchCategories = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Fetching categories using API service');
      // Using centralized categoriesApi
      const data = await categoriesApi.getAllCategories();
      console.log('Categories data:', data);
      
      // Organize categories into a hierarchy
      const categoriesWithHierarchy = organizeCategories(data);
      setCategories(categoriesWithHierarchy);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load categories. Please try again later.');
      
      // If API is not available, fall back to empty array
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to organize categories into a hierarchy
  const organizeCategories = (flatCategories: Category[]): Category[] => {
    const categoryMap = new Map<number, Category>();
    const rootCategories: Category[] = [];
    
    // First pass: create a map of id -> category
    flatCategories.forEach(category => {
      categoryMap.set(category.id, { ...category, children: [] });
    });
    
    // Second pass: organize into hierarchy
    flatCategories.forEach(category => {
      const categoryWithChildren = categoryMap.get(category.id)!;
      
      if (category.parent_id && categoryMap.has(category.parent_id)) {
        // This is a child category, add it to its parent's children
        const parent = categoryMap.get(category.parent_id)!;
        parent.children = [...(parent.children || []), categoryWithChildren];
      } else {
        // This is a root category
        rootCategories.push(categoryWithChildren);
      }
    });
    
    return rootCategories;
  };

  const handleAddCategory = () => {
    setCurrentCategory(undefined); // Reset current category for adding new
    setShowForm(true);
  };

  const handleEditCategory = (category: Category) => {
    setCurrentCategory(category);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category?')) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Deleting category ID:', id);
      // Using centralized categoriesApi
      await categoriesApi.deleteCategory(id.toString());
      

      setSuccessMessage('Category deleted successfully');
      fetchCategories(); // Refresh the list
    } catch (err) {
      console.error('Error deleting category:', err);
      setError('Failed to delete category. Please try again later.');
    }
  };

  const handleSubmit = async (formData: Category) => {
    setError(null);
    
    try {
      // Format the request body
      const requestBody = {
        name: formData.name,
        slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-'),
        description: formData.description || '',
        parent_id: formData.parent_id || null
      };
      
      let response;
      
      if (currentCategory) {
        // Update existing category using centralized categoriesApi
        console.log('Updating category ID:', currentCategory.id);
        response = await categoriesApi.updateCategory(currentCategory.id.toString(), requestBody);
      } else {
        // Create new category using centralized categoriesApi
        console.log('Creating new category');
        response = await categoriesApi.createCategory(requestBody);
      }
      
      setSuccessMessage(
        currentCategory
          ? 'Category updated successfully'
          : 'Category created successfully'
      );
      setShowForm(false);
      fetchCategories(); // Refresh the list
    } catch (err) {
      console.error('Error saving category:', err);
      setError('Failed to save category. Please try again later.');
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
  };

  // Recursive function to render category tree
  const renderCategoryTree = (categories: Category[], depth = 0): React.ReactNode[] => {
    return categories.map((category) => (
      <Fragment key={category.id}>
        <TableRow>
          <TableCell>
            <div style={{ marginLeft: `${depth * 20}px` }} className="flex items-center">
              {category.name}
              {category.is_active ? (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                  Active
                </span>
              ) : (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                  Inactive
                </span>
              )}
            </div>
          </TableCell>
          <TableCell>{category.slug}</TableCell>
          <TableCell>
            {category.seo_title || <span className="text-gray-400">Not set</span>}
          </TableCell>
          <TableCell className="text-center">{category.listing_count || 0}</TableCell>
          <TableCell>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEditCategory(category)}
              >
                <Pencil className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <button
                onClick={() => handleDelete(category.id)}
                className="text-red-500 hover:text-red-700 transition-colors"
                aria-label="Delete category"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </button>
            </div>
          </TableCell>
        </TableRow>
        {category.children && category.children.length > 0 && renderCategoryTree(category.children, depth + 1)}
      </Fragment>
    ));
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link to="/admin/dashboard" className="flex items-center text-blue-600 hover:text-blue-800 mb-2">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold">Listing Categories</h1>
          <p className="text-gray-600">Manage categories for your business listings</p>
        </div>
        <Button onClick={handleAddCategory}>
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert className="mb-6 bg-green-50 text-green-800 border-green-200">
          <Check className="h-4 w-4" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      {showForm ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{currentCategory ? 'Edit Category' : 'Add New Category'}</CardTitle>
            <CardDescription>
              {currentCategory
                ? `Edit details for category: ${currentCategory.name}`
                : 'Create a new category for your listings'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ListingCategoryForm
              category={currentCategory}
              allCategories={categories}
              onSubmit={handleSubmit}
              onCancel={() => setShowForm(false)}
              isEditMode={!!currentCategory}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Categories</CardTitle>
            <CardDescription>
              Manage your listing categories and their SEO information
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No categories found. Click "Add Category" to create your first category.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>SEO Title</TableHead>
                    <TableHead className="text-center">Listings</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>{renderCategoryTree(categories)}</TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

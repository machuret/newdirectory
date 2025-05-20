import { useState, useEffect } from 'react';
import { Category } from '../../types/category';
import { AlertCircle, Check, Pencil, Trash2, Plus } from 'lucide-react';
import { CategoryForm } from '../../components/admin/forms/CategoryForm';

export function ManageCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Category | undefined>(undefined);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // API URL
  const API_URL = 'http://localhost:3001/api/categories';

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
      const response = await fetch(`${API_URL}/with-counts`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
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

  const handleDeleteCategory = async (categoryId: number) => {
    if (!window.confirm('Are you sure you want to delete this category?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/${categoryId}`, { method: 'DELETE' });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete category');
      }
      
      // Refresh categories after deletion
      await fetchCategories();
      setSuccessMessage('Category deleted successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to delete category');
      console.error('Error deleting category:', err);
    }
  };

  const handleFormSubmit = async (categoryData: Partial<Category>) => {
    try {
      if (categoryData.id) {
        // Update existing category
        const response = await fetch(`${API_URL}/${categoryData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(categoryData)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update category');
        }

        setSuccessMessage('Category updated successfully');
      } else {
        // Create new category
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(categoryData)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create category');
        }

        setSuccessMessage('Category created successfully');
      }
      
      // Refresh categories and close the form
      await fetchCategories();
      setShowForm(false);
    } catch (err: any) {
      setError(err.message || 'Failed to save category');
      console.error('Error saving category:', err);
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setCurrentCategory(undefined);
  };

  // Recursive function to render category tree
  const renderCategoryTree = (categories: Category[], depth = 0) => {
    return categories.map((category) => (
      <div key={category.id} className="category-tree-item">
        <div 
          className={`flex items-center justify-between p-3 border-b ${
            depth > 0 ? 'pl-' + (depth * 6) : ''
          } hover:bg-gray-50 dark:hover:bg-gray-700`}
        >
          <div className="flex items-center">
            {depth > 0 && (
              <span className="inline-block w-5 h-5 mr-2 border-l border-b"></span>
            )}
            <span className={`font-medium ${!category.is_active ? 'text-gray-400' : ''}`}>
              {category.name}
            </span>
            {!category.is_active && (
              <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                Inactive
              </span>
            )}
            <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
              {category.listing_count || 0} listings
            </span>
          </div>
          <div className="flex items-center">
            <button
              onClick={() => handleEditCategory(category)}
              className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-4"
              title="Edit category"
            >
              <Pencil className="h-5 w-5" />
            </button>
            <button
              onClick={() => handleDeleteCategory(category.id)}
              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
              title="Delete category"
              disabled={category.children && category.children.length > 0}
            >
              <Trash2 className={`h-5 w-5 ${category.children && category.children.length > 0 ? 'opacity-50 cursor-not-allowed' : ''}`} />
            </button>
          </div>
        </div>
        {category.children && category.children.length > 0 && (
          <div className="category-children">
            {renderCategoryTree(category.children, depth + 1)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold text-gray-800 dark:text-white">Manage Categories</h1>
        <button
          onClick={handleAddCategory}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md flex items-center hover:bg-indigo-700 transition-colors"
        >
          <Plus className="mr-2 h-5 w-5" />
          Add Category
        </button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-100 border-l-4 border-green-500 text-green-700 flex items-center">
          <Check className="mr-2 h-5 w-5" />
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 flex items-center">
          <AlertCircle className="mr-2 h-5 w-5" />
          {error}
        </div>
      )}

      {/* Category Form */}
      {showForm && (
        <div className="mb-6">
          <CategoryForm 
            category={currentCategory} 
            allCategories={categories.flatMap(c => [c, ...(c.children || [])])}
            onSubmit={handleFormSubmit} 
            onCancel={handleCancelForm} 
          />
        </div>
      )}

      {/* Categories Tree */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-center text-gray-600 dark:text-gray-300">
            Loading categories...
          </div>
        ) : categories.length === 0 ? (
          <div className="p-6 text-center text-gray-600 dark:text-gray-300">
            No categories found. Click "Add Category" to create your first category.
          </div>
        ) : (
          <div className="category-tree">
            {renderCategoryTree(categories)}
          </div>
        )}
      </div>
    </div>
  );
}

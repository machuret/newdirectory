import { useState, useEffect } from 'react';
import { Category } from '../../../types/category';
import slugify from 'slugify';

interface CategoryFormProps {
  category?: Category;
  allCategories: Category[];
  onSubmit: (categoryData: Partial<Category>) => void;
  onCancel: () => void;
}

export function CategoryForm({ category, allCategories, onSubmit, onCancel }: CategoryFormProps) {
  const [formData, setFormData] = useState<Partial<Category>>({
    name: '',
    slug: '',
    description: '',
    icon: '',
    parent_id: null,
    is_active: true,
  });

  const [autoSlug, setAutoSlug] = useState(true);

  useEffect(() => {
    if (category) {
      // If editing an existing category, populate the form
      setFormData({
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description || '',
        icon: category.icon || '',
        parent_id: category.parent_id || null,
        is_active: category.is_active,
      });
      setAutoSlug(false); // Don't auto-generate slug when editing
    }
  }, [category]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Handle checkbox separately
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
      return;
    }
    
    // Handle parent_id as null when empty
    if (name === 'parent_id' && value === '') {
      setFormData((prev) => ({ ...prev, [name]: null }));
      return;
    }
    
    // Handle name specially to auto-generate slug
    if (name === 'name' && autoSlug) {
      const generatedSlug = slugify(value, { lower: true, strict: true });
      setFormData((prev) => ({ 
        ...prev, 
        [name]: value,
        slug: generatedSlug
      }));
      return;
    }
    
    // Handle slug change to disable auto-generation
    if (name === 'slug') {
      setAutoSlug(false);
    }
    
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const isNewCategory = !category?.id;
  
  // Filter out the current category and its children from parent options to prevent circular references
  const getValidParentOptions = () => {
    if (!category?.id) return allCategories;
    
    // Function to check if a category is a descendant of the current category
    const isDescendant = (potentialParent: Category): boolean => {
      if (potentialParent.id === category.id) return true;
      if (potentialParent.children && potentialParent.children.length > 0) {
        return potentialParent.children.some(child => isDescendant(child));
      }
      return false;
    };
    
    return allCategories.filter(c => !isDescendant(c));
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
        {isNewCategory ? 'Add New Category' : 'Edit Category'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name || ''}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          
          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Slug *
            </label>
            <input
              type="text"
              id="slug"
              name="slug"
              value={formData.slug || ''}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
            />
            <p className="text-xs text-gray-500 mt-1">
              Used in URLs: /category/your-slug
            </p>
          </div>
        </div>
        
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description || ''}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="icon" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Icon
            </label>
            <input
              type="text"
              id="icon"
              name="icon"
              value={formData.icon || ''}
              onChange={handleChange}
              placeholder="e.g., shopping-bag"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
            />
            <p className="text-xs text-gray-500 mt-1">
              Lucide icon name or custom CSS class
            </p>
          </div>
          
          <div>
            <label htmlFor="parent_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Parent Category
            </label>
            <select
              id="parent_id"
              name="parent_id"
              value={formData.parent_id || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">None (Top Level)</option>
              {getValidParentOptions().map((parentCategory) => (
                <option key={parentCategory.id} value={parentCategory.id}>
                  {parentCategory.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              name="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              Active
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Inactive categories won't be shown on the frontend
          </p>
        </div>
        
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {isNewCategory ? 'Create Category' : 'Update Category'}
          </button>
        </div>
      </form>
    </div>
  );
}

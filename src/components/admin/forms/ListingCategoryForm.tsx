import { useState, useEffect } from 'react';
import { Category } from '../../../types/category';
import slugify from 'slugify';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

interface ListingCategoryFormProps {
  category?: Category;
  allCategories: Category[];
  onSubmit: (categoryData: Partial<Category>) => void;
  onCancel: () => void;
}

export function ListingCategoryForm({ 
  category, 
  allCategories, 
  onSubmit, 
  onCancel 
}: ListingCategoryFormProps) {
  const [formData, setFormData] = useState<Partial<Category>>({
    name: '',
    slug: '',
    description: '',
    icon: '',
    parent_id: null,
    is_active: true,
    seo_title: '',
    seo_description: '',
    content_description: ''
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
        seo_title: category.seo_title || '',
        seo_description: category.seo_description || '',
        content_description: category.content_description || ''
      });
      setAutoSlug(false); // Don't auto-generate slug when editing
    }
  }, [category]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
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

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Basic Information</h3>
          
          <div className="space-y-2">
            <Label htmlFor="name">Category Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Restaurants"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="slug">
              Slug
              {autoSlug && <span className="text-xs text-gray-500 ml-2">(Auto-generated)</span>}
            </Label>
            <Input
              id="slug"
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              placeholder="e.g., restaurants"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="parent_id">Parent Category (Optional)</Label>
            <select
              id="parent_id"
              name="parent_id"
              value={formData.parent_id?.toString() || ''}
              onChange={handleChange}
              className="w-full rounded-md border border-gray-300 p-2"
            >
              <option value="">None (Top-level Category)</option>
              {getValidParentOptions().map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="icon">Icon (Optional)</Label>
            <Input
              id="icon"
              name="icon"
              value={formData.icon || ''}
              onChange={handleChange}
              placeholder="e.g., restaurant or fa-utensils"
            />
            <p className="text-xs text-gray-500">
              Enter an icon name from Font Awesome or another icon library you're using
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_active"
              name="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => 
                handleCheckboxChange('is_active', checked as boolean)
              }
            />
            <Label htmlFor="is_active">Active</Label>
          </div>
        </div>
        
        {/* SEO and Content Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">SEO & Content</h3>
          
          <div className="space-y-2">
            <Label htmlFor="seo_title">SEO Title</Label>
            <Input
              id="seo_title"
              name="seo_title"
              value={formData.seo_title || ''}
              onChange={handleChange}
              placeholder="SEO optimized title (50-60 characters)"
            />
            <p className="text-xs text-gray-500">
              {formData.seo_title?.length || 0}/60 characters
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="seo_description">SEO Description</Label>
            <Textarea
              id="seo_description"
              name="seo_description"
              value={formData.seo_description || ''}
              onChange={handleChange}
              placeholder="Meta description for search engines (150-160 characters)"
              rows={3}
            />
            <p className="text-xs text-gray-500">
              {formData.seo_description?.length || 0}/160 characters
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Short Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description || ''}
              onChange={handleChange}
              placeholder="Brief description of this category"
              rows={2}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="content_description">Content Description</Label>
            <Textarea
              id="content_description"
              name="content_description"
              value={formData.content_description || ''}
              onChange={handleChange}
              placeholder="Detailed content description for category pages"
              rows={5}
            />
            <p className="text-xs text-gray-500">
              This content will be displayed on the category page
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {isNewCategory ? 'Create Category' : 'Update Category'}
        </Button>
      </div>
    </form>
  );
}

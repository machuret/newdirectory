import * as React from 'react';
import { useState, useEffect } from 'react';
import { Page } from '../../../types/page';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Label } from '../../ui/label';

interface PageFormProps {
  page?: Page | null; // Page data for editing, null or undefined for new page
  onSubmit: (pageData: Omit<Page, 'id' | 'created_at' | 'updated_at'>) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  submissionError?: string | null;
}

const emptyPageData: Omit<Page, 'id' | 'created_at' | 'updated_at'> = {
  title: '',
  slug: '',
  content: '',
  featured_photo_url: '',
  meta_title: '',
  meta_description: '',
  status: 'draft', // Default status
};

export function PageForm({ page, onSubmit, onCancel, isSubmitting = false, submissionError = null }: PageFormProps) {
  const [formData, setFormData] = useState<Omit<Page, 'id' | 'created_at' | 'updated_at'>>(emptyPageData);

  useEffect(() => {
    if (page) {
      const editData: Omit<Page, 'id' | 'created_at' | 'updated_at'> = {
        title: page.title || '',
        slug: page.slug || '',
        content: page.content || '',
        featured_photo_url: page.featured_photo_url || '',
        meta_title: page.meta_title || '',
        meta_description: page.meta_description || '',
        status: page.status || 'draft',
      };
      setFormData(editData);
    } else {
      setFormData(emptyPageData);
    }
  }, [page]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const generatedSlug = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    setFormData(prev => ({ ...prev, slug: generatedSlug }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.slug) {
      alert('Title and Slug (SEO URL) are required.');
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-gray-800 p-6 md:p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">
        {page ? 'Edit Page' : 'Add New Page'}
      </h2>

      {submissionError && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          <p><strong>Error:</strong> {submissionError}</p>
        </div>
      )}

      <div>
        <Label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</Label>
        <Input
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          className="mt-1 block w-full"
        />
      </div>

      <div>
        <Label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Content (HTML or Markdown)</Label>
        <Textarea
          id="content"
          name="content"
          value={formData.content}
          onChange={handleChange}
          rows={10}
          className="mt-1 block w-full"
          placeholder="Enter page content... You can use HTML or Markdown."
        />
      </div>

      <div>
        <Label htmlFor="featured_photo_url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Featured Photo URL</Label>
        <Input
          id="featured_photo_url"
          name="featured_photo_url"
          value={formData.featured_photo_url}
          onChange={handleChange}
          className="mt-1 block w-full"
          placeholder="https://example.com/image.jpg"
        />
      </div>

      <fieldset className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <legend className="text-lg font-medium text-gray-900 dark:text-white mb-3">SEO Settings</legend>
        <div className="space-y-4">
          <div>
            <Label htmlFor="meta_title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Meta Title (SEO Title)</Label>
            <Input
              id="meta_title"
              name="meta_title"
              value={formData.meta_title}
              onChange={handleChange}
              className="mt-1 block w-full"
              placeholder="e.g., Awesome Product | My Company"
            />
          </div>
          <div>
            <Label htmlFor="slug" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Slug (SEO URL)</Label>
            <Input
              id="slug"
              name="slug"
              value={formData.slug}
              onChange={handleSlugChange}
              required
              className="mt-1 block w-full"
              placeholder="e.g., awesome-product (auto-generated or custom)"
            />
            {formData.slug && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Page will be accessible at: /pages/{formData.slug}</p>}
          </div>
          <div>
            <Label htmlFor="meta_description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Meta Description (SEO Meta Description)</Label>
            <Textarea
              id="meta_description"
              name="meta_description"
              value={formData.meta_description}
              onChange={handleChange}
              rows={3}
              className="mt-1 block w-full"
              placeholder="Brief summary for search engines (approx. 160 characters)"
            />
          </div>
        </div>
      </fieldset>

      <div>
        <Label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</Label>
        <select
          id="status"
          name="status"
          value={formData.status}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-offset-gray-800"
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : (page ? 'Save Changes' : 'Create Page')}
        </Button>
      </div>
    </form>
  );
}

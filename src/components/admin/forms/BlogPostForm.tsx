import React, { useState, useEffect } from 'react';
import { BlogPost } from '../../../types/blogPost';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Label } from '../../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select"; // Import the new Select component

interface BlogPostFormProps {
  post?: BlogPost | null;
  onSave: (postData: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt' | 'publishedAt'> | BlogPost) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  submissionError?: string | null;
}

const emptyPostData: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt' | 'publishedAt'> = {
  title: '',
  slug: '',
  content: '',
  excerpt: '',
  authorName: '', // Default or fetch current user later
  status: 'draft',
  featureImageURL: '', // Initialize featureImageURL
  seoTitle: '',
  seoDescription: '',
};

export function BlogPostForm({ 
  post, 
  onSave, 
  onCancel, 
  isSubmitting = false, 
  submissionError = null 
}: BlogPostFormProps) {
  const [formData, setFormData] = useState<Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt' | 'publishedAt'> | BlogPost>(emptyPostData);

  useEffect(() => {
    if (post) {
      setFormData(post);
    } else {
      setFormData(emptyPostData);
    }
  }, [post]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const slug = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    setFormData(prev => ({ ...prev, [name]: slug }));
  };

  const handleStatusChange = (value: 'draft' | 'published') => {
    setFormData(prev => ({ ...prev, status: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.slug) {
      alert('Title and Slug are required.');
      return;
    }
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-gray-800 p-6 md:p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">
        {post ? 'Edit Blog Post' : 'Add New Blog Post'}
      </h2>

      {submissionError && (
        <div className="p-3 mb-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <p><strong>Error:</strong> {submissionError}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" value={formData.title} onChange={handleChange} required disabled={isSubmitting} />
        </div>
        <div>
          <Label htmlFor="slug">Slug (URL)</Label>
          <Input id="slug" name="slug" value={formData.slug} onChange={handleSlugChange} required placeholder="e.g., my-awesome-post" disabled={isSubmitting} />
          {formData.slug && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Post will be at: /blog/{formData.slug}</p>}
        </div>
      </div>

      <div>
        <Label htmlFor="authorName">Author Name</Label>
        <Input id="authorName" name="authorName" value={formData.authorName || ''} onChange={handleChange} placeholder="e.g., John Doe" disabled={isSubmitting} />
      </div>

      <div>
        <Label htmlFor="featureImageURL">Feature Image URL</Label>
        <Input 
          id="featureImageURL" 
          name="featureImageURL" 
          value={formData.featureImageURL || ''} 
          onChange={handleChange} 
          placeholder="e.g., https://example.com/image.jpg" 
          disabled={isSubmitting} 
        />
      </div>

      <div>
        <Label htmlFor="status">Status</Label>
        <Select value={formData.status} onValueChange={handleStatusChange} disabled={isSubmitting}>
          <SelectTrigger id="status" disabled={isSubmitting}>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="content">Content (HTML or Markdown)</Label>
        <Textarea id="content" name="content" value={formData.content} onChange={handleChange} rows={12} placeholder="Write your blog post here..." disabled={isSubmitting} />
      </div>

      <div>
        <Label htmlFor="excerpt">Excerpt (Short Summary)</Label>
        <Textarea id="excerpt" name="excerpt" value={formData.excerpt || ''} onChange={handleChange} rows={3} placeholder="A brief summary of the post for listings and previews." disabled={isSubmitting} />
      </div>

      <fieldset className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <legend className="text-lg font-medium text-gray-900 dark:text-white mb-3">SEO Settings</legend>
        <div className="space-y-4">
          <div>
            <Label htmlFor="seoTitle">SEO Title</Label>
            <Input id="seoTitle" name="seoTitle" value={formData.seoTitle || ''} onChange={handleChange} placeholder="e.g., My Awesome Blog Post | Your Blog" disabled={isSubmitting} />
          </div>
          <div>
            <Label htmlFor="seoDescription">SEO Meta Description</Label>
            <Textarea id="seoDescription" name="seoDescription" value={formData.seoDescription || ''} onChange={handleChange} rows={3} placeholder="Brief summary for search engines (approx. 160 characters)." disabled={isSubmitting} />
          </div>
        </div>
      </fieldset>

      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : (post ? 'Save Changes' : 'Create Post')}
        </Button>
      </div>
    </form>
  );
}

import React, { useState, useEffect } from 'react';
import { SeoSettings } from '../../../../types/settings';
import { Button } from '../../../ui/button';
import { Input } from '../../../ui/input';
import { Textarea } from '../../../ui/textarea';
import { Label } from '../../../ui/label';

interface SeoSettingsFormProps {
  settings: SeoSettings;
  onSave: (data: SeoSettings) => void;
}

export function SeoSettingsForm({ settings, onSave }: SeoSettingsFormProps) {
  const [formData, setFormData] = useState<SeoSettings>(settings);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Global SEO Settings</h2>
      <div>
        <Label htmlFor="globalSeoTitle">Global SEO Title</Label>
        <Input
          id="globalSeoTitle"
          name="globalSeoTitle"
          value={formData.globalSeoTitle}
          onChange={handleChange}
          placeholder="Your Site's Default SEO Title"
        />
         <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">This is the default title used if a page/post doesn't have a specific SEO title.</p>
      </div>
      <div>
        <Label htmlFor="globalSeoDescription">Global SEO Meta Description</Label>
        <Textarea
          id="globalSeoDescription"
          name="globalSeoDescription"
          value={formData.globalSeoDescription}
          onChange={handleChange}
          rows={3}
          placeholder="Your site's default meta description for search engines (approx. 160 characters)."
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">This is the default description used if a page/post doesn't have a specific SEO description.</p>
      </div>
      <div className="flex justify-end">
        <Button type="submit">Save SEO Settings</Button>
      </div>
    </form>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { GeneralSettings } from '../../../../types/settings';
import { Button } from '../../../ui/button';
import { Input } from '../../../ui/input';
import { Textarea } from '../../../ui/textarea';
import { Label } from '../../../ui/label';
import { Upload, Image as ImageIcon, X } from 'lucide-react';

interface GeneralSettingsFormProps {
  settings: GeneralSettings;
  onSave: (data: GeneralSettings) => void;
}

export function GeneralSettingsForm({ settings, onSave }: GeneralSettingsFormProps) {
  // Initialize with default values to prevent undefined errors
  const defaultSettings: GeneralSettings = {
    siteTitle: '',
    siteDescription: '',
    logoUrl: '',
    homepageListingCount: 12
  };
  
  const [formData, setFormData] = useState<GeneralSettings>({...defaultSettings, ...settings});
  const [previewLogo, setPreviewLogo] = useState<string | null>((settings?.logoUrl) || null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFormData(settings);
    setPreviewLogo(settings.logoUrl || null);
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Create a preview URL for the selected file
    const previewUrl = URL.createObjectURL(file);
    setPreviewLogo(previewUrl);
    
    // Simulate uploading to a server
    setIsUploading(true);
    
    try {
      // In a real implementation, you would upload the file to your server here
      // For now, we'll just simulate a delay and set the URL directly
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Set the logo URL in the form data
      // In a real implementation, this would be the URL returned from your server
      setFormData(prev => ({ ...prev, logoUrl: previewUrl }));
    } catch (error) {
      console.error('Error uploading logo:', error);
      alert('Failed to upload logo. Please try again.');
      // Reset the preview on error
      setPreviewLogo(settings.logoUrl || null);
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleRemoveLogo = () => {
    setPreviewLogo(null);
    setFormData(prev => ({ ...prev, logoUrl: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">General Settings</h2>
      <div>
        <Label htmlFor="siteTitle">Site Title</Label>
        <Input
          id="siteTitle"
          name="siteTitle"
          value={formData.siteTitle}
          onChange={handleChange}
          placeholder="Your Site's Name"
          required
        />
      </div>
      <div>
        <Label htmlFor="siteDescription">Site Description</Label>
        <Textarea
          id="siteDescription"
          name="siteDescription"
          value={formData.siteDescription}
          onChange={handleChange}
          rows={3}
          placeholder="A short description of your site."
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="homepageListingCount">Homepage Listing Count</Label>
        <div className="flex items-center gap-2">
          <Input
            id="homepageListingCount"
            name="homepageListingCount"
            type="number"
            min="4"
            max="48"
            step="4"
            value={formData.homepageListingCount || 12}
            onChange={handleChange}
            className="w-24"
          />
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Number of listings to display on the homepage
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {[4, 8, 12, 16, 20, 24, 32].map(count => (
            <Button
              key={count}
              type="button"
              variant={formData.homepageListingCount === count ? "default" : "outline"}
              size="sm"
              onClick={() => setFormData(prev => ({ ...prev, homepageListingCount: count }))}
            >
              {count}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Site Logo</Label>
        
        {previewLogo ? (
          <div className="relative w-full max-w-xs border rounded-md overflow-hidden">
            <img 
              src={previewLogo} 
              alt="Site Logo Preview" 
              className="w-full h-auto max-h-40 object-contain"
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2 rounded-full p-1 h-8 w-8"
              onClick={handleRemoveLogo}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-center border border-dashed rounded-md p-6 bg-gray-50 dark:bg-gray-800">
            <div className="text-center">
              <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">No logo uploaded</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex items-center gap-2 mt-2">
          <input
            type="file"
            id="logoUpload"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleLogoUpload}
            className="hidden"
          />
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            {isUploading ? 'Uploading...' : 'Upload Logo'}
          </Button>
          {previewLogo && (
            <Button 
              type="button" 
              variant="destructive" 
              onClick={handleRemoveLogo}
            >
              Remove Logo
            </Button>
          )}
        </div>
      </div>

      <Button type="submit" className="w-full">Save Settings</Button>
    </form>
  );
}

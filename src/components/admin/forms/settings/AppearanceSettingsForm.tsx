import React, { useState, useEffect, useCallback } from 'react';
import { AppearanceSettings } from '../../../../types/settings';
import { Button } from '../../../ui/button';
import { Input } from '../../../ui/input';
import { Label } from '../../../ui/label';

interface AppearanceSettingsFormProps {
  settings: AppearanceSettings;
  onSave: (data: AppearanceSettings) => void;
}

export function AppearanceSettingsForm({ settings, onSave }: AppearanceSettingsFormProps) {
  const [formData, setFormData] = useState<AppearanceSettings>(settings);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const { name, value } = e.target;
      console.log(`Updating ${name} to ${value}`);
      setFormData(prev => ({ ...prev, [name]: value }));
    } catch (error) {
      console.error('Error updating color value:', error);
    }
  }, []);
  
  const handleColorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const { name, value } = e.target;
      console.log(`Updating color ${name} to ${value}`);
      // Validate color format before setting
      setFormData(prev => ({ ...prev, [name]: value }));
    } catch (error) {
      console.error('Error updating color value:', error);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Appearance Settings</h2>
      <div>
        <Label htmlFor="primaryFontColor">Primary Font Color</Label>
        <div className="flex gap-2">
          <Input
            id="primaryFontColor"
            name="primaryFontColor"
            type="text"
            value={formData.primaryFontColor || ''}
            onChange={handleChange}
            placeholder="#333333"
            className="flex-1"
          />
          <input
            type="color"
            id="primaryFontColorPicker"
            name="primaryFontColor"
            value={formData.primaryFontColor || '#333333'}
            onChange={handleColorChange}
            className="h-10 w-10 p-1 border rounded cursor-pointer"
          />
        </div>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Enter a CSS color value (e.g., hex, rgb, or color name).</p>
        {formData.primaryFontColor && (
          <div className="mt-2 flex items-center">
            <span className="text-sm mr-2">Preview:</span>
            <div style={{ width: '20px', height: '20px', backgroundColor: formData.primaryFontColor, border: '1px solid #ccc' }}></div>
          </div>
        )}
      </div>
      <div className="flex justify-end">
        <Button type="submit">Save Appearance Settings</Button>
      </div>
    </form>
  );
}

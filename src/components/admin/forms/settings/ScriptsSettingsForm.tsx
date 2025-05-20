import React, { useState, useEffect } from 'react';
import { ScriptsSettings } from '../../../../types/settings';
import { Button } from '../../../ui/button';
import { Textarea } from '../../../ui/textarea';
import { Label } from '../../../ui/label';

interface ScriptsSettingsFormProps {
  settings: ScriptsSettings;
  onSave: (data: ScriptsSettings) => void;
}

export function ScriptsSettingsForm({ settings, onSave }: ScriptsSettingsFormProps) {
  const [formData, setFormData] = useState<ScriptsSettings>(settings);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Header Scripts</h2>
      <div>
        <Label htmlFor="headerScripts">Scripts for &lt;head&gt; tag</Label>
        <Textarea
          id="headerScripts"
          name="headerScripts"
          value={formData.headerScripts}
          onChange={handleChange}
          rows={8}
          placeholder="Paste scripts here, e.g., Google Analytics tracking code. They will be injected before the closing </head> tag."
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Ensure scripts are valid and include &lt;script&gt; tags if necessary.</p>
      </div>
      <div className="flex justify-end">
        <Button type="submit">Save Scripts</Button>
      </div>
    </form>
  );
}

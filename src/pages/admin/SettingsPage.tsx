import { useState, useEffect, useCallback } from 'react';
import { SiteSettings, GeneralSettings, SeoSettings, ScriptsSettings, AppearanceSettings } from '../../types/settings';
import { Button } from '../../components/ui/button';
import { GeneralSettingsForm } from '../../components/admin/forms/settings/GeneralSettingsForm';
import { SeoSettingsForm } from '../../components/admin/forms/settings/SeoSettingsForm';
import { ScriptsSettingsForm } from '../../components/admin/forms/settings/ScriptsSettingsForm';
import { AppearanceSettingsForm } from '../../components/admin/forms/settings/AppearanceSettingsForm';
import { API_CONFIG } from '@/config/api.config';

// Use the API configuration pattern to get the correct API URL
const getApiUrl = () => `${API_CONFIG.getBaseUrl()}/settings`;

export function SettingsPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [activeCategory, setActiveCategory] = useState<'general' | 'seo' | 'scripts' | 'appearance'>('general');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(getApiUrl());
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setSettings(data);
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError('An unknown error occurred');
        }
        setSettings({
          general: { 
            siteTitle: 'Error loading', 
            siteDescription: '', 
            logoUrl: '', 
            homepageListingCount: 6 // Default value
          },
          seo: { globalSeoTitle: '', globalSeoDescription: '' },
          scripts: { headerScripts: '' },
          appearance: { primaryFontColor: '' },
        });
      }
      setIsLoading(false);
    };
    fetchSettings();
  }, []);

  const handleSave = useCallback(async (data: Partial<SiteSettings>) => {
    if (!settings) return;
    try {
      const response = await fetch(getApiUrl(), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const updatedSettings = await response.json();
      setSettings(updatedSettings);
      alert('Settings saved successfully!');
    } catch (e) {
      if (e instanceof Error) {
        alert(`Error saving settings: ${e.message}`);
      } else {
        alert('An unknown error occurred while saving settings.');
      }
    }
  }, [settings]);

  const handleSaveGeneral = useCallback((data: GeneralSettings) => {
    handleSave({ general: data });
  }, [handleSave]);

  const handleSaveSeo = useCallback((data: SeoSettings) => {
    handleSave({ seo: data });
  }, [handleSave]);

  const handleSaveScripts = useCallback((data: ScriptsSettings) => {
    handleSave({ scripts: data });
  }, [handleSave]);

  const handleSaveAppearance = useCallback((data: AppearanceSettings) => {
    handleSave({ appearance: data });
  }, [handleSave]);

  const renderActiveForm = () => {
    if (isLoading) return <div className="p-4 text-center">Loading settings...</div>;
    if (error) return <div className="p-4 text-center text-red-500">Error: {error} <br />Ensure json-server is running (npm run server).</div>;
    if (!settings) return <div className="p-4 text-center">No settings data available.</div>;

    switch (activeCategory) {
      case 'general':
        return <GeneralSettingsForm settings={settings.general} onSave={handleSaveGeneral} />;
      case 'seo':
        return <SeoSettingsForm settings={settings.seo} onSave={handleSaveSeo} />;
      case 'scripts':
        return <ScriptsSettingsForm settings={settings.scripts} onSave={handleSaveScripts} />;
      case 'appearance':
        return <AppearanceSettingsForm settings={settings.appearance} onSave={handleSaveAppearance} />;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <h1 className="text-3xl font-semibold text-gray-800 dark:text-white mb-8">Site Settings</h1>

      <div className="md:flex">
        <nav className="md:w-1/4 md:pr-8 mb-8 md:mb-0">
          <ul className="space-y-2">
            <li>
              <Button
                variant={activeCategory === 'general' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveCategory('general')}
              >
                General
              </Button>
            </li>
            <li>
              <Button
                variant={activeCategory === 'seo' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveCategory('seo')}
              >
                SEO
              </Button>
            </li>
            <li>
              <Button
                variant={activeCategory === 'scripts' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveCategory('scripts')}
              >
                Scripts
              </Button>
            </li>
            <li>
              <Button
                variant={activeCategory === 'appearance' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveCategory('appearance')}
              >
                Appearance
              </Button>
            </li>
          </ul>
        </nav>

        <main className="md:w-3/4 bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
          {renderActiveForm()}
        </main>
      </div>
    </div>
  );
}

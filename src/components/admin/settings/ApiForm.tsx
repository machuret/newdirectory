import React, { useState } from 'react';
import { ApiConfig } from '../../../pages/admin/settings/ApiSettingsPage'; // Import shared interface

interface ApiFormProps {
  onApiAdded: (newApi: Omit<ApiConfig, 'id' | 'status'>) => void;
  // existingApi?: ApiConfig; // For editing in the future
  // onCancel?: () => void;    // For closing edit form
}

const ApiForm: React.FC<ApiFormProps> = ({ onApiAdded }) => {
  const [name, setName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [type, setType] = useState<'APIFY' | 'OpenAI' | 'Other'>('APIFY');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !apiKey.trim()) {
      setError('Please provide a name and API key.');
      return;
    }
    onApiAdded({ name, apiKey, type });
    setName('');
    setApiKey('');
    setType('APIFY'); // Reset to default
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-300 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}
      <div>
        <label htmlFor="apiName" className="block text-sm font-medium text-gray-700 mb-1">API Name/Provider</label>
        <input 
          type="text" 
          id="apiName" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          placeholder="e.g., My OpenAI Key, Apify Scraper"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          required 
        />
      </div>
      <div>
        <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
        <input 
          type="password" // Use password type to obscure key by default
          id="apiKey" 
          value={apiKey} 
          onChange={(e) => setApiKey(e.target.value)} 
          placeholder="Enter your API key (it will be stored securely)"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          required 
        />
      </div>
      <div>
        <label htmlFor="apiType" className="block text-sm font-medium text-gray-700 mb-1">API Type</label>
        <select 
          id="apiType" 
          value={type} 
          onChange={(e) => setType(e.target.value as 'APIFY' | 'OpenAI' | 'Other')} 
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-white"
        >
          <option value="APIFY">APIFY</option>
          <option value="OpenAI">OpenAI</option>
          <option value="Other">Other</option>
        </select>
      </div>
      <button 
        type="submit" 
        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Add API Key
      </button>
    </form>
  );
};

export default ApiForm;

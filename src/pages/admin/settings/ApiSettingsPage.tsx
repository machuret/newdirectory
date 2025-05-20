import { useEffect, useState } from 'react';
import ApiListItem from '../../../components/admin/settings/ApiListItem'; // Remove .tsx extension
import ApiForm from '../../../components/admin/settings/ApiForm'; // Remove .tsx extension

export interface ApiConfig {
  id: string;
  name: string;
  apiKey: string;
  type: 'APIFY' | 'OpenAI' | 'Other';
  status: 'active' | 'inactive' | 'error' | 'unchecked';
}

// Since the API endpoint doesn't exist, we'll use local storage to store API keys
// This allows the feature to work without a backend endpoint
const LOCAL_STORAGE_KEY = 'react_admin_api_keys';

const ApiSettingsPage: React.FC = () => {
  const [apis, setApis] = useState<ApiConfig[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load APIs from local storage
  const fetchApis = () => {
    setLoading(true);
    try {
      console.log('Loading API keys from local storage');
      const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
      
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        console.log('Loaded API keys:', parsedData);
        setApis(parsedData);
      } else {
        // Initialize with empty array if no data exists
        console.log('No API keys found in local storage');
        setApis([]);
      }
      
      setError(null);
    } catch (e: any) {
      console.error('Error in fetchApis:', e);
      setError(e.message);
      setApis([]); // Clear apis on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApis();
  }, []);

  // Test an API key to verify it works
  const testApiKey = async (id: string): Promise<boolean> => {
    try {
      const api = apis.find(a => a.id === id);
      if (!api) {
        console.error('API not found with ID:', id);
        return false;
      }

      console.log(`Testing ${api.type} API key...`);

      if (api.type === 'OpenAI') {
        // Test OpenAI API key
        const response = await fetch('https://api.openai.com/v1/models', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${api.apiKey}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          console.log('OpenAI API key is valid');
          return true;
        } else {
          console.error('OpenAI API key validation failed:', await response.text());
          return false;
        }
      } else if (api.type === 'APIFY') {
        // Test APIFY API key
        const response = await fetch('https://api.apify.com/v2/user/me', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${api.apiKey}`
          }
        });

        if (response.ok) {
          console.log('APIFY API key is valid');
          return true;
        } else {
          console.error('APIFY API key validation failed:', await response.text());
          return false;
        }
      }

      // For other API types, just return true for now
      return true;
    } catch (error) {
      console.error('Error testing API key:', error);
      return false;
    }
  };

  // Update API status
  const updateApiStatus = (id: string, status: 'active' | 'inactive' | 'error' | 'unchecked') => {
    const updatedApis = apis.map(api => 
      api.id === id ? { ...api, status } : api
    );
    setApis(updatedApis);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedApis));
  };

  // Add a new API key to local storage
  const handleApiAdded = async (newApiData: Omit<ApiConfig, 'id' | 'status'>) => {
    try {
      console.log('Adding new API:', newApiData);
      
      // Create a new API config with generated ID
      const newApi: ApiConfig = {
        ...newApiData,
        id: `api_${Date.now()}`, // Generate a unique ID
        status: 'unchecked', // Default status for new APIs
      };
      
      // Add to state
      const updatedApis = [...apis, newApi];
      setApis(updatedApis);
      
      // Save to local storage
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedApis));

      // Automatically test the API key
      const isValid = await testApiKey(newApi.id);
      updateApiStatus(newApi.id, isValid ? 'active' : 'error');
      
      return newApi;
    } catch (e: any) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error adding API key';
      setError(errorMessage);
      throw e;
    }
  };

  // Delete an API key from local storage
  const handleApiDeleted = (id: string) => {
    try {
      // Remove from state
      const updatedApis = apis.filter(api => api.id !== id);
      setApis(updatedApis);
      
      // Save to local storage
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedApis));
    } catch (e: any) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error deleting API key';
      setError(errorMessage);
    }
  };
  //   // Actual test logic will go here
  //   // You might want to update the status in db.json based on the test result
  // };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Manage API Keys</h1>
      
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{error}</span>
      </div>}

      <div className="mb-8 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-3">Add New API Key</h2>
        <ApiForm onApiAdded={handleApiAdded} />
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-3">Existing API Keys</h2>
        {loading && <p>Loading API configurations...</p>}
        {!loading && apis.length === 0 && !error && (
          <p className="text-gray-600">No API keys configured yet. Add one using the form above.</p>
        )}
        {!loading && apis.length > 0 && (
          <div className="space-y-4">
            {apis.map(api => (
              <ApiListItem 
                key={api.id} 
                api={api} 
                onDelete={handleApiDeleted} 
                onTest={testApiKey}
                onStatusChange={updateApiStatus}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApiSettingsPage;

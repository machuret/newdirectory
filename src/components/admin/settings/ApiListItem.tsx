import * as React from 'react';
import { useState } from 'react';
import { ApiConfig } from '../../../pages/admin/settings/ApiSettingsPage'; // Import shared interface
import { Loader2 } from 'lucide-react';

interface ApiListItemProps {
  api: ApiConfig;
  onDelete: (id: string) => void;
  onTest: (id: string) => Promise<boolean>;
  onStatusChange: (id: string, status: 'active' | 'inactive' | 'error' | 'unchecked') => void;
}

const ApiListItem: React.FC<ApiListItemProps> = ({ api, onDelete, onTest, onStatusChange }: ApiListItemProps) => {
  const [isTesting, setIsTesting] = useState(false);
  const getStatusColor = () => {
    switch (api.status) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-gray-400'; // Or a more distinct color for inactive
      case 'error': return 'bg-red-500';
      case 'unchecked': return 'bg-yellow-500';
      default: return 'bg-gray-300';
    }
  };

  return (
    <div className="p-4 border border-gray-200 bg-white rounded-lg shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3">
      <div className="mb-3 sm:mb-0">
        <h3 className="text-lg font-semibold text-gray-800">{api.name} <span className="text-sm font-medium text-indigo-600">({api.type})</span></h3>
        <p className="text-sm text-gray-500">API Key: <span className="font-mono">...{api.apiKey.slice(-4)}</span></p>
      </div>
      <div className="flex items-center space-x-2 flex-shrink-0">
        <span 
          className={`h-3 w-3 rounded-full ${getStatusColor()}`}
          title={`Status: ${api.status}`}
        ></span>
        <button 
          onClick={async () => {
            setIsTesting(true);
            try {
              const success = await onTest(api.id);
              onStatusChange(api.id, success ? 'active' : 'error');
            } catch (error) {
              console.error('API test error:', error);
              onStatusChange(api.id, 'error');
            } finally {
              setIsTesting(false);
            }
          }} 
          disabled={isTesting}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-1 px-3 rounded text-xs shadow-sm transition duration-150 ease-in-out disabled:bg-blue-300"
        >
          {isTesting ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin inline mr-1" />
              Testing...
            </>
          ) : 'Test'}
        </button>
        <button 
          onClick={() => onDelete(api.id)} 
          className="bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-3 rounded text-xs shadow-sm transition duration-150 ease-in-out"
        >
          Remove
        </button>
      </div>
    </div>
  );
};

export default ApiListItem;

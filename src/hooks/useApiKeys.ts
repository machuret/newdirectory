import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiKeysApi } from '@/services/api';

// Query keys
export const apiKeysKeys = {
  all: ['apiKeys'] as const,
  lists: () => [...apiKeysKeys.all, 'list'] as const,
  details: () => [...apiKeysKeys.all, 'detail'] as const,
  detail: (id: number | string) => [...apiKeysKeys.details(), id] as const,
};

// Get all API keys
export const useApiKeys = () => {
  return useQuery({
    queryKey: apiKeysKeys.lists(),
    queryFn: () => apiKeysApi.getAll(),
  });
};

// Create a new API key
export const useCreateApiKey = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ serviceName, apiKey }: { serviceName: string; apiKey: string }) => 
      apiKeysApi.create(serviceName, apiKey),
    onSuccess: () => {
      // Invalidate the API keys list query to refetch
      queryClient.invalidateQueries({ queryKey: apiKeysKeys.lists() });
    },
  });
};

// Update an API key
export const useUpdateApiKey = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, apiKey }: { id: number | string; apiKey: string }) => 
      apiKeysApi.update(id, apiKey),
    onSuccess: () => {
      // Invalidate the API keys list query to refetch
      queryClient.invalidateQueries({ queryKey: apiKeysKeys.lists() });
    },
  });
};

// Delete an API key
export const useDeleteApiKey = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number | string) => apiKeysApi.delete(id),
    onSuccess: () => {
      // Invalidate the API keys list query to refetch
      queryClient.invalidateQueries({ queryKey: apiKeysKeys.lists() });
    },
  });
};

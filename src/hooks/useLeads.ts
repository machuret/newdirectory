import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadsApi } from '@/services/api';
import { Lead } from '@/types/lead';

// Query keys
export const leadsKeys = {
  all: ['leads'] as const,
  lists: () => [...leadsKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...leadsKeys.lists(), filters] as const,
  details: () => [...leadsKeys.all, 'detail'] as const,
  detail: (id: number | string) => [...leadsKeys.details(), id] as const,
  stats: () => [...leadsKeys.all, 'stats'] as const,
};

// Get all leads with pagination and filtering
export const useLeads = (
  page = 1, 
  limit = 20, 
  status?: string, 
  listingId?: number
) => {
  return useQuery({
    queryKey: leadsKeys.list({ page, limit, status, listingId }),
    queryFn: () => leadsApi.getAll(page, limit, status, listingId),
    keepPreviousData: true,
  });
};

// Get a single lead by ID
export const useLead = (id: number | string) => {
  return useQuery({
    queryKey: leadsKeys.detail(id),
    queryFn: () => leadsApi.getById(id),
    enabled: !!id,
  });
};

// Create a new lead (contact form submission)
export const useCreateLead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (lead: { listingId: number; name: string; email: string; message: string }) => 
      leadsApi.create(lead),
    onSuccess: () => {
      // Invalidate the leads list query to refetch
      queryClient.invalidateQueries({ queryKey: leadsKeys.lists() });
      // Also invalidate stats
      queryClient.invalidateQueries({ queryKey: leadsKeys.stats() });
    },
  });
};

// Update lead status
export const useUpdateLeadStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, status }: { id: number | string; status: 'new' | 'read' | 'replied' | 'archived' }) => 
      leadsApi.updateStatus(id, status),
    onSuccess: (data, variables) => {
      // Invalidate the specific lead query
      queryClient.invalidateQueries({ queryKey: leadsKeys.detail(variables.id) });
      // Also invalidate the list query
      queryClient.invalidateQueries({ queryKey: leadsKeys.lists() });
      // Also invalidate stats
      queryClient.invalidateQueries({ queryKey: leadsKeys.stats() });
    },
  });
};

// Delete a lead
export const useDeleteLead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number | string) => leadsApi.delete(id),
    onSuccess: (_, id) => {
      // Invalidate the specific lead query
      queryClient.invalidateQueries({ queryKey: leadsKeys.detail(id) });
      // Also invalidate the list query
      queryClient.invalidateQueries({ queryKey: leadsKeys.lists() });
      // Also invalidate stats
      queryClient.invalidateQueries({ queryKey: leadsKeys.stats() });
    },
  });
};

// Bulk update lead statuses
export const useBulkUpdateLeadStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ ids, status }: { ids: number[]; status: 'new' | 'read' | 'replied' | 'archived' }) => 
      leadsApi.bulkUpdateStatus(ids, status),
    onSuccess: () => {
      // Invalidate the list query
      queryClient.invalidateQueries({ queryKey: leadsKeys.lists() });
      // Also invalidate stats
      queryClient.invalidateQueries({ queryKey: leadsKeys.stats() });
    },
  });
};

// Get lead statistics
export const useLeadStats = () => {
  return useQuery({
    queryKey: leadsKeys.stats(),
    queryFn: () => leadsApi.getStats(),
  });
};

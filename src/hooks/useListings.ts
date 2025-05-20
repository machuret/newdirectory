import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listingsApi } from '@/services/api';
import { Listing } from '@/types/listing';

// Query keys
export const listingsKeys = {
  all: ['listings'] as const,
  lists: () => [...listingsKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...listingsKeys.lists(), filters] as const,
  details: () => [...listingsKeys.all, 'detail'] as const,
  detail: (id: number | string) => [...listingsKeys.details(), id] as const,
  featured: () => [...listingsKeys.all, 'featured'] as const,
};

// Get all listings with pagination
export const useListings = (page = 1, limit = 20) => {
  return useQuery({
    queryKey: listingsKeys.list({ page, limit }),
    queryFn: () => listingsApi.getAll(page, limit),
    keepPreviousData: true,
  });
};

// Get featured listings with pagination
export const useFeaturedListings = (page = 1, limit = 12) => {
  return useQuery({
    queryKey: listingsKeys.featured(),
    queryFn: () => listingsApi.getFeatured(page, limit),
    keepPreviousData: true,
  });
};

// Get a single listing by ID
export const useListing = (id: number | string) => {
  return useQuery({
    queryKey: listingsKeys.detail(id),
    queryFn: () => listingsApi.getById(id),
    enabled: !!id,
  });
};

// Create a new listing
export const useCreateListing = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (listing: Partial<Listing>) => listingsApi.create(listing),
    onSuccess: () => {
      // Invalidate the listings list query to refetch
      queryClient.invalidateQueries({ queryKey: listingsKeys.lists() });
    },
  });
};

// Update an existing listing
export const useUpdateListing = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, listing }: { id: number | string; listing: Partial<Listing> }) => 
      listingsApi.update(id, listing),
    onSuccess: (data, variables) => {
      // Invalidate the specific listing query
      queryClient.invalidateQueries({ queryKey: listingsKeys.detail(variables.id) });
      // Also invalidate the list query
      queryClient.invalidateQueries({ queryKey: listingsKeys.lists() });
    },
  });
};

// Delete a listing
export const useDeleteListing = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number | string) => listingsApi.delete(id),
    onSuccess: (_, id) => {
      // Invalidate the specific listing query
      queryClient.invalidateQueries({ queryKey: listingsKeys.detail(id) });
      // Also invalidate the list query
      queryClient.invalidateQueries({ queryKey: listingsKeys.lists() });
    },
  });
};

// Generate a description for a listing
export const useGenerateDescription = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number | string) => listingsApi.generateDescription(id),
    onSuccess: (data, id) => {
      // Update the listing cache with the new description
      queryClient.setQueryData(
        listingsKeys.detail(id),
        (oldData: Listing | undefined) => {
          if (!oldData) return undefined;
          return {
            ...oldData,
            description: data.description,
          };
        }
      );
      
      // Also invalidate the list query
      queryClient.invalidateQueries({ queryKey: listingsKeys.lists() });
    },
  });
};

// Generate FAQs for a listing
export const useGenerateFAQs = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number | string) => listingsApi.generateFAQs(id),
    onSuccess: (data, id) => {
      // Update the listing cache with the new FAQs
      queryClient.setQueryData(
        listingsKeys.detail(id),
        (oldData: Listing | undefined) => {
          if (!oldData) return undefined;
          return {
            ...oldData,
            faq: data.faqs,
          };
        }
      );
      
      // Also invalidate the list query
      queryClient.invalidateQueries({ queryKey: listingsKeys.lists() });
    },
  });
};

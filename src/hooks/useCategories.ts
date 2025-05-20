import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesApi, Category } from '@/services/api';

// Query keys
export const categoriesKeys = {
  all: ['categories'] as const,
  lists: () => [...categoriesKeys.all, 'list'] as const,
  details: () => [...categoriesKeys.all, 'detail'] as const,
  detail: (id: number | string) => [...categoriesKeys.details(), id] as const,
};

// Get all categories
export const useCategories = () => {
  return useQuery({
    queryKey: categoriesKeys.lists(),
    queryFn: () => categoriesApi.getAll(),
  });
};

// Get a single category by ID
export const useCategory = (id: number | string) => {
  return useQuery({
    queryKey: categoriesKeys.detail(id),
    queryFn: () => categoriesApi.getById(id),
    enabled: !!id,
  });
};

// Create a new category
export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (category: Partial<Category>) => categoriesApi.create(category),
    onSuccess: () => {
      // Invalidate the categories list query to refetch
      queryClient.invalidateQueries({ queryKey: categoriesKeys.lists() });
    },
  });
};

// Update an existing category
export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, category }: { id: number | string; category: Partial<Category> }) => 
      categoriesApi.update(id, category),
    onSuccess: (data, variables) => {
      // Invalidate the specific category query
      queryClient.invalidateQueries({ queryKey: categoriesKeys.detail(variables.id) });
      // Also invalidate the list query
      queryClient.invalidateQueries({ queryKey: categoriesKeys.lists() });
    },
  });
};

// Delete a category
export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number | string) => categoriesApi.delete(id),
    onSuccess: (_, id) => {
      // Invalidate the specific category query
      queryClient.invalidateQueries({ queryKey: categoriesKeys.detail(id) });
      // Also invalidate the list query
      queryClient.invalidateQueries({ queryKey: categoriesKeys.lists() });
    },
  });
};

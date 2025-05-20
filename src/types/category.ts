// src/types/category.ts

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  parent_id?: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  
  // SEO fields
  seo_title?: string;
  seo_description?: string;
  content_description?: string;
  
  // Optional fields for UI state
  children?: Category[];
  listing_count?: number;
}

export interface CategoryFormData {
  id?: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  parent_id?: number | null;
  is_active: boolean;
}

export interface ListingCategory {
  listing_id: number;
  category_id: number;
  is_primary: boolean;
  created_at: string;
}

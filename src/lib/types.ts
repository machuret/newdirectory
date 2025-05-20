export interface MenuItem {
  id: number; // Or string, depending on your DB
  label: string;
  url: string;
  // Add other properties like 'icon', 'target', 'children' (for submenus) if needed later
}

export interface ListingItem {
  id: number | string; // Assuming 'id' will be the primary key from your DB
  main_image_url?: string | null;
  title: string;
  average_rating?: number | null;
  description?: string | null;
  city?: string | null;
  state_province?: string | null;
  // We can add more fields here later if needed for other views, e.g., full_address, website, phone
}

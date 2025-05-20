export interface MenuItem {
  id: string;
  label: string;
  url: string;
  menuLocation: 'header' | 'footer' | 'sidebar'; // Example locations
  order?: number; // Optional: for sorting menu items
}

export interface Page {
  id: string; // Unique identifier from the database
  title: string;
  slug: string; // This will be used for the page's path, e.g., /about-us
  content: string; // Can be simple text, HTML, or Markdown
  featured_photo_url?: string; // Optional URL for the featured photo
  meta_title?: string; // Optional: SEO title
  meta_description?: string; // Optional: SEO description
  status?: 'draft' | 'published' | 'archived'; // Page status
  created_at?: string; // ISO date string
  updated_at?: string; // ISO date string
}

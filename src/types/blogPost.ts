export interface BlogPost {
  id: number;
  title: string;
  slug: string; // SEO-friendly URL part
  content: string; // Can be HTML or Markdown
  excerpt?: string; // Optional short summary
  status: 'draft' | 'published' | 'archived';
  featured_photo_url?: string; // Renamed from featureImageURL
  meta_title?: string; // Renamed from seoTitle
  meta_description?: string; // Renamed from seoDescription
  published_at?: string; // ISO date string, set when status is 'published'
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
}

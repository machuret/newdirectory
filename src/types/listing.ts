// src/types/listing.ts

export interface Location {
  lat: number;
  lng: number;
}

export interface Geometry {
  location: Location;
  // viewport if needed
}

export interface Photo {
  height: number;
  html_attributions: string[];
  photo_reference: string;
  width: number;
  photo_url?: string; // URL to the photo, may be stored directly in database
}

export interface Review {
  author_name: string;
  author_url?: string; // Optional, might not always be present
  profile_photo_url?: string; // Optional
  rating: number;
  relative_time_description: string;
  text: string;
  time: number; // Unix timestamp
  // translated?: boolean; // if Google translates reviews
}

export interface OpenCloseDetail {
  day: number; // 0 (Sunday) to 6 (Saturday)
  time: string; // "HHMM" format, e.g., "1700"
  // date?: string; // For special hours, YYYY-MM-DD
  // truncated?: boolean; // If times are truncated due to special hours
}

export interface Period {
  open: OpenCloseDetail;
  close?: OpenCloseDetail; // Might be missing if open 24 hours or for certain cases
}

export interface OpeningHours {
  open_now?: boolean;
  periods?: Period[];
  weekday_text?: string[]; // e.g., "Monday: 9:00 AM – 5:00 PM"
  // special_days?: any[]; // For holidays, etc.
}

export interface PlusCode {
  compound_code: string;
  global_code: string;
}

export interface AddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

import { Category } from './category';

export interface Listing {
  // Database primary keys and identifiers
  id?: number;  // PostgreSQL primary key
  google_place_id: string; // Unique identifier from Google Places API
  place_id?: string;       // Related Google Place ID 
  
  // Basic listing information
  name: string;
  formatted_address?: string;
  vicinity?: string;
  
  // Location data
  latitude?: number;
  longitude?: number;
  geometry?: Geometry;        // Original Google Places geometry structure
  
  // Contact information
  phone_number?: string;      // Database field name
  formatted_phone_number?: string; // Original Google Places field name, maps to phone_number
  website?: string;
  
  // Metadata
  main_type?: string;        // Primary business type (legacy field)
  types?: string[];          // All business types (legacy field)
  
  // Categories (new system)
  categories?: Category[];   // All categories associated with this listing
  primary_category?: Category; // Primary category for this listing
  
  // Ratings and reviews
  rating?: number;           // Average rating (e.g., 4.5)
  user_ratings_total?: number; // Number of ratings
  reviews?: Review[];        // Associated reviews
  
  // Photos and media
  main_photo_url?: string;   // URL of the main photo
  photos?: Photo[];          // All associated photos
  
  // Operating hours
  opening_hours?: OpeningHours;
  
  // Additional information
  editorial_summary?: { overview: string; language?: string };
  
  // SEO fields
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  
  // Image fields
  main_image_url?: string;
  google_image_urls_json?: string;
  
  // Description field
  description?: string;
  description_generated?: boolean;
  
  // FAQ field - stores questions and answers
  faq?: Array<{question: string, answer: string}>;
  faqs?: Array<{question: string, answer: string}>;
  faqs_generated?: boolean;
  
  // Timestamps
  created_at?: string;       // When the record was created
  updated_at?: string;       // When the record was last updated
  
  // User who created/owns this listing
  user_id?: number;          // Reference to the user who created this listing
  is_approved?: boolean;     // Whether this listing has been approved by an admin
  is_featured?: boolean;     // Whether this listing is featured
  has_unread_leads?: boolean;     // Whether this listing has unread leads
  
  // Temporary field for UI state (not stored in database)
  newImageUrl?: string;
  
  // Google Places API specific fields that might be needed in the future
  business_status?: string;
  icon?: string;
  icon_background_color?: string;
  icon_mask_base_uri?: string;
  international_phone_number?: string;
  plus_code?: PlusCode;
  price_level?: number;
  reference?: string;
  scope?: string;
  utc_offset_minutes?: number; // Time zone offset from UTC in minutes
  address_components?: AddressComponent[]; // Official website
  google_url?: string; // Google Maps URL for the place
  // Any other fields you expect from your specific Google Places API call
}

// If you need the old OpeningHour for compatibility, keep it or adapt
// export interface OldOpeningHour {
//   day: string;
//   hours: string;
// }

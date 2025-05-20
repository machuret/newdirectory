export interface Lead {
  id: number;
  listing_id: number;
  listing_name?: string;
  name: string;
  email: string;
  message: string;
  status: 'new' | 'read' | 'replied' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface LeadStats {
  new_count: number;
  read_count: number;
  replied_count: number;
  archived_count: number;
  total_count: number;
}

export interface LeadFormData {
  name: string;
  email: string;
  message: string;
}

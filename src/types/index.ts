export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  lead_score: number;
  lead_status: 'cold' | 'warm' | 'hot' | 'converted' | 'not_interested';
  last_interaction: string;
  total_messages: number;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  lead_id: string;
  message: string;
  sender: 'user' | 'agent';
  created_at: string;
}

export interface ChatResponse {
  reply: string;
}

export interface LeadInfo {
  name: string;
  email: string;
  phone?: string;
  company?: string;
}

export type Profile = {
  id: string;
  name: string;
  phone: string;
  avatar_url?: string;
  is_job_seeker: boolean;
  created_at: string;
  updated_at: string;
};

export type Job = {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  category: string;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  created_by: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  completion_deadline?: string;
  images?: string[];
};

export type Bid = {
  id: string;
  job_id: string;
  bidder_id: string;
  amount: number;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: string;
  job_id?: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  image_url?: string;
  read: boolean;
  created_at: string;
};

export type Payment = {
  id: string;
  job_id: string;
  amount: number;
  status: 'pending' | 'held' | 'released' | 'refunded';
  payer_id: string;
  receiver_id: string;
  payment_method: string;
  created_at: string;
  updated_at: string;
};

export type Withdrawal = {
  id: string;
  user_id: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  payment_method: string;
  created_at: string;
  updated_at: string;
};
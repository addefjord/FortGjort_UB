import { Bid, Job, Message, Payment, Profile, Withdrawal } from '../types/database';
import { supabase } from './supabase';

export const database = {
  // Profil-operasjoner
  profiles: {
    get: async (userId: string) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return data as Profile;
    },

    update: async (userId: string, updates: Partial<Profile>) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();
      
      if (error) throw error;
      return data as Profile;
    },
  },

  // Jobb-operasjoner
  jobs: {
    create: async (job: Omit<Job, 'id' | 'created_at' | 'updated_at' | 'status'>) => {
      const { data, error } = await supabase
        .from('jobs')
        .insert({ ...job, status: 'open' })
        .select()
        .single();

      if (error) throw error;
      return data as Job;
    },

    getAll: async (filters?: { category?: string; search?: string; location?: string }) => {
      let query = supabase
        .from('jobs')
        // Avoid ambiguous embedding; select only job fields
        .select('*')
        .eq('status', 'open');

      if (filters?.category && filters.category !== 'all') {
        query = query.eq('category', filters.category);
      }
      
      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      if (filters?.location) {
        query = query.ilike('location', `%${filters.location}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Job[];
    },

    getMine: async (userId: string) => {
      const { data: postedJobs, error: postedError } = await supabase
        .from('jobs')
        // Avoid ambiguous embedding; select only job fields
        .select('*')
        .eq('created_by', userId)
        .order('created_at', { ascending: false });

      const { data: assignedJobs, error: assignedError } = await supabase
        .from('jobs')
        // Avoid ambiguous embedding; select only job fields
        .select('*')
        .eq('assigned_to', userId)
        .order('created_at', { ascending: false });

      if (postedError || assignedError) throw postedError || assignedError;
      
      return {
        posted: postedJobs as Job[],
        assigned: assignedJobs as Job[]
      };
    },
    
    getById: async (jobId: string) => {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single();
      
      if (error) throw error;
      return data as Job;
    },

    getBySeller: async (userId: string, limit?: number) => {
      let query = supabase
        .from('jobs')
        .select('*')
        .eq('created_by', userId)
        .order('created_at', { ascending: false });
      
      if (limit) {
        query = query.limit(limit);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as Job[];
    },

    update: async (jobId: string, updates: Partial<Job>) => {
      const { data, error } = await supabase
        .from('jobs')
        .update(updates)
        .eq('id', jobId)
        .select()
        .single();
      
      if (error) throw error;
      return data as Job;
    },
  },

  // Bud-operasjoner
  bids: {
    create: async (bid: Omit<Bid, 'id' | 'created_at' | 'updated_at' | 'status'>) => {
      const { data, error } = await supabase
        .from('bids')
        .insert(bid)
        .select()
        .single();
      
      if (error) throw error;
      return data as Bid;
    },

    getForJob: async (jobId: string) => {
      const { data, error } = await supabase
        .from('bids')
        .select('*')
        .eq('job_id', jobId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Bid[];
    },

    accept: async (bidId: string) => {
      const { data, error } = await supabase
        .from('bids')
        .update({ status: 'accepted' })
        .eq('id', bidId)
        .select()
        .single();
      
      if (error) throw error;
      return data as Bid;
    },
  },

  // Meldings-operasjoner
  messages: {
    send: async (message: Omit<Message, 'id' | 'created_at' | 'updated_at' | 'read'>) => {
      // Ensure user has valid session before inserting
      let { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session. Please log in.');
      }

      // Force refresh and set session to ensure JWT is attached on next request
      try {
        await supabase.auth.refreshSession();
        const refreshed = await supabase.auth.getSession();
        if (refreshed.data.session) {
          session = refreshed.data.session;
          await supabase.auth.setSession({
            access_token: session.access_token!,
            refresh_token: session.refresh_token!,
          });
        }
      } catch {}

      // Debug: log what we're sending
      console.log('Sending message:', {
        sender_id: message.sender_id,
        auth_uid: session.user.id,
        match: message.sender_id === session.user.id
      });

      const attemptInsert = async () => {
        // Prefer server-side RPC to ensure auth context is applied
        const { data, error } = await supabase.rpc('send_message', {
          p_sender: message.sender_id,
          p_receiver: message.receiver_id,
          p_content: message.content ?? '',
          p_image_url: (message as any).image_url ?? null,
        });
        // Shape result like PostgREST insert/select
        return { data, error } as { data: Message | null; error: any };
      };

      let { data, error } = await attemptInsert();
      // If RLS fails, try one quick retry after re-setting session
      if (error?.code === '42501') {
        const s = (await supabase.auth.getSession()).data.session;
        if (s) {
          await supabase.auth.setSession({
            access_token: s.access_token!,
            refresh_token: s.refresh_token!,
          });
          ({ data, error } = await attemptInsert());
        }
      }

      if (error) {
        console.error('Insert error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }
      return data as Message;
    },

    getAll: async (userId: string) => {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!sender_id(name, avatar_url),
          receiver:profiles!receiver_id(name, avatar_url)
        `)
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Message[];
    },
    
    getConversation: async (userId1: string, userId2: string) => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        // (sender=user1 AND receiver=user2) OR (sender=user2 AND receiver=user1)
        .or(
          `and(sender_id.eq.${userId1},receiver_id.eq.${userId2}),and(sender_id.eq.${userId2},receiver_id.eq.${userId1})`
        )
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as Message[];
    },

    markAsRead: async (messageId: string) => {
      const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('id', messageId);
      
      if (error) throw error;
    },

    delete: async (messageId: string) => {
      // Requires RLS policy: sender_id = auth.uid() for DELETE
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);
      if (error) throw error;
    },
  },

  // Betalings-operasjoner
  payments: {
    create: async (payment: Omit<Payment, 'id' | 'created_at' | 'updated_at' | 'status'>) => {
      const { data, error } = await supabase
        .from('payments')
        .insert(payment)
        .select()
        .single();
      
      if (error) throw error;
      return data as Payment;
    },

    release: async (paymentId: string) => {
      const { data, error } = await supabase
        .from('payments')
        .update({ status: 'released' })
        .eq('id', paymentId)
        .select()
        .single();
      
      if (error) throw error;
      return data as Payment;
    },
  },

  // Utbetalings-operasjoner
  withdrawals: {
    create: async (withdrawal: Omit<Withdrawal, 'id' | 'created_at' | 'updated_at' | 'status'>) => {
      const { data, error } = await supabase
        .from('withdrawals')
        .insert(withdrawal)
        .select()
        .single();
      
      if (error) throw error;
      return data as Withdrawal;
    },

    getForUser: async (userId: string) => {
      const { data, error } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Withdrawal[];
    },
  },
};
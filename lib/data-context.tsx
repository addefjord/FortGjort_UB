import { createContext, useContext, useEffect, useState } from 'react';
import type { Job, Message, Profile } from '../types/database';
import { useAuth } from './auth-context';
import { database } from './database';
import { supabase } from './supabase';

type DataContextType = {
  // Jobs
  jobs: Job[];
  myJobs: {
    posted: Job[];
    assigned: Job[];
  };
  loadJobs: (filters?: { category?: string; search?: string; location?: string }) => Promise<void>;
  loadMyJobs: () => Promise<void>;
  createJob: (job: Omit<Job, 'id' | 'created_at' | 'updated_at'>) => Promise<Job>;
  
  // Messages
  messages: Message[];
  unreadCount: number;
  loadMessages: () => Promise<void>;
  sendMessage: (message: Omit<Message, 'id' | 'created_at'>) => Promise<void>;
  
  // Profile
  profile: Profile | null;
  loadProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  
  // Loading states
  isLoading: {
    jobs: boolean;
    myJobs: boolean;
    messages: boolean;
    profile: boolean;
  };

  // Error states
  errors: {
    jobs: string | null;
    myJobs: string | null;
    messages: string | null;
    profile: string | null;
  };

  // Utilities
  reset: () => void;
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [myJobs, setMyJobs] = useState<{ posted: Job[]; assigned: Job[] }>({ posted: [], assigned: [] });
  const [messages, setMessages] = useState<Message[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState({
    jobs: false,
    myJobs: false,
    messages: false,
    profile: false
  });

  const [errors, setErrors] = useState({
    jobs: null as string | null,
    myJobs: null as string | null,
    messages: null as string | null,
    profile: null as string | null
  });

  const loadJobs = async (filters?: { category?: string; search?: string; location?: string }) => {
    try {
      setIsLoading(prev => ({ ...prev, jobs: true }));
      setErrors(prev => ({ ...prev, jobs: null }));
      const jobs = await database.jobs.getAll(filters);
      setJobs(jobs);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Kunne ikke laste jobber';
      setErrors(prev => ({ ...prev, jobs: message }));
      console.error('Failed to load jobs:', error);
    } finally {
      setIsLoading(prev => ({ ...prev, jobs: false }));
    }
  };

  const loadMyJobs = async () => {
    if (!user?.id) return;
    try {
      setIsLoading(prev => ({ ...prev, myJobs: true }));
      setErrors(prev => ({ ...prev, myJobs: null }));
      const { posted, assigned } = await database.jobs.getMine(user.id);
      setMyJobs({ posted, assigned });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Kunne ikke laste dine jobber';
      setErrors(prev => ({ ...prev, myJobs: message }));
      console.error('Failed to load my jobs:', error);
    } finally {
      setIsLoading(prev => ({ ...prev, myJobs: false }));
    }
  };

  const loadMessages = async () => {
    if (!user?.id) return;
    try {
      setIsLoading(prev => ({ ...prev, messages: true }));
      setErrors(prev => ({ ...prev, messages: null }));
      const messages = await database.messages.getAll(user.id);
      setMessages(messages);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Kunne ikke laste meldinger';
      setErrors(prev => ({ ...prev, messages: message }));
      console.error('Failed to load messages:', error);
    } finally {
      setIsLoading(prev => ({ ...prev, messages: false }));
    }
  };

  const loadProfile = async () => {
    if (!user?.id) return;
    try {
      setIsLoading(prev => ({ ...prev, profile: true }));
      setErrors(prev => ({ ...prev, profile: null }));
      const profile = await database.profiles.get(user.id);
      setProfile(profile);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Kunne ikke laste profil';
      setErrors(prev => ({ ...prev, profile: message }));
      console.error('Failed to load profile:', error);
    } finally {
      setIsLoading(prev => ({ ...prev, profile: false }));
    }
  };

  // Load initial data when user logs in
  useEffect(() => {
    if (user?.id) {
      loadJobs();
      loadMyJobs();
      loadMessages();
      loadProfile();
    }
  }, [user?.id]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user?.id) return;

    // Subscribe to message inserts/updates for this user
    const messageSubscription = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`
        },
        () => {
          // Reload to keep list and unread counts in sync
          loadMessages();
        }
      )
      .subscribe();

    // Subscribe to job updates
    const jobSubscription = supabase
      .channel('jobs')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'jobs'
        },
        () => {
          loadJobs();
          loadMyJobs();
        }
      )
      .subscribe();

    return () => {
      messageSubscription.unsubscribe();
      jobSubscription.unsubscribe();
    };
  }, [user?.id]);

  const value: DataContextType = {
    jobs,
    myJobs,
    loadJobs,
    loadMyJobs,
    createJob: (job) => database.jobs.create(job),
    
    messages,
    unreadCount: messages.filter(m => !m.read && m.receiver_id === user?.id).length,
    loadMessages,
    sendMessage: async (message) => {
      await database.messages.send(message);
      loadMessages();
    },
    
    profile,
    loadProfile,
    updateProfile: async (updates) => {
      if (!user?.id) throw new Error('No user');
      await database.profiles.update(user.id, updates);
      loadProfile();
    },
    
    isLoading,
    errors,
    reset: () => {
      setJobs([]);
      setMyJobs({ posted: [], assigned: [] });
      setMessages([]);
      setProfile(null);
      setIsLoading({ jobs: false, myJobs: false, messages: false, profile: false });
      setErrors({ jobs: null, myJobs: null, messages: null, profile: null });
    },
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
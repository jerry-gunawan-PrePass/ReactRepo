import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';

// Define the Chore interface
export interface Chore {
  id: number;
  description: string;
  frequency: string;
  created_at: string;
}

// Define the context type
interface ChoreContextType {
  chores: Chore[];
  fetchChores: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

// Create the context with default values
const ChoreContext = createContext<ChoreContextType>({
  chores: [],
  fetchChores: async () => {},
  isLoading: false,
  error: null
});

// Custom hook to use the chore context
export const useChores = () => useContext(ChoreContext);

// Provider component
interface ChoreProviderProps {
  children: ReactNode;
}

export const ChoreProvider: React.FC<ChoreProviderProps> = ({ children }) => {
  const [chores, setChores] = useState<Chore[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch chores from Supabase
  const fetchChores = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('chores')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setChores(data || []);
      console.log('Chores loaded in context:', data);
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      console.error('Error fetching chores in context:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch chores when the provider mounts
  useEffect(() => {
    fetchChores();
  }, []);

  // Value object to be provided by the context
  const value = {
    chores,
    fetchChores,
    isLoading,
    error
  };

  return (
    <ChoreContext.Provider value={value}>
      {children}
    </ChoreContext.Provider>
  );
};

export default ChoreContext; 
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface Chore {
  id: number;
  description: string;
  frequency: string;
  created_at: string;
}

const ChoresManager: React.FC = () => {
  const [chores, setChores] = useState<Chore[]>([]);
  const [newChoreDescription, setNewChoreDescription] = useState('');
  const [newChoreFrequency, setNewChoreFrequency] = useState('one-time');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch all chores when component mounts
  useEffect(() => {
    fetchChores();
  }, []);

  const fetchChores = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('chores')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setChores(data || []);
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      console.error('Error fetching chores:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddChore = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newChoreDescription.trim()) {
      setError('Please enter a chore description');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // Get all existing chores to find the maximum ID
      const { data: allChores, error: fetchError } = await supabase
        .from('chores')
        .select('id')
        .order('id', { ascending: false });
      
      if (fetchError) throw fetchError;
      
      // Calculate the next ID (max + 1, or 1 if no chores exist)
      const maxId = allChores && allChores.length > 0 ? allChores[0].id : 0;
      const nextId = maxId + 1;
      
      console.log('Next ID to use:', nextId);
      
      // Insert with explicit ID
      const { data, error } = await supabase
        .from('chores')
        .insert([
          { 
            id: nextId,
            description: newChoreDescription.trim(),
            frequency: newChoreFrequency,
            created_at: new Date().toISOString()
          }
        ])
        .select();

      if (error) {
        console.error('Insert error details:', error);
        throw error;
      }
      
      console.log('Insert successful:', data);
      
      // Refresh the entire chores list
      await fetchChores();
      
      setNewChoreDescription('');
      setNewChoreFrequency('one-time');
      setSuccessMessage('Chore added successfully!');
      
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      const error = err as Error;
      setError(`Error adding chore: ${error.message}`);
      console.error('Error adding chore:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteChore = async (id: number) => {
    if (!confirm('Are you sure you want to delete this chore?')) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('chores')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setChores(prev => prev.filter(chore => chore.id !== id));
      setSuccessMessage('Chore deleted successfully!');
      
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      console.error('Error deleting chore:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Chores Manager</h1>
      
      {/* Add Chore Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Add New Chore</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {successMessage}
          </div>
        )}
        
        <form onSubmit={handleAddChore}>
          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium mb-1">
              Chore Description
            </label>
            <input
              type="text"
              id="description"
              className="w-full p-3 border rounded text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={newChoreDescription}
              onChange={(e) => setNewChoreDescription(e.target.value)}
              placeholder="Enter chore description"
              required
              style={{ minHeight: "45px" }}
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="frequency" className="block text-sm font-medium mb-1">
              Frequency (Required)
            </label>
            <select
              id="frequency"
              className="w-full p-3 border rounded text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={newChoreFrequency}
              onChange={(e) => setNewChoreFrequency(e.target.value)}
              required
              style={{ minHeight: "45px" }}
            >
              <option value="one-time">One-time</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          
          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded text-base font-medium"
            disabled={isLoading}
            style={{ minHeight: "45px" }}
          >
            {isLoading ? 'Adding...' : 'Add Chore'}
          </button>
        </form>
      </div>
      
      {/* Chores List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">All Chores</h2>
        
        {isLoading && chores.length === 0 ? (
          <p className="text-center py-4">Loading chores...</p>
        ) : chores.length === 0 ? (
          <p className="text-center py-4">No chores found. Add some chores above!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700">
                  <th className="py-2 px-4 text-left">Description</th>
                  <th className="py-2 px-4 text-left">Frequency</th>
                  <th className="py-2 px-4 text-left">Created</th>
                  <th className="py-2 px-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {chores.map((chore) => (
                  <tr key={chore.id} className="border-b">
                    <td className="py-2 px-4">{chore.description}</td>
                    <td className="py-2 px-4">
                      <span className="capitalize">{chore.frequency}</span>
                    </td>
                    <td className="py-2 px-4">
                      {chore.created_at ? new Date(chore.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-2 px-4">
                      <button
                        onClick={() => handleDeleteChore(chore.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChoresManager; 
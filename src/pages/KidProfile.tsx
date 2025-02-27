import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

interface Kid {
  id: number;
  first_name: string;
  last_name: string;
  points: number;
  avatar_url: string | null;
}

interface Chore {
  id: number;
  description: string;
  kid_chore_id: number;
  assigned_date: string;
  completed: boolean;
}

const KidProfile = () => {
  const [kid, setKid] = useState<Kid | null>(null);
  const [chores, setChores] = useState<Chore[]>([]);
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchKidProfile();
    fetchKidChores();
  }, []);

  async function fetchKidProfile() {
    try {
      const { data, error } = await supabase
        .from('kids')
        .select('*')
        .eq('id', 1)
        .single();

      if (error) throw error;
      
      setKid(data);
      setAvatarUrl(data.avatar_url);
    } catch (error) {
      console.error('Error fetching kid profile:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchKidChores() {
    try {
      const { data, error } = await supabase
        .from('kids_chores')
        .select(`
          id,
          assigned_date,
          completed,
          chores (
            id,
            description
          )
        `)
        .eq('kid_id', 1);

      if (error) throw error;
      
      // Transform the data to a more usable format
      const formattedChores = data.map(item => ({
        id: item.chores.id,
        description: item.chores.description,
        kid_chore_id: item.id,
        assigned_date: item.assigned_date,
        completed: item.completed
      }));
      
      setChores(formattedChores);
    } catch (error) {
      console.error('Error fetching kid chores:', error);
    }
  }

  async function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }
    
    const file = event.target.files[0];
    setAvatarFile(file);
    
    // Create a preview
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target) {
        setAvatarUrl(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  }

  async function uploadAvatar() {
    if (!avatarFile || !kid) return;
    
    setUploading(true);
    
    try {
      // Upload the file to Supabase Storage
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${kid.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile);
        
      if (uploadError) throw uploadError;
      
      // Get the public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
        
      // Update the kid's avatar_url in the database
      const { error: updateError } = await supabase
        .from('kids')
        .update({ avatar_url: data.publicUrl })
        .eq('id', kid.id);
        
      if (updateError) throw updateError;
      
      // Update the state
      setAvatarUrl(data.publicUrl);
      alert('Avatar updated successfully!');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Error uploading avatar');
    } finally {
      setUploading(false);
      setAvatarFile(null);
    }
  }

  async function toggleChoreCompletion(choreId: number, completed: boolean) {
    try {
      const now = new Date().toISOString();
      
      const { error } = await supabase
        .from('kids_chores')
        .update({ 
          completed: !completed,
          last_completed: !completed ? now : null
        })
        .eq('id', choreId);
        
      if (error) throw error;
      
      // Update the local state
      setChores(chores.map(chore => 
        chore.kid_chore_id === choreId 
          ? { ...chore, completed: !completed } 
          : chore
      ));
    } catch (error) {
      console.error('Error toggling chore completion:', error);
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!kid) {
    return <div className="flex justify-center items-center h-screen">Kid not found</div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex flex-col items-center">
            <div className="relative w-32 h-32 mb-4">
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt={`${kid.first_name}'s avatar`} 
                  className="w-full h-full object-cover rounded-full border-4 border-blue-500"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center border-4 border-blue-500">
                  <span className="text-3xl font-bold text-gray-500">
                    {kid.first_name.charAt(0)}{kid.last_name.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            
            <label className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition">
              Change Photo
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleAvatarChange} 
                className="hidden" 
              />
            </label>
            
            {avatarFile && (
              <button 
                onClick={uploadAvatar}
                disabled={uploading}
                className="mt-2 bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition disabled:bg-gray-400"
              >
                {uploading ? 'Uploading...' : 'Save Photo'}
              </button>
            )}
          </div>
          
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{kid.first_name} {kid.last_name}</h1>
            <p className="text-xl mb-4">Points: <span className="font-bold text-blue-600">{kid.points}</span></p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4">My Chores</h2>
        
        {chores.length === 0 ? (
          <p className="text-gray-500">No chores assigned yet.</p>
        ) : (
          <ul className="space-y-4">
            {chores.map((chore) => (
              <li key={chore.kid_chore_id} className="flex items-center p-3 border rounded-md hover:bg-gray-50">
                <input 
                  type="checkbox" 
                  checked={chore.completed} 
                  onChange={() => toggleChoreCompletion(chore.kid_chore_id, chore.completed)}
                  className="w-5 h-5 mr-3 accent-blue-500"
                />
                <div className="flex-1">
                  <p className={`text-lg ${chore.completed ? 'line-through text-gray-400' : ''}`}>
                    {chore.description}
                  </p>
                  <p className="text-sm text-gray-500">
                    Assigned: {new Date(chore.assigned_date).toLocaleDateString()}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default KidProfile;
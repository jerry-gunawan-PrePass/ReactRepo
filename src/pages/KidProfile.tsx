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
      
      console.log('Raw chores data:', data);
      
      // Transform the data to a more usable format
      const formattedChores = data.map(item => {
        // Check if chores exists and has at least one item
        if (item.chores && Array.isArray(item.chores) && item.chores.length > 0) {
          return {
            id: item.chores[0].id,
            description: item.chores[0].description,
            kid_chore_id: item.id,
            assigned_date: item.assigned_date,
            completed: item.completed
          };
        } else if (item.chores && !Array.isArray(item.chores)) {
          // If chores is not an array but an object
          return {
            id: item.chores.id,
            description: item.chores.description,
            kid_chore_id: item.id,
            assigned_date: item.assigned_date,
            completed: item.completed
          };
        }
        return null;
      }).filter(Boolean); // Remove any null entries
      
      console.log('Formatted chores:', formattedChores);
      setChores(formattedChores);
    } catch (error) {
      console.error('Error fetching kid chores:', error);
    }
  }

  async function handleAvatarClick() {
    // Create a file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.onchange = handleAvatarChange;
    fileInput.click();
  }

  async function handleAvatarChange(event: any) {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }
    
    const file = event.target.files[0];
    
    // Create a preview
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target) {
        setAvatarUrl(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
    
    // Upload immediately
    uploadAvatar(file);
  }

  async function uploadAvatar(file: File) {
    if (!kid) return;
    
    setUploading(true);
    
    try {
      // Instead of using the images table or a specific bucket,
      // let's use a data URL approach which doesn't require storage
      const reader = new FileReader();
      
      // Create a promise to handle the FileReader async operation
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            reject(new Error('Failed to convert file to data URL'));
          }
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
      
      // Update the kid's avatar_url in the database with the data URL
      const { error: updateError } = await supabase
        .from('kids')
        .update({ avatar_url: dataUrl })
        .eq('id', kid.id);
        
      if (updateError) throw updateError;
      
      // Update the state with the data URL
      setAvatarUrl(dataUrl);
      
      // Update the kid state to include the new avatar_url
      setKid({
        ...kid,
        avatar_url: dataUrl
      });
      
      alert('Avatar updated successfully!');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Error uploading avatar');
    } finally {
      setUploading(false);
    }
  }

  async function toggleChoreCompletion(choreId: number, completed: boolean) {
    try {
      const now = new Date().toISOString();
      
      // First, get the current chore to check last_completed status
      const { data: choreData, error: fetchError } = await supabase
        .from('kids_chores')
        .select('last_completed')
        .eq('id', choreId)
        .single();
        
      if (fetchError) throw fetchError;
      
      // Update the chore completion status
      const { error } = await supabase
        .from('kids_chores')
        .update({ 
          completed: !completed,
          // Only set last_completed when completing for the first time
          // If unchecking, keep the existing last_completed value
          last_completed: !completed && choreData.last_completed === null ? now : choreData.last_completed
        })
        .eq('id', choreId);
        
      if (error) throw error;
      
      // Award points only if:
      // 1. The chore is being marked as completed (not uncompleted)
      // 2. The chore was never completed before (last_completed was null)
      if (!completed && choreData.last_completed === null && kid) {
        // Update points in the database
        const { error: pointsError } = await supabase
          .from('kids')
          .update({ points: kid.points + 1 })
          .eq('id', kid.id);
          
        if (pointsError) throw pointsError;
        
        // Update local state for kid's points
        setKid({
          ...kid,
          points: kid.points + 1
        });
      }
      
      // Update the local state for chores
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
            <div 
              className="relative cursor-pointer" 
              style={{ width: '2in', height: '2in' }}
              onClick={handleAvatarClick}
            >
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full z-10">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
                </div>
              )}
              
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt={`${kid.first_name}'s avatar`} 
                  className="w-full h-full object-cover rounded-full border-4 border-blue-500"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center border-4 border-blue-500 hover:bg-gray-300 transition">
                  <span className="text-3xl font-bold text-gray-500">
                    {kid.first_name.charAt(0)}{kid.last_name.charAt(0)}
                  </span>
                </div>
              )}
            </div>
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
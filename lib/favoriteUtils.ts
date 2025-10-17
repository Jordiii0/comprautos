import { supabase } from '@/lib/supabaseClient';

export const addToFavorites = async (userId: string, vehicleId: string) => {
  try {
    const { error } = await supabase
      .from('favorites')
      .insert({
        user_id: userId,
        vehicle_id: vehicleId
      });

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('Error adding favorite:', error);
    return { success: false, error: error.message };
  }
};

export const removeFromFavorites = async (userId: string, vehicleId: string) => {
  try {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('vehicle_id', vehicleId);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('Error removing favorite:', error);
    return { success: false, error: error.message };
  }
};

export const checkIsFavorite = async (userId: string, vehicleId: string) => {
  try {
    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('vehicle_id', vehicleId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  } catch (error: any) {
    console.error('Error checking favorite:', error);
    return false;
  }
};
import { supabase } from "./supabaseClient";

export type UserType = "usuario" | "empresa" | "administrador" | null;

export const checkUserType = async (
  userId: string
): Promise<UserType> => {
  try {
    // Verificar si es usuario
    const { data: userData } = await supabase
      .from("usuario")
      .select("rol")
      .eq("usuario_id", userId)
      .single();

    if (userData) {
      return userData.rol === "administrador"
        ? "administrador"
        : "usuario";
    }

    // Verificar si es empresa
    const { data: empresaData } = await supabase
      .from("empresa")
      .select("id")
      .eq("usuario_id", userId)
      .single();

    if (empresaData) {
      return "empresa";
    }

    return null;
  } catch (error) {
    console.error("Error checking user type:", error);
    return null;
  }
};

export const isUserType = (userType: UserType, allowed: UserType[]): boolean => {
  return allowed.includes(userType);
};

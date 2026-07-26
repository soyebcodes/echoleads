"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ProfileNameState = {
  error?: string;
  success?: string;
};

export async function updateProfileName(
  _previousState: ProfileNameState,
  formData: FormData,
): Promise<ProfileNameState> {
  const name = String(formData.get("name") ?? "")
    .trim()
    .replace(/\s+/g, " ");

  if (name.length < 2 || name.length > 80) {
    return { error: "Name must be between 2 and 80 characters." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to update your name." };
  }

  const { error } = await supabase
    .from("profiles")
    .upsert({ id: user.id, name }, { onConflict: "id" });

  if (error) {
    return { error: "We couldn't save your name. Please try again." };
  }

  revalidatePath("/dashboard", "layout");
  return { success: "Name saved." };
}

export async function updateProfileAvatar(path: string): Promise<ProfileNameState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || path !== `${user.id}/avatar`) {
    return { error: "Invalid avatar upload." };
  }

  const { data } = supabase.storage.from("profile-avatars").getPublicUrl(path);
  const { error } = await supabase
    .from("profiles")
    .upsert({ id: user.id, avatar_url: data.publicUrl }, { onConflict: "id" });

  if (error) {
    return { error: "We couldn't save your avatar. Please try again." };
  }

  revalidatePath("/dashboard", "layout");
  return { success: "Avatar updated." };
}

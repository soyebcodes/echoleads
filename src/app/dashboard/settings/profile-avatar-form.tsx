"use client";

import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { updateProfileAvatar } from "@/app/actions/profile";
import { createClient } from "@/lib/supabase/client";

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 2 * 1024 * 1024;

export function ProfileAvatarForm({ name, avatarUrl }: { name: string; avatarUrl: string | null }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [previewUrl, setPreviewUrl] = useState<string | null>(avatarUrl);
  const [message, setMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type) || file.size > MAX_FILE_SIZE) {
      setMessage("Choose a PNG, JPG, or WebP image under 2 MB.");
      return;
    }

    setUploading(true);
    setMessage(null);
    setPreviewUrl(URL.createObjectURL(file));

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setUploading(false);
      setMessage("You must be signed in to upload an avatar.");
      return;
    }

    const path = `${user.id}/avatar`;
    const { error: uploadError } = await supabase.storage
      .from("profile-avatars")
      .upload(path, file, { cacheControl: "3600", contentType: file.type, upsert: true });

    if (uploadError) {
      setUploading(false);
      setMessage("Upload failed. Confirm the avatar storage migration has been run.");
      return;
    }

    const result = await updateProfileAvatar(path);
    setUploading(false);
    setMessage(result.error ?? result.success ?? null);
    if (!result.error) router.refresh();
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div
        className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-ember bg-cover bg-center text-lg font-semibold text-ember-foreground"
        style={previewUrl ? { backgroundImage: `url(${previewUrl})` } : undefined}
        aria-label="Profile avatar"
      >
        {previewUrl ? null : name[0]?.toUpperCase()}
      </div>
      <div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={handleAvatarChange}
        />
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface px-3.5 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4 text-ember" />}
          {uploading ? "Uploading..." : "Upload avatar"}
        </button>
        <p aria-live="polite" className="mt-1.5 text-xs text-muted-foreground">{message ?? "PNG, JPG, or WebP. Maximum 2 MB."}</p>
      </div>
    </div>
  );
}

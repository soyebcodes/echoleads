-- Run this after 20260720_profiles_add_name.sql if that migration was already applied.
-- It repairs missing rows for existing auth.users and adds the profile metadata fields.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS "avatar_url" text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS "created_at" timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS "updated_at" timestamptz NOT NULL DEFAULT now();

INSERT INTO public.profiles (id, name, avatar_url, created_at, updated_at)
SELECT
	user_account.id,
	COALESCE(
		NULLIF(BTRIM(user_account.raw_user_meta_data ->> 'name'), ''),
		NULLIF(SPLIT_PART(user_account.email, '@', 1), ''),
		'there'
	),
	COALESCE(
		NULLIF(BTRIM(user_account.raw_user_meta_data ->> 'avatar_url'), ''),
		NULLIF(BTRIM(user_account.raw_user_meta_data ->> 'picture'), '')
	),
	COALESCE(user_account.created_at, now()),
	now()
FROM auth.users AS user_account
ON CONFLICT (id) DO UPDATE
SET
	name = CASE
		WHEN public.profiles.name IS NULL OR BTRIM(public.profiles.name) = '' THEN EXCLUDED.name
		ELSE public.profiles.name
	END,
	avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url),
	updated_at = now();

CREATE OR REPLACE FUNCTION public.set_profile_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
	NEW.updated_at = now();
	RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS "set_profile_updated_at" ON public.profiles;
CREATE TRIGGER "set_profile_updated_at"
	BEFORE UPDATE ON public.profiles
	FOR EACH ROW EXECUTE FUNCTION public.set_profile_updated_at();

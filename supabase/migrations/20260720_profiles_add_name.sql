CREATE TABLE IF NOT EXISTS public.profiles (
	"id" uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
	"name" text NOT NULL DEFAULT '',
	"avatar_url" text,
	"created_at" timestamptz NOT NULL DEFAULT now(),
	"updated_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS "name" text;
--> statement-breakpoint
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS "avatar_url" text;
--> statement-breakpoint
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS "created_at" timestamptz NOT NULL DEFAULT now();
--> statement-breakpoint
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS "updated_at" timestamptz NOT NULL DEFAULT now();
--> statement-breakpoint
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
--> statement-breakpoint
ALTER TABLE public.profiles ALTER COLUMN "name" SET DEFAULT '';
--> statement-breakpoint
ALTER TABLE public.profiles ALTER COLUMN "name" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
	FOR SELECT USING ((SELECT auth.uid()) = id);
--> statement-breakpoint
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
	FOR INSERT WITH CHECK ((SELECT auth.uid()) = id);
--> statement-breakpoint
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
	FOR UPDATE USING ((SELECT auth.uid()) = id) WITH CHECK ((SELECT auth.uid()) = id);
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.create_profile_for_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
	INSERT INTO public.profiles (id, name, avatar_url)
	VALUES (
		NEW.id,
		COALESCE(
			NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'name'), ''),
			NULLIF(SPLIT_PART(NEW.email, '@', 1), ''),
			'there'
		),
		COALESCE(
			NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'avatar_url'), ''),
			NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'picture'), '')
		)
	)
	ON CONFLICT (id) DO NOTHING;
	RETURN NEW;
END;
$$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS "create_profile_for_new_user" ON auth.users;
CREATE TRIGGER "create_profile_for_new_user"
	AFTER INSERT ON auth.users
	FOR EACH ROW EXECUTE FUNCTION public.create_profile_for_new_user();

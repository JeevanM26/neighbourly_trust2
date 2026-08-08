-- fix_categories.sql

-- 1. Merge duplicates by case-insensitive slug
DO $$ 
DECLARE
    dup RECORD;
    primary_id UUID;
BEGIN
    FOR dup IN 
        SELECT lower(slug) as low_slug, count(*), array_agg(id) as ids
        FROM public.service_categories
        GROUP BY lower(slug)
        HAVING count(*) > 1
    LOOP
        -- Keep the first ID as the primary
        primary_id := dup.ids[1];
        
        -- Safely update worker_categories, avoiding primary key violations
        UPDATE public.worker_categories wc
        SET category_id = primary_id
        WHERE category_id = ANY(dup.ids) AND category_id != primary_id
        AND NOT EXISTS (
            SELECT 1 FROM public.worker_categories wc2
            WHERE wc2.worker_id = wc.worker_id AND wc2.category_id = primary_id
        );
        
        -- Delete redundant worker_categories that couldn't be merged
        DELETE FROM public.worker_categories 
        WHERE category_id = ANY(dup.ids) AND category_id != primary_id;
        
        -- Update bookings to the primary category
        UPDATE public.bookings 
        SET category_id = primary_id 
        WHERE category_id = ANY(dup.ids) AND category_id != primary_id;

        -- Delete the duplicate categories
        DELETE FROM public.service_categories 
        WHERE id = ANY(dup.ids) AND id != primary_id;
    END LOOP;
END $$;

-- 2. Convert all slugs to lowercase
UPDATE public.service_categories SET slug = lower(slug);

-- 3. Enforce lowercase and uniqueness
-- First remove the old unique constraint if it exists
ALTER TABLE public.service_categories DROP CONSTRAINT IF EXISTS service_categories_slug_key;

-- Add check constraint for lowercase
ALTER TABLE public.service_categories DROP CONSTRAINT IF EXISTS service_categories_slug_check;
ALTER TABLE public.service_categories ADD CONSTRAINT service_categories_slug_check CHECK (slug = lower(slug));

-- Add unique constraint
ALTER TABLE public.service_categories ADD CONSTRAINT service_categories_slug_key UNIQUE (slug);

-- 4. Insert missing categories
INSERT INTO public.service_categories (slug, name_en) 
VALUES 
    ('mason-construction', 'Mason/Construction'),
    ('mechanic', 'Mechanic')
ON CONFLICT (slug) DO NOTHING;

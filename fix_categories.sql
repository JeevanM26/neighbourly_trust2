-- 1. Merge worker_categories from 'Electrician' (duplicate) to 'electrician'
UPDATE public.worker_categories
SET category_id = 'd558018e-5842-49ee-93e5-756c8554e9d1'
WHERE category_id = '999ae8cc-32aa-44c4-a213-9a8cc111c962'
  AND NOT EXISTS (
    SELECT 1 FROM public.worker_categories wc2 
    WHERE wc2.worker_id = public.worker_categories.worker_id 
      AND wc2.category_id = 'd558018e-5842-49ee-93e5-756c8554e9d1'
  );

-- Delete any remaining duplicate worker_categories that would violate primary key
DELETE FROM public.worker_categories
WHERE category_id = '999ae8cc-32aa-44c4-a213-9a8cc111c962';

-- Delete the 'Electrician' category
DELETE FROM public.service_categories
WHERE id = '999ae8cc-32aa-44c4-a213-9a8cc111c962';

-- 2. Add missing categories
INSERT INTO public.service_categories (slug, name_en)
VALUES
  ('mason-construction', 'Mason/Construction'),
  ('mechanic', 'Mechanic')
ON CONFLICT DO NOTHING;

-- 3. Add UNIQUE constraint to slug (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'service_categories_slug_key'
  ) THEN
    ALTER TABLE public.service_categories ADD CONSTRAINT service_categories_slug_key UNIQUE (slug);
  END IF;
END $$;

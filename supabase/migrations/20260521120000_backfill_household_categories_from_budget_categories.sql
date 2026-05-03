-- One-time backfill: copy distinct spending category *names* from historical budget_categories
-- into household_categories (global templates per household).
--
-- Rules:
-- - Dedupe by (household_id, lower(trim(name))) across all months.
-- - For each name, take the row from the most recent monthly_budget (year DESC, month DESC),
--   then tie-break by display_order so order feels like the latest month.
-- - default_amount = planned_amount from that winning row.
-- - slug is deterministic from household + normalized name so re-runs stay idempotent.
-- - Skips names that already exist as a non-archived household_categories row.
-- - Does NOT delete or alter budget_categories (existing months stay as-is).

WITH picked AS (
  SELECT DISTINCT ON (bc.household_id, lower(trim(bc.name)))
    bc.household_id,
    trim(bc.name) AS name,
    ('m-' || md5(bc.household_id::text || '|' || lower(trim(bc.name)))) AS slug,
    bc.category_type,
    bc.planned_amount::numeric(12, 2) AS default_amount,
    bc.display_order AS src_display_order
  FROM public.budget_categories bc
  INNER JOIN public.monthly_budgets mb ON mb.id = bc.monthly_budget_id
  WHERE bc.is_active = true
    AND trim(bc.name) <> ''
  ORDER BY
    bc.household_id,
    lower(trim(bc.name)),
    mb.year DESC,
    mb.month DESC,
    bc.display_order ASC,
    bc.updated_at DESC NULLS LAST
),
ranked AS (
  SELECT
    picked.household_id,
    picked.name,
    picked.slug,
    picked.category_type,
    picked.default_amount,
    (row_number() OVER (
      PARTITION BY picked.household_id
      ORDER BY picked.src_display_order, picked.name
    ) - 1)::int AS display_order
  FROM picked
)
INSERT INTO public.household_categories (
  household_id,
  name,
  slug,
  category_type,
  default_amount,
  display_order,
  archived_at
)
SELECT
  r.household_id,
  r.name,
  r.slug,
  r.category_type,
  r.default_amount,
  r.display_order,
  NULL::timestamptz
FROM ranked r
WHERE NOT EXISTS (
  SELECT 1
  FROM public.household_categories hc
  WHERE hc.household_id = r.household_id
    AND lower(trim(hc.name)) = lower(trim(r.name))
    AND hc.archived_at IS null
);

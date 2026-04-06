-- Normalize username for existing rows that do not have usuario
WITH normalized AS (
  SELECT
    id,
    CASE
      WHEN COALESCE(NULLIF(BTRIM(usuario), ''), '') <> '' THEN LOWER(BTRIM(usuario))
      WHEN COALESCE(NULLIF(BTRIM(email), ''), '') <> '' THEN LOWER(SPLIT_PART(BTRIM(email), '@', 1))
      ELSE 'user' || id::text
    END AS raw_usuario
  FROM "usuarios"
),
sanitized AS (
  SELECT
    id,
    CASE
      WHEN REGEXP_REPLACE(raw_usuario, '[^a-z0-9._-]', '', 'g') = '' THEN 'user' || id::text
      ELSE REGEXP_REPLACE(raw_usuario, '[^a-z0-9._-]', '', 'g')
    END AS base_usuario
  FROM normalized
),
ranked AS (
  SELECT
    id,
    base_usuario,
    ROW_NUMBER() OVER (PARTITION BY base_usuario ORDER BY id) AS rn
  FROM sanitized
)
UPDATE "usuarios" u
SET "usuario" = CASE WHEN r.rn = 1 THEN r.base_usuario ELSE r.base_usuario || '_' || u.id::text END
FROM ranked r
WHERE u.id = r.id
  AND (u."usuario" IS NULL OR BTRIM(u."usuario") = '');

-- Ensure every username is lowercase and trimmed
UPDATE "usuarios"
SET "usuario" = LOWER(BTRIM("usuario"))
WHERE "usuario" IS NOT NULL;

-- Apply final constraints
ALTER TABLE "usuarios" ALTER COLUMN "usuario" SET NOT NULL;
ALTER TABLE "usuarios" ALTER COLUMN "email" DROP NOT NULL;

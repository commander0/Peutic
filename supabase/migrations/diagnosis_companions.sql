-- DIAGAGNOSIS: Check Companions Table
-- List all companions to see duplicates
SELECT id, name, status, specialty FROM public.companions ORDER BY name;

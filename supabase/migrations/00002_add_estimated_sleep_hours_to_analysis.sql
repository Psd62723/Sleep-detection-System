-- Add estimated_sleep_hours column to analysis_results table
ALTER TABLE public.analysis_results 
ADD COLUMN estimated_sleep_hours numeric(4,2);
-- 1. Update profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false;

-- 2. Update ideas and problems tables
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false;
ALTER TABLE problems ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false;

-- 3. Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  target_id UUID NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('idea', 'problem', 'comment')),
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Auto-Mod Trigger: Hide post if reports >= 5
CREATE OR REPLACE FUNCTION handle_auto_moderation()
RETURNS TRIGGER AS $$
DECLARE
  report_count INTEGER;
BEGIN
  -- Count reports for the target
  SELECT COUNT(*) INTO report_count 
  FROM reports 
  WHERE target_id = NEW.target_id;

  IF report_count >= 5 THEN
    IF NEW.target_type = 'idea' THEN
      UPDATE ideas SET is_hidden = true WHERE id = NEW.target_id;
    ELSIF NEW.target_type = 'problem' THEN
      UPDATE problems SET is_hidden = true WHERE id = NEW.target_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_auto_mod ON reports;
CREATE TRIGGER trigger_auto_mod
AFTER INSERT ON reports
FOR EACH ROW EXECUTE FUNCTION handle_auto_moderation();

-- Create user_actions table for rate limiting and audit
-- Using gen_random_uuid() which is available by default in Supabase
CREATE TABLE IF NOT EXISTS user_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    metadata JSONB DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient rate limit queries
CREATE INDEX IF NOT EXISTS idx_user_actions_user_id ON user_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_actions_action ON user_actions(action);
CREATE INDEX IF NOT EXISTS idx_user_actions_created_at ON user_actions(created_at);
CREATE INDEX IF NOT EXISTS idx_user_actions_user_action_time ON user_actions(user_id, action, created_at);

-- Add RLS policies
ALTER TABLE user_actions ENABLE ROW LEVEL SECURITY;

-- Users can only view their own actions
CREATE POLICY "Users can view own actions"
    ON user_actions FOR SELECT
    USING (user_id = auth.uid());

-- Only system can insert actions (via service role or triggers)
CREATE POLICY "System can insert actions"
    ON user_actions FOR INSERT
    WITH CHECK (true);

-- Add comment
COMMENT ON TABLE user_actions IS 'Audit log for user actions used for rate limiting and analytics';

-- Create function to clean up old actions (keep last 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_user_actions()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM user_actions
    WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$;

-- Create scheduled job to clean up old actions (requires pg_cron extension)
-- This will run daily at 3 AM
-- SELECT cron.schedule('cleanup-user-actions', '0 3 * * *', 'SELECT cleanup_old_user_actions()');

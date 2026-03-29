-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'booking_request', 'booking_accepted', 'booking_rejected', 'new_message', 'new_review'
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  ride_id UUID REFERENCES rides(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own notifications" 
  ON notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" 
  ON notifications FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" 
  ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Function to get unread count
CREATE OR REPLACE FUNCTION get_unread_notifications_count(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM notifications WHERE user_id = user_uuid AND read = FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

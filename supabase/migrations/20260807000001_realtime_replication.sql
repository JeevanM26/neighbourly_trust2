-- Enable Realtime for bookings and booking_offers
ALTER PUBLICATION supabase_realtime ADD TABLE bookings, booking_offers;

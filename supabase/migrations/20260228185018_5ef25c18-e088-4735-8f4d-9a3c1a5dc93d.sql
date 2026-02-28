INSERT INTO storage.buckets (id, name, public) VALUES ('business-logos', 'business-logos', true);

CREATE POLICY "Anyone can view business logos" ON storage.objects FOR SELECT USING (bucket_id = 'business-logos');
CREATE POLICY "Authenticated users can upload own logo" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'business-logos' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update own logo" ON storage.objects FOR UPDATE USING (bucket_id = 'business-logos' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete own logo" ON storage.objects FOR DELETE USING (bucket_id = 'business-logos' AND auth.role() = 'authenticated');

-- RLS policies for scan-images bucket: users can only access their own folder (user_id/...)
CREATE POLICY "Users can view their own scan images"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'scan-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own scan images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'scan-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own scan images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'scan-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own scan images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'scan-images' AND auth.uid()::text = (storage.foldername(name))[1]);

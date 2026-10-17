ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS attachment_path text,
  ADD COLUMN IF NOT EXISTS attachment_name text,
  ADD COLUMN IF NOT EXISTS attachment_type text,
  ADD COLUMN IF NOT EXISTS attachment_size bigint;

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('chat-attachments', 'chat-attachments', false, 20971520)
ON CONFLICT (id) DO UPDATE
SET public = false,
    file_size_limit = EXCLUDED.file_size_limit;

DROP POLICY IF EXISTS "Chat members can view attachments" ON storage.objects;
CREATE POLICY "Chat members can view attachments"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'chat-attachments'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
);

DROP POLICY IF EXISTS "Chat members can upload attachments" ON storage.objects;
CREATE POLICY "Chat members can upload attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'chat-attachments'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
);

DROP POLICY IF EXISTS "Chat members can delete attachments" ON storage.objects;
CREATE POLICY "Chat members can delete attachments"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'chat-attachments'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
);

DROP POLICY IF EXISTS "Chat participants can update messages" ON public.messages;
CREATE POLICY "Chat participants can update messages"
ON public.messages FOR UPDATE TO authenticated
USING (
  (sender_id = auth.uid() AND is_admin = false)
  OR EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  (sender_id = auth.uid() AND is_admin = false)
  OR EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- File deletions are made by the signed-in client using its user JWT and these RLS policies.
-- Remove older Vault/pg_net triggers if this migration was run before.
DROP TRIGGER IF EXISTS delete_chat_attachment_after_message_delete ON public.messages;
DROP TRIGGER IF EXISTS delete_chat_attachment_after_path_change ON public.messages;
DROP FUNCTION IF EXISTS public.delete_chat_attachment_from_storage();

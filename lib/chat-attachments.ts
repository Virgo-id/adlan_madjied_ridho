import { supabase } from "@/lib/supabase";

export const CHAT_ATTACHMENT_BUCKET = "chat-attachments";
export const MAX_CHAT_ATTACHMENT_SIZE = 20 * 1024 * 1024;

export interface UploadedChatAttachment {
  attachment_path: string;
  attachment_name: string;
  attachment_type: string;
  attachment_size: number;
}

export async function uploadChatAttachment(
  file: File,
  senderId: string
): Promise<UploadedChatAttachment> {
  if (file.size > MAX_CHAT_ATTACHMENT_SIZE) {
    throw new Error("Ukuran lampiran maksimal 20 MB.");
  }

  const attachmentPath = `${senderId}/${crypto.randomUUID()}`;
  const { error } = await supabase.storage
    .from(CHAT_ATTACHMENT_BUCKET)
    .upload(attachmentPath, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (error) throw error;

  return {
    attachment_path: attachmentPath,
    attachment_name: file.name,
    attachment_type: file.type || "application/octet-stream",
    attachment_size: file.size,
  };
}

export async function removeChatAttachment(path: string) {
  return removeChatAttachments([path]);
}

export async function removeChatAttachments(paths: string[]) {
  const uniquePaths = [...new Set(paths.filter(Boolean))];
  for (let index = 0; index < uniquePaths.length; index += 100) {
    const { error } = await supabase.storage
      .from(CHAT_ATTACHMENT_BUCKET)
      .remove(uniquePaths.slice(index, index + 100));

    if (error) throw error;
  }
}

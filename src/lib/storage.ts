import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
  },
});

const bucket = env.SUPABASE_STORAGE_BUCKET;

const extensionForContentType = (contentType: string) => {
  if (contentType === "image/jpeg") return "jpg";
  if (contentType === "image/png") return "png";
  if (contentType === "image/heic") return "heic";
  if (contentType === "image/heif") return "heif";
  if (contentType === "image/webp") return "webp";
  return "bin";
};

export const storageService = {
  async createSignedUploadUrl(orgId: string, receiptId: string, contentType: string) {
    const ext = extensionForContentType(contentType);
    const key = `${orgId}/${receiptId}.${ext}`;
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUploadUrl(key);

    if (error || !data?.signedUrl) {
      throw new Error("Failed to create upload URL.");
    }

    return { key, signedUrl: data.signedUrl };
  },

  async createSignedViewUrl(orgId: string, key: string) {
    const validPrefix = key.startsWith(`${orgId}/`) || key.startsWith(`logo-${orgId}`);
    if (!validPrefix) {
      throw new Error("Unauthorized");
    }

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(key, 60 * 10);

    if (error || !data?.signedUrl) {
      throw new Error("Failed to create view URL.");
    }

    return data.signedUrl;
  },

  async createOrgLogoUploadUrl(orgId: string, contentType: string) {
    const ext = extensionForContentType(contentType);
    const key = `logo-${orgId}.${ext}`;
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUploadUrl(key);

    if (error || !data?.signedUrl) {
      throw new Error("Failed to create upload URL.");
    }

    return { key, signedUrl: data.signedUrl };
  },
};

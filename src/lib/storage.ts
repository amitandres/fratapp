import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

let _supabase: SupabaseClient | null = null;
const getSupabase = () => {
  if (!_supabase) {
    _supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });
  }
  return _supabase;
};

const getBucket = () => env.SUPABASE_STORAGE_BUCKET;

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
    const { data, error } = await getSupabase().storage
      .from(getBucket())
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

    const { data, error } = await getSupabase().storage
      .from(getBucket())
      .createSignedUrl(key, 60 * 10);

    if (error || !data?.signedUrl) {
      throw new Error("Failed to create view URL.");
    }

    return data.signedUrl;
  },

  async createOrgLogoUploadUrl(orgId: string, contentType: string) {
    const ext = extensionForContentType(contentType);
    const key = `logo-${orgId}.${ext}`;
    const { data, error } = await getSupabase().storage
      .from(getBucket())
      .createSignedUploadUrl(key);

    if (error || !data?.signedUrl) {
      throw new Error("Failed to create upload URL.");
    }

    return { key, signedUrl: data.signedUrl };
  },
};

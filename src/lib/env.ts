const requiredEnv = (key: string) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return value;
};

// Lazy validation: throw only when value is first accessed (runtime), not at module load (build)
export const env = {
  get SESSION_SECRET() {
    return requiredEnv("SESSION_SECRET");
  },
  get SUPABASE_URL() {
    return requiredEnv("SUPABASE_URL");
  },
  get SUPABASE_SERVICE_ROLE_KEY() {
    return requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  },
  get SUPABASE_STORAGE_BUCKET() {
    return requiredEnv("SUPABASE_STORAGE_BUCKET");
  },
};

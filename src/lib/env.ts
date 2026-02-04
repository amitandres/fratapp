const requiredEnv = (key: string) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return value;
};

export const env = {
  SESSION_SECRET: requiredEnv("SESSION_SECRET"),
  SUPABASE_URL: requiredEnv("SUPABASE_URL"),
  SUPABASE_SERVICE_ROLE_KEY: requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
  SUPABASE_STORAGE_BUCKET: requiredEnv("SUPABASE_STORAGE_BUCKET"),
};

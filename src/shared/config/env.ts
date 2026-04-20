const getRequiredEnv = (value: string | undefined, name: string) => {
  if (!value) {
    throw new Error(`Missing required env variable: ${name}`);
  }

  return value;
};

const env = {
  supabaseUrl: getRequiredEnv(import.meta.env.VITE_SUPABASE_URL, "VITE_SUPABASE_URL"),
  supabasePublishableKey: getRequiredEnv(
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    "VITE_SUPABASE_PUBLISHABLE_KEY",
  ),
};

export default env;

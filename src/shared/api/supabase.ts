import { createClient } from "@supabase/supabase-js";
import env from "../config/env";

export const db = createClient(env.supabaseUrl, env.supabasePublishableKey);

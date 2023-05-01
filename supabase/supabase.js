import config from "../config.js";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(config.supabaseURL, config.supabaseKey);

export default supabase;

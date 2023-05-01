import * as dotenv from "dotenv";
dotenv.config();

const config = {
  supabaseURL: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_KEY,
};

export default config;

import { z } from "zod";

const envSchema = z.object({
  MFL_YEAR: z.string().default("2026"),
  MFL_LEAGUE_ID: z.string().min(1, "MFL_LEAGUE_ID is required"),
  MFL_HOST: z.string().optional(),
  MFL_USERNAME: z.string().optional(),
  MFL_PASSWORD: z.string().optional(),
  MFL_APIKEY: z.string().optional(),
  MFL_USER_AGENT: z.string().default("mfl-mcp/0.1.0"),
  MFL_MCP_READ_ONLY: z
    .string()
    .optional()
    .transform((v) => v === "1" || v === "true"),
  MFL_CACHE_DIR: z.string().default(".cache/mfl-mcp"),
});

export type AppConfig = {
  year: string;
  leagueId: string;
  host?: string;
  username?: string;
  password?: string;
  apiKey?: string;
  userAgent: string;
  readOnly: boolean;
  cacheDir: string;
};

export function loadConfig(): AppConfig {
  const parsed = envSchema.parse(process.env);
  return {
    year: parsed.MFL_YEAR,
    leagueId: parsed.MFL_LEAGUE_ID,
    host: parsed.MFL_HOST,
    username: parsed.MFL_USERNAME,
    password: parsed.MFL_PASSWORD,
    apiKey: parsed.MFL_APIKEY,
    userAgent: parsed.MFL_USER_AGENT,
    readOnly: Boolean(parsed.MFL_MCP_READ_ONLY),
    cacheDir: parsed.MFL_CACHE_DIR,
  };
}

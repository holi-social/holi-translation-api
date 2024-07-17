import { logger, LogSeverity } from "./logging.ts";
import {
  DEFAULT_CACHE_ENABLED,
  DEFAULT_CACHE_TTL_MS_LIBRE_TRANSLATE,
  DEFAULT_PORT,
  startServer,
} from "./server.ts";

const environment = Deno.env.get("ENVIRONMENT") || "development";

logger.setUpLogger(
  environment,
  environment === "development" ? LogSeverity.DEFAULT : LogSeverity.INFO,
);

const requiredEnv = <T>(
  name: string,
  typeFn: (s: string) => T,
  fallback?: T,
): T => {
  const env = Deno.env.get(name);
  if (env === undefined && fallback === undefined) {
    throw Error(`Environment variable "${name}" is required`);
  } else {
    return env !== undefined ? typeFn(env) : fallback!;
  }
};

const asBoolean = (str: string) => /^true$/i.test(str);

const serverConfigFromEnv = () => {
  return {
    port: requiredEnv("PORT", Number, DEFAULT_PORT),
    cacheEnabled: requiredEnv(
      "CACHE_ENABLED",
      asBoolean,
      DEFAULT_CACHE_ENABLED,
    ),
    cacheTtlMsLibreTranslate: requiredEnv(
      "CACHE_TTL_MS_LIBRE_TRANSLATE",
      Number,
      DEFAULT_CACHE_TTL_MS_LIBRE_TRANSLATE,
    ),
    fake: requiredEnv("FAKE", asBoolean, false), // For local development. If set, the API returns dummy data
  };
};

await startServer(serverConfigFromEnv());

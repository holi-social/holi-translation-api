import {
  DetectLanguageQueryParameters,
  TranslationFormat,
  TranslationQueryParameters,
} from "./types.ts";
import {
  ApiLanguageDetectionReslut,
  ApiTranslationReslut,
} from "./api_types.ts";
import { logger } from "./logging.ts";
import { client } from "./redis.ts";
import { createHash, GraphQLError } from "./deps.ts";

const BASE_URL = Deno.env.get("HOLI_LIBRETRANSLATE_BASE_URL");

if (!BASE_URL) {
  throw new Error(
    "HOLI_LIBRETRANSLATE_BASE_URL environment variable is not set",
  );
}

const transformTranslationResult = (
  translation: ApiTranslationReslut,
): string => translation.translatedText;

const transformLanguageDetectionResult = (
  detections: ApiLanguageDetectionReslut,
): string => {
  return detections.sort((a, b) => b.confidence - a.confidence)[0].language;
};

export const translate = async (
  query: TranslationQueryParameters,
): Promise<string> => {
  const cacheKey = createHash("sha256").update(
    `translate:${query.text}:${query.targetLanguage}`,
  ).toString();

  const cachedResult = await client.get(cacheKey);

  if (cachedResult) {
    logger.debug(`cache hit: ${JSON.stringify({ key: cacheKey })}`);
    return cachedResult;
  }

  const url = `${BASE_URL}/translate`;
  logger.info(`Starting translation...`);
  const start = Date.now();
  try {
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify({
        q: query.text,
        source: "auto",
        target: query.targetLanguage,
        format: TranslationFormat.TEXT,
      }),
      headers: { "Content-Type": "application/json" },
    });
    if (response.status >= 400) {
      throw new GraphQLError("Translation failed");
    }
    const json = await response.json();
    const result = transformTranslationResult(json);

    await client.set(cacheKey, result);

    return result;
  } catch (e) {
    logger.error(
      `Error performing request to ${url}: ${
        JSON.stringify({
          message: e.message,
          cause: e.cause,
        })
      }`,
    );
    throw e;
  } finally {
    const duration = Date.now() - start;
    logger.debug(`Translation took ${duration} ms`);
  }
};

export const detectLanguage = async (
  query: DetectLanguageQueryParameters,
): Promise<string> => {
  const url = `${BASE_URL}/detect`;
  logger.info(`Starting language detection...`);
  const start = Date.now();
  try {
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify({
        q: query.text,
      }),
      headers: { "Content-Type": "application/json" },
    });
    if (response.status >= 400) {
      throw new GraphQLError("Language detection failed");
    }
    const json = await response.json();
    return transformLanguageDetectionResult(json);
  } catch (e) {
    logger.error(
      `Error performing request to ${url}: ${
        JSON.stringify({
          message: e.message,
          cause: e.cause,
        })
      }`,
    );
    throw e;
  } finally {
    const duration = Date.now() - start;
    logger.debug(`Language detection took ${duration} ms`);
  }
};

import {
  DetectLanguageQueryParameters,
  TranslationQueryParameters,
} from "./types.ts";
import { createSchema, createYoga, serve, useResponseCache } from "./deps.ts";
import { logger } from "./logging.ts";
import { detectLanguage, translate } from "./libretranslate.ts";

const typeDefs = `
    type Query {
        translate(text: String!, targetLanguage: String!): String!
        detectLanguage(text: String!): String!
    }
`;

const fakeTranslation = "This is a fake translation";
const fakeDetectLanguage = "This is a fake detected language";

type GraphQLContext = {
  request?: { headers: Headers };
  params?: {
    extensions?: {
      headers?: {
        [key: string]: string;
      };
    };
  };
};

const createResolvers = (_config: ServerConfig) => ({
  Query: {
    translate: (
      // deno-lint-ignore no-explicit-any
      _parent: any,
      parameters: TranslationQueryParameters,
    ): Promise<string> =>
      _config.fake ? Promise.resolve(fakeTranslation) : translate(
        parameters,
      ),
    detectLanguage: (
      // deno-lint-ignore no-explicit-any
      _parent: any,
      parameters: DetectLanguageQueryParameters,
    ): Promise<string> =>
      _config.fake ? Promise.resolve(fakeDetectLanguage) : detectLanguage(
        parameters,
      ),
  },
});

export const DEFAULT_PORT = 8089;
export const DEFAULT_CACHE_ENABLED = true;
export const DEFAULT_CACHE_TTL_MS_LIBRE_TRANSLATE = 60_000;

export interface ServerConfig {
  port: number; // default: 8089
  cacheEnabled: boolean; // default: true
  cacheTtlMsLibreTranslate: number; // default: 60 seconds
  fake: boolean; // For local development. If set, the API returns dummy data
}

export const createGraphQLServer = (config: ServerConfig): GraphQLServer => {
  const plugins = config.cacheEnabled
    ? [
      useResponseCache({
        session: () => null, // global cache, shared by all users
        ttlPerSchemaCoordinate: {
          "Query.translate": config.cacheTtlMsLibreTranslate,
          "Query.detectLanguage": config.cacheTtlMsLibreTranslate,
        },
      }),
    ]
    : [];
  const resolvers = createResolvers(config);
  return createYoga({
    schema: createSchema({ resolvers, typeDefs }),
    graphiql: true,
    plugins,
  });
};

// deno-lint-ignore no-explicit-any
export type GraphQLServer = any;

export const startServer = (config: ServerConfig): Promise<void> => {
  const graphQLServer: GraphQLServer = createGraphQLServer(config);
  return serve(graphQLServer, {
    port: config.port,
    onListen({ port, hostname }) {
      logger.info(
        `Server started at http://${
          hostname === "0.0.0.0" ? "localhost" : hostname
        }:${port}/graphql`,
      );
      if (config.fake) {
        logger.info(
          `Server is serving fake data due to FAKE env var set to true`,
        );
      }
    },
  });
};

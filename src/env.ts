

export type EnvType = "development" | "staging" | "production" | undefined;

export interface Env {
  // OpenAI API Key
  OPENAI_API_KEY: string;

  ENVIRONMENT: EnvType;
  NODE_ENV: EnvType;
}

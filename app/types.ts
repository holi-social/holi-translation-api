export type TranslationQueryParameters = {
  text: string
  targetLanguage: string
}

export type DetectLanguageQueryParameters = {
  text: string
}

export enum TranslationFormat {
  TEXT = 'text',
  HTML = 'html',
}

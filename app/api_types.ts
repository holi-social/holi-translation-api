export type ApiTranslationReslut = {
  detectedLanguage: {
    confidence: number
    language: string
  }
  translatedText: string
}

export type ApiLanguageDetectionReslut = Array<{
  confidence: number
  language: string
}>

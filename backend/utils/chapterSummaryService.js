import dotenv from 'dotenv'
import { GoogleGenAI, Type } from '@google/genai'

dotenv.config()

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

// Fonction utilitaire pour créer une pause
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Analyse un livre par blocs en conservant le contexte d'un bloc à l'autre
 */
export const detectChapters = async (text) => {
  if (!text || text.length < 5000) throw new Error('Texte trop court.')

  const CHUNK_SIZE = 120000
  const OVERLAP = 8000

  let allChapters = []
  let currentIndex = 0

  let lastChapterNumber = 0
  let lastChapterTitle = ''

  let stopProcessing = false

  while (currentIndex < text.length) {
    let endIndex = currentIndex + CHUNK_SIZE

    if (endIndex < text.length) {
      const lastNewline = text.lastIndexOf('\n\n', endIndex)
      if (lastNewline > currentIndex + CHUNK_SIZE * 0.8) {
        endIndex = lastNewline
      }
    }

    const chunk = text.substring(currentIndex, endIndex + OVERLAP)

    const contextInstruction =
      lastChapterNumber > 0
        ? `ATTENTION : Ceci est la suite d'un livre.
Le bloc précédent s'est terminé sur le "Chapitre ${lastChapterNumber} : ${lastChapterTitle}".

Règles importantes :
- Ne recrée PAS ce chapitre.
- Si le texte continue ce chapitre, ignore son début.
- Commence uniquement à partir du chapitre ${lastChapterNumber + 1}.`
        : 'Ceci est le début du document. Commence la numérotation au chapitre 1.'

    const PROMPT = `
Tu es un analyste littéraire expert.

Ta mission est d'identifier les chapitres et de produire un résumé détaillé, structuré et fidèle au texte.

${contextInstruction}

📌 Consignes :
- Repère les chapitres (Chapitre 1, 2, changements de sujet, titres implicites).
- Ne mélange jamais deux chapitres.
- Ignore les doublons.

📊 Pour CHAQUE chapitre retourne un JSON :

- chapterNumber (number)
- title (string)
- summary (8 à 12 phrases détaillées)
- keyTakeaways (5 à 8 points)

🚫 Retourne uniquement un tableau JSON valide.
`

    console.log(
      `Analyse du bloc ${currentIndex} → ${endIndex} (chapitre attendu ${lastChapterNumber + 1})`,
    )

    let response
    let retries = 3
    let retryDelay = 15000
    let success = false

    // 🔁 Retry loop
    while (retries > 0 && !success) {
      try {
        response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [{ text: PROMPT }, { text: chunk }],
          config: {
            temperature: 0.1,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  chapterNumber: { type: Type.INTEGER },
                  title: { type: Type.STRING },
                  summary: { type: Type.STRING },
                  keyTakeaways: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: ['chapterNumber', 'title', 'summary', 'keyTakeaways'],
              },
            },
          },
        })

        success = true
      } catch (error) {
        const status = error.status || error.code
        const is429 = status === 429 || error.message?.includes('429')
        const is503 = status === 503 || error.message?.includes('UNAVAILABLE')

        // 🔁 retry si quota temporaire
        if ((is429 || is503) && retries > 1) {
          console.warn(
            `⚠️ Rate limit/surcharge sur bloc ${currentIndex}. Retry dans ${retryDelay / 1000}s (${retries - 1} essais restants)`,
          )

          await delay(retryDelay)
          retries--
          retryDelay *= 2
          continue
        }

        // 🛑 arrêt propre si quota final
        if (is429 || is503) {
          console.error('🚫 Quota atteint ou service indisponible. Arrêt.')
          return allChapters
        }

        // ❌ erreur critique
        console.error(`❌ Erreur fatale sur bloc ${currentIndex}:`, error)
        stopProcessing = true
        break
      }
    }

    // 🛑 stop global si erreur fatale
    if (stopProcessing) break

    // 📦 traitement réponse
    if (success && response?.text) {
      try {
        const chaptersFromChunk = JSON.parse(response.text)

        if (chaptersFromChunk.length > 0) {
          const lastChap = chaptersFromChunk[chaptersFromChunk.length - 1]

          lastChapterNumber = lastChap.chapterNumber
          lastChapterTitle = lastChap.title

          allChapters = allChapters.concat(chaptersFromChunk)
        }
      } catch (e) {
        console.error(`❌ Erreur parsing JSON bloc ${currentIndex}:`, e)
      }
    }

    // ➡️ avancer
    currentIndex = endIndex

    // ⏸️ pause anti rate-limit
    if (currentIndex < text.length) {
      console.log('⏸️ Pause 4s avant prochain bloc...')
      await delay(4000)
    }
  }

  // 🧹 suppression doublons titres
  const finalChapters = []
  const seenTitles = new Set()

  for (const chap of allChapters) {
    const title = chap.title?.toLowerCase().trim()
    if (!seenTitles.has(title)) {
      seenTitles.add(title)
      finalChapters.push(chap)
    }
  }

  console.log(`✅ Terminé : ${finalChapters.length} chapitres détectés`)

  return finalChapters
}

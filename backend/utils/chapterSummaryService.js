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
        ? `IMPORTANT: This is a continuation of a book.
The previous block ended on "Chapter ${lastChapterNumber}: ${lastChapterTitle}".

Key rules:
- Do NOT recreate that chapter.
- If the text continues that chapter, skip its beginning.
- Start only from chapter ${lastChapterNumber + 1}.`
        : 'This is the beginning of the document. Start numbering from chapter 1.'

    const PROMPT = `
You are an expert literary analyst.

Your mission is to identify story chapters and produce detailed, structured summaries faithful to the text.

${contextInstruction}

📌 Rules:
- Only include chapters containing real narrative content (story, dialogue, action, scene description).
- Never merge two chapters together.
- Ignore duplicates.

🚫 COMPLETELY IGNORE and do NOT include in your response:
- Character lists, glossaries, name indexes
- Tables of contents
- Tables, structured lists, appendices
- Prefaces, author's notes, warnings, acknowledgements
- Title pages, dedications, epigraphs
- Anything that is not a narrative chapter telling an actual story

📊 For EACH narrative chapter return a JSON object with:

- chapterNumber (number)
- title (string)
- summary (8 to 12 detailed sentences)
- keyTakeaways (5 to 8 bullet points)
- characterDetails (array): for each character who has AT LEAST one physical description, clothing, or notable item in this chapter:
  → name: character name (without title or honorific)
  → physicalAppearance: physical description (hair, eyes, scars, build…) — empty string if not mentioned
  → clothing: clothing or outfit worn — empty string if not mentioned
  → items: notable objects carried or owned (weapons, artefacts, accessories) — empty array if none
  → Do NOT include a character if none of these three fields are filled.
  → Return [] if no such details are found in the chapter.
- characterMentions (array): list ALL named characters present or mentioned in this chapter, even briefly:
  → name: character name (without title or honorific)
  → role: their role in this chapter in one short sentence
  → relationships: interactions with other named characters in this chapter as [{ with: "CharacterName", note: "short description of the interaction" }] — empty array if no explicit interaction
  → IMPORTANT: do not miss any named character, even if they appear only briefly.

🚫 Return only a valid JSON array.
`

    console.log(
      `Analyse du bloc ${currentIndex} → ${endIndex} (chapitre attendu ${lastChapterNumber + 1})`,
    )

    let response
    let retries = 10
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
                  characterDetails: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        physicalAppearance: { type: Type.STRING },
                        clothing: { type: Type.STRING },
                        items: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING },
                        },
                      },
                    },
                  },
                  characterMentions: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        role: { type: Type.STRING },
                        relationships: {
                          type: Type.ARRAY,
                          items: {
                            type: Type.OBJECT,
                            properties: {
                              with: { type: Type.STRING },
                              note: { type: Type.STRING },
                            },
                          },
                        },
                      },
                    },
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
            `⚠️ Gemini overload sur chapitre ${currentIndex}. ${error}`,
          )
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
          stopProcessing = true
          throw new Error(
            'Failed to generate chapter summaries. Please try again. (Rate limit/surcharge)',
          )
          break
        }

        // ❌ erreur critique
        console.error(`❌ Erreur fatale sur bloc ${currentIndex}:`, error)
        stopProcessing = true
        throw new Error(
          'Failed to generate chapter summaries. Please try again. (Rate limit/surcharge)',
        )
        break
      }
    }

    // 🛑 stop global si erreur fatale
    if (stopProcessing) {
      throw new Error(
        'Failed to generate chapter summaries. Please try again. (Rate limit/surcharge)',
      )
      break
    }

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

import dotenv from 'dotenv'
import { GoogleGenAI, Type } from '@google/genai'

dotenv.config()

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

if (!process.env.GEMINI_API_KEY) {
  console.error(
    'FATAL ERROR: GEMINI_API_KEY is not set in the environment variables.',
  )
  process.exit(1)
}

/**
 * Generate flashcards from text
 * @param {string} text - Document text
 * @param {number} count - Number of flashcards to generate
 * @returns {Promise<Array<{question: string, answer: string, difficulty: string}>>}
 */
export const generateFlashcards = async (text, count = 10) => {
  const prompt = `Generate exactly ${count} educational flashcards from the following text. 
  Format each flashcard as:
  Q: [Clear, specific question]
  A: [Concise, accurate answer]
  D: [Difficulty level: easy, medium, or hard]
  
  Separate each flashcard with "---"
  
  Text:
  ${text.substring(0, 15000)}`

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: prompt,
    })

    const generatedText = response.text

    // Parse the response
    const flashcards = []
    const cards = generatedText.split('---').filter((c) => c.trim())

    for (const card of cards) {
      const lines = card.trim().split('\n')
      let question = '',
        answer = '',
        difficulty = 'medium'

      for (const line of lines) {
        if (line.startsWith('Q:')) {
          question = line.substring(2).trim()
        } else if (line.startsWith('A:')) {
          answer = line.substring(2).trim()
        } else if (line.startsWith('D:')) {
          const diff = line.substring(2).trim().toLowerCase()
          if (['easy', 'medium', 'hard'].includes(diff)) {
            difficulty = diff
          }
        }
      }

      if (question && answer) {
        flashcards.push({ question, answer, difficulty })
      }
    }

    return flashcards.slice(0, count)
  } catch (error) {
    console.error('Gemini API error:', error)
    throw new Error('Failed to generate flashcards')
  }
}

/**
 * Generate quiz questions
 * @param {string} text - Document text
 * @param {number} numQuestions - Number of questions
 * @returns {Promise<Array<{question: string, options: Array, correctAnswer: string, explanation: string, difficulty: string}>>}
 */
export const generateQuiz = async (text, numQuestions = 5) => {
  const prompt = `Generate exactly ${numQuestions} multiple choice questions from the following text.
  Format each question as:
  Q: [Question]
  O1: [Option 1]
  O2: [Option 2]
  O3: [Option 3]
  O4: [Option 4]
  C: [Correct option - exactly as written above]
  E: [Brief explanation]
  D: [Difficulty: easy, medium, or hard]
  
  Separate questions with "---"
  
  Text:
  ${text.substring(0, 15000)}`

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: prompt,
    })

    const generatedText = response.text

    const questions = []
    const questionBlocks = generatedText.split('---').filter((q) => q.trim())

    for (const block of questionBlocks) {
      const lines = block.trim().split('\n')
      let question = '',
        options = [],
        correctAnswer = '',
        explanation = '',
        difficulty = 'medium'

      for (const line of lines) {
        const trimmed = line.trim()
        if (trimmed.startsWith('Q:')) {
          question = trimmed.substring(2).trim()
        } else if (trimmed.match(/^O\d:/)) {
          options.push(trimmed.substring(3).trim())
        } else if (trimmed.startsWith('C:')) {
          correctAnswer = trimmed.substring(2).trim()
        } else if (trimmed.startsWith('E:')) {
          explanation = trimmed.substring(2).trim()
        } else if (trimmed.startsWith('D:')) {
          const diff = trimmed.substring(2).trim().toLowerCase()
          if (['easy', 'medium', 'hard'].includes(diff)) {
            difficulty = diff
          }
        }
      }

      if (question && options.length === 4 && correctAnswer) {
        questions.push({
          question,
          options,
          correctAnswer,
          explanation,
          difficulty,
        })
      }
    }

    return questions.slice(0, numQuestions)
  } catch (error) {
    console.error('Gemini API error:', error)
    throw new Error('Failed to generate quiz')
  }
}

/**
 * Generate document summary
 * @param {string} text - Document text
 * @returns {Promise<string>}
 */
export const generateSummary = async (text) => {
  const prompt = `Provide a concise summary of the following text, highlighting the key concepts, main ideas, and important points. 
  Keep the summary clear and structured.
  
  Text:
  ${text.substring(0, 20000)}`

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: prompt,
    })
    const generatedText = response.text
    return generatedText
  } catch (error) {
    console.error('Gemini API error:', error)
    throw new Error('Failed to generate summary')
  }
}

/**
 * Chat with document context
 * @param {string} question - User question
 * @param {Array<Object>} chunks - Relevant document chunks
 * @returns {Promise<string>}
 */
export const chatWithContext = async (question, chunks) => {
  const context = chunks
    .map((c, i) => `[Chunk ${i + 1}]\n${c.content}`)
    .join('\n\n')

  const prompt = `Based on the following context from a document, Analyse the context and answer the user's question accurately and concisely according to the context.
  If the answer is not in the context, say so.
  
  Context:
  ${context}
  
  Question: ${question}
  
  Answer:`

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: prompt,
    })
    const generatedText = response.text
    return generatedText
  } catch (error) {
    console.error('Gemini API error:', error)
    throw new Error('Failed to process chat request')
  }
}

/**
 * Explain a specific concept
 * @param {string} concept - Concept to explain
 * @param {string} context - Relevant context
 * @returns {Promise<string>}
 */
/**
 * Extract character relationships from a chapter summary
 * @param {string} chapterSummary - The chapter summary text
 * @param {number} chapterNumber - The chapter number
 * @returns {Promise<Array<{source: string, target: string, relationshipType: string, context: string}>>}
 */
export const extractRelationships = async (chapterSummary, chapterNumber) => {
  const prompt = `You are an expert literary analyst extracting character relationships from a chapter summary.

Chapter ${chapterNumber} Summary:
${chapterSummary}

Extract ALL character relationships explicitly described in this chapter.

CRITICAL RULES:
1. INDIVIDUAL CHARACTERS ONLY: 'source' and 'target' MUST be specific, individual named characters. DO NOT extract groups, factions, or generic nouns (e.g., NEVER use "allies", "soldiers", "the army", "villagers", "guards").
2. NO TITLES: Strip all honorifics, titles, or prefixes from character names. Use ONLY the core first name or full name. (e.g., Use "Calder" instead of "Prince Calder", use "Elara" instead of "Queen Elara", use "Smith" instead of "Mr. Smith").
3. CONSISTENCY: Always use the exact same spelling for a character.
4. If no specific named character relationships are described, return an empty array [].

EXAMPLES:
BAD: { "source": "Prince Calder", "target": "allies", "relationshipType": "ally", "context": "..." }
GOOD: { "source": "Calder", "target": "Kael", "relationshipType": "ally", "context": "..." }`

  let retries = 10 // 👈 MODIFIÉ ICI
  let retryDelay = 15000
  let success = false
  let response

  while (retries > 0 && !success) {
    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          temperature: 0.1,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                source: { type: Type.STRING },
                target: { type: Type.STRING },
                relationshipType: {
                  type: Type.STRING,
                  enum: [
                    'ally',
                    'enemy',
                    'family',
                    'rival',
                    'mentor',
                    'romantic',
                    'neutral',
                  ],
                },
                context: { type: Type.STRING },
              },
              required: ['source', 'target', 'relationshipType', 'context'],
            },
          },
        },
      })

      success = true
    } catch (error) {
      const status = error.status || error.code
      const is429 = status === 429 || error.message?.includes('429')
      const is503 = status === 503 || error.message?.includes('UNAVAILABLE')

      // 🔁 retry sur rate limit / overload
      if ((is429 || is503) && retries > 1) {
        console.warn(
          `⚠️ Gemini overload sur chapitre ${chapterNumber}. ${error}`,
        )
        console.warn(
          `⚠️ Gemini overload sur chapitre ${chapterNumber}. Retry dans ${retryDelay / 1000}s (${retries - 1} essais restants)`,
        )

        await new Promise((res) => setTimeout(res, retryDelay))
        retries--
        retryDelay *= 2
        continue
      }

      // 🛑 arrêt propre si quota épuisé
      if (is429 || is503) {
        console.error('🚫 Quota Gemini atteint ou service indisponible.')
        throw new Error(
          'Failed to extract relationships (rate limit / service unavailable).',
        )
      }

      // ❌ erreur critique non récupérable
      console.error(`❌ Erreur Gemini chapitre ${chapterNumber}:`, error)
      throw new Error('Failed to extract relationships')
    }
  }

  if (!success || !response?.text) {
    throw new Error('No response from Gemini')
  }

  try {
    return JSON.parse(response.text)
  } catch (e) {
    console.error('❌ JSON parsing error:', e)
    throw new Error('Invalid JSON returned by Gemini')
  }
}

/**
 * Generate a spoiler-free character biography up to a chapter ceiling
 * @param {string} characterName - Name of the character
 * @param {number} upToChapter - Chapter ceiling (no spoilers past this)
 * @param {Array<{chapterNumber: number, title: string, summary: string}>} summaries - Filtered chapter summaries
 * @returns {Promise<string>}
 */
export const generateCharacterProfile = async (
  characterName,
  upToChapter,
  summaries,
) => {
  const summaryText = summaries
    .map((ch) => `[Chapter ${ch.chapterNumber}: ${ch.title}]\n${ch.summary}`)
    .join('\n\n')

  const prompt = `You are writing a spoiler-free character wiki entry for a book.

Character: ${characterName}
Based on: Chapters 1 through ${upToChapter} ONLY

Chapter Summaries (chronological order):
${summaryText}

Write a concise wiki-style biography for ${characterName} using ONLY the information in these summaries.
Structure it as:
1. Overview paragraph (who they are, their role in the story so far)
2. Key relationships (characters they interact with in these chapters)
3. Notable events (what has happened to/with them up to chapter ${upToChapter})

CRITICAL RULE: Do NOT include, reference, or imply ANY events after Chapter ${upToChapter}. This profile must be completely spoiler-free.`

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    })
    return response.text
  } catch (error) {
    console.error('Gemini API error:', error)
    throw new Error('Failed to generate character profile')
  }
}

export const explainConcept = async (concept, context) => {
  const prompt = `Explain the concept of "${concept}" based on the following context. 
  Provide a clear, educational explanation that's easy to understand.
  Include examples if relevant.
  
  Context:
  ${context.substring(0, 10000)}`

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: prompt,
    })
    const generatedText = response.text
    return generatedText
  } catch (error) {
    console.error('Gemini API error:', error)
    throw new Error('Failed to explain concept')
  }
}

import dotenv from 'dotenv'
import { GoogleGenAI, Type } from '@google/genai'

dotenv.config()

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

/**
 * Analyse un livre par blocs en conservant le contexte d'un bloc à l'autre
 */
export const detectChapters = async (text) => {
  if (!text || text.length < 5000) throw new Error('Texte trop court.')

  const CHUNK_SIZE = 80000
  const OVERLAP = 10000 // Un peu d'overlap reste utile pour ne pas rater un titre
  let allChapters = []
  let currentIndex = 0

  // Variables d'état pour le contexte
  let lastChapterNumber = 0
  let lastChapterTitle = ''

  while (currentIndex < text.length) {
    // 1. Découpage intelligent : on essaie de couper à un saut de ligne pour ne pas couper une phrase en deux
    let endIndex = currentIndex + CHUNK_SIZE
    if (endIndex < text.length) {
      const lastNewline = text.lastIndexOf('\n\n', endIndex)
      // Si on trouve un double saut de ligne pas trop loin en arrière, on coupe là
      if (lastNewline > currentIndex + CHUNK_SIZE * 0.8) {
        endIndex = lastNewline
      }
    }

    const chunk = text.substring(currentIndex, endIndex + OVERLAP)

    // 2. Création du contexte pour l'IA
    let contextInstruction =
      'Ceci est le début du document. Commence la numérotation au chapitre 1.'
    if (lastChapterNumber > 0) {
      contextInstruction = `ATTENTION : Ceci est la suite d'un livre. Le bloc précédent s'est terminé pendant ou juste après le "Chapitre ${lastChapterNumber} : ${lastChapterTitle}". 
Si ce texte commence par la suite de ce chapitre, NE CRÉE PAS de nouvelle entrée pour lui. 
Commence ta détection et ta numérotation à partir du chapitre suivant (qui devrait être le numéro ${lastChapterNumber + 1}).`
    }

    const PROMPT = `Analyse le texte suivant et identifie les nouveaux chapitres.
${contextInstruction}

Règles :
- Repère les délimitations (Chapitre 1, sections numérotées, changements de sujet évidents).
- Fournis un résumé de 2-3 phrases et 3 à 5 points clés.
- Ne renvoie que les chapitres présents dans CE texte.`

    console.log(
      `Analyse du bloc de ${currentIndex} à ${endIndex}... (Chapitre attendu: ${lastChapterNumber + 1})`,
    )

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ text: PROMPT }, { text: chunk }],
        config: {
          temperature: 0.1, // Basse température pour des résultats factuels
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

      // Le JSON est garanti valide par l'API
      const chaptersFromChunk = JSON.parse(response.text)

      if (chaptersFromChunk.length > 0) {
        // On met à jour notre "mémoire" pour le prochain bloc
        const lastChap = chaptersFromChunk[chaptersFromChunk.length - 1]
        lastChapterNumber = lastChap.chapterNumber
        lastChapterTitle = lastChap.title

        allChapters = allChapters.concat(chaptersFromChunk)
      }
    } catch (error) {
      console.error(`Erreur sur le bloc ${currentIndex}:`, error)
      // En cas d'erreur, on continue quand même sur le bloc suivant
    }

    // On avance pour le prochain tour de boucle
    currentIndex = endIndex
  }

  // 3. Nettoyage final de sécurité
  // Bien qu'on ait guidé l'IA, un overlap peut parfois créer un doublon si le titre tombe pile dans la zone de chevauchement.
  const finalChapters = []
  const seenTitles = new Set()

  for (const chap of allChapters) {
    const normalTitle = chap.title.toLowerCase().trim()
    if (!seenTitles.has(normalTitle)) {
      finalChapters.push(chap)
      seenTitles.add(normalTitle)
    }
  }

  console.log(
    `✅ Analyse terminée. ${finalChapters.length} chapitres détectés.`,
  )
  return finalChapters
}

import Document from '../models/Document.js'
import CharacterRelationship from '../models/CharacterRelationship.js'
import CharacterProfile from '../models/CharacterProfile.js'
import {
  extractRelationships as extractRelationshipsFromLLM,
  generateCharacterProfile as generateProfileFromLLM,
} from '../utils/geminiService.js'

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// Fonction pour nettoyer le nom et enlever les titres (Anglais + Français)
const cleanCharacterName = (name) => {
  if (!name) return ''

  // 1. Liste des titres à supprimer (avec un espace à la fin pour ne pas couper de vrais prénoms)
  const titlesToRemove = [
    // Titres anglais
    'prince ',
    'princess ',
    'king ',
    'queen ',
    'lord ',
    'lady ',
    'sir ',
    'mr ',
    'mrs ',
    'ms ',
    'dr ',
    'emperor ',
    'empress ',
    'duke ',
    'duchess ',
    // Titres français
    'roi ',
    'reine ',
    'princesse ',
    'seigneur ',
    'dame ',
    'monsieur ',
    'madame ',
    'mademoiselle ',
    'docteur ',
    'empereur ',
    'impératrice ',
    'imperatrice ',
    'duc ',
    'duchesse ',
    'comte ',
    'comtesse ',
    'chevalier ',
    'maître ',
    'maitre ',
  ]

  let cleanedName = name.toLowerCase().trim()

  // 2. Supprimer les titres au début du nom
  for (const title of titlesToRemove) {
    if (cleanedName.startsWith(title)) {
      cleanedName = cleanedName.substring(title.length).trim()
      break
    }
  }

  // 3. Remettre la première lettre en majuscule
  return cleanedName.charAt(0).toUpperCase() + cleanedName.slice(1)
}

// Fonction pour rejeter les mots génériques (Anglais + Français)
const isInvalidCharacter = (name) => {
  const invalidNames = [
    // Mots génériques anglais
    'allies',
    'ally',
    'enemies',
    'enemy',
    'soldiers',
    'army',
    'villagers',
    'guards',
    'everyone',
    'nobody',
    'crowd',
    'group',
    // Mots génériques français
    'alliés',
    'allies',
    'allié',
    'allie',
    'ennemis',
    'ennemi',
    'soldats',
    'soldat',
    'armée',
    'armee',
    'villageois',
    'gardes',
    'garde',
    'tout le monde',
    'personne',
    'foule',
    'groupe',
    'tous',
    'les',
    'des',
  ]

  return invalidNames.includes(name.toLowerCase().trim())
}

// @desc    Batch-extract character relationships up to a chapter ceiling (incremental)
// @route   POST /api/characters/extract-relationships
// @access  Private
export const extractRelationships = async (req, res, next) => {
  try {
    const { documentId, upToChapter } = req.body

    if (!documentId || upToChapter === undefined) {
      return res.status(400).json({
        success: false,
        error: 'documentId and upToChapter are required',
        statusCode: 400,
      })
    }

    const document = await Document.findOne({
      _id: documentId,
      userId: req.user._id,
    })
    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found',
        statusCode: 404,
      })
    }

    const targetChapters = document.chapters
      .filter((ch) => ch.chapterNumber <= Number(upToChapter))
      .sort((a, b) => a.chapterNumber - b.chapterNumber)

    if (targetChapters.length === 0) {
      return res.status(404).json({
        success: false,
        error: `No chapters found up to chapter ${upToChapter}`,
        statusCode: 404,
      })
    }

    const existingChapterNumbers = await CharacterRelationship.distinct(
      'chapterNumber',
      {
        document: documentId,
        chapterNumber: { $lte: Number(upToChapter) },
      },
    )
    const existingSet = new Set(existingChapterNumbers)

    const chaptersToExtract = targetChapters.filter(
      (ch) => !existingSet.has(ch.chapterNumber),
    )

    const allRelationships = []
    let chaptersExtracted = 0

    for (const chapter of chaptersToExtract) {
      const extracted = await extractRelationshipsFromLLM(
        chapter.summary,
        chapter.chapterNumber,
        chapter.characterDetails || [],
        chapter.characterMentions || [],
      )

      if (extracted.length > 0) {
        // 🔥 ETAPE DE NETTOYAGE ICI 🔥
        const cleanedRelationships = extracted
          .map((r) => ({
            ...r,
            source: cleanCharacterName(r.source),
            target: cleanCharacterName(r.target),
          }))
          // Filtrer les relations où la source ou la target est invalide (ex: "allies")
          .filter(
            (r) =>
              !isInvalidCharacter(r.source) &&
              !isInvalidCharacter(r.target) &&
              r.source !== r.target,
          )

        if (cleanedRelationships.length > 0) {
          const saved = await CharacterRelationship.insertMany(
            cleanedRelationships.map((r) => ({
              document: documentId,
              chapterNumber: chapter.chapterNumber,
              source: r.source,
              target: r.target,
              relationshipType: r.relationshipType,
              context: r.context,
            })),
          )
          allRelationships.push(...saved)
        }
      }
      chaptersExtracted++
    }

    res.json({
      success: true,
      data: {
        upToChapter: Number(upToChapter),
        chaptersExtracted,
        chaptersSkipped: targetChapters.length - chaptersExtracted,
        totalRelationships: allRelationships.length,
        relationships: allRelationships,
      },
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Get all relationships for a document up to a chapter
// @route   GET /api/characters/relationships
// @access  Private
export const getRelationships = async (req, res, next) => {
  try {
    const { documentId, upToChapter } = req.query

    if (!documentId || upToChapter === undefined) {
      return res.status(400).json({
        success: false,
        error: 'documentId and upToChapter are required',
        statusCode: 400,
      })
    }

    const document = await Document.findOne({
      _id: documentId,
      userId: req.user._id,
    })
    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found',
        statusCode: 404,
      })
    }

    const relationships = await CharacterRelationship.find({
      document: documentId,
      chapterNumber: { $lte: Number(upToChapter) },
    }).sort({ chapterNumber: 1 })

    res.json({ success: true, data: { relationships } })
  } catch (error) {
    next(error)
  }
}

// @desc    Get or generate a spoiler-free character profile
// @route   GET /api/characters/profile
// @access  Private
export const getCharacterProfile = async (req, res, next) => {
  try {
    const { documentId, name, upToChapter } = req.query

    if (!documentId || !name || upToChapter === undefined) {
      return res.status(400).json({
        success: false,
        error: 'documentId, name, and upToChapter are required',
        statusCode: 400,
      })
    }

    const document = await Document.findOne({
      _id: documentId,
      userId: req.user._id,
    })
    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found',
        statusCode: 404,
      })
    }

    const cached = await CharacterProfile.findOne({
      document: documentId,
      characterName: { $regex: new RegExp(`^${escapeRegex(name)}$`, 'i') },
      upToChapter: Number(upToChapter),
    })

    if (cached) {
      return res.json({
        success: true,
        data: {
          characterName: cached.characterName,
          upToChapter: cached.upToChapter,
          profile: cached.profileText,
          fromCache: true,
        },
      })
    }

    const nameRegex = new RegExp(escapeRegex(name), 'i')
    const relevantChapters = document.chapters
      .filter((ch) => {
        if (ch.chapterNumber > Number(upToChapter)) return false
        if (nameRegex.test(ch.summary)) return true
        if (ch.characterMentions?.some((m) => nameRegex.test(m.name))) return true
        if (ch.characterDetails?.some((d) => nameRegex.test(d.name))) return true
        return false
      })
      .sort((a, b) => a.chapterNumber - b.chapterNumber)

    if (relevantChapters.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Character not found in chapters up to chapter ${upToChapter}`,
        statusCode: 404,
      })
    }

    const nameRegex2 = new RegExp(escapeRegex(name), 'i')
    const aggregatedDetails = relevantChapters
      .map((ch) => {
        const detail = ch.characterDetails?.find((d) => nameRegex2.test(d.name))
        if (!detail) return null
        return {
          chapterNumber: ch.chapterNumber,
          physicalAppearance: detail.physicalAppearance || '',
          clothing: detail.clothing || '',
          items: detail.items || [],
        }
      })
      .filter(Boolean)
      .filter((d) => d.physicalAppearance || d.clothing || d.items.length > 0)

    const profileText = await generateProfileFromLLM(
      name,
      Number(upToChapter),
      relevantChapters,
      aggregatedDetails,
    )

    await CharacterProfile.create({
      document: documentId,
      characterName: name,
      upToChapter: Number(upToChapter),
      profileText,
      generatedAt: new Date(),
    })

    res.json({
      success: true,
      data: {
        characterName: name,
        upToChapter: Number(upToChapter),
        profile: profileText,
        fromCache: false,
      },
    })
  } catch (error) {
    next(error)
  }
}

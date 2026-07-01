import express from 'express';
import {
  generateQuiz,
  generateSummary,
  chat,
  explainConcept,
  getChatHistory,
  generateChapterSummaries
} from '../controllers/aiController.js';
import protect from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/generate-quiz', generateQuiz);
router.post('/generate-summary', generateSummary);
router.post('/chat', chat);
router.post('/explain-concept', explainConcept);
router.get('/chat-history/:documentId', getChatHistory);
router.post('/summarize-chapters/:documentId', generateChapterSummaries);

export default router;
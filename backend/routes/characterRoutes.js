import express from 'express';
import {
  extractRelationships,
  getRelationships,
  getCharacterProfile
} from '../controllers/characterController.js';
import protect from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/extract-relationships', extractRelationships);
router.get('/relationships', getRelationships);
router.get('/profile', getCharacterProfile);

export default router;

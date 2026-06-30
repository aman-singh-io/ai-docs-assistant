import mongoose from 'mongoose';

const characterRelationshipSchema = new mongoose.Schema({
  document: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true
  },
  chapterNumber: {
    type: Number,
    required: true
  },
  source: {
    type: String,
    required: true,
    trim: true
  },
  target: {
    type: String,
    required: true,
    trim: true
  },
  relationshipType: {
    type: String,
    enum: ['ally', 'enemy', 'family', 'rival', 'mentor', 'romantic', 'neutral'],
    required: true
  },
  context: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

characterRelationshipSchema.index({ document: 1, chapterNumber: 1 });

const CharacterRelationship = mongoose.model('CharacterRelationship', characterRelationshipSchema);

export default CharacterRelationship;

import mongoose from 'mongoose';

const characterProfileSchema = new mongoose.Schema({
  document: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true
  },
  characterName: {
    type: String,
    required: true,
    trim: true
  },
  upToChapter: {
    type: Number,
    required: true
  },
  profileText: {
    type: String,
    required: true
  },
  generatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

characterProfileSchema.index({ document: 1, upToChapter: 1 });

const CharacterProfile = mongoose.model('CharacterProfile', characterProfileSchema);

export default CharacterProfile;

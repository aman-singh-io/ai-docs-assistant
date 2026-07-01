import axiosInstance from '../utils/axiosInstance';

const getRelationships = async (documentId, upToChapter) => {
  try {
    const response = await axiosInstance.get('/api/characters/relationships', {
      params: { documentId, upToChapter },
    });
    return response.data?.data?.relationships ?? [];
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch relationships' };
  }
};

const getCharacterProfile = async (documentId, name, upToChapter) => {
  try {
    const response = await axiosInstance.get('/api/characters/profile', {
      params: { documentId, name, upToChapter },
    });
    return response.data?.data ?? null;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch character profile' };
  }
};

const extractRelationships = async (documentId, upToChapter) => {
  try {
    const response = await axiosInstance.post('/api/characters/extract-relationships', {
      documentId,
      upToChapter,
    });
    return response.data?.data ?? null;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to extract relationships' };
  }
};

const characterService = {
  getRelationships,
  getCharacterProfile,
  extractRelationships,
};

export default characterService;

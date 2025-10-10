import { apiRequest } from './api';

/**
 * Add a product to favorites
 * @param {number} userId - User ID
 * @param {number} productId - Product ID
 * @returns {Promise<Object>} Favorite object
 */
export const addToFavorites = async (userId, productId) => {
  try {
    const favoriteData = {
      userId: userId,
      productId: productId,
      createdDate: new Date().toISOString()
    };

    const response = await apiRequest('/api/Favorite', {
      method: 'POST',
      body: favoriteData
    });

    return response;
  } catch (error) {
    console.error('Error adding to favorites:', error);
    throw error;
  }
};

/**
 * Remove a product from favorites
 * @param {number} favoriteId - Favorite ID
 * @returns {Promise<void>}
 */
export const removeFromFavorites = async (favoriteId) => {
  try {
    await apiRequest(`/api/Favorite/${favoriteId}`, {
      method: 'DELETE'
    });
  } catch (error) {
    console.error('Error removing from favorites:', error);
    throw error;
  }
};

/**
 * Get user's favorite products
 * @param {number} userId - User ID
 * @returns {Promise<Array>} Array of favorite objects
 */
export const getUserFavorites = async (userId) => {
  try {
    const response = await apiRequest(`/api/Favorite/user/${userId}`);
    return Array.isArray(response) ? response : [];
  } catch (error) {
    console.error('Error getting user favorites:', error);
    throw error;
  }
};

/**
 * Check if a product is favorited by user
 * @param {number} userId - User ID
 * @param {number} productId - Product ID
 * @returns {Promise<Object|null>} Favorite object if exists, null otherwise
 */
export const isProductFavorited = async (userId, productId) => {
  try {
    const favorites = await getUserFavorites(userId);
    return favorites.find(fav => fav.productId === productId) || null;
  } catch (error) {
    console.error('Error checking if product is favorited:', error);
    return null;
  }
};

/**
 * Toggle favorite status for a product
 * @param {number} userId - User ID
 * @param {number} productId - Product ID
 * @returns {Promise<{isFavorited: boolean, favoriteId?: number}>}
 */
export const toggleFavorite = async (userId, productId) => {
  try {
    const existingFavorite = await isProductFavorited(userId, productId);
    
    if (existingFavorite) {
      // Remove from favorites
      await removeFromFavorites(existingFavorite.favoriteId);
      return { isFavorited: false };
    } else {
      // Add to favorites
      const newFavorite = await addToFavorites(userId, productId);
      return { isFavorited: true, favoriteId: newFavorite.favoriteId };
    }
  } catch (error) {
    console.error('Error toggling favorite:', error);
    throw error;
  }
};

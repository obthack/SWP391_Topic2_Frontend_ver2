import { apiRequest } from './api';

/**
 * Request vehicle verification for a product
 * @param {number} productId - The ID of the product to verify
 * @returns {Promise<Object>} API response
 */
export async function requestVerification(productId) {
  try {
    console.log(`🔍 Requesting verification for product ${productId}...`);
    
    // Try using verificationStatus first, fallback to inspectionRequested
    try {
      const response = await apiRequest(`/api/Product/${productId}`, {
        method: 'PUT',
        body: {
          verificationStatus: 'Requested'
        }
      });
      
      console.log('✅ Verification request sent successfully (verificationStatus):', response);
      return response;
    } catch (verificationError) {
      console.warn('⚠️ verificationStatus field not supported, trying inspectionRequested...');
      
      // Fallback to inspectionRequested field
      const response = await apiRequest(`/api/Product/${productId}`, {
        method: 'PUT',
        body: {
          inspectionRequested: true
        }
      });
      
      console.log('✅ Verification request sent successfully (inspectionRequested):', response);
      return response;
    }
  } catch (error) {
    console.error('❌ Failed to request verification:', error);
    throw error;
  }
}

/**
 * Update verification status for a product (admin only)
 * @param {number} productId - The ID of the product
 * @param {string} status - New verification status (Requested, InProgress, Completed, Rejected)
 * @param {string} notes - Optional notes from admin
 * @returns {Promise<Object>} API response
 */
export async function updateVerificationStatus(productId, status, notes = '') {
  try {
    console.log(`🔍 Updating verification status for product ${productId} to ${status}...`);
    
    // Try using verificationStatus first, fallback to inspectionRequested
    try {
      const response = await apiRequest(`/api/Product/${productId}`, {
        method: 'PUT',
        body: {
          verificationStatus: status,
          verificationNotes: notes
        }
      });
      
      console.log('✅ Verification status updated successfully (verificationStatus):', response);
      return response;
    } catch (verificationError) {
      console.warn('⚠️ verificationStatus field not supported, trying inspectionRequested...');
      
      // Map status to inspectionRequested boolean
      let inspectionRequested = false;
      if (status === 'Requested' || status === 'InProgress') {
        inspectionRequested = true;
      }
      
      const response = await apiRequest(`/api/Product/${productId}`, {
        method: 'PUT',
        body: {
          inspectionRequested: inspectionRequested
        }
      });
      
      console.log('✅ Verification status updated successfully (inspectionRequested):', response);
      return response;
    }
  } catch (error) {
    console.error('❌ Failed to update verification status:', error);
    throw error;
  }
}

/**
 * Get verification requests for admin
 * @returns {Promise<Array>} List of products with verification requests
 */
export async function getVerificationRequests() {
  try {
    console.log('🔍 Fetching verification requests...');
    
    // Use the existing Product endpoint and filter on frontend
    const response = await apiRequest('/api/Product', {
      method: 'GET'
    });
    
    const allProducts = Array.isArray(response) ? response : response?.items || [];
    
    // Filter products with verification requests on frontend
    const verificationRequests = allProducts.filter(product => 
      product.productType === "Vehicle" && 
      (
        // New field
        (product.verificationStatus === "Requested" || product.verificationStatus === "InProgress") ||
        // Fallback to old field
        product.inspectionRequested === true
      )
    );
    
    console.log('✅ Verification requests fetched successfully:', verificationRequests);
    return verificationRequests;
  } catch (error) {
    console.error('❌ Failed to fetch verification requests:', error);
    throw error;
  }
}

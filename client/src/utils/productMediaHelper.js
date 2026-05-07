/**
 * Get the first available media (image or video) for a product
 * Prioritizes images, falls back to videos if no images exist
 * @param {Object} product - Product object with images and videos arrays
 * @returns {Object} - { url, type, alt } where type is 'image' or 'video'
 */
export const getProductMedia = (product) => {
  if (product?.images && product.images.length > 0) {
    return {
      url: product.images[0].url,
      type: 'image',
      alt: product.images[0].alt || product.name,
    }
  }
  
  if (product?.videos && product.videos.length > 0) {
    return {
      url: product.videos[0].url,
      type: 'video',
      alt: product.videos[0].alt || product.name,
    }
  }
  
  return {
    url: '/placeholder.svg',
    type: 'image',
    alt: product?.name || 'Product',
  }
}

/**
 * Get all media items (images + videos) for a product detail page
 * @param {Object} product - Product object
 * @returns {Array} - Array of media items with type identifier
 */
export const getAllProductMedia = (product) => {
  const allMedia = []
  
  if (product?.images && product.images.length > 0) {
    product.images.forEach((img, idx) => {
      allMedia.push({
        url: img.url,
        type: 'image',
        alt: img.alt || `${product.name} image ${idx + 1}`,
        id: img._id,
      })
    })
  }
  
  if (product?.videos && product.videos.length > 0) {
    product.videos.forEach((vid, idx) => {
      allMedia.push({
        url: vid.url,
        type: 'video',
        alt: vid.alt || `${product.name} video ${idx + 1}`,
        id: vid._id,
      })
    })
  }
  
  return allMedia
}

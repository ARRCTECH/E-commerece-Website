/**
 * Cache Control Middleware
 * Use this middleware to set different cache policies for different routes
 */

// No caching (default)
const noCache = (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  next();
};

// Short-term cache (5 minutes) - good for product listings, categories, etc.
const shortCache = (req, res, next) => {
  res.setHeader('Cache-Control', 'public, max-age=300');
  next();
};

// Medium-term cache (1 hour) - good for product details, static content
const mediumCache = (req, res, next) => {
  res.setHeader('Cache-Control', 'public, max-age=3600');
  next();
};

// Long-term cache (1 day) - good for static assets
const longCache = (req, res, next) => {
  res.setHeader('Cache-Control', 'public, max-age=86400');
  next();
};

// Very long-term cache (1 week) - good for rarely changing static assets
const veryLongCache = (req, res, next) => {
  res.setHeader('Cache-Control', 'public, max-age=604800');
  next();
};

// Special cache for static assets with versioning (1 year)
const immutableCache = (req, res, next) => {
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  next();
};

// ETag support for conditional requests
const etagCache = (req, res, next) => {
  res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  next();
};

module.exports = {
  noCache,
  shortCache,
  mediumCache,
  longCache,
  veryLongCache,
  immutableCache,
  etagCache
};

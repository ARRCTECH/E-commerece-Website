# Server-Side Optimizations Documentation

This document outlines the server-side performance optimizations implemented in the Ksauni Bliss e-commerce platform.

## Implemented Optimizations

### 1. HTTP Compression
- Added compression middleware to reduce response payload size
- Implemented with moderate compression level (6) for balance between CPU usage and compression ratio
- Reduces bandwidth usage and improves loading times for clients

### 2. Security Headers
- Added helmet middleware to set secure HTTP headers
- Protects against common web vulnerabilities like XSS, clickjacking, etc.

### 3. Rate Limiting
- Implemented rate limiting to prevent abuse and DDoS attacks
- General API limit: 200 requests per 15 minutes
- Stricter authentication route limit: 30 requests per 15 minutes

### 4. MongoDB Query Optimization
- Created database indexes for frequently queried fields
- Added `scripts/create-indexes.js` to easily set up indexes
- Implemented optimized projections to reduce payload size
- Added pagination utilities for consistent query patterns

### 5. Caching Strategy
- Implemented tiered caching strategy based on content type
- Static files: 1 day cache (86400 seconds)
- Added cache middleware utilities for different caching durations
- Removed duplicate cache-control headers

### 6. Input Validation
- Added standardized validation middleware using express-validator
- Consistent error format for validation failures

### 7. Error Handling
- Enhanced error handling with custom AppError class
- Centralized error middleware for consistent error responses
- Added asyncHandler utility to eliminate try/catch repetition
- Environment-aware error details (more info in development)

## How to Use These Optimizations

### MongoDB Indexes
Run the following command after deploying to create necessary indexes:
```
npm run create-indexes
```

### Validation Middleware
Use the validation middleware in your routes:
```javascript
const validate = require('../middleware/validate');
const { body } = require('express-validator');

router.post(
  '/create',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
  ],
  validate,
  yourController
);
```

### Cache Control
Apply appropriate cache middleware to your routes:
```javascript
const { shortCache, mediumCache } = require('../middleware/cache');

// For frequently changing data
router.get('/products', shortCache, productController.getProducts);

// For less frequently changing data
router.get('/product/:id', mediumCache, productController.getProduct);
```

### Error Handling
Use the asyncHandler to wrap your controller functions:
```javascript
const { asyncHandler, AppError } = require('../middleware/errorHandler');

router.get('/resource/:id', asyncHandler(async (req, res) => {
  const item = await Resource.findById(req.params.id);
  
  if (!item) {
    throw new AppError('Resource not found', 404, 'RESOURCE_NOT_FOUND');
  }
  
  res.json({ success: true, data: item });
}));
```

## Performance Monitoring

Consider implementing performance monitoring to track the effectiveness of these optimizations:

1. Server-side metrics:
   - Response times
   - Memory usage
   - CPU utilization

2. Database metrics:
   - Query execution times
   - Index usage statistics
   - Connection pool usage

3. Client-side metrics:
   - Time to first byte
   - Page load time
   - Time to interactive

## Further Optimization Opportunities

1. **Implement Redis for caching**: Add Redis to cache frequent database queries
2. **Connection pooling optimization**: Fine-tune MongoDB connection pool settings
3. **Service worker for offline capability**: Implement service workers in the frontend
4. **Implement HTTP/2**: Configure your server to use HTTP/2 for multiplexing
5. **Image optimization service**: Add on-the-fly image resizing and optimization

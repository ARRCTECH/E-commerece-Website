/**
 * This script creates MongoDB indexes to optimize query performance
 * Run this script once after deploying to production
 * node scripts/create-indexes.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Import models
const Product = require('../models/Product');
const Category = require('../models/Category');
const User = require('../models/User');
const Order = require('../models/Order');

async function createIndexes() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fashionhub';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
    
    // Create indexes for Product model
    await Product.collection.createIndex({ name: 'text', description: 'text' }); // Text search index
    await Product.collection.createIndex({ category: 1 }); // For category filtering
    await Product.collection.createIndex({ isActive: 1 }); // For active product filtering
    await Product.collection.createIndex({ tags: 1 }); // For tag filtering
    await Product.collection.createIndex({ price: 1 }); // For price sorting and filtering
    await Product.collection.createIndex({ createdAt: -1 }); // For date sorting
    await Product.collection.createIndex({ 'rating.average': -1 }); // For rating sorting
    await Product.collection.createIndex({ 'colors.name': 1 }); // For color filtering
    await Product.collection.createIndex({ 'sizes.size': 1 }); // For size filtering
    
    // Create indexes for Category model
    await Category.collection.createIndex({ slug: 1 }, { unique: true }); // For slug lookups
    await Category.collection.createIndex({ parentId: 1 }); // For hierarchical category queries
    await Category.collection.createIndex({ isActive: 1 }); // For active category filtering
    
    // Create indexes for User model
    await User.collection.createIndex({ email: 1 }, { unique: true }); // For email lookups
    await User.collection.createIndex({ phoneNumber: 1 }); // For phone lookups
    await User.collection.createIndex({ role: 1 }); // For role-based queries
    await User.collection.createIndex({ firebaseUid: 1 }, { unique: true, sparse: true }); // For Firebase Auth
    
    // Create indexes for Order model
    await Order.collection.createIndex({ user: 1 }); // For user's orders
    await Order.collection.createIndex({ status: 1 }); // For order status filtering
    await Order.collection.createIndex({ createdAt: -1 }); // For date sorting
    await Order.collection.createIndex({ 'items.product': 1 }); // For product-based order queries
    
    
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('📊 MongoDB connection closed');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    process.exit(1);
  }
}

createIndexes();

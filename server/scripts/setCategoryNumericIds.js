// scripts/setCategoryNumericIds.js
const mongoose = require('mongoose');
const Category = require('../models/Category');
const Counter = require('../models/Counter');

const run = async () => {
  try {
    // MongoDB connection string (तुझी .env वरून किंवा थेट)
    const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://Factory Sale:LGaRwEasIMDN1M2x@cluster0.lbc8x6q.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
    
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    // Get current max ID from counter
    let categoryCounter = await Counter.findById('categoryId');
    let categorySeq = categoryCounter ? categoryCounter.sequence_value : 0;

    // Find categories without categoryId
    const categories = await Category.find({ 
      $or: [
        { categoryId: { $exists: false } },
        { categoryId: null }
      ]
    });

    console.log(`\n📁 Found ${categories.length} categories without numeric IDs`);

    let updatedCount = 0;

    for (const category of categories) {
      categorySeq++;
      category.categoryId = categorySeq;
      await category.save();
      updatedCount++;
      console.log(`   ✅ Category: ${category.name} (ID: ${category.categoryId})`);
    }

    // Update counter
    await Counter.findByIdAndUpdate('categoryId', { sequence_value: categorySeq }, { upsert: true });

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Categories updated: ${updatedCount}`);
    console.log(`   📈 Last Category ID: ${categorySeq}`);
    
    console.log(`\n🎉 Done! All categories now have numeric IDs.`);
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

run();
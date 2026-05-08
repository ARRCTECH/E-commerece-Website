// scripts/setProductNumericIds.js
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Counter = require('../models/Counter');

const run = async () => {
  try {
    // MongoDB connection string (तुझी .env वरून किंवा थेट)
    const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://Factory Sale:LGaRwEasIMDN1M2x@cluster0.lbc8x6q.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
    
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    // Get current max IDs from counters
    let productCounter = await Counter.findById('productId');
    let variantCounter = await Counter.findById('variantId');

    let productSeq = productCounter ? productCounter.sequence_value : 0;
    let variantSeq = variantCounter ? variantCounter.sequence_value : 0;

    // Find products without productId
    const products = await Product.find({ 
      $or: [
        { productId: { $exists: false } },
        { productId: null }
      ]
    });

    console.log(`\n📦 Found ${products.length} products without numeric IDs`);

    let updatedCount = 0;
    let variantCount = 0;

    for (const product of products) {
      productSeq++;
      product.productId = productSeq;

      // Update variants with variantId
      let variantUpdated = false;
      for (const size of product.sizes) {
        if (!size.variantId) {
          variantSeq++;
          size.variantId = variantSeq;
          variantCount++;
          variantUpdated = true;
        }
      }

      await product.save();
      updatedCount++;
      
      if (variantUpdated) {
        console.log(`   ✅ Product: ${product.name.substring(0, 40)}... (ID: ${product.productId}) - ${product.sizes.filter(s => s.variantId).length} variants updated`);
      } else {
        console.log(`   ✅ Product: ${product.name.substring(0, 40)}... (ID: ${product.productId}) - no new variants`);
      }
    }

    // Update counters
    await Counter.findByIdAndUpdate('productId', { sequence_value: productSeq }, { upsert: true });
    await Counter.findByIdAndUpdate('variantId', { sequence_value: variantSeq }, { upsert: true });

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Products updated: ${updatedCount}`);
    console.log(`   ✅ Variants updated: ${variantCount}`);
    console.log(`   📈 Last Product ID: ${productSeq}`);
    console.log(`   📈 Last Variant ID: ${variantSeq}`);
    
    console.log(`\n🎉 Done! All products now have numeric IDs.`);
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

run();
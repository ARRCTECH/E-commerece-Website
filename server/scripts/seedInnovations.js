const mongoose = require("mongoose");
const Innovation = require("../models/Innovation");
const User = require("../models/User");

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/fashionhub";

const seedInnovations = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    // Find an admin user
    const adminUser = await User.findOne({ role: "admin" });
    if (!adminUser) {
      process.exit(1);
    }

    // Sample innovation data
    const sampleInnovations = [
      {
        title: "AI-Powered Product Recommendations",
        description: "Implementing machine learning algorithms to provide personalized product recommendations based on user behavior and preferences.",
        category: "Technology",
        tags: ["AI", "ML", "Personalization", "Recommendations"],
        priority: "High",
        status: "In Progress",
        isActive: true,
        image: {
          url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&h=300&fit=crop",
          alt: "AI Technology"
        },
        createdBy: adminUser._id
      },
      {
        title: "Sustainable Packaging Initiative",
        description: "Developing eco-friendly packaging solutions using biodegradable materials to reduce environmental impact.",
        category: "Process",
        tags: ["Sustainability", "Eco-friendly", "Packaging", "Green"],
        priority: "Critical",
        status: "Approved",
        isActive: true,
        image: {
          url: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=500&h=300&fit=crop",
          alt: "Sustainable Packaging"
        },
        createdBy: adminUser._id
      },
      {
        title: "Mobile App Redesign",
        description: "Complete overhaul of the mobile application with improved UX/UI design and enhanced performance.",
        category: "Design",
        tags: ["Mobile", "UX", "UI", "Redesign"],
        priority: "Medium",
        status: "Review",
        isActive: false,
        image: {
          url: "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=500&h=300&fit=crop",
          alt: "Mobile Design"
        },
        createdBy: adminUser._id
      },
      {
        title: "Automated Inventory Management",
        description: "Implementing IoT sensors and automated systems for real-time inventory tracking and management.",
        category: "Technology",
        tags: ["IoT", "Automation", "Inventory", "Real-time"],
        priority: "High",
        status: "Draft",
        isActive: true,
        image: {
          url: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=500&h=300&fit=crop",
          alt: "Inventory Management"
        },
        createdBy: adminUser._id
      }
    ];

    // Clear existing innovations
    await Innovation.deleteMany({});

    // Insert sample data
    await Innovation.insertMany(sampleInnovations);

    process.exit(0);
  } catch (error) {
    console.error("Error seeding innovations:", error);
    process.exit(1);
  }
};

seedInnovations();

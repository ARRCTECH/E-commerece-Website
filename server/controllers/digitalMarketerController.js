const Banner = require("../models/Banner")
const Product = require("../models/Product")
const Category = require("../models/Category")
const Order = require("../models/Order")
const User = require("../models/User")
const SEO = require("../models/SEO")
const Campaign = require("../models/Compaign")
const { uploadToCloudinary } = require("../utils/cloudinary")

// Marketing Analytics
const getMarketingAnalytics = async (req, res) => {
  try {
    const { period = "7d" } = req.query
    const now = new Date()
    let startDate

    // Calculate date range based on period
    switch (period) {
      case "1d":
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    }

    // Traffic Analytics (simulated - in real app, integrate with Google Analytics)
    const trafficData = await generateTrafficData(startDate, now)

    // Sales Analytics
    const salesAnalytics = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $ne: "cancelled" },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          sales: { $sum: "$pricing.total" },
          orders: { $sum: 1 },
          avgOrderValue: { $avg: "$pricing.total" },
        },
      },
      { $sort: { _id: 1 } },
    ])

    // Conversion Rate (orders vs total users)
    const totalUsers = await User.countDocuments({ createdAt: { $gte: startDate } })
    const totalOrders = await Order.countDocuments({
      createdAt: { $gte: startDate },
      status: { $ne: "cancelled" },
    })
    const conversionRate = totalUsers > 0 ? ((totalOrders / totalUsers) * 100).toFixed(2) : 0

    // Top Selling Products
    const topProducts = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate }, status: { $ne: "cancelled" } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          totalSold: { $sum: "$items.quantity" },
          revenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
    ])

    // Top Categories
    const topCategories = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate }, status: { $ne: "cancelled" } } },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "productInfo",
        },
      },
      { $unwind: "$productInfo" },
      {
        $group: {
          _id: "$productInfo.category",
          totalSold: { $sum: "$items.quantity" },
          revenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: "$category" },
    ])

    // User Demographics (simulated)
    const userDemographics = {
      ageGroups: [
        { range: "18-24", percentage: 25, count: Math.floor(totalUsers * 0.25) },
        { range: "25-34", percentage: 35, count: Math.floor(totalUsers * 0.35) },
        { range: "35-44", percentage: 25, count: Math.floor(totalUsers * 0.25) },
        { range: "45+", percentage: 15, count: Math.floor(totalUsers * 0.15) },
      ],
      devices: [
        { type: "Mobile", percentage: 65, count: Math.floor(totalUsers * 0.65) },
        { type: "Desktop", percentage: 30, count: Math.floor(totalUsers * 0.3) },
        { type: "Tablet", percentage: 5, count: Math.floor(totalUsers * 0.05) },
      ],
      locations: [
        { city: "Mumbai", percentage: 20, count: Math.floor(totalUsers * 0.2) },
        { city: "Delhi", percentage: 18, count: Math.floor(totalUsers * 0.18) },
        { city: "Bangalore", percentage: 15, count: Math.floor(totalUsers * 0.15) },
        { city: "Chennai", percentage: 12, count: Math.floor(totalUsers * 0.12) },
        { city: "Others", percentage: 35, count: Math.floor(totalUsers * 0.35) },
      ],
    }

    // Summary Stats
    const totalRevenue = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate }, status: { $ne: "cancelled" } } },
      { $group: { _id: null, total: { $sum: "$pricing.total" } } },
    ])

    const avgSessionDuration = "3m 45s" // Simulated
    const bounceRate = "42%" // Simulated

    res.status(200).json({
      success: true,
      analytics: {
        summary: {
          totalRevenue: totalRevenue[0]?.total || 0,
          totalOrders,
          totalUsers,
          conversionRate: `${conversionRate}%`,
          avgSessionDuration,
          bounceRate,
        },
        trafficData,
        salesAnalytics,
        topProducts,
        topCategories,
        userDemographics,
      },
    })
  } catch (error) {
    console.error("Get marketing analytics error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch marketing analytics",
    })
  }
}

// Generate simulated traffic data
const generateTrafficData = async (startDate, endDate) => {
  const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
  const trafficData = []

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
    const dateStr = date.toISOString().split("T")[0]

    // Simulate traffic data (in real app, get from Google Analytics)
    const baseTraffic = 1000
    const randomVariation = Math.floor(Math.random() * 500) - 250
    const weekendMultiplier = date.getDay() === 0 || date.getDay() === 6 ? 1.3 : 1

    trafficData.push({
      date: dateStr,
      pageViews: Math.floor((baseTraffic + randomVariation) * weekendMultiplier),
      uniqueVisitors: Math.floor((baseTraffic + randomVariation) * weekendMultiplier * 0.7),
      sessions: Math.floor((baseTraffic + randomVariation) * weekendMultiplier * 0.8),
    })
  }

  return trafficData
}

// SEO Management
const getSEOData = async (req, res) => {
  try {
    const seoData = await SEO.find().sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      seoData,
    })
  } catch (error) {
    console.error("Get SEO data error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch SEO data",
    })
  }
}

const updateSEOData = async (req, res) => {
  try {
    const { page, title, description, keywords, ogTitle, ogDescription, ogImage } = req.body

    if (!page || !title || !description) {
      return res.status(400).json({
        success: false,
        message: "Page, title, and description are required",
      })
    }

    const seoData = await SEO.findOneAndUpdate(
      { page },
      {
        page,
        title,
        description,
        keywords: keywords || [],
        ogTitle: ogTitle || title,
        ogDescription: ogDescription || description,
        ogImage: ogImage || "",
        updatedBy: req.user.userId,
        updatedAt: new Date(),
      },
      { upsert: true, new: true, runValidators: true },
    )

    res.status(200).json({
      success: true,
      message: "SEO data updated successfully",
      seoData,
    })
  } catch (error) {
    console.error("Update SEO data error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to update SEO data",
    })
  }
}

// Campaign Management
const getAllCampaigns = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query
    const skip = (page - 1) * limit

    const query = {}
    if (status) {
      query.status = status
    }

    const campaigns = await Campaign.find(query)
      .populate("createdBy", "name")
      .populate("banners", "title imageUrl")
      .populate("coupons", "code discountValue")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))

    const totalCampaigns = await Campaign.countDocuments(query)

    res.status(200).json({
      success: true,
      campaigns,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(totalCampaigns / limit),
        totalCampaigns,
        hasNext: page < Math.ceil(totalCampaigns / limit),
        hasPrev: page > 1,
      },
    })
  } catch (error) {
    console.error("Get all campaigns error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch campaigns",
    })
  }
}

const createCampaign = async (req, res) => {
  try {
    const { name, description, startDate, endDate, budget, targetAudience, banners, coupons, goals } = req.body

    if (!name || !description || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Name, description, start date, and end date are required",
      })
    }

    const campaign = new Campaign({
      name,
      description,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      budget: Number(budget) || 0,
      targetAudience: targetAudience || {},
      banners: banners || [],
      coupons: coupons || [],
      goals: goals || {},
      createdBy: req.user.userId,
    })

    await campaign.save()

    const populatedCampaign = await Campaign.findById(campaign._id)
      .populate("createdBy", "name")
      .populate("banners", "title imageUrl")
      .populate("coupons", "code discountValue")

    res.status(201).json({
      success: true,
      message: "Campaign created successfully",
      campaign: populatedCampaign,
    })
  } catch (error) {
    console.error("Create campaign error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to create campaign",
    })
  }
}

const updateCampaign = async (req, res) => {
  try {
    const { campaignId } = req.params
    const updateData = req.body

    // Parse dates if provided
    if (updateData.startDate) updateData.startDate = new Date(updateData.startDate)
    if (updateData.endDate) updateData.endDate = new Date(updateData.endDate)
    if (updateData.budget) updateData.budget = Number(updateData.budget)

    const campaign = await Campaign.findByIdAndUpdate(
      campaignId,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true },
    )
      .populate("createdBy", "name")
      .populate("banners", "title imageUrl")
      .populate("coupons", "code discountValue")

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      })
    }

    res.status(200).json({
      success: true,
      message: "Campaign updated successfully",
      campaign,
    })
  } catch (error) {
    console.error("Update campaign error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to update campaign",
    })
  }
}

const deleteCampaign = async (req, res) => {
  try {
    const { campaignId } = req.params

    const campaign = await Campaign.findByIdAndDelete(campaignId)
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      })
    }

    res.status(200).json({
      success: true,
      message: "Campaign deleted successfully",
    })
  } catch (error) {
    console.error("Delete campaign error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to delete campaign",
    })
  }
}

const getCampaignAnalytics = async (req, res) => {
  try {
    const { campaignId } = req.params

    const campaign = await Campaign.findById(campaignId).populate("banners").populate("coupons")

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      })
    }

    // Calculate campaign performance (simulated)
    const analytics = {
      impressions: Math.floor(Math.random() * 10000) + 5000,
      clicks: Math.floor(Math.random() * 1000) + 500,
      conversions: Math.floor(Math.random() * 100) + 50,
      revenue: Math.floor(Math.random() * 50000) + 25000,
      ctr: "4.2%", // Click-through rate
      conversionRate: "8.5%",
      roas: "3.2x", // Return on ad spend
      costPerClick: "₹12.50",
      costPerConversion: "₹150",
    }

    res.status(200).json({
      success: true,
      campaign,
      analytics,
    })
  } catch (error) {
    console.error("Get campaign analytics error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch campaign analytics",
    })
  }
}

module.exports = {
  getMarketingAnalytics,
  getSEOData,
  updateSEOData,
  getAllCampaigns,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  getCampaignAnalytics,
}

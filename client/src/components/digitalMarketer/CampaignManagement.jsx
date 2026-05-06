"use client";
import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { PlusIcon, PencilIcon, TrashIcon, ChartBarIcon } from "@heroicons/react/24/outline";
import {
  fetchAllCampaigns,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  fetchCampaignAnalytics,
} from "../../store/slices/digitalMarketerSlice";
import LoadingSpinner from "../LoadingSpinner";
const CampaignManagement = () => {
  const [showModal, setShowModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    budget: "",
    status: "draft",
    targetAudience: {
      ageRange: { min: 18, max: 65 },
      gender: "all",
      locations: [],
      interests: [],
    },
    goals: {
      impressions: "",
      clicks: "",
      conversions: "",
      revenue: "",
    },
  });
  const dispatch = useDispatch();
  const { campaigns, campaignsLoading, selectedCampaign, campaignAnalytics } = useSelector(
    (state) => state.digitalMarketer,
  );
  useEffect(() => {
    dispatch(fetchAllCampaigns());
  }, [dispatch]);
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      if (parent === "targetAudience" && child === "ageRange") {
        const [ageType] = child.split(".");
        setFormData((prev) => ({
          ...prev,
          targetAudience: {
            ...prev.targetAudience,
            ageRange: {
              ...prev.targetAudience.ageRange,
              [ageType]: Number(value),
            },
          },
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: value,
          },
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      budget: Number(formData.budget) || 0,
      goals: {
        impressions: Number(formData.goals.impressions) || 0,
        clicks: Number(formData.goals.clicks) || 0,
        conversions: Number(formData.goals.conversions) || 0,
        revenue: Number(formData.goals.revenue) || 0,
      },
    };
    try {
      if (editingCampaign) {
        await dispatch(updateCampaign({ campaignId: editingCampaign._id, campaignData: submitData })).unwrap();
      } else {
        await dispatch(createCampaign(submitData)).unwrap();
      }
      handleCloseModal();
    } catch (error) {
      console.error("Error saving campaign:", error);
    }
  };
  const handleEdit = (campaign) => {
    setEditingCampaign(campaign);
    setFormData({
      name: campaign.name,
      description: campaign.description,
      startDate: new Date(campaign.startDate).toISOString().split("T")[0],
      endDate: new Date(campaign.endDate).toISOString().split("T")[0],
      budget: campaign.budget.toString(),
      status: campaign.status,
      targetAudience: campaign.targetAudience || {
        ageRange: { min: 18, max: 65 },
        gender: "all",
        locations: [],
        interests: [],
      },
      goals: {
        impressions: campaign.goals?.impressions?.toString() || "",
        clicks: campaign.goals?.clicks?.toString() || "",
        conversions: campaign.goals?.conversions?.toString() || "",
        revenue: campaign.goals?.revenue?.toString() || "",
      },
    });
    setShowModal(true);
  };
  const handleDelete = async (campaignId) => {
    if (window.confirm("Are you sure you want to delete this campaign?")) {
      try {
        await dispatch(deleteCampaign(campaignId)).unwrap();
      } catch (error) {
        console.error("Error deleting campaign:", error);
      }
    }
  };
  const handleViewAnalytics = async (campaign) => {
    try {
      await dispatch(fetchCampaignAnalytics(campaign._id)).unwrap();
      setShowAnalyticsModal(true);
    } catch (error) {
      console.error("Error fetching campaign analytics:", error);
    }
  };
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCampaign(null);
    setFormData({
      name: "",
      description: "",
      startDate: "",
      endDate: "",
      budget: "",
      status: "draft",
      targetAudience: {
        ageRange: { min: 18, max: 65 },
        gender: "all",
        locations: [],
        interests: [],
      },
      goals: {
        impressions: "",
        clicks: "",
        conversions: "",
        revenue: "",
      },
    });
  };
  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "paused":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  if (campaignsLoading) {
    return <LoadingSpinner />;
  }
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Campaign Management</h1>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Create Campaign
        </button>
      </div>
      {/* Campaigns Table */}
      <div className="overflow-hidden bg-white shadow sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {campaigns.map((campaign) => (
            <li key={campaign._id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-medium text-gray-900 truncate">{campaign.name}</h3>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}
                      >
                        {campaign.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">{campaign.description}</p>
                    <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500">
                      <span>Start: {new Date(campaign.startDate).toLocaleDateString()}</span>
                      <span>End: {new Date(campaign.endDate).toLocaleDateString()}</span>
                      <span>Budget: ₹{campaign.budget.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleViewAnalytics(campaign)}
                      className="p-2 text-blue-600 rounded-full hover:bg-blue-50"
                      title="View Analytics"
                    >
                      <ChartBarIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleEdit(campaign)}
                      className="p-2 text-gray-600 rounded-full hover:bg-gray-50"
                      title="Edit"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(campaign._id)}
                      className="p-2 text-red-600 rounded-full hover:bg-red-50"
                      title="Delete"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      {campaigns.length === 0 && (
        <div className="py-12 text-center">
          <div className="w-12 h-12 mx-auto text-gray-400">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No campaigns</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new campaign.</p>
        </div>
      )}
      {/* Create/Edit Campaign Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={handleCloseModal} />
            <div className="inline-block overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="px-4 pt-5 pb-4 bg-white sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="w-full">
                      <h3 className="mb-4 text-lg font-medium leading-6 text-gray-900">
                        {editingCampaign ? "Edit Campaign" : "Create New Campaign"}
                      </h3>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {/* Campaign Name */}
                        <div className="sm:col-span-2">
                          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                            Campaign Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                            className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                          />
                        </div>
                        {/* Description */}
                        <div className="sm:col-span-2">
                          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                            Description <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            required
                            rows={3}
                            className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                          />
                        </div>
                        {/* Start Date */}
                        <div>
                          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                            Start Date <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="date"
                            id="startDate"
                            name="startDate"
                            value={formData.startDate}
                            onChange={handleInputChange}
                            required
                            className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                          />
                        </div>
                        {/* End Date */}
                        <div>
                          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                            End Date <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="date"
                            id="endDate"
                            name="endDate"
                            value={formData.endDate}
                            onChange={handleInputChange}
                            required
                            className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                          />
                        </div>
                        {/* Budget */}
                        <div>
                          <label htmlFor="budget" className="block text-sm font-medium text-gray-700">
                            Budget (₹)
                          </label>
                          <input
                            type="number"
                            id="budget"
                            name="budget"
                            value={formData.budget}
                            onChange={handleInputChange}
                            min="0"
                            className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                          />
                        </div>
                        {/* Status */}
                        <div>
                          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                            Status
                          </label>
                          <select
                            id="status"
                            name="status"
                            value={formData.status}
                            onChange={handleInputChange}
                            className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                          >
                            <option value="draft">Draft</option>
                            <option value="active">Active</option>
                            <option value="paused">Paused</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                        {/* Goals Section */}
                        <div className="sm:col-span-2">
                          <h4 className="mb-2 font-medium text-gray-900 text-md">Campaign Goals</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label htmlFor="goals.impressions" className="block text-sm font-medium text-gray-700">
                                Target Impressions
                              </label>
                              <input
                                type="number"
                                id="goals.impressions"
                                name="goals.impressions"
                                value={formData.goals.impressions}
                                onChange={handleInputChange}
                                min="0"
                                className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                              />
                            </div>
                            <div>
                              <label htmlFor="goals.clicks" className="block text-sm font-medium text-gray-700">
                                Target Clicks
                              </label>
                              <input
                                type="number"
                                id="goals.clicks"
                                name="goals.clicks"
                                value={formData.goals.clicks}
                                onChange={handleInputChange}
                                min="0"
                                className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                              />
                            </div>
                            <div>
                              <label htmlFor="goals.conversions" className="block text-sm font-medium text-gray-700">
                                Target Conversions
                              </label>
                              <input
                                type="number"
                                id="goals.conversions"
                                name="goals.conversions"
                                value={formData.goals.conversions}
                                onChange={handleInputChange}
                                min="0"
                                className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                              />
                            </div>
                            <div>
                              <label htmlFor="goals.revenue" className="block text-sm font-medium text-gray-700">
                                Target Revenue (₹)
                              </label>
                              <input
                                type="number"
                                id="goals.revenue"
                                name="goals.revenue"
                                value={formData.goals.revenue}
                                onChange={handleInputChange}
                                min="0"
                                className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="px-4 py-3 bg-gray-50 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="inline-flex justify-center w-full px-4 py-2 text-base font-medium text-white bg-purple-600 border border-transparent rounded-md shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    {editingCampaign ? "Update" : "Create"} Campaign
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="inline-flex justify-center w-full px-4 py-2 mt-3 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* Analytics Modal */}
      {showAnalyticsModal && selectedCampaign && campaignAnalytics && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
              onClick={() => setShowAnalyticsModal(false)}
            />
            <div className="inline-block overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="px-4 pt-5 pb-4 bg-white sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="w-full">
                    <h3 className="mb-4 text-lg font-medium leading-6 text-gray-900">
                      Campaign Analytics: {selectedCampaign.name}
                    </h3>
                    {/* Analytics Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-6 sm:grid-cols-4">
                      <div className="p-4 rounded-lg bg-blue-50">
                        <div className="text-2xl font-bold text-blue-600">
                          {campaignAnalytics.impressions.toLocaleString()}
                        </div>
                        <div className="text-sm text-blue-800">Impressions</div>
                      </div>
                      <div className="p-4 rounded-lg bg-green-50">
                        <div className="text-2xl font-bold text-green-600">
                          {campaignAnalytics.clicks.toLocaleString()}
                        </div>
                        <div className="text-sm text-green-800">Clicks</div>
                      </div>
                      <div className="p-4 rounded-lg bg-purple-50">
                        <div className="text-2xl font-bold text-purple-600">{campaignAnalytics.conversions}</div>
                        <div className="text-sm text-purple-800">Conversions</div>
                      </div>
                      <div className="p-4 rounded-lg bg-yellow-50">
                        <div className="text-2xl font-bold text-yellow-600">
                          ₹{campaignAnalytics.revenue.toLocaleString()}
                        </div>
                        <div className="text-sm text-yellow-800">Revenue</div>
                      </div>
                    </div>
                    {/* Performance Metrics */}
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900">{campaignAnalytics.ctr}</div>
                        <div className="text-sm text-gray-500">CTR</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900">{campaignAnalytics.conversionRate}</div>
                        <div className="text-sm text-gray-500">Conversion Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900">{campaignAnalytics.roas}</div>
                        <div className="text-sm text-gray-500">ROAS</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900">{campaignAnalytics.costPerClick}</div>
                        <div className="text-sm text-gray-500">Cost/Click</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900">{campaignAnalytics.costPerConversion}</div>
                        <div className="text-sm text-gray-500">Cost/Conversion</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-4 py-3 bg-gray-50 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => setShowAnalyticsModal(false)}
                  className="inline-flex justify-center w-full px-4 py-2 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:w-auto sm:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default CampaignManagement;
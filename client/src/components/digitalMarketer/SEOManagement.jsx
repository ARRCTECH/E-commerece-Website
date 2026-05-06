"use client";
import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchSEOData, updateSEOData } from "../../store/slices/digitalMarketerSlice";
import LoadingSpinner from "../LoadingSpinner";
const SEOManagement = () => {
  const [selectedPage, setSelectedPage] = useState("home");
  const [formData, setFormData] = useState({
    page: "home",
    title: "",
    description: "",
    keywords: [],
    ogTitle: "",
    ogDescription: "",
    ogImage: "",
  });
  const [keywordInput, setKeywordInput] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const dispatch = useDispatch();
  const { seoData, seoLoading } = useSelector((state) => state.digitalMarketer);
  useEffect(() => {
    dispatch(fetchSEOData());
  }, [dispatch]);
  useEffect(() => {
    const pageData = seoData.find((item) => item.page === selectedPage);
    if (pageData) {
      setFormData({
        page: pageData.page,
        title: pageData.title,
        description: pageData.description,
        keywords: pageData.keywords || [],
        ogTitle: pageData.ogTitle || pageData.title,
        ogDescription: pageData.ogDescription || pageData.description,
        ogImage: pageData.ogImage || "",
      });
      setIsEditing(true);
    } else {
      setFormData({
        page: selectedPage,
        title: "",
        description: "",
        keywords: [],
        ogTitle: "",
        ogDescription: "",
        ogImage: "",
      });
      setIsEditing(false);
    }
  }, [selectedPage, seoData]);
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const handleAddKeyword = () => {
    if (keywordInput.trim() && !formData.keywords.includes(keywordInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        keywords: [...prev.keywords, keywordInput.trim()],
      }));
      setKeywordInput("");
    }
  };
  const handleRemoveKeyword = (keyword) => {
    setFormData((prev) => ({
      ...prev,
      keywords: prev.keywords.filter((k) => k !== keyword),
    }));
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(updateSEOData(formData));
  };
  const pages = [
    { value: "home", label: "Homepage" },
    { value: "products", label: "Products Page" },
    { value: "categories", label: "Categories Page" },
    { value: "about", label: "About Page" },
    { value: "contact", label: "Contact Page" },
    { value: "blog", label: "Blog Page" },
  ];
  if (seoLoading) {
    return <LoadingSpinner />;
  }
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">SEO Management</h1>
        <select
          value={selectedPage}
          onChange={(e) => setSelectedPage(e.target.value)}
          className="border-gray-300 rounded-md shadow-sm focus:border-purple-500 focus:ring-purple-500"
        >
          {pages.map((page) => (
            <option key={page.value} value={page.value}>
              {page.label}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* SEO Form */}
        <div className="p-6 bg-white rounded-lg shadow">
          <h3 className="mb-4 text-lg font-medium text-gray-900">
            {isEditing ? "Edit" : "Add"} SEO Data for {pages.find((p) => p.value === selectedPage)?.label}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Meta Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                maxLength={60}
                required
                className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-purple-500 focus:ring-purple-500"
                placeholder="Enter meta title (max 60 characters)"
              />
              <p className="mt-1 text-xs text-gray-500">{formData.title.length}/60 characters</p>
            </div>
            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Meta Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                maxLength={160}
                required
                rows={3}
                className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-purple-500 focus:ring-purple-500"
                placeholder="Enter meta description (max 160 characters)"
              />
              <p className="mt-1 text-xs text-gray-500">{formData.description.length}/160 characters</p>
            </div>
            {/* Keywords */}
            <div>
              <label htmlFor="keywords" className="block text-sm font-medium text-gray-700">
                Keywords
              </label>
              <div className="flex mt-1 rounded-md shadow-sm">
                <input
                  type="text"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddKeyword())}
                  className="flex-1 border-gray-300 rounded-l-md focus:border-purple-500 focus:ring-purple-500"
                  placeholder="Enter keyword and press Enter"
                />
                <button
                  type="button"
                  onClick={handleAddKeyword}
                  className="inline-flex items-center px-3 py-2 text-sm text-gray-500 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 hover:bg-gray-100"
                >
                  Add
                </button>
              </div>
              {formData.keywords.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.keywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                    >
                      {keyword}
                      <button
                        type="button"
                        onClick={() => handleRemoveKeyword(keyword)}
                        className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-purple-400 hover:bg-purple-200 hover:text-purple-500"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            {/* Open Graph Title */}
            <div>
              <label htmlFor="ogTitle" className="block text-sm font-medium text-gray-700">
                Open Graph Title
              </label>
              <input
                type="text"
                id="ogTitle"
                name="ogTitle"
                value={formData.ogTitle}
                onChange={handleInputChange}
                maxLength={60}
                className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-purple-500 focus:ring-purple-500"
                placeholder="Leave empty to use meta title"
              />
            </div>
            {/* Open Graph Description */}
            <div>
              <label htmlFor="ogDescription" className="block text-sm font-medium text-gray-700">
                Open Graph Description
              </label>
              <textarea
                id="ogDescription"
                name="ogDescription"
                value={formData.ogDescription}
                onChange={handleInputChange}
                maxLength={160}
                rows={2}
                className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-purple-500 focus:ring-purple-500"
                placeholder="Leave empty to use meta description"
              />
            </div>
            {/* Open Graph Image */}
            <div>
              <label htmlFor="ogImage" className="block text-sm font-medium text-gray-700">
                Open Graph Image URL
              </label>
              <input
                type="url"
                id="ogImage"
                name="ogImage"
                value={formData.ogImage}
                onChange={handleInputChange}
                className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-purple-500 focus:ring-purple-500"
                placeholder="https://example.com/image.jpg"
              />
            </div>
            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                className="flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                {isEditing ? "Update" : "Save"} SEO Data
              </button>
            </div>
          </form>
        </div>
        {/* Preview */}
        <div className="p-6 bg-white rounded-lg shadow">
          <h3 className="mb-4 text-lg font-medium text-gray-900">Search Result Preview</h3>
          {/* Google Search Preview */}
          <div className="p-4 border rounded-lg bg-gray-50">
            <div className="mb-1 text-xs text-gray-500">
              www.yoursite.com/{selectedPage === "home" ? "" : selectedPage}
            </div>
            <div className="mb-1 text-lg text-blue-600 cursor-pointer hover:underline">
              {formData.title || "Your Page Title"}
            </div>
            <div className="text-sm leading-5 text-gray-600">
              {formData.description || "Your page description will appear here..."}
            </div>
          </div>
          {/* Social Media Preview */}
          <div className="mt-6">
            <h4 className="mb-3 font-medium text-gray-900 text-md">Social Media Preview</h4>
            <div className="overflow-hidden bg-white border rounded-lg shadow-sm">
              {formData.ogImage && (
                <div className="flex items-center justify-center h-32 bg-gray-200">
                  <img
                    src={formData.ogImage || "/placeholder.svg"}
                    alt="OG Preview"
                    className="object-cover w-full h-full"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "flex";
                    }}
                  />
                  <div className="items-center justify-center hidden w-full h-full text-gray-400">Image Preview</div>
                </div>
              )}
              <div className="p-3">
                <div className="text-xs tracking-wide text-gray-500 uppercase">yoursite.com</div>
                <div className="mt-1 text-sm font-medium text-gray-900">
                  {formData.ogTitle || formData.title || "Your Page Title"}
                </div>
                <div className="mt-1 text-xs text-gray-600">
                  {formData.ogDescription || formData.description || "Your page description..."}
                </div>
              </div>
            </div>
          </div>
          {/* Keywords */}
          {formData.keywords.length > 0 && (
            <div className="mt-6">
              <h4 className="mb-3 font-medium text-gray-900 text-md">Target Keywords</h4>
              <div className="flex flex-wrap gap-2">
                {formData.keywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      {/* SEO Tips */}
      <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
        <h4 className="mb-2 text-sm font-medium text-blue-900">SEO Best Practices</h4>
        <ul className="space-y-1 text-sm text-blue-800">
          <li>• Keep meta titles under 60 characters for optimal display</li>
          <li>• Write compelling meta descriptions under 160 characters</li>
          <li>• Use relevant keywords naturally in your content</li>
          <li>• Ensure each page has unique meta titles and descriptions</li>
          <li>• Include your target keywords in the title and description</li>
          <li>• Use high-quality images for Open Graph previews</li>
        </ul>
      </div>
    </div>
  );
};
export default SEOManagement;
// client/src/api/ksauniTshirtAPI.js
const BASE_API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const API_BASE_URL = `${BASE_API_URL}/ksauni-tshirts`;
// Fetch all T-shirts
export const fetchKsauniTshirtsAPI = async () => {
  const response = await fetch(API_BASE_URL);
  if (!response.ok) throw new Error("Failed to fetch Ksauni T-shirts");
  return await response.json();
};
// Create T-shirt
export const createKsauniTshirtAPI = async (formData) => {
  const response = await fetch(API_BASE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("fashionhub_token")}`,
    },
    body: formData,
  });
  if (!response.ok) throw new Error("Failed to create Ksauni T-shirt");
  return await response.json();
};
// Update T-shirt
export const updateKsauniTshirtAPI = async (id, formData) => {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("fashionhub_token")}`,
    },
    body: formData,
  });
  if (!response.ok) throw new Error("Failed to update Ksauni T-shirt");
  return await response.json();
};
// Delete T-shirt
export const deleteKsauniTshirtAPI = async (id) => {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("fashionhub_token")}`,
    },
  });
  if (!response.ok) throw new Error("Failed to delete Ksauni T-shirt");
  return id;
};
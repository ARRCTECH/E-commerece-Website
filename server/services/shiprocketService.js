const axios = require("axios");
require("dotenv").config();

class ShiprocketService {
  constructor() {
    this.baseURL =
      process.env.SHIPROCKET_API_URL ||
      "https://apiv2.shiprocket.in/v1/external";
    this.token = null;
    this.tokenExpiry = null;
  }

  // 🔐 Authenticate with caching
  async authenticate() {
    if (this.token && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.token;
    }
    try {
      const response = await axios.post(`${this.baseURL}/auth/login`, {
        email: process.env.SHIPROCKET_EMAIL,
        password: process.env.SHIPROCKET_PASSWORD,
      });

      this.token = response.data.token;
      this.tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
      return this.token;
    } catch (error) {
      console.error("❌ Shiprocket Auth Error:", error.response?.data || error.message);
      throw new Error("Shiprocket authentication failed");
    }
  }

  // 🔧 Headers
  async getHeaders() {
    const token = await this.authenticate();
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }

  // 📌 FIXED: Get Pickup Addresses
  async getPickupAddresses() {
    try {
      const headers = await this.getHeaders();
      const response = await axios.get(
        `${this.baseURL}/settings/company/pickup`,
        { headers }
      );
      return response.data.data || [];
    } catch (error) {
      console.error("❌ Failed to get pickup addresses:", error.response?.data || error.message);
      return [];
    }
  }

  // 📌 FIXED: Check if pickup pincode exists
  async isPickupPincodeValid(pincode) {
    const addresses = await this.getPickupAddresses();
    return addresses.some((addr) => addr.pin_code == pincode);
  }

  // 📦 Create order
  async createOrder(orderData) {
    try {
      const headers = await this.getHeaders();
      const totalWeight = orderData.items.reduce(
        (weight, item) => weight + item.quantity * 0.5,
        0.5
      );

      const payload = {
        order_id: orderData.orderNumber,
        order_date: new Date(orderData.createdAt).toISOString().split("T")[0],
        pickup_location: "work",
        billing_customer_name:
          orderData.shippingAddress.fullName.split(" ")[0],
        billing_last_name:
          orderData.shippingAddress.fullName.split(" ").slice(1).join(" ") || "",
        billing_address: orderData.shippingAddress.addressLine1,
        billing_address_2: orderData.shippingAddress.addressLine2 || "",
        billing_city: orderData.shippingAddress.city,
        billing_pincode: orderData.shippingAddress.pinCode,
        billing_state: orderData.shippingAddress.state,
        billing_country: "India",
        billing_email:
          orderData.user?.email ||
          orderData.shippingAddress?.email ||
          "customer@Factory Sale.com",
        billing_phone: orderData.shippingAddress.phoneNumber
          .replace(/^\+91/, "")
          .replace(/\D/g, ""),
        shipping_is_billing: true,
        order_items: orderData.items.map((item, i) => ({
          name: item.name,
          sku: item.product || `SKU-${i + 1}`,
          units: item.quantity,
          selling_price: item.price,
          hsn: 441122,
        })),
        payment_method:
          orderData.paymentInfo?.method === "COD" ? "COD" : "Prepaid",
        shipping_charges:
          orderData.pricing?.shippingCharges ||
          orderData.shippingCharges ||
          0,
        total_discount:
         ( orderData.pricing?.discount || orderData.discount || 0 ) + (orderData.pricing.freediscount),
        sub_total: orderData.pricing?.subtotal || orderData.subtotal || 0,
        length: 15,
        breadth: 10,
        height: 5,
        weight: totalWeight,
      };

      const response = await axios.post(
        `${this.baseURL}/orders/create/adhoc`,
        payload,
        { headers }
      );

      if (response.data.status_code === 1) return response.data;

      throw new Error(response.data.message || "Failed to create order");
    } catch (error) {
      console.error("❌ Create Order Error:", error.response?.data || error.message);
      throw new Error("Failed to create Shiprocket order");
    }
  }

  // 🚚 Serviceability
  async getAvailableCouriers(pickupPincode, deliveryPincode, weight, cod = 0) {
    try {
      if (!(await this.isPickupPincodeValid(pickupPincode))) {
        throw new Error(
          `Pickup pincode ${pickupPincode} is not added in your Shiprocket pickup addresses`
        );
      }

      const headers = await this.getHeaders();
      const response = await axios.get(
        `${this.baseURL}/courier/serviceability/`,
        {
          headers,
          params: {
            pickup_postcode: pickupPincode,
            delivery_postcode: deliveryPincode,
            weight,
            cod,
          },
        }
      );

      return response.data.data.available_courier_companies;
    } catch (error) {
      console.error("❌ Serviceability Error:", error.response?.data || error.message);
      throw new Error("Failed to get available couriers");
    }
  }

  // 🏷 Assign AWB
  async assignAwb(shipmentId, courierId) {
    try {
      const headers = await this.getHeaders();
      const response = await axios.post(
        `${this.baseURL}/courier/assign/awb`,
        { shipment_id: shipmentId, courier_id: courierId },
        { headers }
      );

      if (response.data.awb_assign_status === 1)
        return response.data.response.data;

      throw new Error(response.data.message || "Failed to assign AWB");
    } catch (error) {
      console.error("❌ Assign AWB Error:", error.response?.data || error.message);
      throw new Error("AWB assignment failed");
    }
  }

  // 🚦 Track Shipment
  async trackShipment(awbCode) {
    try {
      const headers = await this.getHeaders();
      const url = `${this.baseURL}/courier/track/awb/${awbCode}`;
      const response = await axios.get(url, { headers });
      return response.data;
    } catch (error) {
      console.error("❌ Track Error:", error.response?.data || error.message);
      throw new Error("Failed to track shipment");
    }
  }

  // 🚫 Cancel shipment
  async cancelShipment(shipmentId) {
    try {
      const headers = await this.getHeaders();
      const response = await axios.delete(
        `${this.baseURL}/courier/cancel/shipment/${shipmentId}`,
        { headers }
      );

      if (response.data.status_code === 1) return response.data;

      throw new Error(response.data.message || "Cancel failed");
    } catch (error) {
      console.error("❌ Cancel Error:", error.response?.data || error.message);
      throw new Error("Failed to cancel shipment");
    }
  }

  // 📅 Schedule pickup
  async schedulePickup(shipmentId, pickupDate) {
    try {
      const headers = await this.getHeaders();
      const response = await axios.post(
        `${this.baseURL}/courier/generate/pickup`,
        { shipment_id: [shipmentId], pickup_date: pickupDate },
        { headers }
      );
      return response.data;
    } catch (error) {
      console.error("❌ Pickup Error:", error.response?.data || error.message);
      throw new Error("Failed to schedule pickup");
    }
  }
}

module.exports = new ShiprocketService();

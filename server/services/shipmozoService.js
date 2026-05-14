const axios = require('axios');

class ShipmozoService {
  constructor() {
    this.baseURL = process.env.SHIPMOZO_BASE_URL;
    // ✅ Direct keys from .env (no login API)
    this.publicKey = process.env.SHIPMOZO_PUBLIC_KEY;
    this.privateKey = process.env.SHIPMOZO_PRIVATE_KEY;
    this.warehouseId = process.env.SHIPMOZO_WAREHOUSE_ID;
    this.defaultWeight = parseInt(process.env.SHIPMOZO_DEFAULT_WEIGHT) || 200;
    this.defaultLength = parseInt(process.env.SHIPMOZO_DEFAULT_LENGTH) || 25;
    this.defaultWidth = parseInt(process.env.SHIPMOZO_DEFAULT_WIDTH) || 20;
    this.defaultHeight = parseInt(process.env.SHIPMOZO_DEFAULT_HEIGHT) || 10;
    
    console.log('🔧 ShipmozoService Initialized:');
    console.log('   Public Key:', this.publicKey ? this.publicKey.substring(0, 10) + '...' : 'MISSING ❌');
    console.log('   Private Key:', this.privateKey ? this.privateKey.substring(0, 10) + '...' : 'MISSING ❌');
    console.log('   Warehouse ID:', this.warehouseId || 'MISSING ❌');
  }

  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'public_key': this.publicKey,
      'private_key': this.privateKey
    };
  }

  cleanPhoneNumber(phone) {
    if (!phone) return "9999999999";
    let cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.length === 10) return cleaned;
    if (cleaned.length > 10) return cleaned.slice(-10);
    return cleaned.padStart(10, '9');
  }

  async pushOrder(orderData) {
    try {
      console.log('🟢 Pushing order to Shipmozo:', orderData.orderNumber);
      
      const productDetails = [];
      for (const item of orderData.items) {
        for (let i = 0; i < item.quantity; i++) {
          productDetails.push({
            name: item.name.substring(0, 100),
            sku_number: "",
            quantity: 1,
            discount: "",
            hsn: "",
            unit_price: item.price,
            product_category: "FashionClothing"
          });
        }
      }
      
      const totalItems = productDetails.length;
      const totalWeight = (orderData.weight || this.defaultWeight) * totalItems;
      const collectableAmount = orderData.paymentType === "COD" ? orderData.totalAmount : 0;
      
      const payload = {
        order_id: orderData.orderNumber,
        order_date: new Date().toISOString().split('T')[0],
        order_type: "ESSENTIALS",
        consignee_name: orderData.customer.name,
        consignee_phone: this.cleanPhoneNumber(orderData.customer.phone),
        consignee_alternate_phone: "",
        consignee_email: orderData.customer.email || "",
        consignee_address_line_one: orderData.address.addressLine1,
        consignee_address_line_two: orderData.address.addressLine2 || "",
        consignee_pin_code: parseInt(orderData.address.pinCode),
        consignee_city: orderData.address.city,
        consignee_state: orderData.address.state,
        product_detail: productDetails,
        payment_type: orderData.paymentType === "COD" ? "COD" : "PREPAID",
        cod_amount: collectableAmount.toString(),
        weight: totalWeight,
        length: orderData.length || this.defaultLength,
        width: orderData.width || this.defaultWidth,
        height: orderData.height || this.defaultHeight,
        warehouse_id: this.warehouseId,
        gst_ewaybill_number: "",
        gstin_number: ""
      };

      console.log('📋 Headers:', {
        public_key: this.publicKey?.substring(0, 10) + '...',
        private_key: this.privateKey?.substring(0, 10) + '...'
      });
      
      const response = await axios.post(`${this.baseURL}/push-order`, payload, {
        headers: this.getHeaders()
      });

      console.log('📨 Response:', response.data);

      if (response.data.result === "1") {
        console.log(`✅ Order pushed: ${response.data.data.order_id}`);
        return { success: true, orderId: response.data.data.order_id };
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error('❌ Push error:', error.response?.data || error.message);
      return { success: false, error: error.response?.data?.message || error.message };
    }
  }

  async trackOrder(awbNumber) {
    try {
      const response = await axios.get(`${this.baseURL}/track-order`, {
        params: { awb_number: awbNumber },
        headers: this.getHeaders()
      });
      
      if (response.data.result === "1") {
        return { success: true, tracking: response.data.data };
      }
      return { success: false };
    } catch (error) {
      return { success: false };
    }
  }

  async cancelOrder(orderId, awbNumber) {
    try {
      const response = await axios.post(`${this.baseURL}/cancel-order`, {
        order_id: orderId,
        awb_number: awbNumber
      }, { headers: this.getHeaders() });
      
      return { success: response.data.result === "1" };
    } catch (error) {
      return { success: false };
    }
  }
}

module.exports = new ShipmozoService();
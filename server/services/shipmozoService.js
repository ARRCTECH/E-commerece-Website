const axios = require('axios');

class ShipmozoService {
  constructor() {
    this.baseURL = process.env.SHIPMOZO_BASE_URL || 'https://shipping-api.com/app/api/v1';
    this.publicKey = process.env.SHIPMOZO_PUBLIC_KEY;
    this.privateKey = process.env.SHIPMOZO_PRIVATE_KEY;
    this.warehouseId = process.env.SHIPMOZO_WAREHOUSE_ID;
    this.defaultWeight = parseInt(process.env.SHIPMOZO_DEFAULT_WEIGHT) || 200;
    this.defaultLength = parseInt(process.env.SHIPMOZO_DEFAULT_LENGTH) || 25;
    this.defaultWidth = parseInt(process.env.SHIPMOZO_DEFAULT_WIDTH) || 20;
    this.defaultHeight = parseInt(process.env.SHIPMOZO_DEFAULT_HEIGHT) || 10;

    console.log('🔧 ShipmozoService Initialized');
  }

  // ✅ Headers as per documentation
  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'public-key': this.publicKey,
      'private-key': this.privateKey
    };
  }

  cleanPhoneNumber(phone) {
    if (!phone) return "9999999999";
    let cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.length === 10) return cleaned;
    if (cleaned.length > 10) return cleaned.slice(-10);
    return cleaned.padStart(10, '9');
  }

  // ========== 1. Push Order API (FIXED - Exact Invoice) ==========
  async pushOrder(orderData) {
    try {
      console.log('='.repeat(60));
      console.log('🟢 PUSH ORDER TO SHIPMOZO STARTED');
      console.log('='.repeat(60));
      console.log('📦 Order Number:', orderData.orderNumber);
      console.log('💰 Payment Type:', orderData.paymentType);
      console.log('💰 Total Amount:', orderData.totalAmount);

      // ✅ Calculate total quantity
      const totalQuantity = orderData.items.reduce((sum, item) => sum + item.quantity, 0);

      // ✅ Desired invoice amount (COD आणि PREPAID दोन्ही साठी)
      const desiredInvoiceAmount = orderData.totalAmount;

      // ✅ FIXED: Exact distribution without rounding error
      const baseUnitPrice = Math.floor(desiredInvoiceAmount / totalQuantity);
      let remainder = desiredInvoiceAmount - (baseUnitPrice * totalQuantity);

      console.log(`📊 Total Quantity: ${totalQuantity}`);
      console.log(`📊 Desired Invoice: ${desiredInvoiceAmount}`);
      console.log(`📊 Base Price: ${baseUnitPrice}, Remainder: ${remainder}`);

      // ✅ Prepare product details with exact amount matching
      const productDetails = [];
      for (const item of orderData.items) {
        for (let i = 0; i < item.quantity; i++) {
          let unitPrice = baseUnitPrice;
          if (remainder > 0) {
            unitPrice += 1;
            remainder--;
          }

          productDetails.push({
            name: item.name.substring(0, 100),
            sku_number: item.sku || "",
            quantity: 1,
            discount: "",
            hsn: "",
            unit_price: unitPrice,
            product_category: "FashionClothing"
          });
        }
      }

      console.log('📋 Unit Prices:', productDetails.map(p => p.unit_price));
      console.log('📋 Total Invoice:', productDetails.reduce((sum, p) => sum + p.unit_price, 0));

      const totalItems = productDetails.length;
      const totalWeight = (orderData.weight || this.defaultWeight) * totalItems;
      const collectableAmount = orderData.paymentType === "COD" ? orderData.totalAmount : 0;

      // ✅ Payload as per documentation
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
        gstin_number: "",
        shipment_invoice_amount: orderData.totalAmount
      };

      console.log('📋 Request URL:', `${this.baseURL}/push-order`);
      console.log('📋 Headers public-key exists:', !!this.publicKey);
      console.log('📋 Headers private-key exists:', !!this.privateKey);
      console.log('📋 Payload Order ID:', payload.order_id);
      console.log('📋 Payload Payment Type:', payload.payment_type);
      console.log('📋 Payload COD Amount:', payload.cod_amount);

      const response = await axios.post(`${this.baseURL}/push-order`, payload, {
        headers: this.getHeaders()
      });

      console.log('📨 Response:', response.data);

      if (response.data.result === "1") {
        console.log(`✅ Order pushed: ${response.data.data.order_id}`);
        console.log(`✅ Reference ID: ${response.data.data.refrence_id}`);
        return {
          success: true,
          orderId: response.data.data.order_id,
          referenceId: response.data.data.refrence_id
        };
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error('❌ Push error:', error.response?.data || error.message);
      return { success: false, error: error.response?.data?.message || error.message };
    }
  }

  // ========== 2. Track Order API ==========
  async trackOrder(awbNumber) {
    try {
      const response = await axios.get(`${this.baseURL}/track-order`, {
        params: { awb_number: awbNumber },
        headers: this.getHeaders()
      });

      if (response.data.result === "1") {
        const scanDetail = response.data.data.scan_detail || [];
        return {
          success: true,
          orderId: response.data.data.order_id,
          awbNumber: response.data.data.awb_number,
          courier: response.data.data.courier,
          currentStatus: response.data.data.current_status,
          scanHistories: scanDetail.map(scan => ({
            status: scan.scan_status,
            location: scan.scan_location,
            timestamp: scan.scan_datetime,
            remark: scan.scan_remarks
          }))
        };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      console.error('❌ Track error:', error.message);
      return { success: false, message: error.message };
    }
  }

  // ========== 3. Cancel Order API ==========
  async cancelOrder(orderId, awbNumber) {
    try {
      const response = await axios.post(`${this.baseURL}/cancel-order`, {
        order_id: orderId,
        awb_number: awbNumber
      }, { headers: this.getHeaders() });

      if (response.data.result === "1") {
        console.log(`✅ Order cancelled: ${orderId}`);
        return { success: true };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      console.error('❌ Cancel error:', error.message);
      return { success: false, message: error.message };
    }
  }

  async returnOrder(orderData) {
    // --- Validation ---
    if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
      return { success: false, message: "No items provided for return" };
    }
    const totalQuantity = orderData.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    if (totalQuantity === 0) {
      return { success: false, message: "Total quantity of items is zero" };
    }
    if (!orderData.orderNumber || !orderData.customer?.name || !orderData.address?.addressLine1 || !orderData.address?.pinCode) {
      return { success: false, message: "Missing required order data (orderNumber, customer name, address line1, pinCode)" };
    }

    const desiredInvoiceAmount = orderData.totalAmount;
    const baseUnitPrice = Math.floor(desiredInvoiceAmount / totalQuantity);
    let remainder = desiredInvoiceAmount - (baseUnitPrice * totalQuantity);
    const productDetails = [];

    for (const item of orderData.items) {
      const quantity = item.quantity || 0;
      const itemName = (item.name || "Unknown Product").substring(0, 100);
      const sku = item.sku || "";
      for (let i = 0; i < quantity; i++) {
        let unitPrice = baseUnitPrice;
        if (remainder > 0) {
          unitPrice += 1;
          remainder--;
        }
        productDetails.push({
          name: itemName,
          sku_number: sku,
          quantity: 1,
          discount: "",
          hsn: "",
          unit_price: unitPrice,
          product_category: item.productCategory || "FashionClothing", // make dynamic if possible
        });
      }
    }

    if (productDetails.length === 0) {
      return { success: false, message: "No product details generated" };
    }

    const totalItems = productDetails.length;
    const totalWeight = (orderData.weight || this.defaultWeight) * totalItems;
    // collectableAmount is not used – remove or send to Shipmozo if needed

    try {
      const response = await axios.post(`${this.baseURL}/push-return-order`, {
        order_id: orderData.orderNumber,
        order_date: new Date().toISOString().split('T')[0],
        order_type: "ESSENTIALS",
        pickup_name: orderData.customer.name,
        pickup_phone: this.cleanPhoneNumber(orderData.customer.phone),
        pickup_email: orderData.customer.email || "",
        pickup_address_line_one: orderData.address.addressLine1,
        pickup_address_line_two: orderData.address.addressLine2 || "",
        pickup_pin_code: String(orderData.address.pinCode), // keep as string
        pickup_city: orderData.address.city,
        pickup_state: orderData.address.state,
        product_detail: productDetails,
        payment_type: orderData.paymentType === "COD" ? "COD" : "PREPAID",
        weight: totalWeight,
        length: orderData.length || this.defaultLength,
        width: orderData.width || this.defaultWidth,
        height: orderData.height || this.defaultHeight,
        warehouse_id: this.warehouseId,
      }, { headers: this.getHeaders() });

      if (response.data.result === "1") {
        console.log(`✅ Order Return: ${orderData.orderNumber}`);
        return { success: true };
      }
      return {
        success: false,
        message: response.data.message || "Unknown error from Shipmozo",
        data: response.data.data
      };
    } catch (error) {
      console.error('❌ Return error:', error.message);
      return { success: false, message: error.message };
    }
  }


  // ========== 4. Get Order Label API ==========
  async getOrderLabel(awbNumber) {
    try {
      const response = await axios.get(`${this.baseURL}/get-order-label/${awbNumber}`, {
        headers: this.getHeaders()
      });

      if (response.data.result === "1" && response.data.data && response.data.data[0]) {
        return {
          success: true,
          label: response.data.data[0].label,
          createdAt: response.data.data[0].created_at
        };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      console.error('❌ Label error:', error.message);
      return { success: false, message: error.message };
    }
  }
}

module.exports = new ShipmozoService();
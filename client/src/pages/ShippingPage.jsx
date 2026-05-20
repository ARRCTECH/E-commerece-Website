import { Truck, Package, Clock, Shield, MapPin, Phone, Mail, Gift, Share2, RefreshCw, AlertCircle } from "lucide-react";

const ShippingPage = () => {
  return (
    <div className="max-w-4xl px-4 py-12 mx-auto">
      <h1 className="mb-8 text-4xl font-bold text-center text-red-600">Shipping & Policy Information</h1>
      <p className="max-w-3xl mx-auto mb-12 text-lg text-center text-gray-700">
        At Factory Sale, we're committed to getting your orders to you as quickly and safely as possible. Please read
        our shipping policy to understand how we handle shipping, delivery, and returns.
      </p>

      {/* 1. Order Processing Time */}
      <section className="mb-10">
        <h2 className="flex items-center gap-3 mb-6 text-2xl font-semibold text-red-600">
          <Clock className="w-8 h-8 text-blue-600" />
          1. Order Processing Time
        </h2>
        <div className="p-6 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
          <p className="text-gray-700">
            All orders are processed within <strong>2-3 business days</strong> from the time of purchase. Orders placed
            on weekends or holidays will be processed on the next business day.
          </p>
        </div>
      </section>

      {/* 2. Shipping Rates */}
      <section className="mb-10">
        <h2 className="flex items-center gap-3 mb-6 text-2xl font-semibold text-red-600">
          <Package className="w-8 h-8 text-green-600" />
          2. Shipping Rates
        </h2>
        <div className="p-6 bg-green-50 border-l-4 border-green-500 rounded-lg">
          <p className="text-gray-700">
            Shipping rate is <strong>FREE</strong>. There are extra advantages of discount on prepaid or prepayment orders.
          </p>
        </div>
      </section>

      {/* 3. Fast Delivery */}
      <section className="mb-10">
        <h2 className="flex items-center gap-3 mb-6 text-2xl font-semibold text-red-600">
          <Truck className="w-8 h-8 text-purple-600" />
          3. Fast Delivery
        </h2>
        <div className="p-6 bg-purple-50 border-l-4 border-purple-500 rounded-lg">
          <p className="text-gray-700">
            If customer asks for customized delivery partner for fast delivery within <strong>2 days</strong>, 
            extra charges will be included.
          </p>
        </div>
      </section>

      {/* 4. Shipping Delay */}
      <section className="mb-10">
        <h2 className="flex items-center gap-3 mb-6 text-2xl font-semibold text-red-600">
          <Clock className="w-8 h-8 text-yellow-600" />
          4. Shipping Delay
        </h2>
        <div className="p-6 bg-yellow-50 border-l-4 border-yellow-500 rounded-lg">
          <p className="text-gray-700">
            While we strive to deliver your order within the stated time frame, occasional delays may occur due to 
            factors like weather conditions, shipping carrier issues, or holidays. We are not responsible for delays 
            caused by third-party carriers, but we'll do our best to help you track down your package.
          </p>
        </div>
      </section>

      {/* 5. Missing or Damaged */}
      <section className="mb-10">
        <h2 className="flex items-center gap-3 mb-6 text-2xl font-semibold text-red-600">
          <AlertCircle className="w-8 h-8 text-red-600" />
          5. Missing or Damaged Items
        </h2>
        <div className="p-6 bg-red-50 border-l-4 border-red-500 rounded-lg">
          <p className="text-gray-700">
            If your order arrives damaged or is missing, we require a damaged product photograph and unboxing video. 
            Please contact us within <strong>1 day</strong> of receiving your package. We will assist you in resolving 
            the issue, including offering a replacement or refund (where applicable).
          </p>
        </div>
      </section>

      {/* 6. Change of Address */}
      <section className="mb-10">
        <h2 className="flex items-center gap-3 mb-6 text-2xl font-semibold text-red-600">
          <MapPin className="w-8 h-8 text-orange-600" />
          6. Change of Address
        </h2>
        <div className="p-6 bg-orange-50 border-l-4 border-orange-500 rounded-lg">
          <p className="text-gray-700">
            If you need to change your shipping address after placing an order, please contact us as soon as possible. 
            We will do our best to accommodate address changes, but once an order has been processed and shipped, 
            we can no longer update the address.
          </p>
        </div>
      </section>

      {/* 7. Customer Responsibility */}
      <section className="mb-10">
        <h2 className="flex items-center gap-3 mb-6 text-2xl font-semibold text-red-600">
          <Shield className="w-8 h-8 text-blue-600" />
          7. Customer Responsibility
        </h2>
        <div className="p-6 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
          <p className="text-gray-700">
            Please ensure that all shipping details (including your address, phone number, and email) are correct when 
            placing your order. Factory Sale is not responsible for delivery issues due to incorrect or incomplete 
            information provided by the customer.
          </p>
        </div>
      </section>

      {/* 8. RTO Case */}
      <section className="mb-10">
        <h2 className="flex items-center gap-3 mb-6 text-2xl font-semibold text-red-600">
          <RefreshCw className="w-8 h-8 text-red-600" />
          8. RTO Case (Return to Origin)
        </h2>
        <div className="p-6 bg-red-50 border-l-4 border-red-500 rounded-lg">
          <p className="text-gray-700">
            If the product is returned to origin (RTO) due to buyer's mistake, a shipping penalty of <strong>₹150 per piece</strong> will be charged.
          </p>
        </div>
      </section>

      {/* 9. Referral & Sharing Rules */}
      <section className="mb-10">
        <h2 className="flex items-center gap-3 mb-6 text-2xl font-semibold text-red-600">
          <Share2 className="w-8 h-8 text-green-600" />
          9. Referral & Sharing Rules
        </h2>
        <div className="p-6 bg-green-50 border-l-4 border-green-500 rounded-lg">
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start gap-2">
              <span className="font-bold text-green-600">a.</span>
              <span>If you share a product, a referral code will be given to you.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-green-600">b.</span>
              <span>If a customer purchases a product, referral amount will be added to your wallet after delivery.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-green-600">c.</span>
              <span>Referral amount can be used in the next purchase.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-green-600">d.</span>
              <span>User can use the full referral amount — there is no limit.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-green-600">e.</span>
              <span>Referral code is valid for <strong>365 days</strong>.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-green-600">f.</span>
              <span>If the user returns the product, the referral code will be removed from the account.</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Contact Information Footer */}
      <section className="mt-16">
        <div className="p-8 text-center bg-gray-100 rounded-lg">
          <h3 className="mb-4 text-xl font-semibold text-gray-800">Need Help?</h3>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <div className="flex items-center gap-2 text-gray-600">
              <Phone className="w-5 h-5 text-red-500" />
              <span>+91 88301 55383</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Mail className="w-5 h-5 text-red-500" />
              <span>support@factorysale.com</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ShippingPage;
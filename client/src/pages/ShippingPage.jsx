import { Truck, Package, Clock, Shield, MapPin, Phone, Mail } from "lucide-react";
const ShippingPage = () => {
  return (
    <div className="max-w-4xl px-4 py-12 mx-auto">
      <h1 className="mb-8 text-4xl font-bold text-center text-red-600">Shipping Policy</h1>
      <p className="max-w-3xl mx-auto mb-8 text-lg text-center text-gray-700">
        At Ksauni Bliss, we're committed to getting your orders to you as quickly and safely as possible. Please read
        our shipping policy to understand how we handle shipping and delivery.
      </p>
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
      <section className="mb-10">
        <h2 className="flex items-center gap-3 mb-6 text-2xl font-semibold text-red-600">
          <Package className="w-8 h-8 text-green-600" />
          2. Shipping Rates
        </h2>
        <p className="text-gray-700">
          Shipping costs are calculated based on your location and the shipping method you select at checkout. The total
          shipping fee will be displayed before you complete your order.
        </p>
      </section>
      <section className="mb-10">
        <h2 className="flex items-center gap-3 mb-6 text-2xl font-semibold text-red-600">
          <Truck className="w-8 h-8 text-purple-600" />
          3. Shipping Methods
        </h2>
        <p className="mb-6 text-gray-700">We offer several shipping options to suit your needs, including:</p>
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <li className="flex flex-col p-6 transition-shadow duration-300 border rounded-lg shadow-sm hover:shadow-md bg-green-50">
            <div className="flex items-center gap-3 mb-3">
              <Package className="w-8 h-8 text-green-600" />
              <h3 className="text-lg font-semibold text-green-800">Standard Shipping</h3>
            </div>
            <p className="text-gray-700">
              <strong>FREE Delivery</strong> within 5-7 business days.
            </p>
          </li>
          <li className="flex flex-col p-6 transition-shadow duration-300 border rounded-lg shadow-sm hover:shadow-md bg-yellow-50">
            <div className="flex items-center gap-3 mb-3">
              <Clock className="w-8 h-8 text-yellow-600" />
              <h3 className="text-lg font-semibold text-yellow-800">Express Shipping</h3>
            </div>
            <p className="text-gray-700">
              Faster delivery will charge <strong>₹150/-</strong> and will be delivered in 2-3 business days.
            </p>
          </li>
        </ul>
      </section>
      <section className="mb-10">
        <h2 className="flex items-center gap-3 mb-6 text-2xl font-semibold text-red-600">
          <Shield className="w-8 h-8 text-orange-600" />
          4. Shipping Delays
        </h2>
        <div className="p-6 bg-orange-50 border-l-4 border-orange-500 rounded-lg">
          <p className="text-gray-700">
            While we strive to deliver your order within the stated time frame, occasional delays may occur due to
            factors like weather conditions, shipping carrier issues, or holidays. We are not responsible for delays
            caused by third-party carriers, but we'll do our best to help you track down your package.
          </p>
        </div>
      </section>
      <section className="mb-10">
        <h2 className="flex items-center gap-3 mb-6 text-2xl font-semibold text-red-600">
          <Package className="w-8 h-8 text-red-600" />
          5. Missing or Damaged Packages
        </h2>
        <div className="p-6 bg-red-50 border-l-4 border-red-500 rounded-lg">
          <p className="text-gray-700">
            If your order arrives damaged or is missing, we require that damaged product photograph and please contact
            us within <strong>1 day</strong> of receiving your package. We will assist you in resolving the issue,
            including offering a replacement or refund (where applicable).
          </p>
        </div>
      </section>
      <section className="mb-10">
        <h2 className="flex items-center gap-3 mb-6 text-2xl font-semibold text-red-600">
          <MapPin className="w-8 h-8 text-blue-600" />
          6. Change of Address
        </h2>
        <p className="text-gray-700">
          If you need to change your shipping address after placing an order, please contact us as soon as possible. We
          will do our best to accommodate address changes, but once an order has been processed and shipped, we can no
          longer update the address.
        </p>
      </section>
      <section className="mb-10">
        <h2 className="flex items-center gap-3 mb-6 text-2xl font-semibold text-red-600">
          <Shield className="w-8 h-8 text-purple-600" />
          7. Customer Responsibility
        </h2>
        <div className="p-6 bg-purple-50 border-l-4 border-purple-500 rounded-lg">
          <p className="text-gray-700">
            Please ensure that all shipping details (including your address, phone number, and email) are correct when
            placing your order. Ksauni Bliss is not responsible for delivery issues due to incorrect or incomplete
            information provided by the customer.
          </p>
        </div>
      </section>
    </div>
  );
};
export default ShippingPage;
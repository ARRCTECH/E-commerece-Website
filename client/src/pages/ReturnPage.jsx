import { Link } from "react-router-dom";
const ReturnPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <nav className="text-sm text-gray-500 mb-4">
            <Link to="/" className="hover:text-gray-700">
              Home
            </Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">Return & Refund Policy</span>
          </nav>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Return & Refund Policy</h1>
          <p className="text-lg text-gray-600">
            We want you to be happy with your purchase! If for any reason you are not satisfied, please read our return
            and refund policy below to understand the process.
          </p>
        </div>
        {/* Policy Content */}
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-8">
          {/* Return Eligibility */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
              <span className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                1
              </span>
              Return Eligibility
            </h2>
            <p className="text-gray-700 mb-4">
              To be eligible for a return, your item must meet the following conditions:
            </p>
            <div className="space-y-3">
              <div className="flex items-start">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <div>
                  <strong className="text-gray-900">Unworn and Unwashed:</strong>
                  <span className="text-gray-700 ml-1">
                    The item must be in its original condition, unworn, unwashed, and free from any stains or damage.
                  </span>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <div>
                  <strong className="text-gray-900">Original Packaging:</strong>
                  <span className="text-gray-700 ml-1">
                    The item must be returned in its original packaging with all tags attached.
                  </span>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <div>
                  <strong className="text-gray-900">Return Window:</strong>
                  <span className="text-gray-700 ml-1">
                    You must initiate the return within <strong>03 days</strong> of receiving your order.
                  </span>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <div>
                  <span className="text-gray-700">If the article is defected or wrong design delivered</span>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <div>
                  <span className="text-gray-700">If wrong size is delivered by us</span>
                </div>
              </div>
            </div>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
              <p className="text-yellow-800">
                <strong>Note:</strong> Custom or personalized items are non-returnable unless they are defective or
                damaged.
              </p>
            </div>
          </section>
          {/* Refund Process */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
              <span className="bg-green-100 text-green-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                2
              </span>
              Refund Process
            </h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <p className="text-gray-700">
                  Once we receive your return, we will inspect the item to ensure it meets our return conditions.
                </p>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <div>
                  <strong className="text-gray-900">Refund Confirmation:</strong>
                  <span className="text-gray-700 ml-1">We will notify you once your return has been processed.</span>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <div>
                  <strong className="text-gray-900">Refund Method:</strong>
                  <span className="text-gray-700 ml-1">
                    Refunds will be issued to the original payment method used during checkout. It can take{" "}
                    <strong>7-10 business days</strong> for the refund to appear in your account, depending on your bank
                    or payment provider.
                  </span>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <div>
                  <strong className="text-gray-900">Partial Refund:</strong>
                  <span className="text-gray-700 ml-1">
                    If the item is returned damaged or has missing parts (e.g., tags, packaging), we may issue a partial
                    refund based on the condition of the item.
                  </span>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <div>
                  <strong className="text-gray-900">Non-refundable Fees:</strong>
                  <span className="text-gray-700 ml-1">
                    Please note that shipping charges are non-refundable. Delivery charges will be reduced from your
                    refund amount.
                  </span>
                </div>
              </div>
            </div>
          </section>
          {/* Exchanges */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
              <span className="bg-purple-100 text-purple-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                3
              </span>
              Exchanges
            </h2>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-purple-800">
                We do not offer direct exchanges for items. If you would like a different size, color, or style, please
                return the item you purchased and place a new order for the replacement item.
              </p>
            </div>
          </section>
          {/* Non-Refundable Items */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
              <span className="bg-red-100 text-red-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                4
              </span>
              Non-Refundable Items
            </h2>
            <p className="text-gray-700 mb-4">The following items are not eligible for a return or refund:</p>
            <div className="space-y-3">
              <div className="flex items-start">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <div>
                  <strong className="text-gray-900">Customized or Personalized Products:</strong>
                  <span className="text-gray-700 ml-1">
                    Items that are made to order or have been customized with personal details (names, messages, etc.).
                  </span>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <div>
                  <strong className="text-gray-900">Sale or Clearance Items:</strong>
                  <span className="text-gray-700 ml-1">
                    Items marked as "final sale" or "clearance" are not eligible for return or refund or Discounted
                    items.
                  </span>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <div>
                  <strong className="text-gray-900">Gift Cards:</strong>
                  <span className="text-gray-700 ml-1">
                    If applicable, gift cards are not returnable or refundable.
                  </span>
                </div>
              </div>
            </div>
          </section>
          {/* Special Circumstances */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
              <span className="bg-orange-100 text-orange-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                5
              </span>
              Special Circumstances
            </h2>
            <div className="space-y-6">
              <div className="border-l-4 border-orange-400 pl-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Returns Due to Incorrect Address</h3>
                <p className="text-gray-700">
                  If an order is returned to us due to an incorrect or incomplete address provided by the customer, you
                  will be responsible for the cost of reshipping the item to the correct address. Please double-check
                  your shipping details before completing your order.
                </p>
              </div>
              <div className="border-l-4 border-orange-400 pl-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Returns After Delivery Attempts Fail</h3>
                <p className="text-gray-700">
                  If a shipping carrier attempts delivery and is unable to do so (due to a missed delivery, wrong
                  address, etc.), and the item is returned to us, you will be responsible for the cost of reshipping the
                  item. A refund can only be processed if the item is returned in original, unused condition.
                </p>
              </div>
            </div>
          </section>
          {/* Contact Information */}
        </div>
      </div>
    </div>
  );
};
export default ReturnPage;
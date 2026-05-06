export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Privacy <span className="text-red-200">Policy</span>
          </h1>
          <p className="text-xl md:text-2xl text-red-100 max-w-3xl mx-auto">
            We respect your privacy and are committed to protecting your personal information.
          </p>
        </div>
      </div>
      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Introduction */}
        <div className="mb-12">
          <p className="text-lg text-gray-700 leading-relaxed">
            At Ksauni Bliss, we respect your privacy and are committed to protecting your personal information. This
            Privacy Policy explains how we collect, use, and safeguard your data when you visit our website or make a
            purchase.
          </p>
        </div>
        {/* Policy Sections */}
        <div className="space-y-12">
          {/* Information We Collect */}
          <div className="bg-white rounded-xl shadow-lg p-8 border-l-4 border-red-600">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              1. Information We <span className="text-red-600">Collect</span>
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              When you visit our website, make a purchase, or interact with us in other ways, we may collect the
              following types of information:
            </p>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-red-600 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h3 className="font-semibold text-gray-900">Personal Information:</h3>
                  <p className="text-gray-700">
                    Your name, email address, phone number, shipping address, and payment details.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-red-600 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h3 className="font-semibold text-gray-900">Usage Data:</h3>
                  <p className="text-gray-700">
                    Information about how you use our website, such as pages visited, time spent, and clicks.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-red-600 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h3 className="font-semibold text-gray-900">Cookies:</h3>
                  <p className="text-gray-700">
                    Small text files stored on your device to help us improve your browsing experience (e.g.,
                    remembering your preferences).
                  </p>
                </div>
              </div>
            </div>
          </div>
          {/* How We Use Your Information */}
          <div className="bg-white rounded-xl shadow-lg p-8 border-l-4 border-red-600">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              2. How We <span className="text-red-600">Use</span> Your Information
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We use the information we collect for the following purposes:
            </p>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-red-600 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h3 className="font-semibold text-gray-900">Order Processing:</h3>
                  <p className="text-gray-700">To process and fulfill your orders, including shipping and payment.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-red-600 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h3 className="font-semibold text-gray-900">Customer Support:</h3>
                  <p className="text-gray-700">To respond to your inquiries or concerns.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-red-600 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h3 className="font-semibold text-gray-900">Marketing:</h3>
                  <p className="text-gray-700">
                    To send you promotional emails or offers, if you've agreed to receive them. You can unsubscribe at
                    any time.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-red-600 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h3 className="font-semibold text-gray-900">Improving Our Website:</h3>
                  <p className="text-gray-700">
                    To enhance your experience and improve the performance of our website based on your behavior.
                  </p>
                </div>
              </div>
            </div>
          </div>
          {/* Sharing Your Information */}
          <div className="bg-white rounded-xl shadow-lg p-8 border-l-4 border-red-600">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              3. <span className="text-red-600">Sharing</span> Your Information
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We do not sell, rent, or trade your personal information. However, we may share it in the following
              situations:
            </p>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-red-600 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h3 className="font-semibold text-gray-900">Service Providers:</h3>
                  <p className="text-gray-700">
                    We may share your data with third-party services (like payment processors or shipping companies) to
                    help process your order or provide customer support.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-red-600 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h3 className="font-semibold text-gray-900">Legal Requirements:</h3>
                  <p className="text-gray-700">
                    If required by law, we may disclose your information to comply with legal obligations or protect our
                    rights.
                  </p>
                </div>
              </div>
            </div>
          </div>
          {/* Data Security */}
          <div className="bg-white rounded-xl shadow-lg p-8 border-l-4 border-red-600">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              4. Data <span className="text-red-600">Security</span>
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We take your privacy seriously and use reasonable measures to protect your personal data from unauthorized
              access, alteration, or destruction. We use secure encryption for payment processing and follow
              industry-standard practices to safeguard your information.
            </p>
          </div>
          {/* Your Rights and Choices */}
          <div className="bg-white rounded-xl shadow-lg p-8 border-l-4 border-red-600">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              5. Your <span className="text-red-600">Rights</span> and Choices
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              You have the following rights regarding your personal information:
            </p>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-red-600 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h3 className="font-semibold text-gray-900">Access:</h3>
                  <p className="text-gray-700">You can request access to the personal data we hold about you.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-red-600 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h3 className="font-semibold text-gray-900">Correction:</h3>
                  <p className="text-gray-700">You can update or correct any inaccurate information.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-red-600 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h3 className="font-semibold text-gray-900">Deletion:</h3>
                  <p className="text-gray-700">
                    You can request that we delete your personal data, subject to certain legal exceptions.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-red-600 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h3 className="font-semibold text-gray-900">Opt-Out:</h3>
                  <p className="text-gray-700">
                    You can opt-out of receiving marketing communications from us by clicking "unsubscribe" in our
                    emails or contacting us directly.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Contact Section */}
        <div className="mt-16 text-center bg-gradient-to-r from-red-600 to-red-700 text-white rounded-2xl p-12">
          <h2 className="text-3xl font-bold mb-4">
            Questions About Our <span className="text-red-200">Privacy Policy</span>?
          </h2>
          <p className="text-xl text-red-100 mb-8 max-w-2xl mx-auto">
            If you have any questions or concerns about this Privacy Policy, please don't hesitate to contact us.
          </p>
          <button className="bg-white text-red-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-red-50 transition-colors duration-300 shadow-lg">
            Contact Us
          </button>
        </div>
      </div>
    </div>
  );
}
import React from "react";
import { Cookie, ShieldCheck, Settings, AlertCircle } from "lucide-react";
const CookiesPage = () => {
  return (
    <div className="max-w-4xl px-4 py-12 mx-auto">
      <h1 className="mb-10 text-4xl font-bold text-red-600 text-center">Cookie Policy</h1>
      <p className="mb-10 text-lg text-gray-700 text-center max-w-3xl mx-auto">
        We use cookies and similar technologies to enhance your experience on our website. Cookies help us provide personalized content, analyze site traffic, and improve our services.
      </p>
      <section className="mb-12">
        <h2 className="mb-8 text-2xl font-semibold text-red-600 flex items-center gap-3">
          <Cookie className="w-10 h-10 text-yellow-600" />
          What Are Cookies?
        </h2>
        <p className="text-gray-700 mb-6">
          Cookies are small text files stored on your device by your web browser. They help websites remember your preferences and activity.
        </p>
      </section>
      <section className="mb-12">
        <h2 className="mb-8 text-2xl font-semibold text-red-600 flex items-center gap-3">
          <ShieldCheck className="w-10 h-10 text-green-600" />
          How We Use Cookies
        </h2>
        <ul className="list-disc list-inside text-gray-700 space-y-2">
          <li>To remember your login and preferences.</li>
          <li>To analyze website traffic and usage.</li>
          <li>To personalize content and ads.</li>
          <li>To improve website performance and security.</li>
        </ul>
      </section>
      <section className="mb-12">
        <h2 className="mb-8 text-2xl font-semibold text-red-600 flex items-center gap-3">
          <Settings className="w-10 h-10 text-blue-600" />
          Managing Cookies
        </h2>
        <p className="text-gray-700 mb-6">
          You can manage or disable cookies through your browser settings. Please note that disabling cookies may affect your experience on our site.
        </p>
      </section>
      <section>
        <h2 className="mb-8 text-2xl font-semibold text-red-600 flex items-center gap-3">
          <AlertCircle className="w-10 h-10 text-red-600" />
          Your Consent
        </h2>
        <p className="text-gray-700">
          By using our website, you consent to our use of cookies as described in this policy.
        </p>
      </section>
    </div>
  );
};
export default CookiesPage;
"use client";
import { Mail, Phone, MapPin, Instagram } from "lucide-react";
const ContactUsPage = () => {
  return (
    <section className="w-full min-h-screen flex items-center justify-center bg-red-50 py-10 px-4">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-lg p-8 md:p-12 border border-red-200">
        {/* Header */}
        <h1 className="text-3xl md:text-4xl font-bold text-red-600 mb-6 text-center">
          Contact Us
        </h1>
        {/* Info Block */}
        <div className="space-y-6 text-gray-800">
          <p className="text-lg leading-relaxed">
            <span className="font-semibold text-red-600">Manufactured & Packed By:</span><br />
            Ksauni Bliss <br />
            Ground Floor, Nawada Housing Complex, Dwarka More, Delhi - 110059
          </p>
          {/* Contact Methods */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Phone className="w-6 h-6 text-red-600" />
              <p className="text-base">
                <span className="font-semibold">Telephone (WhatsApp Only):</span> +91 92118 91719
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Instagram className="w-6 h-6 text-red-600" />
              <p className="text-base">
                <span className="font-semibold">DM us on Instagram:</span> @ksaunibliss
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Mail className="w-6 h-6 text-red-600" />
              <p className="text-base">
                <span className="font-semibold">Email:</span> ksaunibliss@gmail.com
              </p>
            </div>
          </div>
        </div>
        {/* Footer Note */}
        <p className="mt-8 text-center text-sm text-gray-500">
          We’re always happy to assist you with any questions or support you may need.
        </p>
      </div>
    </section>
  );
};
export default ContactUsPage;
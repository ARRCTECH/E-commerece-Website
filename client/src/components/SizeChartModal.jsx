// components/SizeChartModal.jsx
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

const SizeChartModal = ({ isOpen, onClose, productType = "jeans" }) => {
  // Jeans Size Chart Data
  const jeansData = {
    sizes: [28, 30, 32, 34, 36, 38, 40],
    measurements: {
      "WAIST ALL RD": [30.09, 32.06, 33.95, 35.93, 37.83, 39.73, 41.63],
      "HIP 8\"": [36.88, 38.89, 40.89, 42.90, 44.92, 46.94, 48.96],
      "THIGH 1\"": [24.04, 25.04, 26.04, 27.04, 28.04, 29.04, 30.04],
      "KNEE 14\"": [18.77, 19.43, 20.09, 20.75, 21.41, 22.07, 22.73],
      "BOTTOM": [17.99, 18.49, 18.99, 19.49, 19.99, 20.49, 20.99],
      "FRONT RISE": [12.26, 12.51, 12.76, 13.01, 13.25, 13.50, 13.75],
      "BACK RISE": [16.04, 16.27, 16.50, 16.73, 16.96, 17.19, 17.42],
      "LENGTH": [41, 41, 41, 41, 41, 41, 41]
    }
  };

  // T-Shirt Size Chart Data
  const tshirtData = {
    sizes: ["S", "M", "L", "XL", "XXL"],
    measurements: {
      "CHEST": [36, 38, 40, 42, 44],
      "LENGTH": [26, 27, 28, 29, 30],
      "SHOULDER": [16, 17, 18, 19, 20],
      "SLEEVE": [8, 8.5, 9, 9.5, 10]
    }
  };

  const data = productType === "jeans" ? jeansData : tshirtData;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="relative bg-white rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-y-auto"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="text-xl font-bold text-gray-900">📏 Size Measurement Chart</h2>
                <p className="text-sm text-gray-500 mt-1">All measurements are in inches</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100 transition"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Diagram / Measurement Guide */}
            <div className="px-6 pt-6">
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="flex justify-center">
                  <svg width="350" height="180" viewBox="0 0 350 180" xmlns="http://www.w3.org/2000/svg">
                    {/* Jeans Outline */}
                    <rect x="80" y="15" width="190" height="150" rx="8" fill="none" stroke="#334155" strokeWidth="1.5" strokeDasharray="4,3"/>
                    
                    {/* Measurement Lines */}
                    <line x1="80" y1="35" x2="270" y2="35" stroke="#dc2626" strokeWidth="1.5" strokeDasharray="3,2"/>
                    <text x="280" y="38" fontSize="9" fill="#dc2626" fontWeight="bold">WAIST</text>
                    
                    <line x1="80" y1="75" x2="270" y2="75" stroke="#dc2626" strokeWidth="1.5" strokeDasharray="3,2"/>
                    <text x="280" y="78" fontSize="9" fill="#dc2626" fontWeight="bold">HIP</text>
                    
                    <line x1="80" y1="105" x2="270" y2="105" stroke="#dc2626" strokeWidth="1.5" strokeDasharray="3,2"/>
                    <text x="280" y="108" fontSize="9" fill="#dc2626" fontWeight="bold">THIGH</text>
                    
                    <line x1="80" y1="135" x2="270" y2="135" stroke="#dc2626" strokeWidth="1.5" strokeDasharray="3,2"/>
                    <text x="280" y="138" fontSize="9" fill="#dc2626" fontWeight="bold">KNEE</text>
                    
                    <line x1="80" y1="158" x2="270" y2="158" stroke="#dc2626" strokeWidth="1.5" strokeDasharray="3,2"/>
                    <text x="280" y="161" fontSize="9" fill="#dc2626" fontWeight="bold">BOTTOM</text>
                    
                    {/* Length Arrow */}
                    <line x1="65" y1="15" x2="65" y2="165" stroke="#166534" strokeWidth="1.5"/>
                    <polygon points="65,165 60,155 70,155" fill="#166534"/>
                    <polygon points="65,15 60,25 70,25" fill="#166534"/>
                    <text x="55" y="95" fontSize="9" fill="#166534" fontWeight="bold" transform="rotate(-90,55,95)">LENGTH</text>
                  </svg>
                </div>
                <p className="text-center text-xs text-gray-500 mt-3">
                  📐 <strong>How to measure:</strong> Waist (full circumference) | Hip 8" below waist | Inseam measured from crotch to hem
                </p>
              </div>
            </div>

            {/* Size Table */}
            <div className="px-6 pb-6">
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-900 text-white">
                      <th className="px-4 py-3 text-left">Size Name</th>
                      {data.sizes.map((size, idx) => (
                        <th key={idx} className="px-4 py-3 text-center font-semibold">
                          {size}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(data.measurements).map(([measure, values], idx) => (
                      <tr 
                        key={idx}
                        className={measure === "LENGTH" ? "bg-green-50" : "border-b border-gray-100 hover:bg-gray-50"}
                      >
                        <td className={`px-4 py-2.5 font-semibold ${measure === "LENGTH" ? "text-green-700" : "text-gray-700"}`}>
                          {measure === "LENGTH" ? "📏 " + measure : measure}
                        </td>
                        {values.map((val, i) => (
                          <td 
                            key={i} 
                            className={`px-4 py-2.5 text-center ${measure === "LENGTH" ? "text-green-600 font-bold" : "text-gray-600"}`}
                          >
                            {val}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-4 flex gap-3 justify-end">
                <button 
                  onClick={() => {
                    // Copy table to clipboard
                    const tableHtml = document.querySelector('.overflow-x-auto table').outerHTML;
                    navigator.clipboard.writeText(tableHtml);
                    alert("✅ Table copied!");
                  }}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  📋 Copy Table
                </button>
                <button 
                  onClick={() => {
                    // Export as image
                    const element = document.querySelector('.max-w-4xl');
                    import('https://cdn.skypack.dev/html2canvas').then(html2canvas => {
                      html2canvas.default(element, { scale: 2 }).then(canvas => {
                        const link = document.createElement('a');
                        link.download = 'size-chart.png';
                        link.href = canvas.toDataURL();
                        link.click();
                      });
                    });
                  }}
                  className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  📸 Download as Image
                </button>
              </div>
            </div>

            {/* Footer Note */}
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
              <p className="text-xs text-gray-500 text-center">
                * These are approximate measurements. Actual product may vary slightly by 0.5-1 inch.
                <br /> For best fit, please refer to our size guide or contact customer support.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SizeChartModal;
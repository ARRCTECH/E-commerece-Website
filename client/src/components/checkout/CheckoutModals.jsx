import { motion } from "framer-motion";
import { X, CreditCard } from "lucide-react";
import { useState } from "react";

export const PaymentModal = ({ 
  isOpen, 
  onClose, 
  onOnline, 
  onCOD, 
  onPartialCod, 
  amount,           // discounted amount (Pay Online साठी)
  originalAmount,   // original amount (COD आणि Partial COD साठी)
  showPartialCod, 
  partialPercentage, 
  isBulkProduct 
}) => {
  const [tab, setTab] = useState("online");
  if (!isOpen) return null;
  
  // Partial COD साठी original amount वरून calculate करा
  const baseAmountForPartial = originalAmount || amount;
  const onlineAmount = Math.round(baseAmountForPartial * (partialPercentage / 100));
  const codAmount = baseAmountForPartial - onlineAmount;
  const showCodTab = !showPartialCod;
  const showPartialCodTab = showPartialCod;
  
  const handleTabChange = (newTab) => {
    console.log("🔵 PaymentModal - tab changed to:", newTab);
    setTab(newTab);
  };
  
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Select Payment Method</h2>
          <button onClick={() => { console.log("🔵 PaymentModal - Close button clicked"); onClose(); }} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b mb-4">
          <button 
            className={`flex-1 py-2 text-center ${tab === "online" ? "font-bold border-b-2 border-red-600" : ""}`} 
            onClick={() => handleTabChange("online")}
          >
            Pay Online
          </button>
          
          {showCodTab && (
            <button 
              className={`flex-1 py-2 text-center ${tab === "cod" ? "font-bold border-b-2 border-red-600" : ""}`} 
              onClick={() => handleTabChange("cod")}
            >
              Cash on Delivery
            </button>
          )}
          
          {showPartialCodTab && (
            <button 
              className={`flex-1 py-2 text-center ${tab === "partial" ? "font-bold border-b-2 border-red-600" : ""}`} 
              onClick={() => handleTabChange("partial")}
            >
              Partial COD
            </button>
          )}
        </div>

        <div className="p-4">
          {tab === "online" && (
            <>
              <p className="mb-4 text-center text-gray-600">Amount: ₹{amount}</p>
              <button 
                onClick={() => { console.log("🔵 PaymentModal - Online payment clicked, amount:", amount); onOnline(); }} 
                className="flex items-center justify-center w-full py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                <CreditCard className="mr-2 w-4 h-4" /> Pay ₹{amount}
              </button>
            </>
          )}
          
          {tab === "cod" && (
            <>
              <p className="mb-2 text-center text-gray-600">Amount: ₹{originalAmount || amount} (Pay on delivery)</p>
              <p className="text-xs text-center text-red-500 mb-3">*No online discount applicable on COD</p>
              <button 
                onClick={() => { console.log("🔵 PaymentModal - COD clicked, amount:", originalAmount || amount); onCOD(); }} 
                className="w-full py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Confirm COD
              </button>
            </>
          )}
          
          {tab === "partial" && partialPercentage && (
            <>
              <p className="text-center text-gray-700 mb-2">
                Pay <span className="font-bold">{partialPercentage}%</span> online
              </p>
              <p className="text-center text-lg font-semibold text-red-600 mb-1">
                ₹{onlineAmount}
              </p>
              <p className="text-center text-sm text-gray-500 mb-4">
                Remaining <span className="font-bold">{100 - partialPercentage}%</span> (₹{codAmount}) on delivery
              </p>
              <p className="text-xs text-center text-gray-400 mb-3">
                *Calculated on original amount ₹{baseAmountForPartial}
              </p>
              <button 
                onClick={() => { 
                  console.log("🔵 PaymentModal - Partial COD clicked");
                  console.log("   Online Amount:", onlineAmount);
                  console.log("   COD Amount:", codAmount);
                  console.log("   Percentage:", partialPercentage);
                  onPartialCod(); 
                }} 
                className="w-full py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Pay ₹{onlineAmount} Online
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export const CongratulationsModal = ({ isOpen, onClose, couponCode, savingsAmount }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-md bg-white rounded-2xl p-6 text-center shadow-2xl"
      >
        <div className="w-20 h-20 mx-auto mb-4 bg-green-500 rounded-full flex items-center justify-center">
          <span className="text-4xl">🎉</span>
        </div>
        <h2 className="text-2xl font-bold mb-2 text-gray-800">Congratulations!</h2>
        <p className="text-gray-600 mb-4">Your promo code has been applied successfully!</p>
        <div className="bg-green-50 p-4 rounded-xl mb-4 border border-green-200">
          <span className="font-bold text-green-800">{couponCode}</span>
          <span className="block text-2xl font-bold text-green-600 mt-1">₹{savingsAmount} OFF</span>
        </div>
        <button 
          onClick={() => { console.log("🔵 CongratulationsModal - Close button clicked"); onClose(); }} 
          className="w-full py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-colors"
        >
          Continue
        </button>
      </motion.div>
    </div>
  );
};

// ========== Exit Warning Modal ==========
export const ExitWarningModal = ({ isOpen, onContinue, onExit, message, type = "warning" }) => {
  const [selectedReasons, setSelectedReasons] = useState([]);
  const [othersText, setOthersText] = useState("");
  const [isOthersSelected, setIsOthersSelected] = useState(false);
  if (!isOpen) return null;
  const reasons = [
    "Don't want to share mobile number",
    "Need to modify cart",
    "Found better deal",
    "Changed my mind",
    "Technical issues",
    "Shipping costs",
    "Just browsing",
    "Others"
  ];
  const handleSubmit = (e) => {
    e.preventDefault();
    let finalReasons = [...selectedReasons];
    if (isOthersSelected) {
      finalReasons = finalReasons.filter(r => r !== "Others");
      finalReasons.push(othersText || "Others");
    }
    onExit(finalReasons);
  };

  const handleReasonChange = (reason, isChecked) => {
    if (isChecked) {
      setSelectedReasons([...selectedReasons, reason]);
      if (reason === "Others") setIsOthersSelected(true);
    } else {
      setSelectedReasons(selectedReasons.filter(r => r !== reason));
      if (reason === "Others") setIsOthersSelected(false);
    }
  };
  
  if (type === "survey") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl"
        >
          <div className="text-center mb-4">
            <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-xl">😢</span>
            </div>
            <h3 className="text-xl font-bold text-gray-800">Wait! Don't Go</h3>
            <p className="text-sm text-gray-500 mt-1">Help us improve by sharing your feedback</p>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="max-h-48 overflow-y-auto space-y-2 mb-4">
              {reasons.map(reason => (
                <label key={reason} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input 
                    type="checkbox" 
                    value={reason} 
                    onChange={(e) => handleReasonChange(reason, e.target.checked)} 
                    className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700">{reason}</span>
                </label>
              ))}
            </div>
            
            {isOthersSelected && (
              <input 
                type="text" 
                value={othersText} 
                onChange={(e) => {
                  console.log("🔵 ExitWarningModal - Others text changed:", e.target.value);
                  setOthersText(e.target.value);
                }} 
                placeholder="Please specify..." 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            )}
            
            <div className="flex gap-3">
              <button 
                type="button" 
                onClick={() => { console.log("🔵 ExitWarningModal - Keep Shopping clicked"); onContinue(); }} 
                className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Keep Shopping
              </button>
              <button 
                type="submit" 
                disabled={selectedReasons.length === 0} 
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save & Exit
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl max-w-md w-full p-6 text-center shadow-2xl"
      >
        <div className="w-16 h-16 mx-auto mb-4 bg-yellow-500 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold mb-2 text-gray-800">{message?.title || "Wait! Don't Go Yet!"}</h3>
        <p className="text-gray-600 mb-4">{message?.description || "You're about to leave behind an exclusive FREE GIFT!"}</p>
        <div className="flex gap-3">
          <button 
            onClick={() => { console.log("🔵 ExitWarningModal - Continue clicked"); onContinue(); }} 
            className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            Continue
          </button>
          <button 
            onClick={() => { console.log("🔵 ExitWarningModal - Exit Anyway clicked"); onExit(); }} 
            className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Exit Anyway
          </button>
        </div>
      </motion.div>
    </div>
  );
};
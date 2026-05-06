import { useState, useEffect } from "react";
import { CreditCard, X, Info } from "lucide-react";
// PaymentModal – drop this in right under your imports
export const PaymentModal = ({ isOpen, onClose, onOnline, onCOD, amount }) => {
  const [tab, setTab] = useState("online");
  if (!isOpen) return null;
  return (
    <div>
      <div>
        <button
          className="text-gray-500 hover:text-gray-900"
          onClick={onClose}
        >
          <X />
        </button>
      </div>
      <div className="flex border-b rounded-lg">
        <button
          className={`flex-1 py-2 text-center ${tab === "online" ? "font-bold border-b-2 border-red-600" : ""
            }`}
          onClick={() => setTab("online")}
        >
          Pay Online
        </button>
        <button
          className={`flex-1 py-2 text-center ${tab === "cod" ? "font-bold border-b-2 border-red-600" : ""
            }`}
          onClick={() => setTab("cod")}
        >
          Cash on Delivery
        </button>
      </div>
      {/* Content */}
      <div className="p-4">
        {tab === "online" ? (
          <>
            <p className="mb-4">Amount: ₹{amount}</p>
            <button
              className="flex items-center justify-center w-full py-2 text-white bg-red-600 rounded-[10px] hover:bg-red-700"
              onClick={() => {
                onOnline();
              }}
            >
              <CreditCard className="mr-2" /> Pay ₹{amount}
            </button>
          </>
        ) : (
          <>
            <div className="mb-4 space-y-3">
              {/* Cash On Delivery Header */}
              <div className="flex justify-between items-start pb-3 border-b">
                <div>
                  <p>Amount: ₹{amount}</p>
                </div>
              </div>
            </div>
            <button
              className="w-full py-2 text-white bg-red-600 rounded-[10px] hover:bg-red-700"
              onClick={() => {
                onCOD();
                onClose();
              }}
            >
              Confirm COD
            </button>
          </>
        )}
      </div>
    </div>
  );
};





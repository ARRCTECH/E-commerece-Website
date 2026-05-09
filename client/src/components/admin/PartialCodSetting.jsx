"use client";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { 
  fetchPartialCodSettings, 
  updatePartialCodSettings,
  clearError,
  clearSuccess 
} from "../../store/slices/partialCodSlice";
import toast from "react-hot-toast";

const PartialCodSetting = () => {
  const dispatch = useDispatch();
  const { percentage, isEnabled, loading, error, success } = useSelector((state) => state.partialCod);
  const [value, setValue] = useState(30);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    dispatch(fetchPartialCodSettings());
  }, [dispatch]);

  useEffect(() => {
    if (percentage) setValue(percentage);
    if (isEnabled !== undefined) setEnabled(isEnabled);
  }, [percentage, isEnabled]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
    if (success) {
      toast.success(success);
      dispatch(clearSuccess());
    }
  }, [error, success, dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await dispatch(updatePartialCodSettings({ percentage: value, isEnabled: enabled }));
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 max-w-md">
      <h2 className="text-xl font-bold text-gray-800 mb-2">Partial COD Settings</h2>
      <p className="text-sm text-gray-500 mb-4">
        Configure partial payment option for bulk products
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div>
            <label className="font-medium text-gray-700">Enable Partial COD</label>
            <p className="text-xs text-gray-400">Show partial COD option at checkout</p>
          </div>
          <button
            type="button"
            onClick={() => setEnabled(!enabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              enabled ? "bg-red-600" : "bg-gray-300"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                enabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {/* Percentage Input - Only show if enabled */}
        {enabled && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Online Payment Percentage (%)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={value}
                onChange={(e) => setValue(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                className="w-28 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                min="0"
                max="100"
              />
              <span className="text-gray-500">%</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Example: 30% means 30% online, 70% on delivery
            </p>
          </div>
        )}

        {/* Preview */}
        {enabled && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              💡 Current: <strong>{value}%</strong> online, <strong>{100 - value}%</strong> COD
            </p>
          </div>
        )}

        {!enabled && (
          <div className="p-3 bg-gray-100 rounded-lg">
            <p className="text-sm text-gray-600">
              🔴 Partial COD is currently <strong>disabled</strong>
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 w-full"
        >
          {loading ? "Saving..." : "Save Settings"}
        </button>
      </form>
    </div>
  );
};

export default PartialCodSetting;
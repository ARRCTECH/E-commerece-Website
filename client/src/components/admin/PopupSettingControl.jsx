import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchPopupSetting, updatePopupSetting } from "../../store/slices/popupSlice";
const PopupSettingControl = () => {
  const dispatch = useDispatch();
  const { showSalePopup, loading, error } = useSelector((state) => state.popup);
  const [enabled, setEnabled] = useState(() => showSalePopup);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  useEffect(() => {
    dispatch(fetchPopupSetting());
  }, [dispatch]);
  // Removed useEffect that resets enabled on showSalePopup changes
  const handleToggle = () => {
    setEnabled(!enabled);
  };
  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      await dispatch(updatePopupSetting({ showSalePopup: enabled })).unwrap();
      setSaveSuccess(true);
    } catch (err) {
      setSaveError(err || "Failed to save popup setting");
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="p-4 bg-white rounded shadow max-w-md">
      <h2 className="text-xl font-semibold mb-4">Popup Visibility Control</h2>
      <label className="flex items-center space-x-3">
        <input
          type="checkbox"
          checked={enabled}
          onChange={handleToggle}
          disabled={loading || saving}
          className="form-checkbox h-5 w-5 text-blue-600"
        />
        <span>Show popup to users</span>
      </label>
      {error && <p className="text-red-600 mt-2">Error loading setting: {error}</p>}
      {saveError && <p className="text-red-600 mt-2">Error saving setting: {saveError}</p>}
      {saveSuccess && <p className="text-green-600 mt-2">Popup setting saved successfully.</p>}
      <button
        onClick={handleSave}
        disabled={loading || saving}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save"}
      </button>
    </div>
  );
};
export default PopupSettingControl;
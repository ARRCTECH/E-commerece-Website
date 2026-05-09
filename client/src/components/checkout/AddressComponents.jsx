import { motion } from "framer-motion";
import { X, Plus, MapPin, Mail, Edit, Trash2, Check } from "lucide-react";
import { useState, useEffect } from "react";

// ========== Address Popup Component ==========
export const AddressPopup = ({ isOpen, onClose, onSave, editingAddress, user }) => {
  const [formData, setFormData] = useState({ fullName: "", email: "", phoneNumber: "", addressLine1: "", addressLine2: "", city: "", state: "", pinCode: "", landmark: "", addressType: "home", isDefault: false });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (editingAddress) {
      setFormData(editingAddress);
    } else {
      setFormData(prev => ({ ...prev, fullName: user?.name || "", email: user?.email || "", phoneNumber: user?.phoneNumber?.replace("+91", "") || "" }));
    }
  }, [editingAddress, user, isOpen]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = "Full name required";
    if (!formData.email.trim()) newErrors.email = "Email required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Invalid email";
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = "Phone required";
    else if (!/^[6789]\d{9}$/.test(formData.phoneNumber)) newErrors.phoneNumber = "Valid 10-digit mobile required";
    if (!formData.addressLine1.trim()) newErrors.addressLine1 = "Address required";
    if (!formData.city.trim()) newErrors.city = "City required";
    if (!formData.state.trim()) newErrors.state = "State required";
    if (!formData.pinCode.trim()) newErrors.pinCode = "PIN code required";
    else if (!/^[1-9][0-9]{5}$/.test(formData.pinCode)) newErrors.pinCode = "Valid 6-digit PIN required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => { e.preventDefault(); if (validateForm()) onSave(formData); };
  if (!isOpen) return null;

  const addressTypes = [
    { value: "home", label: "🏠 Home" }, { value: "work", label: "💼 Work" }, { value: "other", label: "📦 Other" }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/50 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="relative w-full max-w-md max-h-[75vh] bg-white rounded-md shadow-xl border border-gray-300 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-300">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-6 h-6 bg-red-50 rounded-md border border-red-200"><MapPin className="w-3 h-3 text-red-600" /></div>
            <h2 className="text-base font-semibold text-gray-800">{editingAddress ? "Edit Address" : "Add Address"}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-3">
              <div><label className="block mb-1.5 text-sm font-medium text-gray-700">Full Name *</label><input type="text" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} className={`w-full px-3 py-2 text-sm border rounded-lg ${errors.fullName ? "border-red-500 bg-red-50" : "border-gray-300"}`} /></div>
              <div><label className="block mb-1.5 text-sm font-medium text-gray-700">Email *</label><div className="flex"><span className="inline-flex items-center px-3 py-2 text-sm border border-r-0 rounded-l-lg bg-gray-50"><Mail className="w-4 h-4" /></span><input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 text-sm border rounded-r-lg" /></div></div>
              <div><label className="block mb-1.5 text-sm font-medium text-gray-700">Phone *</label><div className="flex"><span className="inline-flex items-center px-3 py-2 text-sm border border-r-0 rounded-l-lg bg-gray-50">+91</span><input type="tel" value={formData.phoneNumber} onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value.replace(/\D/g, "").slice(0, 10) })} className="w-full px-3 py-2 text-sm border rounded-r-lg" placeholder="10-digit mobile" /></div></div>
            </div>

            <div><label className="block mb-1.5 text-sm font-medium text-gray-700">Address Type</label><div className="grid grid-cols-3 gap-2">{addressTypes.map(type => (<button key={type.value} type="button" onClick={() => setFormData({ ...formData, addressType: type.value })} className={`p-2 border rounded-lg text-xs ${formData.addressType === type.value ? "border-red-500 bg-red-50 text-red-700" : "border-gray-300"}`}>{type.label}</button>))}</div></div>

            <div className="space-y-3"><input type="text" value={formData.addressLine1} onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })} className="w-full px-3 py-2 text-sm border rounded-lg" placeholder="Address Line 1 *" /><input type="text" value={formData.addressLine2} onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })} className="w-full px-3 py-2 text-sm border rounded-lg" placeholder="Address Line 2 (Optional)" /></div>

            <div className="grid gap-3 grid-cols-2"><input type="text" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} placeholder="City *" className="px-3 py-2 text-sm border rounded-lg" /><input type="text" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} placeholder="State *" className="px-3 py-2 text-sm border rounded-lg" /><div className="col-span-2"><input type="text" value={formData.pinCode} onChange={(e) => setFormData({ ...formData, pinCode: e.target.value.replace(/\D/g, "").slice(0, 6) })} placeholder="PIN Code *" className="w-full px-3 py-2 text-sm border rounded-lg" /></div></div>

            <input type="text" value={formData.landmark} onChange={(e) => setFormData({ ...formData, landmark: e.target.value })} className="w-full px-3 py-2 text-sm border rounded-lg" placeholder="Landmark (Optional)" />

            <div className="flex items-center justify-between p-3 border rounded-lg"><div><p className="text-sm font-medium">Set as default</p><p className="text-xs text-gray-500">Selected by default</p></div><button type="button" onClick={() => setFormData({ ...formData, isDefault: !formData.isDefault })} className={`relative inline-flex h-5 w-9 rounded-full ${formData.isDefault ? "bg-red-600" : "bg-gray-300"}`}><span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${formData.isDefault ? "translate-x-5" : "translate-x-1"}`} /></button></div>

            <div className="flex gap-3"><button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-lg">Cancel</button><button type="submit" className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-red-600 border border-red-600 rounded-lg">Save</button></div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

// ========== Address List Component ==========
export const AddressList = ({ addresses, selectedAddress, onSelectAddress, onEditAddress, onDeleteAddress, onSetDefault, onAddNew }) => {
  if (addresses.length === 0) {
    return (<div className="text-center py-8"><MapPin className="w-12 h-12 mx-auto mb-4 text-gray-300" /><h3 className="mb-2 text-lg font-medium text-gray-900">No addresses saved</h3><button onClick={onAddNew} className="px-6 py-3 text-sm font-semibold text-white bg-red-600 rounded-xl">Add Your First Address</button></div>);
  }
  return (<div className="space-y-3">{addresses.map((address) => (<div key={address.id} className={`p-4 border rounded-xl cursor-pointer transition-all ${selectedAddress?.id === address.id ? "border-red-500 bg-red-50 ring-2 ring-red-500" : "border-gray-200"}`} onClick={() => onSelectAddress(address)}><div className="flex items-start justify-between"><div className="flex-1"><div className="flex items-center mb-2"><span className="mr-2 text-lg">{address.addressType === 'home' ? '🏠' : address.addressType === 'work' ? '💼' : '📦'}</span><span className="text-sm font-medium">{address.addressType}{address.isDefault && <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full">Default</span>}</span></div><div className="space-y-1 text-sm text-gray-600"><p className="font-medium">{address.fullName}</p><p>{address.email}</p><p>+91 {address.phoneNumber}</p><p>{address.addressLine1}</p>{address.addressLine2 && <p>{address.addressLine2}</p>}<p>{address.city}, {address.state} - {address.pinCode}</p></div></div><div className="flex items-center space-x-1">{!address.isDefault && <button onClick={(e) => { e.stopPropagation(); onSetDefault(address.id); }} className="p-2 text-gray-400 hover:text-green-600"><Check className="w-4 h-4" /></button>}<button onClick={(e) => { e.stopPropagation(); onEditAddress(address); }} className="p-2 text-gray-400 hover:text-blue-600"><Edit className="w-4 h-4" /></button>{addresses.length > 1 && <button onClick={(e) => { e.stopPropagation(); if (confirm("Delete this address?")) onDeleteAddress(address.id); }} className="p-2 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>}</div></div></div>))}<button onClick={onAddNew} className="flex items-center justify-center w-full p-4 border-2 border-dashed rounded-xl hover:border-red-500 hover:bg-red-50"><Plus className="w-5 h-5 mr-2 text-gray-400 group-hover:text-red-500" /><span className="text-sm font-medium text-gray-600">Add New Address</span></button></div>);
};
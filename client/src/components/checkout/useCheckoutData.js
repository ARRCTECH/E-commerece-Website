import { useState, useEffect, useCallback } from "react";

export const useCheckoutData = (location, user) => {
  // Buy Now Flow
  const [isBuyNow, setIsBuyNow] = useState(false);
  const [isBulkBuyNow, setIsBulkBuyNow] = useState(false);
  const [buyNowProduct, setBuyNowProduct] = useState(null);

  // Address Management
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddressPopup, setShowAddressPopup] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  // UI States
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCongratulationsPopup, setShowCongratulationsPopup] = useState(false);
  const [congratulationsData, setCongratulationsData] = useState({ couponCode: "", savingsAmount: 0 });
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [showExitWarningS, setShowExitWarningS] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [showCouponInput, setShowCouponInput] = useState(false);
  const [coupons, setCoupons] = useState([]);

  // ========== Buy Now Flow ==========
  useEffect(() => {
    const savedBuyNowData = localStorage.getItem('buyNowProduct');
    const savedIsBulk = localStorage.getItem('isBulkBuyNow');
    
    if (location.state?.buyNow) {
      setIsBuyNow(true);
      setIsBulkBuyNow(location.state?.isBulkProduct || false);
      setBuyNowProduct(location.state.buyNowProduct);
      localStorage.setItem('buyNowProduct', JSON.stringify(location.state.buyNowProduct));
      localStorage.setItem('isBuyNow', 'true');
      if (location.state?.isBulkProduct) localStorage.setItem('isBulkBuyNow', 'true');
    } else if (savedBuyNowData) {
      setIsBuyNow(true);
      setIsBulkBuyNow(savedIsBulk === 'true');
      setBuyNowProduct(JSON.parse(savedBuyNowData));
    }
  }, [location.state]);

  const clearBuyNowData = useCallback(() => {
    localStorage.removeItem('buyNowProduct');
    localStorage.removeItem('isBuyNow');
    localStorage.removeItem('isBulkBuyNow');
  }, []);

  // ========== Address Management ==========
  useEffect(() => {
    const savedAddresses = localStorage.getItem('userAddresses');
    if (savedAddresses) {
      try {
        const parsed = JSON.parse(savedAddresses);
        setAddresses(parsed);
        const defaultAddr = parsed.find(addr => addr.isDefault) || parsed[0];
        if (defaultAddr) setSelectedAddress(defaultAddr);
      } catch (error) { console.error('Error loading addresses:', error); }
    }
  }, []);

  useEffect(() => {
    if (addresses.length > 0) localStorage.setItem('userAddresses', JSON.stringify(addresses));
  }, [addresses]);

  const addAddress = useCallback((addressData) => {
    const newAddress = { id: `addr_${Date.now()}`, ...addressData, isDefault: addresses.length === 0, createdAt: new Date().toISOString() };
    setAddresses(prev => [...prev, newAddress]);
    if (addresses.length === 0 || addressData.isDefault) setSelectedAddress(newAddress);
  }, [addresses.length]);

  const updateAddress = useCallback((addressId, addressData) => {
    setAddresses(prev => prev.map(addr => addr.id === addressId ? { ...addr, ...addressData, updatedAt: new Date().toISOString() } : addr));
    if (selectedAddress?.id === addressId) setSelectedAddress(prev => ({ ...prev, ...addressData }));
  }, [selectedAddress]);

  const deleteAddress = useCallback((addressId) => {
    setAddresses(prev => {
      const filtered = prev.filter(addr => addr.id !== addressId);
      if (selectedAddress?.id === addressId && filtered.length > 0) {
        setSelectedAddress(filtered.find(addr => addr.isDefault) || filtered[0]);
      }
      return filtered;
    });
  }, [selectedAddress]);

  const setDefaultAddress = useCallback((addressId) => {
    setAddresses(prev => prev.map(addr => ({ ...addr, isDefault: addr.id === addressId })));
    const newDefault = addresses.find(addr => addr.id === addressId);
    if (newDefault) setSelectedAddress(newDefault);
  }, [addresses]);

  const startEditing = useCallback((address) => { setEditingAddress(address); setShowAddressPopup(true); }, []);
  const startAdding = useCallback(() => { setEditingAddress(null); setShowAddressPopup(true); }, []);
  const cancelEditing = useCallback(() => { setEditingAddress(null); setShowAddressPopup(false); }, []);

  const handleSaveAddress = useCallback((addressData) => {
    if (editingAddress) updateAddress(editingAddress.id, addressData);
    else addAddress(addressData);
    cancelEditing();
  }, [editingAddress, updateAddress, addAddress, cancelEditing]);

  // ========== Coupon ==========
  const filterYCoupon = coupons.filter(c => c.isFreeCoupon !== "N");
  const filterNCoupon = coupons.filter(c => c.isFreeCoupon !== "Y");

  return {
    // Buy Now
    isBuyNow, isBulkBuyNow, buyNowProduct, clearBuyNowData,
    // Address
    addresses, selectedAddress, setSelectedAddress, showAddressPopup, editingAddress,
    deleteAddress, setDefaultAddress, startEditing, startAdding, cancelEditing, handleSaveAddress,
    // UI States
    showPaymentModal, setShowPaymentModal, showCongratulationsPopup, setShowCongratulationsPopup,
    congratulationsData, setCongratulationsData, showExitWarning, setShowExitWarning,
    showExitWarningS, setShowExitWarningS, couponCode, setCouponCode, showCouponInput, setShowCouponInput,
    coupons, setCoupons, filterYCoupon, filterNCoupon
  };
};
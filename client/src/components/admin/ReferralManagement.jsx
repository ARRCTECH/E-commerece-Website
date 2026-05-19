import { useState, useEffect } from 'react';
import axios from 'axios';

const ReferralManagement = () => {
  const [referralEntries, setReferralEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const API_URL = import.meta.env?.VITE_API_URL || process.env.VITE_API_URL || '';

  const getAuthConfig = () => {
    const token = localStorage.getItem('authToken');
    return {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    };
  };

  const fetchAllUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/admin/users`, getAuthConfig());
      const data = response.data;
      if (!data.success) throw new Error('API returned unsuccessful');
      const users = data.users || [];
      const entries = [];

      users.forEach((user) => {
        const referredTo = user.referredTo || {};
        const keys = Object.keys(referredTo);
        let counter = 0;
        Object.entries(referredTo).forEach(([referredUserId, referralDetail]) => {
          entries.push({
            referrerId: user._id,
            referrerName: user.name || 'Unknown',
            referrerEmail: user.email || 'No email',
            referrerCode: user.myreferralCode || '',
            referralId: keys[counter++],
            referredUserId: referredUserId,
            referredName: referralDetail.name || 'Unknown User',
            amount: referralDetail.amount || 0,
            type: referralDetail.type || 'fixed',
            referredAt: referralDetail.referredAt,
            expiryDate: referralDetail.expiryDate,
            creditStatus: referralDetail.creditStatus || false,
            firstOrderStatus: referralDetail.firstOrderStatus || false,
          });
        });
      });
      setReferralEntries(entries);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const updateReferral = async (userId, referralId, newAmount, newType) => {
    try {
      await axios.put(
        `${API_URL}/admin/users/referral/update`,
        { userId, referralId, newAmount, newType },
        getAuthConfig()
      );
      await fetchAllUsers();
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      alert(`Error updating referral: ${errorMsg}`);
    }
  };

  const deleteReferral = async (userId, referralId) => {
    if (!window.confirm('⚠️ Permanently delete this referral?')) return;
    try {
      await axios.post(
        `${API_URL}/admin/users/referral/delete`,
        { userId, referralId },
        getAuthConfig()
      );
      await fetchAllUsers();
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      alert(`Error deleting referral: ${errorMsg}`);
    }
  };

  const openEditModal = (entry) => {
    setEditingEntry({
      userId: entry.referrerId,
      referralId: entry.referralId,
      currentAmount: entry.amount,
      currentType: entry.type,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingEntry(null);
  };

  const handleUpdateSubmit = (e) => {
    e.preventDefault();
    const newAmount = parseFloat(e.target.amount.value);
    const newType = e.target.type.value;
    if (isNaN(newAmount) || newAmount <= 0) {
      alert('Amount must be a positive number');
      return;
    }
    updateReferral(editingEntry.userId, editingEntry.referralId, newAmount, newType);
    closeModal();
  };

  useEffect(() => {
    fetchAllUsers();
  }, []);

  const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const creditedCount = referralEntries.filter((entry) => entry.creditStatus === true).length;
  const totalReferrals = referralEntries.length;
  const pendingCount = totalReferrals - creditedCount;

  // Professional styles (modern, clean, with interactive elements)
  const styles = `
    .ref-dashboard {
      background: linear-gradient(145deg, #f8fafc 0%, #f1f5f9 100%);
      font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 2rem 1.5rem;
      min-height: 100vh;
    }
    .ref-container {
      max-width: 1440px;
      margin: 0 auto;
    }
    .ref-header {
      margin-bottom: 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .ref-title-section h1 {
      font-size: 1.875rem;
      font-weight: 700;
      background: linear-gradient(135deg, #1e293b, #0f172a);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      letter-spacing: -0.02em;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin: 0 0 0.25rem 0;
    }
    .ref-subtitle {
      color: #475569;
      font-size: 0.875rem;
      margin: 0;
    }
    .refresh-btn {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 40px;
      padding: 0.5rem 1.25rem;
      font-weight: 500;
      color: #1e293b;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }
    .refresh-btn:hover {
      background: #f8fafc;
      border-color: #cbd5e1;
      transform: translateY(-1px);
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.25rem;
      margin-bottom: 2rem;
    }
    .stat-card {
      background: white;
      border-radius: 1.25rem;
      padding: 1.25rem 1.5rem;
      box-shadow: 0 4px 6px -2px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03);
      border: 1px solid #eef2ff;
      transition: transform 0.1s ease, box-shadow 0.2s;
    }
    .stat-card:hover {
      box-shadow: 0 10px 15px -3px rgba(0,0,0,0.08);
    }
    .stat-label {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 600;
      color: #5b6e8c;
      margin-bottom: 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.375rem;
    }
    .stat-number {
      font-size: 2.25rem;
      font-weight: 700;
      color: #0f172a;
      line-height: 1.2;
    }
    .table-wrapper {
      background: white;
      border-radius: 1.5rem;
      box-shadow: 0 8px 20px -6px rgba(0,0,0,0.08);
      border: 1px solid #eef2ff;
      overflow-x: auto;
      margin-bottom: 1.5rem;
    }
    .referral-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
      min-width: 1000px;
    }
    .referral-table th {
      background: #f8fafc;
      color: #1e293b;
      padding: 1rem 1rem;
      font-weight: 600;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
      font-size: 0.8125rem;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .referral-table td {
      padding: 1rem 1rem;
      border-bottom: 1px solid #f1f5f9;
      color: #334155;
      vertical-align: middle;
    }
    .referral-table tr:hover {
      background-color: #fef9f7;
    }
    .referrer-name {
      font-weight: 600;
      color: #0f172a;
    }
    .referral-code {
      font-size: 0.7rem;
      color: #5b6e8c;
      font-family: monospace;
      background: #f1f5f9;
      display: inline-block;
      padding: 0.125rem 0.375rem;
      border-radius: 20px;
      margin-top: 0.25rem;
    }
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.25rem 0.75rem;
      border-radius: 40px;
      font-size: 0.7rem;
      font-weight: 600;
      width: fit-content;
    }
    .status-credited {
      background: #e6f7ec;
      color: #1e7b3e;
    }
    .status-pending {
      background: #fff3e0;
      color: #c2410c;
    }
    .action-buttons {
      display: flex;
      gap: 0.5rem;
    }
    .edit-btn, .delete-btn {
      background: transparent;
      border: none;
      font-size: 1.1rem;
      cursor: pointer;
      padding: 0.375rem;
      border-radius: 40px;
      transition: all 0.15s ease;
      width: 32px;
      height: 32px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .edit-btn {
      color: #3b82f6;
    }
    .edit-btn:hover {
      background: #eff6ff;
      transform: scale(1.05);
    }
    .delete-btn {
      color: #ef4444;
    }
    .delete-btn:hover {
      background: #fef2f2;
      transform: scale(1.05);
    }
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(15, 23, 42, 0.7);
      backdrop-filter: blur(6px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.2s ease;
    }
    .modal-container {
      background: white;
      border-radius: 2rem;
      max-width: 460px;
      width: 90%;
      padding: 1.75rem;
      box-shadow: 0 25px 40px -12px rgba(0,0,0,0.35);
      animation: slideUp 0.2s ease;
    }
    .modal-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .form-input, .form-select {
      width: 100%;
      padding: 0.75rem 1rem;
      margin-bottom: 1rem;
      border-radius: 60px;
      border: 1px solid #e2e8f0;
      background: white;
      font-family: inherit;
      font-size: 0.875rem;
      transition: border 0.2s;
    }
    .form-input:focus, .form-select:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
    }
    .modal-buttons {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 0.5rem;
    }
    .btn-cancel {
      background: #f1f5f9;
      border: none;
      padding: 0.5rem 1.25rem;
      border-radius: 40px;
      font-weight: 500;
      color: #334155;
      cursor: pointer;
    }
    .btn-save {
      background: #0f172a;
      border: none;
      padding: 0.5rem 1.5rem;
      border-radius: 40px;
      font-weight: 500;
      color: white;
      cursor: pointer;
    }
    .loading-spinner {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 3rem;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e2e8f0;
      border-top-color: #0f172a;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    .error-card {
      background: white;
      border-radius: 1.5rem;
      padding: 2rem;
      text-align: center;
      color: #b91c1c;
      border: 1px solid #fee2e2;
    }
    .footer-note {
      text-align: center;
      font-size: 0.7rem;
      color: #94a3b8;
      margin-top: 1.5rem;
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slideUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    @media (max-width: 640px) {
      .ref-dashboard { padding: 1rem; }
      .stat-number { font-size: 1.75rem; }
    }
  `;

  if (loading) {
    return (
      <>
        <style>{styles}</style>
        <div className="ref-dashboard">
          <div className="ref-container">
            <div className="loading-spinner">
              <div className="spinner"></div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <style>{styles}</style>
        <div className="ref-dashboard">
          <div className="ref-container">
            <div className="error-card">
              <span style={{ fontSize: '2rem', display: 'block' }}>⚠️</span>
              <p style={{ marginTop: '0.5rem' }}>Error: {error}</p>
              <p style={{ fontSize: '0.8rem', color: '#5b6e8c' }}>Please check your backend connection.</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="ref-dashboard">
        <div className="ref-container">
          <div className="ref-header">
            <div className="ref-title-section">
              <h1>
                <span>📈</span> Referral Management
              </h1>
              <p className="ref-subtitle">Complete network · Individual referral entries</p>
            </div>
            <button onClick={fetchAllUsers} className="refresh-btn">
              🔄 Refresh data
            </button>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">
                <span>📊</span> Total Referrals
              </div>
              <div className="stat-number">{totalReferrals}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">
                <span>✅</span> Credited
              </div>
              <div className="stat-number">{creditedCount}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">
                <span>⏳</span> Pending
              </div>
              <div className="stat-number">{pendingCount}</div>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="referral-table">
              <thead>
                <tr>
                  <th>Referrer</th>
                  <th>Referred User</th>
                  <th>Amount</th>
                  <th>Type</th>
                  <th>Referral Date</th>
                  <th>Expiry</th>
                  <th>Credit Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {referralEntries.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                      ✨ No referral entries found ✨
                    </td>
                  </tr>
                ) : (
                  referralEntries.map((entry, idx) => (
                    <tr key={`${entry.referrerId}_${entry.referralId}_${idx}`}>
                      <td>
                        <div className="referrer-name">{entry.referrerName}</div>
                        <div className="referral-code">{entry.referrerCode}</div>
                        <div style={{ fontSize: '0.7rem', color: '#5b6e8c' }}>{entry.referrerEmail}</div>
                      </td>
                      <td>
                        <strong>{entry.referredName}</strong>
                      </td>
                      <td>
                        ${entry.amount.toFixed(2)}
                        {entry.type === 'percentage' && (
                          <span style={{ fontSize: '0.7rem', marginLeft: '0.25rem', color: '#5b6e8c' }}>({entry.amount}%)</span>
                        )}
                      </td>
                      <td>{entry.type === 'percentage' ? '% Commission' : 'Fixed'}</td>
                      <td>{formatDate(entry.referredAt)}</td>
                      <td>{formatDate(entry.expiryDate)}</td>
                      <td>
                        <span className={`status-badge ${entry.creditStatus ? 'status-credited' : 'status-pending'}`}>
                          {entry.creditStatus ? '✓ Credited' : '⏳ Pending'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button onClick={() => openEditModal(entry)} className="edit-btn" title="Edit amount / type">
                            ✏️
                          </button>
                          <button onClick={() => deleteReferral(entry.referrerId, entry.referralId)} className="delete-btn" title="Delete referral">
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="footer-note">
            🔥 Manage referral amounts & types | Updates reflect immediately
          </div>
        </div>

        {modalOpen && editingEntry && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
              <div className="modal-title">
                <span>✏️</span> Update Referral
              </div>
              <form onSubmit={handleUpdateSubmit}>
                <input
                  type="number"
                  name="amount"
                  step="0.01"
                  defaultValue={editingEntry.currentAmount}
                  className="form-input"
                  required
                  placeholder="Enter amount"
                />
                <select name="type" defaultValue={editingEntry.currentType} className="form-select">
                  <option value="fixed">Fixed amount</option>
                  <option value="percentage">Percentage (%)</option>
                </select>
                <div className="modal-buttons">
                  <button type="button" onClick={closeModal} className="btn-cancel">
                    Cancel
                  </button>
                  <button type="submit" className="btn-save">
                    Update Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ReferralManagement;
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
      const response = await axios.get(`${API_URL}/auth/getallprofile`, getAuthConfig());
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

  // ----------------------------------------------
  // Fully responsive styles (mobile-first)
  // ----------------------------------------------
  const styles = `
    /* Base & reset */
    .ref-dashboard * {
      box-sizing: border-box;
    }
    .ref-dashboard {
      background: linear-gradient(145deg, #f8fafc 0%, #f1f5f9 100%);
      font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 1rem;
      min-height: 100vh;
    }
    @media (min-width: 640px) {
      .ref-dashboard {
        padding: 2rem 1.5rem;
      }
    }
    .ref-container {
      max-width: 1440px;
      margin: 0 auto;
    }
    .ref-header {
      margin-bottom: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    @media (min-width: 640px) {
      .ref-header {
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
      }
    }
    .ref-title-section h1 {
      font-size: 1.5rem;
      font-weight: 700;
      background: linear-gradient(135deg, #1e293b, #0f172a);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0 0 0.25rem 0;
    }
    @media (min-width: 640px) {
      .ref-title-section h1 {
        font-size: 1.875rem;
      }
    }
    .ref-subtitle {
      color: #475569;
      font-size: 0.8rem;
    }
    .refresh-btn {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 40px;
      padding: 0.6rem 1rem;
      font-weight: 500;
      color: #1e293b;
      cursor: pointer;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      width: 100%;
    }
    @media (min-width: 640px) {
      .refresh-btn {
        width: auto;
        padding: 0.5rem 1.25rem;
      }
    }
    .refresh-btn:hover {
      background: #f8fafc;
      border-color: #cbd5e1;
    }
    /* Stats grid */
    .stats-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1rem;
      margin-bottom: 2rem;
    }
    @media (min-width: 480px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    @media (min-width: 768px) {
      .stats-grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }
    .stat-card {
      background: white;
      border-radius: 1.25rem;
      padding: 1rem 1.25rem;
      box-shadow: 0 4px 6px -2px rgba(0,0,0,0.05);
      border: 1px solid #eef2ff;
    }
    .stat-label {
      font-size: 0.7rem;
      text-transform: uppercase;
      font-weight: 600;
      color: #5b6e8c;
      display: flex;
      align-items: center;
      gap: 0.375rem;
      margin-bottom: 0.5rem;
    }
    .stat-number {
      font-size: 1.8rem;
      font-weight: 700;
      color: #0f172a;
      line-height: 1.2;
    }
    @media (min-width: 640px) {
      .stat-number {
        font-size: 2.25rem;
      }
    }
    /* Responsive table → cards on mobile */
    .table-wrapper {
      background: white;
      border-radius: 1.5rem;
      box-shadow: 0 8px 20px -6px rgba(0,0,0,0.08);
      border: 1px solid #eef2ff;
      overflow: hidden;
    }
    .referral-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }
    /* Hide thead on small screens */
    @media (max-width: 767px) {
      .referral-table thead {
        display: none;
      }
      .referral-table,
      .referral-table tbody,
      .referral-table tr,
      .referral-table td {
        display: block;
        width: 100%;
      }
      .referral-table tr {
        margin-bottom: 1rem;
        border: 1px solid #eef2ff;
        border-radius: 1rem;
        background: white;
        padding: 0.75rem;
      }
      .referral-table td {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.6rem 0.5rem;
        border-bottom: 1px solid #f1f5f9;
        text-align: right;
      }
      .referral-table td:last-child {
        border-bottom: none;
      }
      .referral-table td::before {
        content: attr(data-label);
        font-weight: 600;
        color: #1e293b;
        text-align: left;
        flex: 1;
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.03em;
      }
      .action-buttons {
        justify-content: flex-end;
      }
    }
    @media (min-width: 768px) {
      .referral-table th {
        background: #f8fafc;
        color: #1e293b;
        padding: 1rem;
        font-weight: 600;
        text-align: left;
        border-bottom: 1px solid #e2e8f0;
        font-size: 0.8125rem;
      }
      .referral-table td {
        padding: 1rem;
        border-bottom: 1px solid #f1f5f9;
        color: #334155;
      }
      .referral-table tr:hover {
        background-color: #fef9f7;
      }
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
      gap: 0.75rem;
    }
    .edit-btn, .delete-btn {
      background: transparent;
      border: none;
      font-size: 1.2rem;
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 40px;
      transition: all 0.15s ease;
      min-width: 44px;
      min-height: 44px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    @media (min-width: 768px) {
      .edit-btn, .delete-btn {
        min-width: 32px;
        min-height: 32px;
        font-size: 1.1rem;
        padding: 0.375rem;
      }
    }
    .edit-btn { color: #3b82f6; }
    .edit-btn:hover { background: #eff6ff; }
    .delete-btn { color: #ef4444; }
    .delete-btn:hover { background: #fef2f2; }
    /* Modal */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(15, 23, 42, 0.8);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }
    .modal-container {
      background: white;
      border-radius: 1.5rem;
      max-width: 460px;
      width: 100%;
      padding: 1.5rem;
      box-shadow: 0 25px 40px -12px rgba(0,0,0,0.35);
    }
    .modal-title {
      font-size: 1.4rem;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 1.2rem;
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
      font-size: 1rem;
    }
    .modal-buttons {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1rem;
      flex-wrap: wrap;
    }
    .btn-cancel, .btn-save {
      padding: 0.6rem 1.2rem;
      border-radius: 40px;
      font-weight: 500;
      cursor: pointer;
      border: none;
      font-size: 0.9rem;
    }
    .btn-cancel { background: #f1f5f9; color: #334155; }
    .btn-save { background: #0f172a; color: white; }
    .loading-spinner {
      display: flex;
      justify-content: center;
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
    @keyframes spin { to { transform: rotate(360deg); } }
    .error-card {
      background: white;
      border-radius: 1.5rem;
      padding: 2rem;
      text-align: center;
      color: #b91c1c;
    }
    .footer-note {
      text-align: center;
      font-size: 0.7rem;
      color: #94a3b8;
      margin-top: 1.5rem;
    }
  `;

  if (loading) {
    return (
      <>
        <style>{styles}</style>
        <div className="ref-dashboard">
          <div className="loading-spinner"><div className="spinner" /></div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <style>{styles}</style>
        <div className="ref-dashboard">
          <div className="error-card">
            <div style={{ fontSize: '2rem' }}>⚠️</div>
            <p>Error: {error}</p>
            <p style={{ fontSize: '0.8rem' }}>Please check your backend connection.</p>
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
              <h1><span>📈</span> Referral Management</h1>
              <p className="ref-subtitle">Complete network · Individual referral entries</p>
            </div>
            <button onClick={fetchAllUsers} className="refresh-btn">🔄 Refresh data</button>
          </div>

          <div className="stats-grid">
            <div className="stat-card"><div className="stat-label">📊 Total Referrals</div><div className="stat-number">{totalReferrals}</div></div>
            <div className="stat-card"><div className="stat-label">✅ Credited</div><div className="stat-number">{creditedCount}</div></div>
            <div className="stat-card"><div className="stat-label">⏳ Pending</div><div className="stat-number">{pendingCount}</div></div>
          </div>

          <div className="table-wrapper">
            <table className="referral-table">
              <thead>
                <tr><th>Referrer</th><th>Referred User</th><th>Amount</th><th>Type</th><th>Referral Date</th><th>Expiry</th><th>Credit Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {referralEntries.length === 0 ? (
                  <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>✨ No referral entries found ✨</td></tr>
                ) : (
                  referralEntries.map((entry, idx) => (
                    <tr key={`${entry.referrerId}_${entry.referralId}_${idx}`}>
                      <td data-label="Referrer">
                        <div><strong className="referrer-name">{entry.referrerName}</strong></div>
                        <div className="referral-code">{entry.referrerCode}</div>
                        <div style={{ fontSize: '0.7rem', color: '#5b6e8c' }}>{entry.referrerEmail}</div>
                      </td>
                      <td data-label="Referred User"><strong>{entry.referredName}</strong></td>
                      <td data-label="Amount">
                        {entry.type === 'fixed' && <span style={{ fontSize: '0.8rem', marginLeft: '0.35rem' }}>₹{entry.amount.toFixed(2)}</span>}
                        {entry.type === 'percentage' && <span style={{ fontSize: '0.8rem', marginLeft: '0.35rem' }}>{entry.amount}%</span>}
                      </td>
                      <td data-label="Type">{entry.type === 'percentage' ? '% Commission' : 'Fixed'}</td>
                      <td data-label="Referral Date">{formatDate(entry.referredAt)}</td>
                      <td data-label="Expiry">{formatDate(entry.expiryDate)}</td>
                      <td data-label="Credit Status">
                        <span className={`status-badge ${entry.creditStatus ? 'status-credited' : 'status-pending'}`}>
                          {entry.creditStatus ? '✓ Credited' : '⏳ Pending'}
                        </span>
                      </td>
                      <td data-label="Actions">
                        <div className="action-buttons">
                          <button onClick={() => openEditModal(entry)} className="edit-btn" title="Edit">✏️</button>
                          <button onClick={() => deleteReferral(entry.referrerId, entry.referralId)} className="delete-btn" title="Delete">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="footer-note">🔥 Manage referral amounts & types | Updates reflect immediately</div>
        </div>

        {modalOpen && editingEntry && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
              <div className="modal-title"><span>✏️</span> Update Referral</div>
              <form onSubmit={handleUpdateSubmit}>
                <input type="number" name="amount" step="0.01" defaultValue={editingEntry.currentAmount} className="form-input" required placeholder="Enter amount" />
                <select name="type" defaultValue={editingEntry.currentType} className="form-select">
                  <option value="fixed">Fixed amount</option>
                  <option value="percentage">Percentage (%)</option>
                </select>
                <div className="modal-buttons">
                  <button type="button" onClick={closeModal} className="btn-cancel">Cancel</button>
                  <button type="submit" className="btn-save">Update Changes</button>
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
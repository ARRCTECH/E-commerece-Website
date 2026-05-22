// src/components/ReasonsDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import axios from 'axios';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const ReasonsDashboard = () => {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  const [cancelChartData, setCancelChartData] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(true);
  const [cancelError, setCancelError] = useState(null);

  const [returnChartData, setReturnChartData] = useState(null);
  const [returnLoading, setReturnLoading] = useState(true);
  const [returnError, setReturnError] = useState(null);

  const predefinedReasons = [
    "Wrong product received",
    "Product damaged / defective",
    "Size / fit issue",
    "Changed my mind",
    "Late delivery"
  ];

  // Safely extract array from Axios response
  const extractArray = (response) => {
    // Log for debugging
    console.log("API Response:", response.data);
    
    // If response.data is an array
    if (Array.isArray(response.data)) return response.data;
    // If response.data has a 'data' property that is an array
    if (response.data && Array.isArray(response.data.data)) return response.data.data;
    // If response.data has a 'records' property
    if (response.data && Array.isArray(response.data.records)) return response.data.records;
    // If response.data has a 'results' property
    if (response.data && Array.isArray(response.data.results)) return response.data.results;
    // If response.data has a 'cancellations' or 'returns' array
    if (response.data && Array.isArray(response.data.cancellations)) return response.data.cancellations;
    if (response.data && Array.isArray(response.data.returns)) return response.data.returns;
    // If response itself is an array (unlikely)
    if (Array.isArray(response)) return response;
    // Otherwise return empty array
    console.warn("Unexpected response structure:", response.data);
    return [];
  };

  // Aggregate cancellation reasons: count occurrences of each reason string
  const aggregateCancellationReasons = (records) => {
    // If records already have aggregated counts (e.g., { reason: "...", cancellation: 5 })
    if (records.length > 0 && records[0].cancellation !== undefined) {
      const labels = records.map(r => r.reason);
      const data = records.map(r => r.cancellation);
      return { labels, data };
    }
    
    // Otherwise assume each record is a single cancellation with a 'reason' field
    const counts = {};
    records.forEach(record => {
      const reason = (record.reason || "").trim();
      if (reason) {
        counts[reason] = (counts[reason] || 0) + 1;
      }
    });
    const labels = Object.keys(counts);
    const data = labels.map(l => counts[l]);
    return { labels, data };
  };

  // Fetch Cancellation Data
  useEffect(() => {
    const fetchCancellations = async () => {
      try {
        const response = await axios.get(`${API_URL}/reason/cancellation`);
        const records = extractArray(response);
        const { labels, data } = aggregateCancellationReasons(records);
        
        setCancelChartData({
          labels,
          datasets: [{
            label: 'Number of Cancellations',
            data,
            backgroundColor: 'rgba(255, 99, 132, 0.7)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1,
          }]
        });
      } catch (err) {
        console.error("Cancellation fetch error:", err);
        setCancelError(err.message);
      } finally {
        setCancelLoading(false);
      }
    };
    fetchCancellations();
  }, [API_URL]);

  // Fetch Return Data
  useEffect(() => {
    const fetchReturns = async () => {
      try {
        const response = await axios.get(`${API_URL}/return/returnvaluesave`);
        const records = extractArray(response);
        
        // Count predefined reasons + Other
        const counts = {};
        predefinedReasons.forEach(r => counts[r] = 0);
        let otherCount = 0;
        
        records.forEach(record => {
          const reason = (record.reason || "").trim();
          if (predefinedReasons.includes(reason)) {
            counts[reason]++;
          } else if (reason !== "") {
            otherCount++;
          }
        });
        
        const labels = [...predefinedReasons];
        const data = labels.map(l => counts[l]);
        if (otherCount > 0) {
          labels.push("Other");
          data.push(otherCount);
        }
        
        setReturnChartData({
          labels,
          datasets: [{
            label: 'Number of Returns',
            data,
            backgroundColor: 'rgba(54, 162, 235, 0.7)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
          }]
        });
      } catch (err) {
        console.error("Return fetch error:", err);
        setReturnError(err.message);
      } finally {
        setReturnLoading(false);
      }
    };
    fetchReturns();
  }, [API_URL]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.raw}` } }
    },
    scales: {
      y: {
        beginAtZero: true,
        stepSize: 1,
        title: { display: true, text: 'Count' }
      },
      x: {
        ticks: { maxRotation: 45, minRotation: 45 }
      }
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
        Reasons Analytics Dashboard
      </h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Cancellation Reasons Chart */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            Cancellation Reasons
          </h2>
          {cancelLoading ? (
            <div className="h-80 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
              <span className="ml-2 text-gray-600">Loading...</span>
            </div>
          ) : cancelError ? (
            <div className="h-80 flex items-center justify-center text-red-600">
              Error: {cancelError}
            </div>
          ) : cancelChartData && cancelChartData.labels.length > 0 ? (
            <div className="h-80">
              <Bar data={cancelChartData} options={chartOptions} />
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">
              No cancellation data available
            </div>
          )}
        </div>

        {/* Return Reasons Chart */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
            Return Reasons
          </h2>
          {returnLoading ? (
            <div className="h-80 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading...</span>
            </div>
          ) : returnError ? (
            <div className="h-80 flex items-center justify-center text-red-600">
              Error: {returnError}
            </div>
          ) : returnChartData && returnChartData.labels.length > 0 ? (
            <div className="h-80">
              <Bar data={returnChartData} options={chartOptions} />
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">
              No return data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReasonsDashboard;
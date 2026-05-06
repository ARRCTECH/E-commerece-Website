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

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const CancellationReasonsChart = () => {
  const [chartData, setChartData] = useState(null);
  const [apiDatafetch, setapiData] = useState([])
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mock data - replace with your actual API call
  const mockData = [
    { reason: "Don't want to share mobile number", cancellation: 45 },
    { reason: "Need to modify cart", cancellation: 32 },
    { reason: "Found better deal", cancellation: 78 },
    { reason: "Changed my mind", cancellation: 56 },
    { reason: "Technical issues", cancellation: 23 },
    { reason: "Shipping costs", cancellation: 67 },
    { reason: "Just browsing", cancellation: 89 },
    { reason: "Others", cancellation: 34 }
  ];

  // Function to fetch data from API
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api"
  const fetchCancellationData = async () => {
    try {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(mockData);
        }, 1000);
      });
    } catch (err) {
      throw new Error('Failed to fetch cancellation data');
    }
  };
  useEffect(() => {
    let isMounted = true; 
    const fetchApiData = async () => {
      try {
        const response = await axios.get(`${API_URL}/reason/cancellation`);
        if (isMounted) {
          setapiData(response?.data || []);
        }
      } catch (err) {
        console.error('API Error:', err);
      }
    };
    fetchApiData();
    return () => {
      isMounted = false; 
    };
  }, []); 
  
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const apiData = await fetchCancellationData();

        const labels = apiData.map(item => item.reason);
        const data = apiData.map(item => item.cancellation);

        setChartData({
          labels: labels,
          datasets: [
            {
              label: 'Number of Cancellations',
              data: data,
              backgroundColor: [
                'rgba(255, 99, 132, 0.7)',
                'rgba(54, 162, 235, 0.7)',
                'rgba(255, 206, 86, 0.7)',
                'rgba(75, 192, 192, 0.7)',
                'rgba(153, 102, 255, 0.7)',
                'rgba(255, 159, 64, 0.7)',
                'rgba(199, 199, 199, 0.7)',
                'rgba(83, 102, 255, 0.7)',
              ],
              borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)',
                'rgba(199, 199, 199, 1)',
                'rgba(83, 102, 255, 1)',
              ],
              borderWidth: 1,
            },
          ],
        });
      } catch (err) {
        setError('Failed to load cancellation data');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#374151',
          font: {
            size: 12
          }
        }
      },
      title: {
        display: true,
        text: 'Cancellation Reasons Analysis',
        color: '#111827',
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
      }
    },
    scales: {
      x: {
        ticks: {
          color: '#6B7280',
          maxRotation: 45,
          minRotation: 45,
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: '#6B7280',
          stepSize: 20,
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        }
      },
    },
  };
  // Calculate metrics for summary cards
  const getHighestReason = () => {
    if (!chartData) return 'N/A';
    const maxValue = Math.max(...chartData.datasets[0].data);
    const maxIndex = chartData.datasets[0].data.indexOf(maxValue);
    return chartData.labels[maxIndex];
  };
  const getLowestReason = () => {
    if (!chartData) return 'N/A';
    const minValue = Math.min(...chartData.datasets[0].data);
    const minIndex = chartData.datasets[0].data.indexOf(minValue);
    return chartData.labels[minIndex];
  };
  const getTotalCancellations = () => {
    if (!chartData) return 0;
    return chartData.datasets[0].data.reduce((a, b) => a + b, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading cancellation data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 bg-red-50 rounded-lg">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Cancellation Reasons Dashboard
        </h2>
        <p className="text-gray-600">
          Analysis of why customers cancel their orders
        </p>
      </div>
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="h-96">
          {chartData && <Bar data={chartData} options={chartOptions} />}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-800 text-sm">Total Reasons</h3>
          <p className="text-2xl font-bold text-blue-600">
            {chartData ? chartData.labels.length : 0}
          </p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <h3 className="font-semibold text-green-800 text-sm">Highest</h3>
          <p className="text-lg font-bold text-green-600 truncate" title={getHighestReason()}>
            {getHighestReason()}
          </p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <h3 className="font-semibold text-red-800 text-sm">Lowest</h3>
          <p className="text-lg font-bold text-red-600 truncate" title={getLowestReason()}>
            {getLowestReason()}
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <h3 className="font-semibold text-purple-800 text-sm">Total Cancellations</h3>
          <p className="text-2xl font-bold text-purple-600">
            {getTotalCancellations()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CancellationReasonsChart;
import { useState, useEffect } from "react";
import axios from "axios";

export const useAnalyticsData = () => {
  const [metricsData, setMetricsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMetricsData = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:8001/api/metrics");
      setMetricsData(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching metrics:", err);
      setError("Failed to fetch metrics data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetricsData();
  }, []);

  return {
    metricsData,
    loading,
    error,
    fetchMetricsData,
  };
}; 
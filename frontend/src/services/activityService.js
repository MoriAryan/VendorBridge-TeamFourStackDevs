import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const activityService = {
  getActivities: async (filters = {}) => {
    try {
      const response = await axios.get(`${API_URL}/activity-logs`, { params: filters });
      return response.data;
    } catch (error) {
      console.error("Error fetching activities", error);
      throw error;
    }
  },

  getRecentActivities: async () => {
    try {
      const response = await axios.get(`${API_URL}/activity-logs/recent`);
      return response.data;
    } catch (error) {
      console.error("Error fetching recent activities", error);
      throw error;
    }
  }
};

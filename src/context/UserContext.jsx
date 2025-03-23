import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";

// Create context
const UserContext = createContext();

// API URL - adjust based on your setup
// const API_URL = "http://127.0.0.1:8000/api";
const API_URL = "http://82.25.109.147:8000/api";

// Provider component
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [coins, setCoins] = useState(0);

  // Check for existing user on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetchUserData(token);
    } else {
      setLoading(false);
    }
  }, []);


  

  // Fetch user data from the token
  // Inside the UserProvider component, modify fetchUserData function to include the role:
const fetchUserData = async (token) => {
  try {
    const decodedToken = parseJwt(token);
    if (decodedToken) {
      setUser({
        id: decodedToken.id,
        username: decodedToken.username,
        email: decodedToken.email,
        avatar: decodedToken.avatar,
        role: decodedToken.role || 'user' // Add role support
      });
      fetchCoins(token);
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
    localStorage.removeItem("token");
  } finally {
    setLoading(false);
  }
};

  // Fetch coins from API
  const fetchCoins = async (token) => {
    try {
      const response = await axios.get(`${API_URL}/coins`, {
        headers: { Authorization: token }
      });
      setCoins(response.data.coins);
    } catch (error) {
      console.error("Error fetching coins:", error);
    }
  };

  // Parse JWT token
  const parseJwt = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64).split('').map(c => {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  };

  // Login function
  // And in loginUser function, modify to handle role:
const loginUser = async (credentials) => {
  try {
    const response = await axios.post(`${API_URL}/login`, credentials);
    const { token, user } = response.data;
    localStorage.setItem("token", token);
    setUser({
      ...user,
      role: user.role || 'user' // Make sure role is set
    });
    fetchCoins(token);
    return { success: true };
  } catch (error) {
    console.error("Login error:", error);
    let errorMessage = "Login gagal. Periksa kembali username/password.";
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    }
    return { success: false, error: errorMessage };
  }
};

// Add this function to check if the current user is an admin
const isAdmin = () => {
  return user && user.role === 'admin';
};

  // Logout function
  const logoutUser = () => {
    localStorage.removeItem("token");
    setUser(null);
    setCoins(0);
  };

  // Update user function
  const updateUser = (updatedUserData) => {
    setUser(prev => ({ ...prev, ...updatedUserData }));
    return { success: true };
  };

  // Change password function
  const changePassword = async (currentPassword, newPassword) => {
    try {
      // Implement password change logic here when backend is ready
      return { success: true };
    } catch (error) {
      console.error("Password change error:", error);
      return { success: false, error: "Failed to change password" };
    }
  };

  // Use a coin function
  const useCoin = async () => {
    if (!user || coins <= 0) return { success: false, message: "Koin tidak cukup!" };
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(`${API_URL}/use-coin`, {}, {
        headers: { Authorization: token }
      });
      setCoins(response.data.coins);
      return { success: true };
    } catch (error) {
      console.error("Error using coin:", error);
      return { success: false, message: error.response?.data?.message || "Gagal menggunakan koin" };
    }
  };

  // Add coins function
  const addCoins = async (amount) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(`${API_URL}/add-coins`, { amount }, {
        headers: { Authorization: token }
      });
      setCoins(response.data.coins);
      return { success: true };
    } catch (error) {
      console.error("Error adding coins:", error);
      return { success: false, message: error.response?.data?.message || "Gagal menambahkan koin" };
    }
  };

  // Add this function to UserProvider component in UserContext.js
  const updateUserProfile = async (formData) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        return { success: false, error: "Anda belum login!" };
      }
  
      // Use FormData-compatible request
      const response = await axios.post(`${API_URL}/update-profile`, formData, {
        headers: { 
          Authorization: token,
          'Content-Type': 'multipart/form-data'  // Important for file uploads
        }
      });
      
      // Update the local state with new user data
      setUser(response.data.user);
      
      // Update stored token with new information
      localStorage.setItem("token", response.data.token);
      
      return { success: true, message: response.data.message };
    } catch (error) {
      console.error("Profile update error:", error);
      let errorMessage = "Gagal memperbarui profil.";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      return { success: false, error: errorMessage };
    }
  };

  // Context value
  const value = {
    user,
    loading,
    coins,
    loginUser,
    logoutUser,
    updateUser,
    changePassword,
    updateUserProfile,
    useCoin,
    addCoins,
    fetchCoins,
    isAdmin // Add this function to the context
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

// Custom hook to use the user context
export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

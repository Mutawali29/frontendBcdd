// App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import React from "react";
import { UserProvider } from "./context/UserContext"; // Import UserProvider
import { ViewProvider } from "./context/ViewContext";
import Login from "./components/Login";
import Register from "./components/Register";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Barcode from "./pages/Barcode";
import FilterImei from "./pages/FilterImei";
import ProfilePage from "./pages/ProfilePage";

import AdminCoinsManagement from "./pages/AdminCoinsManagement";

import PrivateRoutes from "./utils/PrivateRoutes";

const Layout = ({ children }) => {
  return (
    <ViewProvider>
      <div className="flex">
        <Navbar />
        <div className="flex-1 p-6 pt-20 ml-64">{children}</div>
      </div>
    </ViewProvider>
  );
};

function App() {
  return (
    <UserProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Private Routes */}
          <Route element={<PrivateRoutes />}>
            <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
            <Route path="/barcode" element={<Layout><Barcode /></Layout>} />
            <Route path="/filterimei" element={<Layout><FilterImei /></Layout>} />
            <Route path="/profilepage" element={<Layout><ProfilePage /></Layout>} />
            <Route path="/admin/coins" element={<Layout><AdminCoinsManagement /></Layout>} />
          </Route>
        </Routes>
      </Router>
    </UserProvider>
  );
}

export default App;
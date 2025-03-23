import React, { useState, useRef, useEffect } from "react";
import { AiFillHome } from "react-icons/ai";
import { RiBarcodeLine } from "react-icons/ri";
import { FaSearch, FaUserCircle, FaSignOutAlt, FaCog } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { useView } from "../context/ViewContext";

const Navbar = () => {
    const navigate = useNavigate();
    const { user, logoutUser } = useUser(); 
    const { activeView, setActiveView } = useView();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleLogout = () => {
        logoutUser();
        localStorage.removeItem("token");
        navigate("/");
    };

    const handleProfileClick = () => {
        setActiveView("profilepage");
        setDropdownOpen(false);
        navigate("/profilepage");
    };

    if (!user) return null;

    return (
        <>
            {/* Fixed top bar for user profile - using lower z-index */}
            <div className="fixed top-0 left-0 right-0 bg-gray-100 shadow-md h-16 flex items-center justify-end px-6 z-10">
                <div className="relative" ref={dropdownRef}>
                    <div 
                        className="flex items-center space-x-3 cursor-pointer" 
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                    >
                        <div className="flex flex-col items-end">
                            <p className="font-medium text-gray-800">{user.username}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center text-white">
                            {user.avatar ? (
                                <img 
                                    src={user.avatar} 
                                    alt="User avatar" 
                                    className="h-10 w-10 rounded-full object-cover"
                                />
                            ) : (
                                <FaUserCircle className="text-2xl" />
                            )}
                        </div>
                    </div>

                    {/* Dropdown menu - higher z-index to appear above both bars */}
                    {dropdownOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-30">
                            <button 
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                onClick={handleProfileClick}
                            >
                                <div className="flex items-center">
                                    <FaUserCircle className="mr-2" />
                                    Profile
                                </div>
                            </button>
                            <button 
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                onClick={() => {
                                    // Handle settings click
                                    setDropdownOpen(false);
                                }}
                            >
                                <div className="flex items-center">
                                    <FaCog className="mr-2" />
                                    Settings
                                </div>
                            </button>
                            <hr className="my-1" />
                            <button 
                                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                onClick={handleLogout}
                            >
                                <div className="flex items-center">
                                    <FaSignOutAlt className="mr-2" />
                                    Logout
                                </div>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Vertical sidebar with higher z-index to appear in front */}
            <div className="fixed top-0 left-0 h-screen overflow-y-auto z-20">
                <div className="w-64 bg-gray-800 p-6 flex flex-col justify-between h-full">
                    <div>
                        <p className="text-4xl text-white mb-6">B-Code</p>

                        <div className="flex flex-col mt-8">
                            <div 
                                className={`flex items-center space-x-4 cursor-pointer p-4 rounded-lg ${
                                    activeView === "dashboard" ? "bg-gray-700" : "hover:bg-gray-700"
                                }`}
                                onClick={() => {
                                    setActiveView("dashboard");
                                    navigate("/dashboard");
                                }}
                            >
                                <AiFillHome className="text-3xl text-white" />
                                <p className="text-white text-xl font-medium">Dashboard</p>
                            </div>

                            <div 
                                className={`flex items-center space-x-4 cursor-pointer p-4 rounded-lg ${
                                    activeView === "barcode" ? "bg-gray-700" : "hover:bg-gray-700"
                                }`}
                                onClick={() => {
                                    setActiveView("barcode");
                                    navigate("/barcode");
                                }}
                            >
                                <RiBarcodeLine className="text-3xl text-white" />
                                <p className="text-white text-xl font-medium">Barcode</p>
                            </div>

                            <div 
                                className={`flex items-center space-x-4 cursor-pointer p-4 rounded-lg ${
                                    activeView === "filterImei" ? "bg-gray-700" : "hover:bg-gray-700"
                                }`}
                                onClick={() => {
                                    setActiveView("filterImei");
                                    navigate("/filterimei");
                                }}
                            >
                                <FaSearch className="text-3xl text-white" />
                                <p className="text-white text-xl font-medium">Filter IMEI</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Navbar;
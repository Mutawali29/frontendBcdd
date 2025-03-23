import React from "react";
import { RiBarcodeLine } from "react-icons/ri";
import { FaSearch } from "react-icons/fa";
import { Link } from "react-router-dom";
import Barcode from "./Barcode";
import FilterImei from "./FilterImei";
import { useView } from "../context/ViewContext"; 
import { useUser } from "../context/UserContext";

const Dashboard = () => {
    const { activeView, setActiveView } = useView(); 
    const { isAdmin } = useUser();

    if (activeView === "barcode") {
        return <Barcode />;
    }

    if (activeView === "filterImei") {
        return <FilterImei />;
    }

    return (
        <div className="p-6 flex flex-col space-y-6">
            <div className="flex space-x-10">
                {/* Barcode */}
                <div 
                    className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-gray-400 text-gray-400 hover:scale-110 hover:border-black hover:text-black transition-all duration-300 cursor-pointer"
                    onClick={() => setActiveView("barcode")}
                >
                    <RiBarcodeLine className="text-4xl"/>
                    <p className="text-2xl text-center">Barcode</p>
                </div>
                {/* Filter IMEI */}
                <div 
                    className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-gray-400 text-gray-400 hover:scale-110 hover:border-black hover:text-black transition-all duration-300 cursor-pointer"
                    onClick={() => setActiveView("filterImei")}
                >
                    <FaSearch className="text-4xl"/>
                    <p className="text-2xl text-center">Filter IMEI</p>
                </div>
            </div>
            
            {/* Admin Koin Pengguna */}
            {isAdmin() && (
                <Link 
                    to="/admin/coins" 
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-center w-max mx-auto"
                >
                    Admin Koin Pengguna
                </Link>
            )}
        </div>
    );
};

export default Dashboard;
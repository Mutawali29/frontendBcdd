import React, { useState } from "react";

const FilterImei = () => {
    const [imei, setImei] = useState("");
    const [filteredImei, setFilteredImei] = useState("");

    const handleFilter = () => {
        setFilteredImei(imei); 
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(filteredImei);
        window.location.reload(); 
    };

    return (
        <div className="p-6  min-h-screen">
            <div className="bg-white shadow-md rounded-lg p-6 w-full">
                <h1 className="text-2xl font-bold text-gray-800 mb-4">FILTERING IMEI</h1>
                <div className="mb-4">
                    <textarea 
                        className="w-full p-2 border rounded-lg min-h-[150px]"
                        value={imei}
                        onChange={(e) => setImei(e.target.value)}
                        placeholder="Masukkan IMEI di sini..."
                    />
                </div>
                <div className="mb-4">
                    <textarea 
                        className="w-full p-2 border rounded-lg min-h-[150px] bg-gray-200"
                        value={filteredImei}
                        readOnly
                        placeholder="Hasil filtering akan muncul di sini..."
                    />
                </div>
                <div className="flex gap-2">
                    <button 
                        className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition"
                        onClick={handleFilter}
                    >
                        🔍 FILTERING IMEI
                    </button>
                    <button 
                        className="bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-700 transition"
                        onClick={handleCopy}
                    >
                        📋 COPY
                    </button>
                </div>
                <p className="text-sm text-red-500 mt-2">*Jika menekan COPY maka akan otomatis refresh</p>
            </div>
        </div>
    );
};

export default FilterImei;

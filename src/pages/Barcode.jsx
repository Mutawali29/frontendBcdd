import React, { useState, useRef, useEffect } from "react";
import MultipleBarcode from "./Barcode/Multiple";
import Excel from "./Barcode/Excel";
import Barcode from "react-barcode";
import html2canvas from "html2canvas";
import { useUser } from "../context/UserContext";
import { IoIosWifi } from "react-icons/io";
import { IoIosBatteryFull } from "react-icons/io";

import { HiBars3 } from "react-icons/hi2";
import { IoRadioButtonOn } from "react-icons/io5";
import { IoIosArrowBack } from "react-icons/io";

const BarcodeGenerator = () => {
    const { coins, useCoin, fetchCoins } = useUser();
    const languages = ["English", "Indonesia", "Thailand", "Malaysia", "Korea", "China", "Vietnam", "Spain", "France", "Norway"];
    const [language, setLanguage] = useState("English");
    const [imei, setImei] = useState("");
    const [imei2, setImei2] = useState("");
    const [selectedIdentifier, setSelectedIdentifier] = useState(""); // "eid" or "sn"
    const [eid, setEid] = useState("");
    const [sn, setSn] = useState("");
    const [view, setView] = useState("single");
    const [generatedBarcode, setGeneratedBarcode] = useState(false);
    const [displayTheme, setDisplayTheme] = useState("dark");
    const [error, setError] = useState("");
    const [currentTime, setCurrentTime] = useState(new Date());
    
    // Store the current barcode data separately from form inputs
    const [barcodeData, setBarcodeData] = useState({
        imei: "",
        imei2: "",
        eid: "",
        sn: "",
        meid: ""
    });
    
    const barcodeContainerRef = useRef(null);

    // Update time every second
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        
        return () => {
            clearInterval(timer);
        };
    }, []);

    // Clear the other identifier when one is selected
    useEffect(() => {
        if (selectedIdentifier === "eid") {
            setSn("");
        } else if (selectedIdentifier === "sn") {
            setEid("");
        }
    }, [selectedIdentifier]);

    const generateEID = () => {
        // Make sure EID starts with 890490320050088826000 as specified
        const eidPrefix = "890490320050088826000";
        // Generate the remaining random digits (total should be 32)
        const randomSuffix = Array.from({ length: 32 - eidPrefix.length }, () => 
            Math.floor(Math.random() * 10)).join("");
        setEid(eidPrefix + randomSuffix);
        setSelectedIdentifier("eid");
    };

    const generateSN = () => {
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let randomSN = "";
        for (let i = 0; i < 12; i++) {
            randomSN += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        setSn(randomSN);
        setSelectedIdentifier("sn");
    };

    const deriveMEIDFromIMEI = (imeiValue) => {
        // MEID is typically the first 14 digits of the IMEI (excluding the check digit)
        return imeiValue && imeiValue.length >= 14 ? imeiValue.substring(0, 14) : "";
    };

    const downloadBarcode = () => {
        if (!barcodeContainerRef.current) return;
        
        html2canvas(barcodeContainerRef.current).then((canvas) => {
            const link = document.createElement("a");
            link.href = canvas.toDataURL("image/png");
            link.download = `barcode_${barcodeData.imei || "unknown"}_${displayTheme}.png`;
            link.click();
        });
    };

    const handleSubmit = async () => {
        // Reset error state
        setError("");
        
        // Check if user has enough coins
        if (coins <= 0) {
            setError("Koin tidak cukup! Silakan isi koin terlebih dahulu.");
            return;
        }
        
        if (imei.length !== 15 || (imei2 && imei2.length !== 15)) {
            alert("IMEI dan IMEI2 harus 15 digit!");
            return;
        }

        // Check if either EID or SN is selected
        if (!selectedIdentifier) {
            alert("Silakan pilih salah satu antara EID atau SN!");
            return;
        }
        
        // Use a coin
        const result = await useCoin();
        if (!result.success) {
            setError(result.message || "Gagal menggunakan koin!");
            return;
        }
        
        // Calculate MEID from IMEI
        const meidValue = deriveMEIDFromIMEI(imei);
        
        // Save the current form values to barcodeData
        setBarcodeData({
            imei,
            imei2,
            eid: selectedIdentifier === "eid" ? eid : "",
            sn: selectedIdentifier === "sn" ? sn : "",
            meid: meidValue
        });
        
        // Refresh the coins after successful generation
        fetchCoins();
        
        // Set generatedBarcode to true
        setGeneratedBarcode(true);
    };

    // Reset form to generate a new barcode
    const resetForm = () => {
        setGeneratedBarcode(false);
    };

    // Format time to HH:MM
    const formatTime = (date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    };

    // Phone Frame Component for barcode display
    const PhoneFrameDisplay = () => {
        const isDarkMode = displayTheme === "dark";
        const showAndroidFrame = selectedIdentifier === "sn";
        
        // Android frame styling (based on the image) with dark/light mode support
        if (showAndroidFrame) {
            return (
                <div className="max-w-md mx-auto">
                    {/* Android phone frame */}
                    <div className={`${isDarkMode ? 'bg-black' : 'bg-gray-100'} rounded-sm overflow-hidden border-6 p-6 ${isDarkMode ? 'border-black' : 'border-gray-300'} relative shadow-xl`}>
                        
                        {/* Device Info content */}
                        <div className={`${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} mt-40 ${isDarkMode ? 'text-white' : 'text-black'} px-4 pb-4 pt-4 flex flex-col rounded-xl`}>
                            <h1 className="text-2xl font-bold">IMEI(MEID) and S/N</h1>
                            
                            <div className="mb-2 flex flex-col">
                                <p className="text-md mb-1">IMEI1</p>
                                <p className="text-md mb-0">{barcodeData.imei} / 01</p>
                                <div className={`${isDarkMode ? 'bg-black' : 'bg-gray-300'} pt-0 pb-0 flex justify-center mb-0 w-full`}>
                                    <div className="bg-white px-24 w-full">
                                        <Barcode value={barcodeData.imei} format="CODE128" width={1.2} height={55} displayValue={false} />
                                    </div>
                                </div>
                            </div>
                            
                            {barcodeData.imei2 && (
                                <div className="mb-0 flex flex-col">
                                    <p className="text-md mb-1">IMEI2</p>
                                    <p className="text-md mb-0">{barcodeData.imei2} / 01</p>
                                    <div className={`${isDarkMode ? 'bg-black' : 'bg-gray-300'} pt-0 pb-0 flex justify-center mb-4 w-full`}>
                                        <div className="bg-white px-24 w-full">
                                            <div className="">
                                                <Barcode value={barcodeData.imei2} format="CODE128" width={1.2} height={55} displayValue={false} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {barcodeData.sn && (
                                <div className="mb-0 flex flex-col">
                                    <p className="text-md mb-1">SN</p>
                                    <p className="text-md mb-3">{barcodeData.sn}</p>
                                    <div className={`${isDarkMode ? 'bg-black' : 'bg-gray-300'} pt-0 pb-0 flex justify-center mb-4 w-full`}>
                                        <div className="bg-white px-20 w-full">
                                            <Barcode value={barcodeData.sn} format="CODE128" width={1.2} height={55} displayValue={false} />
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {/* OK button */}
                            <div className="mt-0 mb-5 text-center">
                                <p className="text-lg font-bold">OK</p>
                            </div>
                        </div>
                        {/* Android navigation bar */}
                        <div className={`flex justify-center space-x-24 mt-8 text-2xl ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                            <HiBars3 />
                            <IoRadioButtonOn />
                            <IoIosArrowBack />
                        </div>
                    </div>
                </div>
            );
        }
        
        // Original iOS-style frame (for EID option)
        return (
            <div className="max-w-md mx-auto">
                {/* iOS phone frame */}
                <div className={`${isDarkMode ? 'bg-black' : 'bg-white'} rounded-none overflow-hidden border-6 ${isDarkMode ? 'border-black' : 'border-gray-200'} relative shadow-xl`}>
                    {/* Status bar */}
                    <div className={`${isDarkMode ? 'bg-black text-white' : 'bg-white text-black'} py-1 px-4 flex justify-between items-center text-xs`}>
                        <div className="text-lg">{formatTime(currentTime)}</div>
                        <div className="flex items-center space-x-1">
                            <span className="mt-1 text-lg text-gray-500">•••• </span>
                            <IoIosWifi className="text-xl"/>
                            <IoIosBatteryFull className="text-3xl"/>
                        </div>
                    </div>
                    
                    {/* Cancel button */}
                    <div className={`${isDarkMode ? 'bg-black text-blue-500' : 'bg-white text-blue-600'} p-4 text-left text-lg`}>
                        Cancel
                    </div>
                    
                    {/* Device Info content */}
                    <div className={`${isDarkMode ? 'bg-black text-white' : 'bg-white text-black'} px-4 pb-12 pt-4 flex flex-col items-center`}>
                        <h1 className="text-4xl font-bold mb-12 text-center">Device Info</h1>
                        
                        {barcodeData.eid && (
                            <div className="mb-8 flex flex-col items-center">
                                <p className="text-lg mb-3">EID {barcodeData.eid}</p>
                                <Barcode value={barcodeData.eid} format="CODE128" width={1.2} height={55} displayValue={false} />
                            </div>
                        )}
                        
                        <div className="mb-8 flex flex-col items-center">
                            <p className="text-lg mb-3">IMEI {barcodeData.imei}</p>
                            <Barcode value={barcodeData.imei} format="CODE128" width={1.2} height={55} displayValue={false} />
                        </div>
                        
                        {barcodeData.imei2 && (
                            <div className="mb-8 flex flex-col items-center">
                                <p className="text-lg mb-3">IMEI2 {barcodeData.imei2}</p>
                                <Barcode value={barcodeData.imei2} format="CODE128" width={1.2} height={55} displayValue={false} />
                            </div>
                        )}
                        
                        <div className="mb-8 flex flex-col items-center">
                            <p className="text-lg mb-3">MEID {barcodeData.meid}</p>
                            <Barcode value={barcodeData.meid} format="CODE128" width={1.2} height={55} displayValue={false} />
                        </div>
                        
                        {barcodeData.sn && (
                            <div className="mb-8 flex flex-col items-center">
                                <p className="text-lg mb-3">SN {barcodeData.sn}</p>
                                <div className={`${isDarkMode ? 'bg-white' : 'bg-gray-200'} p-2 flex justify-center mb-6`}>
                                    <Barcode value={barcodeData.sn} format="CODE128" width={1.2} height={50} displayValue={false} />
                                </div>
                            </div>
                        )}
                        
                        {/* Home indicator */}
                        <div className="flex justify-center">
                            <div className={`w-32 h-1 ${isDarkMode ? 'bg-gray-400' : 'bg-gray-300'} rounded-full mt-4`}></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="p-6">
            <h1 className="text-xl font-bold">COIN : {coins}</h1>
            <div className="bg-white p-6 rounded shadow-md">
                <h2 className="text-xl font-semibold">Generate Barcode</h2>
                
                {/* Display error message if any */}
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4">
                        {error}
                    </div>
                )}
                
                <div className="flex space-x-2 my-4 text-xl">
                    <button 
                        className={`px-4 py-2 rounded ${view === "single" ? "bg-green-500 text-white" : "bg-gray-300 text-black"}`} 
                        onClick={() => {
                            setView("single");
                            setGeneratedBarcode(false);
                        }}
                    >
                        Single
                    </button>
                    <button 
                        className={`px-4 py-2 rounded ${view === "multiple" ? "bg-green-500 text-white" : "bg-gray-300 text-black"}`} 
                        onClick={() => {
                            setView("multiple");
                            setGeneratedBarcode(false);
                        }}
                    >
                        Multiple
                    </button>
                    <button 
                        className={`px-4 py-2 rounded ${view === "excel" ? "bg-green-500 text-white" : "bg-gray-300 text-black"}`} 
                        onClick={() => {
                            setView("excel");
                            setGeneratedBarcode(false);
                        }}
                    >
                        Excel
                    </button>
                </div>

                {view === "single" ? (
                    <>
                        {!generatedBarcode ? (
                            <form className="text-xl">
                                <label className="block">Language <span className="text-red-600">*</span></label>
                                <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full border rounded p-2">
                                    {languages.map((lang) => (
                                        <option key={lang} value={lang}>{lang}</option>
                                    ))}
                                </select>
                                
                                <label className="block mt-4">IMEI <span className="text-red-600">*</span></label>
                                <input type="text" value={imei} onChange={(e) => setImei(e.target.value)} className="w-full border rounded p-2" />
                                
                                <label className="block mt-4">IMEI2</label>
                                <input type="text" value={imei2} onChange={(e) => setImei2(e.target.value)} className="w-full border rounded p-2" />
                                
                                {/* Identifier selection */}
                                <div className="mt-4">
                                    <label className="block font-semibold">Pilih Identifier <span className="text-red-600">*</span></label>
                                    <div className="flex space-x-4 mb-4">
                                        <label className="inline-flex items-center">
                                            <input
                                                type="radio"
                                                value="eid"
                                                checked={selectedIdentifier === "eid"}
                                                onChange={() => setSelectedIdentifier("eid")}
                                                className="form-radio h-4 w-4 text-blue-600"
                                            />
                                            <span className="ml-2">EID</span>
                                        </label>
                                        <label className="inline-flex items-center">
                                            <input
                                                type="radio"
                                                value="sn"
                                                checked={selectedIdentifier === "sn"}
                                                onChange={() => setSelectedIdentifier("sn")}
                                                className="form-radio h-4 w-4 text-blue-600"
                                            />
                                            <span className="ml-2">SN</span>
                                        </label>
                                    </div>
                                </div>
                                
                                {selectedIdentifier === "eid" && (
                                    <>
                                        <label className="block mt-4">EID <span className="text-red-600">*</span></label>
                                        <div className="flex">
                                            <input type="text" value={eid} onChange={(e) => setEid(e.target.value)} className="w-full border rounded p-2" />
                                            <button type="button" className="ml-2 px-4 py-2 bg-blue-500 text-white rounded" onClick={generateEID}>Generate Otomatis</button>
                                        </div>
                                    </>
                                )}
                                {selectedIdentifier === "sn" && (
                                    <>
                                        <label className="block mt-4">SN <span className="text-red-600">*</span></label>
                                        <div className="flex">
                                            <input type="text" value={sn} onChange={(e) => setSn(e.target.value)} className="w-full border rounded p-2" />
                                            <button type="button" className="ml-2 px-4 py-2 bg-blue-500 text-white rounded" onClick={generateSN}>Generate Otomatis</button>
                                        </div>
                                    </>
                                )}
                                
                                <button 
                                    type="button" 
                                    className={`w-full mt-4 py-2 rounded ${
                                        coins > 0 ? "bg-green-600 text-white" : "bg-gray-400 text-gray-700 cursor-not-allowed"
                                    }`} 
                                    onClick={handleSubmit}
                                    disabled={coins <= 0}
                                >
                                    {coins > 0 ? "SUBMIT" : "KOIN TIDAK CUKUP"}
                                </button>
                            </form>
                        ) : (
                            <div className="mt-4">
                                <button 
                                    type="button" 
                                    className={`w-full py-2 rounded ${
                                        coins > 0 ? "bg-green-600 text-white" : "bg-gray-400 text-gray-700 cursor-not-allowed"
                                    }`} 
                                    onClick={handleSubmit}
                                    disabled={coins <= 0}
                                >
                                    {coins > 0 ? "GENERATE BARCODE BARU" : "KOIN TIDAK CUKUP"}
                                </button>
                            </div>
                        )}
                    </>
                ) : view === "multiple" ? (
                    <MultipleBarcode />
                ) : (
                    <Excel />
                )}

                {generatedBarcode && (
                    <div className="mt-6">
                        <h3 className="text-lg font-semibold mb-4">Generated Barcode</h3>
                        
                        {/* Theme toggle - now works for both EID and SN */}
                        <div className="mb-4 flex items-center">
                            <span className="mr-2">Theme:</span>
                            <button 
                                className={`px-4 py-1 rounded-l ${displayTheme === "dark" ? "bg-gray-800 text-white" : "bg-gray-200 text-gray-800"}`}
                                onClick={() => setDisplayTheme("dark")}
                            >
                                Dark
                            </button>
                            <button 
                                className={`px-4 py-1 rounded-r ${displayTheme === "light" ? "bg-gray-800 text-white" : "bg-gray-200 text-gray-800"}`}
                                onClick={() => setDisplayTheme("light")}
                            >
                                Light
                            </button>
                        </div>
                        
                        {/* Phone frame container */}
                        <div ref={barcodeContainerRef}>
                            <PhoneFrameDisplay />
                        </div>
                        
                        <div className="mt-4 flex justify-center">
                            <button className="px-6 py-2 bg-green-500 text-white rounded" onClick={downloadBarcode}>
                                Download Barcode
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BarcodeGenerator;
import React, { useState, useRef, useEffect } from "react";
import Barcode from "react-barcode";
import html2canvas from "html2canvas";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { useUser } from "../../context/UserContext";
import { IoIosWifi } from "react-icons/io";
import { IoIosBatteryFull } from "react-icons/io";
import { HiBars3 } from "react-icons/hi2";
import { IoRadioButtonOn } from "react-icons/io5";
import { IoIosArrowBack } from "react-icons/io";

const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
};

const MultipleBarcode = () => {
    const { coins, useCoin, fetchCoins } = useUser();
    const languages = ["English", "Indonesia", "Thailand", "Malaysia", "Korea", "China", "Vietnam", "Spain", "France", "Norway"];
    const [imeiList, setImeiList] = useState("");
    const [language, setLanguage] = useState("English");
    const [selectedOption, setSelectedOption] = useState("eid");
    const [generatedBarcodes, setGeneratedBarcodes] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState("");
    const [darkMode, setDarkMode] = useState(false);
    const [validationError, setValidationError] = useState("");
    const [hasGenerated, setHasGenerated] = useState(false);
    const barcodesContainerRef = useRef(null);

    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        
        return () => {
            clearInterval(timer);
        };
    }, []);

    // Parse IMEI list from textarea - Modified to create separate entries for IMEI1 and IMEI2
    const parseImeiList = () => {
        // Split by empty lines first
        const blocks = imeiList.trim().split(/\n\s*\n/);
        
        const result = [];
        
        blocks.forEach(block => {
            const lines = block.trim().split(/\n/);
            const imeis = lines.filter(line => /^\d+$/.test(line.trim()) && line.trim().length === 15);
            
            // If there are valid IMEIs in this block
            if (imeis.length > 0) {
                // First IMEI (IMEI1)
                const meid1 = imeis[0].length >= 14 ? imeis[0].substring(0, 14) : "";
                result.push({
                    imei: imeis[0],
                    eid: selectedOption === "eid" ? generateRandomEID() : "",
                    sn: selectedOption === "sn" ? generateRandomSN() : "",
                    meid: meid1,
                    type: "IMEI1"
                });
                
                // Second IMEI (IMEI2) if exists
                if (imeis.length > 1) {
                    const meid2 = imeis[1].length >= 14 ? imeis[1].substring(0, 14) : "";
                    result.push({
                        imei: imeis[1],
                        eid: selectedOption === "eid" ? generateRandomEID() : "",
                        sn: selectedOption === "sn" ? generateRandomSN() : "",
                        meid: meid2,
                        type: "IMEI2"
                    });
                }
            }
        });
        
        return result;
    };

    const generateRandomEID = () => {
        const eidPrefix = "890490320050088826000";
        const randomSuffix = Array.from({ length: 32 - eidPrefix.length }, () => 
            Math.floor(Math.random() * 10)).join("");
        return eidPrefix + randomSuffix;
    };

    const generateRandomSN = () => {
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let randomSN = "";
        for (let i = 0; i < 12; i++) {
            randomSN += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return randomSN;
    };

    // Handle radio button selection change
    const handleOptionChange = (option) => {
        setSelectedOption(option);
        setValidationError("");
        if (hasGenerated) {
            setGeneratedBarcodes([]);
            setHasGenerated(false);
        }
    };

    // Download a single barcode
    const downloadSingleBarcode = (index) => {
        const element = document.getElementById(`barcode-${index}-phone`);
        if (!element) return;
        
        html2canvas(element).then((canvas) => {
            const link = document.createElement("a");
            link.href = canvas.toDataURL("image/png");
            link.download = `barcode_${generatedBarcodes[index].type}_${generatedBarcodes[index].imei}_${darkMode ? 'dark' : 'light'}.png`;
            link.click();
        });
    };

    // Download all barcodes as a ZIP
    const downloadAllBarcodes = async () => {
        if (!barcodesContainerRef.current || generatedBarcodes.length === 0) return;
        
        setIsProcessing(true);
        const zip = new JSZip();
        const promises = [];

        // Process each barcode
        for (let i = 0; i < generatedBarcodes.length; i++) {
            const element = document.getElementById(`barcode-${i}-phone`);

            if (element) {
                const promise = html2canvas(element).then((canvas) => {
                    const dataUrl = canvas.toDataURL("image/png");
                    const base64Data = dataUrl.split(",")[1];
                    zip.file(`barcode_${generatedBarcodes[i].type}_${generatedBarcodes[i].imei}_${darkMode ? 'dark' : 'light'}.png`, base64Data, { base64: true });
                });
                promises.push(promise);
            }
        }

        try {
            await Promise.all(promises);
            const content = await zip.generateAsync({ type: "blob" });
            saveAs(content, `all_barcodes_${darkMode ? 'dark' : 'light'}.zip`);
        } catch (error) {
            console.error("Error creating ZIP file:", error);
            alert("Failed to download barcodes. Please try again.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Reset error states
        setError("");
        setValidationError("");
        
        // Validate that an option is selected
        if (!selectedOption) {
            setValidationError("Please select either Generate EID or Generate SN");
            return;
        }
        
        const parsedData = parseImeiList();
        if (parsedData.length === 0) {
            alert("Please enter at least one valid IMEI (15 digits)");
            return;
        }
        
        // Check if user has enough coins
        if (coins <= 0) {
            setError("Koin tidak cukup! Silakan isi koin terlebih dahulu.");
            return;
        }
        
        // Use one coin for the operation
        const result = await useCoin();
        if (!result.success) {
            setError(result.message || "Gagal menggunakan koin!");
            return;
        }
        
        // Refresh the coins after successful generation
        fetchCoins();
        
        // Set the generated barcodes
        setGeneratedBarcodes(parsedData);
        // Mark that we've generated barcodes
        setHasGenerated(true);
    };

    // Toggle theme between dark and light mode
    const toggleTheme = () => {
        setDarkMode(!darkMode);
    };

    // Reset the form to generate new barcodes
    const handleReset = () => {
        setGeneratedBarcodes([]);
        setHasGenerated(false);
    };

    // Phone Frame Display Component for each barcode
    const PhoneFrameDisplay = ({ data, index }) => {
        const isDarkMode = darkMode;
        const showAndroidFrame = selectedOption === "sn";
        
        // Android frame styling for SN option
        if (showAndroidFrame) {
            return (
                <div id={`barcode-${index}-phone`} className="max-w-md mx-auto">
                    {/* Android phone frame */}
                    <div className={`${isDarkMode ? 'bg-black' : 'bg-gray-100'} rounded-sm overflow-hidden border-6 p-6 ${isDarkMode ? 'border-black' : 'border-gray-300'} relative shadow-xl`}>
                        
                        {/* Device Info content */}
                        <div className={`${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} mt-40 ${isDarkMode ? 'text-white' : 'text-black'} px-4 pb-4 pt-4 flex flex-col rounded-xl`}>
                            <h1 className="text-2xl font-bold">{data.type} and S/N</h1>
                            
                            <div className="mb-2 flex flex-col">
                                <p className="text-md mb-1">{data.type}</p>
                                <p className="text-md mb-0">{data.imei} / 01</p>
                                <div className={`${isDarkMode ? 'bg-black' : 'bg-gray-300'} pt-0 pb-0 flex justify-center mb-4 w-full`}>
                                    <div className="bg-white px-24 w-full">
                                        <Barcode value={data.imei} format="CODE128" width={1.2} height={55} displayValue={false} />
                                    </div>
                                </div>
                            </div>
                            
                            {data.sn && (
                                <div className="mb-0 flex flex-col">
                                    <p className="text-md mb-1">SN</p>
                                    <p className="text-md mb-3">{data.sn}</p>
                                    <div className={`${isDarkMode ? 'bg-black' : 'bg-gray-300'} pt-0 pb-0 flex justify-center mb-4 w-full`}>
                                        <div className="bg-white px-20 w-full">
                                            <Barcode value={data.sn} format="CODE128" width={1.2} height={55} displayValue={false} />
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
        
        // iOS-style frame for EID option
        return (
            <div id={`barcode-${index}-phone`} className="max-w-md mx-auto">
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
                        
                        {data.eid && (
                            <div className="mb-8 flex flex-col items-center">
                                <p className="text-lg mb-3">EID {data.eid}</p>
                                <Barcode value={data.eid} format="CODE128" width={1.2} height={55} displayValue={false} />
                            </div>
                        )}
                        
                        <div className="mb-8 flex flex-col items-center">
                            <p className="text-lg mb-3">{data.type} {data.imei}</p>
                            <Barcode value={data.imei} format="CODE128" width={1.2} height={55} displayValue={false} />
                        </div>
                        
                        <div className="mb-8 flex flex-col items-center">
                            <p className="text-lg mb-3">MEID {data.meid}</p>
                            <Barcode value={data.meid} format="CODE128" width={1.2} height={55} displayValue={false} />
                        </div>
                        
                        {data.sn && (
                            <div className="mb-8 flex flex-col items-center">
                                <p className="text-lg mb-3">SN {data.sn}</p>
                                <Barcode value={data.sn} format="CODE128" width={1.2} height={55} displayValue={false} />
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
            <div className="bg-white p-6 rounded shadow-md">
                <h2 className="text-xl font-semibold mb-4">Generate Multiple Barcodes</h2>
                
                {/* Display available coins */}
                <h3 className="text-xl font-bold mb-4">COIN : {coins}</h3>
                
                {/* Display error message if any */}
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                        {error}
                    </div>
                )}
                
                {/* Display validation error if any */}
                {validationError && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                        {validationError}
                    </div>
                )}
                
                {!hasGenerated ? (
                    <form onSubmit={handleSubmit} className="text-xl">
                        <div className="mb-4">
                            <label className="block">Language <span className="text-red-600">*</span></label>
                            <select 
                                value={language} 
                                onChange={(e) => setLanguage(e.target.value)} 
                                className="w-full border rounded p-2"
                            >
                                {languages.map((lang) => (
                                    <option key={lang} value={lang}>{lang}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="mb-4">
                            <label className="block">IMEI/IMEI2 List <span className="text-red-600">*</span></label>
                            <textarea
                                className="w-full p-2 border rounded min-h-[150px]"
                                value={imeiList}
                                onChange={(e) => setImeiList(e.target.value)}
                                placeholder="Enter IMEIs, one per line. Separate different barcode blocks with an empty line.

Example:
123456789012345
987654321098765

111222333444555
"
                            />
                            <p className="text-sm text-gray-500 mt-1">
                                Each IMEI should be 15 digits. Separate different barcode sets with an empty line.
                                IMEI1 and IMEI2 will each generate their own separate barcode display.
                            </p>
                        </div>
                        
                        <div className="mb-6">
                            <label className="block mb-2">Select one option <span className="text-red-600">*</span></label>
                            <div className="space-y-4">
                                {/* Radio button for EID option */}
                                <div>
                                    <label className="flex items-center">
                                        <input 
                                            type="radio" 
                                            name="generationOption"
                                            value="eid"
                                            checked={selectedOption === "eid"} 
                                            onChange={() => handleOptionChange("eid")}
                                            className="mr-2"
                                        />
                                        Generate EID
                                    </label>
                                    <p className="text-sm text-gray-500 ml-6">Generate random EID values for each barcode (iOS style display)</p>
                                </div>
                                
                                {/* Radio button for SN option */}
                                <div>
                                    <label className="flex items-center">
                                    <input 
                                            type="radio" 
                                            name="generationOption"
                                            value="sn"
                                            checked={selectedOption === "sn"} 
                                            onChange={() => handleOptionChange("sn")}
                                            className="mr-2"
                                        />
                                        Generate SN
                                    </label>
                                    <p className="text-sm text-gray-500 ml-6">Generate random SN values for each barcode (Android style display)</p>
                                </div>
                            </div>
                        </div>
                        
                        <button 
                            type="submit" 
                            className={`w-full py-2 rounded ${
                                coins > 0 ? "bg-green-600 text-white" : "bg-gray-400 text-gray-700 cursor-not-allowed"
                            }`}
                            disabled={coins <= 0}
                        >
                            {coins > 0 ? "SUBMIT" : "KOIN TIDAK CUKUP"}
                        </button>
                    </form>
                ) : (
                    <div className="flex justify-between items-center mb-4 mt-4">
                        <h3 className="text-lg font-semibold">Generated Barcodes</h3>
                        <button 
                            className="px-4 py-2 bg-blue-500 text-white rounded"
                            onClick={handleReset}
                        >
                            Generate New Barcodes
                        </button>
                    </div>
                )}

                {generatedBarcodes.length > 0 && hasGenerated && (
                    <div className="mt-6" ref={barcodesContainerRef}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Barcodes ({generatedBarcodes.length})</h3>
                            
                            <div className="flex items-center space-x-4">
                                {/* Theme toggle switch */}
                                <div className="flex items-center">
                                    <span className="mr-2 text-sm font-medium">Light</span>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={darkMode} 
                                            onChange={toggleTheme}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                    <span className="ml-2 text-sm font-medium">Dark</span>
                                </div>
                                
                                <button 
                                    className="px-4 py-2 bg-green-500 text-white rounded flex items-center"
                                    onClick={downloadAllBarcodes}
                                    disabled={isProcessing}
                                >
                                    {isProcessing ? (
                                        <span>Processing...</span>
                                    ) : (
                                        <span>Download All as ZIP</span>
                                    )}
                                </button>
                            </div>
                        </div>
                        
                        {generatedBarcodes.map((data, index) => (
                            <div key={index} className="mb-10 pb-10 border-b border-gray-300">
                                <h4 className="text-md font-medium mb-3">Barcode #{index + 1}: {data.type} {data.imei}</h4>
                                
                                <PhoneFrameDisplay data={data} index={index} />
                                
                                <div className="mt-4 flex justify-center">
                                    <button 
                                        className="px-4 py-2 bg-green-500 text-white rounded"
                                        onClick={() => downloadSingleBarcode(index)}
                                    >
                                        Download Barcode
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MultipleBarcode;
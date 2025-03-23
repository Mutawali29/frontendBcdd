import React, { useState, useRef } from "react";
import Barcode from "react-barcode";
import html2canvas from "html2canvas";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { useUser } from "../../context/UserContext";
import * as XLSX from "xlsx";
import { IoIosWifi } from "react-icons/io";
import { IoIosBatteryFull } from "react-icons/io";
import { HiBars3 } from "react-icons/hi2";
import { IoRadioButtonOn } from "react-icons/io5";
import { IoIosArrowBack } from "react-icons/io";

const Excel = () => {
    const { coins, useCoin, fetchCoins } = useUser();
    const languages = ["English", "Indonesia", "Thailand", "Malaysia", "Korea", "China", "Vietnam", "Spain", "France", "Norway"];
    const [language, setLanguage] = useState("English");
    const [file, setFile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [barcodeData, setBarcodeData] = useState([]);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState("");
    const [darkMode, setDarkMode] = useState(false);
    const [identifierType, setIdentifierType] = useState("IMEI"); // Default to IMEI, options: IMEI, EID, SN
    const barcodeContainerRef = useRef(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Update time when component mounts
    React.useEffect(() => {
        setCurrentTime(new Date());
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        
        return () => {
            clearInterval(timer);
        };
    }, []);

    // Format time to HH:MM
    const formatTime = (date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    };

    // Generate random SN
    const generateRandomSN = () => {
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let randomSN = "";
        for (let i = 0; i < 12; i++) {
            randomSN += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return randomSN;
    };

    // Generate random EID
    const generateRandomEID = () => {
        return "890490320050088826000" + Math.random().toString().slice(2, 14);
    };

    // Generate template Excel data structure
    const generateTemplateData = () => {
        const headers = [
            ["IMEI", "IMEI2", "EID", "SN", ""]
        ];
        const emptyRows = Array(30).fill(Array(5).fill(""));
        return [...headers, ...emptyRows];
    };

    // Download Excel template 
    const downloadExcelTemplate = () => {
        setIsLoading(true);
        
        import("xlsx").then(XLSX => {
            try {
                const wb = XLSX.utils.book_new();
                const templateData = generateTemplateData();
                const ws = XLSX.utils.aoa_to_sheet(templateData);
                
                // Set column widths
                const columnWidths = [
                    { wch: 20 }, // IMEI
                    { wch: 20 }, // IMEI2
                    { wch: 20 }, // EID
                    { wch: 20 }, // SN
                    { wch: 15 }  // Extra column
                ];
                
                ws['!cols'] = columnWidths;
                XLSX.utils.book_append_sheet(wb, ws, "TemplateBarcode");
                XLSX.writeFile(wb, "barcode_template.xlsx");
            } catch (error) {
                console.error("Failed to generate Excel template:", error);
                alert("Failed to download template. Please try again.");
            } finally {
                setIsLoading(false);
            }
        }).catch(error => {
            console.error("Failed to load XLSX library:", error);
            alert("Failed to load required library. Please check your internet connection and try again.");
            setIsLoading(false);
        });
    };

    const handleFileChange = (event) => {
        setFile(event.target.files[0]);
    };

    // Process Excel file and extract data
    const parseExcelFile = (fileObject) => {
        return new Promise((resolve, reject) => {
            import("xlsx").then(XLSX => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = e.target.result;
                        const workbook = XLSX.read(data, { type: 'array' });
                        const firstSheetName = workbook.SheetNames[0];
                        const worksheet = workbook.Sheets[firstSheetName];
                        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                        
                        // Extract header row and data rows
                        const headers = jsonData[0];
                        const dataRows = jsonData.slice(1).filter(row => row.length > 0 && row[0]); // Filter out empty rows
                        
                        // Map rows to objects with column names
                        const records = dataRows.map(row => {
                            const record = {};
                            headers.forEach((header, index) => {
                                if (header) {
                                    record[header] = row[index] || "";
                                }
                            });
                            
                            // Add MEID calculation (first 14 digits of IMEI)
                            if (record.IMEI && record.IMEI.toString().length >= 14) {
                                record.MEID = record.IMEI.toString().substring(0, 14);
                            }
                            
                            // Only generate random values if they're needed based on identifierType
                            if (identifierType === "EID" && !record.EID) {
                                record.EID = generateRandomEID();
                            }
                            
                            if (identifierType === "SN" && !record.SN) {
                                record.SN = generateRandomSN();
                            }
                            
                            return record;
                        });
                        
                        resolve(records);
                    } catch (error) {
                        reject(error);
                    }
                };
                reader.onerror = (error) => reject(error);
                reader.readAsArrayBuffer(fileObject);
            }).catch(error => {
                reject(error);
            });
        });
    };

    // Handle form submission
    const handleSubmit = async (event) => {
        event.preventDefault();
        
        // Reset error state
        setError("");
        
        if (!file) {
            alert("Please select a file to upload");
            return;
        }
        
        setIsLoading(true);
        
        try {
            const records = await parseExcelFile(file);
            
            // Validate required IMEI field
            const validRecords = records.filter(record => record.IMEI && record.IMEI.toString().length === 15);
            
            if (validRecords.length === 0) {
                alert("No valid IMEI numbers found in the file. IMEI must be 15 digits.");
                setIsLoading(false);
                return;
            }

            // Check if both EID and SN are present in the same record
            const recordsWithBothIdentifiers = validRecords.filter(
                record => record.EID && record.EID.toString().trim() !== "" && 
                         record.SN && record.SN.toString().trim() !== ""
            );

            if (recordsWithBothIdentifiers.length > 0) {
                alert("Error: Some records contain both EID and SN values. Please choose one identifier type and make sure the other is empty in your Excel file.");
                setIsLoading(false);
                return;
            }
            
            // Check if user has enough coins for all valid records
            if (coins < validRecords.length) {
                setError(`Koin tidak cukup! Anda membutuhkan ${validRecords.length} koin untuk menghasilkan ${validRecords.length} barcode.`);
                setIsLoading(false);
                return;
            }
            
            // Use coins for each valid record
            for (let i = 0; i < validRecords.length; i++) {
                const result = await useCoin();
                if (!result.success) {
                    setError(`Gagal menggunakan koin pada barcode ke-${i+1}! ${result.message || ""}`);
                    setIsLoading(false);
                    return;
                }
            }
            
            // Refresh coins after successful use
            fetchCoins();
            
            // Set data for rendering barcodes
            setBarcodeData(validRecords);
            
            setIsLoading(false);
        } catch (error) {
            console.error("Error processing Excel file:", error);
            alert("Error processing Excel file. Please check the file format and try again.");
            setIsLoading(false);
        }
    };

    // Toggle dark mode
    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
    };

    // Download individual barcode
    const downloadBarcode = (index) => {
        const element = document.getElementById(`barcode-${index}`);
        if (!element) return;
        
        html2canvas(element).then((canvas) => {
            const link = document.createElement("a");
            link.href = canvas.toDataURL("image/png");
            link.download = `barcode_${barcodeData[index].IMEI || "unknown"}_${darkMode ? 'dark' : 'light'}.png`;
            link.click();
        });
    };

    // Download all barcodes as a ZIP file
    const downloadAllBarcodes = async () => {
        if (barcodeData.length === 0) return;
        
        setGenerating(true);
        
        try {
            const zip = new JSZip();
            const barcodeFolder = zip.folder("barcodes");
            const promises = [];
            
            for (let i = 0; i < barcodeData.length; i++) {
                const element = document.getElementById(`barcode-${i}`);
                if (!element) continue;
                
                const promise = html2canvas(element).then((canvas) => {
                    return new Promise((resolve) => {
                        canvas.toBlob((blob) => {
                            barcodeFolder.file(`barcode_${barcodeData[i].IMEI || `unknown_${i}`}_${darkMode ? 'dark' : 'light'}.png`, blob);
                            resolve();
                        });
                    });
                });
                
                promises.push(promise);
            }
            
            await Promise.all(promises);
            
            const zipBlob = await zip.generateAsync({ type: "blob" });
            saveAs(zipBlob, `all_barcodes_${darkMode ? 'dark' : 'light'}.zip`);
        } catch (error) {
            console.error("Error generating ZIP file:", error);
            alert("Error creating barcode ZIP file. Please try again.");
        } finally {
            setGenerating(false);
        }
    };

    // Phone Frame Display Component with Android support
    const PhoneFrameDisplay = ({ data, index }) => {
        // Check if we should show Android frame (when identifier type is SN)
        const showAndroidFrame = identifierType === "SN" || (data.SN && !data.EID);
        
        // Android frame display
        if (showAndroidFrame) {
            const frameStyle = darkMode 
                ? "bg-black" 
                : "bg-gray-100";
            
            const textStyle = darkMode
                ? "text-white"
                : "text-black";
                
            return (
                <div id={`barcode-${index}`} className="max-w-md mx-auto">
                    {/* Android phone frame */}
                    <div className={`${frameStyle} rounded-sm overflow-hidden border-6 p-6 ${darkMode ? 'border-black' : 'border-gray-300'} relative shadow-xl`}>
                        
                        {/* Device Info content */}
                        <div className={`${darkMode ? 'bg-gray-600' : 'bg-gray-200'} mt-40 ${textStyle} px-4 pb-4 pt-4 flex flex-col rounded-xl`}>
                            <h1 className="text-2xl font-bold">IMEI(MEID) and S/N</h1>
                            
                            <div className="mb-2 flex flex-col">
                                <p className="text-md mb-1">IMEI1</p>
                                <p className="text-md mb-0">{data.IMEI} / 01</p>
                                <div className={`${darkMode ? 'bg-black' : 'bg-gray-300'} pt-0 pb-0 flex justify-center mb-0 w-full`}>
                                    <div className="bg-white px-24 w-full">
                                        <Barcode value={data.IMEI.toString()} format="CODE128" width={1.2} height={55} displayValue={false} />
                                    </div>
                                </div>
                            </div>
                            
                            {data.IMEI2 && data.IMEI2.toString().length > 0 && (
                                <div className="mb-0 flex flex-col">
                                    <p className="text-md mb-1">IMEI2</p>
                                    <p className="text-md mb-0">{data.IMEI2} / 01</p>
                                    <div className={`${darkMode ? 'bg-black' : 'bg-gray-300'} pt-0 pb-0 flex justify-center mb-4 w-full`}>
                                        <div className="bg-white px-24 w-full">
                                            <div className="">
                                                <Barcode value={data.IMEI2.toString()} format="CODE128" width={1.2} height={55} displayValue={false} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {data.SN && (
                                <div className="mb-0 flex flex-col">
                                    <p className="text-md mb-1">SN</p>
                                    <p className="text-md mb-3">{data.SN}</p>
                                    <div className={`${darkMode ? 'bg-black' : 'bg-gray-300'} pt-0 pb-0 flex justify-center mb-4 w-full`}>
                                        <div className="bg-white px-20 w-full">
                                            <Barcode value={data.SN} format="CODE128" width={1.2} height={55} displayValue={false} />
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
                        <div className={`flex justify-center space-x-24 mt-8 text-2xl ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                            <HiBars3 />
                            <IoRadioButtonOn />
                            <IoIosArrowBack />
                        </div>
                    </div>
                </div>
            );
        }
        
        // Original iOS style display (for IMEI and EID)
        // Dynamic styling based on dark/light mode
        const frameStyle = darkMode 
            ? "bg-black" 
            : "bg-white border-gray-200";
        
        const contentBgStyle = darkMode 
            ? "bg-black" 
            : "bg-white";
        
        const textStyle = darkMode
            ? "text-white"
            : "text-gray-900";
        
        const barcodeBgStyle = darkMode 
            ? "bg-gray-200" 
            : "bg-white";
            
        const statusBarStyle = darkMode
            ? "bg-black"
            : "bg-white";
            
        const cancelButtonStyle = darkMode
            ? "text-blue-500"
            : "text-blue-600";
            
        const homeIndicatorStyle = darkMode
            ? "bg-gray-400"
            : "bg-gray-300";
        
        return (
            <div id={`barcode-${index}`} className="max-w-md mx-auto">
                {/* Phone frame */}
                <div className={`rounded-none overflow-hidden border-5 relative shadow-xl ${frameStyle}`}>
                    {/* Status bar */}
                    <div className={`${statusBarStyle} ${textStyle} py-1 px-4 flex justify-between items-center text-xs`}>
                        <div>{formatTime(currentTime)}</div>
                        <div className="flex items-center space-x-1">
                            <span className="mt-1 text-lg text-gray-500">•••• </span>
                            <IoIosWifi className="text-xl"/>
                            <IoIosBatteryFull className="text-3xl"/>
                        </div>
                    </div>
                    
                    {/* Cancel button */}
                    <div className={`${contentBgStyle} ${cancelButtonStyle} p-4 text-left text-lg`}>
                        Cancel
                    </div>
                    
                    {/* Device Info content */}
                    <div className={`${contentBgStyle} ${textStyle} px-4 pb-12 pt-4 flex flex-col items-center`}>
                        <h1 className="text-4xl font-bold mb-12 text-center">Device Info</h1>
                        
                        {/* Show EID only if identifierType is EID or it's available */}
                        {(identifierType === "EID" || (data.EID && !data.SN)) && data.EID && (
                            <div className="mb-8 flex flex-col items-center">
                                <p className="text-lg mb-3">EID {data.EID}</p>
                                <Barcode 
                                    value={data.EID} 
                                    format="CODE128" 
                                    width={1.2} 
                                    height={55} 
                                    displayValue={false} 
                                />
                            </div>
                        )}
                        
                        <div className="mb-8 flex flex-col items-center">
                            <p className="text-lg mb-3">IMEI {data.IMEI}</p>
                            <Barcode value={data.IMEI.toString()} format="CODE128" width={1.2} height={55} displayValue={false} />
                        </div>
                        
                        {data.IMEI2 && data.IMEI2.toString().length > 0 && (
                            <div className="mb-8 flex flex-col items-center">
                                <p className="text-lg mb-3">IMEI2 {data.IMEI2}</p>
                                <Barcode value={data.IMEI2.toString()} format="CODE128" width={1.2} height={55} displayValue={false} />
                            </div>
                        )}
                        
                        <div className="mb-8 flex flex-col items-center">
                            <p className="text-lg mb-3">MEID {data.MEID}</p>
                            <Barcode value={data.MEID.toString()} format="CODE128" width={1.2} height={55} displayValue={false} />
                        </div>
                        
                        {/* Show SN for iOS frame when applicable */}
                        {(identifierType === "SN" || (data.SN && !data.EID)) && data.SN && (
                            <div className="mb-8 flex flex-col items-center">
                                <p className="text-lg mb-3">SN {data.SN}</p>
                                <div className={`${barcodeBgStyle} p-2 flex justify-center mb-6 border border-gray-200`}>
                                    <Barcode 
                                        value={data.SN} 
                                        format="CODE128" 
                                        width={1.2} 
                                        height={50} 
                                        displayValue={false} 
                                    />
                                </div>
                            </div>
                        )}
                        
                        {/* Home indicator */}
                        <div className="flex justify-center">
                            <div className={`w-32 h-1 ${homeIndicatorStyle} rounded-full mt-4`}></div>
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
                <h2 className="text-xl font-semibold">Generate Barcode (Excel)</h2>
                
                {/* Display error message if any */}
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4">
                        {error}
                    </div>
                )}
                
                <p className="text-green-600 font-medium my-2">
                    Wajib menggunakan file template sesuai dengan yang tersedia di tautan berikut!
                </p>
                <button 
                    onClick={downloadExcelTemplate} 
                    disabled={isLoading}
                    className="px-4 py-2 bg-green-600 text-white rounded"
                >
                    {isLoading ? "Processing..." : "Download Template Excel"}
                </button>
                <form onSubmit={handleSubmit} className="mt-4 text-xl">
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

                    {/* New select for identifier type */}
                    <label className="block mt-4">Identifier Type <span className="text-red-600">*</span></label>
                    <select 
                        value={identifierType} 
                        onChange={(e) => setIdentifierType(e.target.value)} 
                        className="w-full border rounded p-2"
                    >
                        <option value="IMEI">IMEI Only</option>
                        <option value="EID">EID</option>
                        <option value="SN">SN</option>
                    </select>
                    
                    <div className="mt-2 text-sm text-gray-600">
                        <p>Note: If you select EID or SN, make sure your file doesn't contain both identifiers in the same record.</p>
                        <p>The file should contain either EID or SN, not both.</p>
                    </div>
                    
                    <label className="block mt-4">File Excel <span className="text-red-600">*</span></label>
                    <input 
                        type="file" 
                        accept=".xlsx, .xls" 
                        onChange={handleFileChange} 
                        className="w-full border rounded p-2"
                    />
                    <button 
                        type="submit" 
                        disabled={isLoading || coins <= 0}
                        className={`w-full mt-4 py-2 rounded ${
                            coins > 0 ? "bg-green-600 text-white" : "bg-gray-400 text-gray-700 cursor-not-allowed"
                        }`}
                    >
                        {isLoading ? "PROCESSING..." : coins > 0 ? "SUBMIT" : "KOIN TIDAK CUKUP"}
                    </button>
                </form>

                {barcodeData.length > 0 && (
                    <div className="mt-8">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-semibold">Generated Barcodes ({barcodeData.length})</h3>
                            
                            <div className="flex items-center gap-4">
                                {/* Theme toggle button */}
                                <div className="flex items-center">
                                    <label className="mr-2 text-sm font-medium">
                                        {darkMode ? "Dark Mode" : "Light Mode"}
                                    </label>
                                    <button 
                                        onClick={toggleDarkMode}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${darkMode ? 'bg-blue-600' : 'bg-gray-300'}`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${darkMode ? 'translate-x-6' : 'translate-x-1'}`}
                                        />
                                    </button>
                                </div>
                                
                                {/* Download all button */}
                                <button 
                                    onClick={downloadAllBarcodes}
                                    disabled={generating}
                                    className="px-4 py-2 bg-green-600 text-white rounded"
                                >
                                    {generating ? "Generating..." : "Download All Barcodes (ZIP)"}
                                </button>
                            </div>
                        </div>
                        
                        <div className="space-y-6" ref={barcodeContainerRef}>
                            {barcodeData.map((data, index) => (
                                <div key={index} className="barcode-item relative">
                                    <PhoneFrameDisplay data={data} index={index} />
                                    <div className="mt-4 flex justify-center">
                                        <button 
                                            className="px-6 py-2 bg-green-500 text-white rounded"
                                            onClick={() => downloadBarcode(index)}
                                        >
                                            Download Barcode
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Excel;
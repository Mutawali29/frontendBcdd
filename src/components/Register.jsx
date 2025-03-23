import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

const Register = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [verificationCode, setVerificationCode] = useState("");
    const [sentCode, setSentCode] = useState(""); // For testing only - to display the code
    const [error, setError] = useState({ username: "", email: "", password: "", verification: "" });
    const [step, setStep] = useState(1); // 1: Initial form, 2: Verification code
    const [isVerifying, setIsVerifying] = useState(false);

    const validateForm = () => {
        let isValid = true;
        const newError = { username: "", email: "", password: "" };

        if (!username.trim()) {
            newError.username = "Username tidak boleh kosong";
            isValid = false;
        }

        if (!email.trim()) {
            newError.email = "Email tidak boleh kosong";
            isValid = false;
        }

        if (!password.trim()) {
            newError.password = "Password tidak boleh kosong";
            isValid = false;
        }

        setError(newError);
        return isValid;
    };

    const handleSendVerification = async () => {
        if (!validateForm()) return;
        
        setIsVerifying(true);
        try {
            console.log("Sending verification request to:", "http://127.0.0.1:8000/api/send-verification");
            console.log("With data:", { email, username });
            
            const response = await fetch("http://127.0.0.1:8000/api/send-verification", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, username }),
            });
    
            console.log("Response status:", response.status);
            const data = await response.json();
            console.log("Response data:", data);
            
            if (response.ok) {
                // TESTING ONLY: Show the verification code that would normally be emailed
                if (data.code) {
                    setSentCode(data.code);
                }
                setStep(2);
            } else {
                setError({ ...error, email: data.message });
            }
        } catch (err) {
            console.error("Error sending verification:", err);
            setError({ ...error, email: "Terjadi kesalahan, silakan coba lagi" });
        } finally {
            setIsVerifying(false);
        }
    };

    const handleRegister = async () => {
        if (!verificationCode.trim()) {
            setError({ ...error, verification: "Kode verifikasi tidak boleh kosong" });
            return;
        }
        
        try {
            console.log("Sending registration request with code:", verificationCode);
            
            const response = await fetch("http://127.0.0.1:8000/api/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ 
                    username, 
                    email, 
                    password,
                    verificationCode 
                }),
            });
    
            const data = await response.json();
            console.log("Registration response:", data);
            
            if (response.ok) {
                alert("Registrasi berhasil!");
                navigate("/");
            } else {
                if (data.field === "verification") {
                    setError({ ...error, verification: data.message });
                } else {
                    alert(data.message);
                }
            }
        } catch (error) {
            console.error("Error during registration:", error);
            alert("Terjadi kesalahan saat mendaftar");
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="bg-white p-10 rounded-2xl shadow-xl w-[30rem]">
                <div className="flex flex-col items-center mb-8">
                    <p className="text-green-500 font-bold text-3xl mt-2">Register</p>
                    {step === 2 && <p className="text-gray-600 mt-2 text-center">Kode verifikasi telah dikirim</p>}
                    
                    {/* Testing message to show the code */}
                    {sentCode && step === 2 && (
                        <p className="text-blue-600 mt-2 p-2 border border-blue-300 rounded">
                            Debug mode: Kode verifikasi adalah <strong>{sentCode}</strong>
                        </p>
                    )}
                </div>

                {step === 1 ? (
                    <>
                        <input
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-5 py-3 text-lg border rounded-xl mb-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                        {error.username && <p className="text-red-500 text-sm mb-4 select-none">{error.username}</p>}
                        
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-5 py-3 text-lg border rounded-xl mb-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                        {error.email && <p className="text-red-500 text-sm mb-4 select-none">{error.email}</p>}
                        
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-5 py-3 text-lg border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                        {error.password && <p className="text-red-500 text-sm mt-2 select-none">{error.password}</p>}
                        
                        <button 
    className={`w-full ${isVerifying ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600'} text-white py-3 text-lg rounded-xl mt-6 transition select-none`}
    onClick={handleSendVerification}
    disabled={isVerifying}
>

                            {isVerifying ? 'Mengirim...' : 'Kirim Kode Verifikasi'}
                        </button>
                    </>
                ) : (
                    <>
                        <div className="mb-6">
                            <input
                                type="text"
                                placeholder="Kode Verifikasi"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value)}
                                className="w-full px-5 py-3 text-lg border rounded-xl mb-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                            {error.verification && (
                                <p className="text-red-500 text-sm mt-2 select-none">{error.verification}</p>
                            )}
                        </div>

                        <div className="flex space-x-4">
                            <button
                                className="w-1/2 bg-gray-300 text-gray-700 py-3 text-lg rounded-xl hover:bg-gray-400 transition select-none"
                                onClick={() => setStep(1)}
                            >
                                Kembali
                            </button>
                            <button 
                                className="w-1/2 bg-green-500 text-white py-3 text-lg rounded-xl hover:bg-green-600 transition select-none"
                                onClick={handleRegister}
                            >
                                Register
                            </button>
                        </div>
                    </>
                )}

                <p className="text-center mt-4 text-gray-600">
                    Sudah punya akun? <Link to="/" className="text-green-500 hover:underline">Login di sini</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
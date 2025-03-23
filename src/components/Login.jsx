import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaHandshake, FaEye, FaEyeSlash } from "react-icons/fa";
import { useUser } from "../context/UserContext";

const Login = () => {
    const navigate = useNavigate();
    const { loginUser } = useUser();
    const [showPassword, setShowPassword] = useState(false);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState({ username: "", password: "", api: "" });
    const [loading, setLoading] = useState(false);

    const validateForm = () => {
        let valid = true;
        const newErrors = { username: "", password: "" };

        if (!username.trim()) {
            newErrors.username = "Username tidak boleh kosong.";
            valid = false;
        }
        if (!password.trim()) {
            newErrors.password = "Password tidak boleh kosong.";
            valid = false;
        }

        setError(prev => ({ ...prev, ...newErrors }));
        return valid;
    };

    const handleLogin = async () => {
        if (!validateForm()) return;

        setLoading(true);
        setError(prev => ({ ...prev, api: "" }));

        try {
            // Use the loginUser function from context that uses axios
            const result = await loginUser({ username, password });

            if (result.success) {
                navigate("/dashboard");
            } else {
                setError(prev => ({
                    ...prev,
                    api: result.error || "Login gagal. Periksa kembali username/password.",
                }));
            }
        } catch (error) {
            console.error("Login error:", error);
            setError(prev => ({ 
                ...prev, 
                api: "Terjadi kesalahan, silakan coba lagi." 
            }));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="bg-white p-10 rounded-2xl shadow-xl w-[30rem]">
                <div className="flex flex-col items-center mb-8">
                    <FaHandshake className="text-green-500 text-7xl" />
                    <p className="text-green-500 font-bold text-3xl mt-2">B-Code Generator</p>
                </div>
                <input 
                    type="text" 
                    placeholder="Username" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-5 py-3 text-lg border rounded-xl mb-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                {error.username && <p className="text-red-500 text-sm mb-2">{error.username}</p>}

                <div className="relative">
                    <input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="Password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-5 py-3 text-lg border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <span 
                        className="absolute right-4 top-3 text-gray-400 cursor-pointer text-xl"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </span>
                </div>
                {error.password && <p className="text-red-500 text-sm mt-2">{error.password}</p>}
                {error.api && <p className="text-red-500 text-sm mt-2">{error.api}</p>}

                <button 
                    className="w-full bg-green-500 text-white py-3 text-lg rounded-xl mt-6 hover:bg-green-600 transition"
                    onClick={handleLogin} 
                    disabled={loading}
                >
                    {loading ? "Memproses..." : "Login"}
                </button>

                <p className="text-center text-gray-600 mt-4">Belum punya akun?</p>
                <button 
                    className="w-full bg-blue-500 text-white py-3 text-lg rounded-xl mt-2 hover:bg-blue-600 transition"
                    onClick={() => navigate("/register")}
                >
                    Register
                </button>
            </div>
        </div>
    );
};

export default Login;
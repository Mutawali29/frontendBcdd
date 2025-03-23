import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaCoins, FaUserCog, FaSearch, FaPlus } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

const AdminCoinsManagement = () => {
    const navigate = useNavigate();
    const { user } = useUser();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedUser, setSelectedUser] = useState(null);
    const [coinAmount, setCoinAmount] = useState(1);
    const [successMessage, setSuccessMessage] = useState("");

    // API URL from your context
    const API_URL = "http://82.25.109.147:8000/api";

    // Check if current user is admin on component mount
    useEffect(() => {
        if (!user || user.role !== "admin") {
            navigate("/dashboard");
        } else {
            fetchUsers();
        }
    }, [user, navigate]);

    // Fetch all users
    const fetchUsers = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(`${API_URL}/admin/users`, {
                headers: { Authorization: token }
            });
            setUsers(response.data);
        } catch (error) {
            console.error("Error fetching users:", error);
            setError("Gagal memuat data pengguna");
        } finally {
            setLoading(false);
        }
    };

    // Handle adding coins to a user
    const handleAddCoins = async () => {
        if (!selectedUser || coinAmount < 1) return;

        try {
            const token = localStorage.getItem("token");
            await axios.post(
                `${API_URL}/admin/add-coins`, 
                { 
                    userId: selectedUser.id, 
                    amount: parseInt(coinAmount) 
                },
                {
                    headers: { Authorization: token }
                }
            );
            
            // Update the user in the local state
            setUsers(users.map(u => {
                if (u.id === selectedUser.id) {
                    return {...u, coins: u.coins + parseInt(coinAmount)};
                }
                return u;
            }));
            
            setSuccessMessage(`Berhasil menambahkan ${coinAmount} koin untuk ${selectedUser.username}`);
            setTimeout(() => setSuccessMessage(""), 3000);
        } catch (error) {
            console.error("Error adding coins:", error);
            setError("Gagal menambahkan koin");
            setTimeout(() => setError(""), 3000);
        }
    };

    // Filter users based on search term
    const filteredUsers = users.filter(user => 
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="bg-gray-100 min-h-screen p-6">
            <div className="max-w-7xl mx-auto">
                <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center">
                            <FaUserCog className="text-blue-500 text-3xl mr-3" />
                            <h1 className="text-2xl font-bold">Admin - Manajemen Koin Pengguna</h1>
                        </div>
                        <button 
                            onClick={() => navigate("/dashboard")}
                            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                        >
                            Kembali ke Dashboard
                        </button>
                    </div>

                    {/* Search bar */}
                    <div className="relative mb-6">
                        <FaSearch className="absolute left-3 top-3 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Cari pengguna berdasarkan username atau email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Success/Error messages */}
                    {successMessage && (
                        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                            {successMessage}
                        </div>
                    )}
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                            {error}
                        </div>
                    )}

                    {/* Users table */}
                    {loading ? (
                        <div className="text-center py-10">
                            <p className="text-gray-500">Memuat data pengguna...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-white border rounded-lg">
                                <thead>
                                    <tr>
                                        <th className="py-3 px-4 border-b text-left">Username</th>
                                        <th className="py-3 px-4 border-b text-left">Email</th>
                                        <th className="py-3 px-4 border-b text-center">Koin</th>
                                        <th className="py-3 px-4 border-b text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.length > 0 ? (
                                        filteredUsers.map((user) => (
                                            <tr key={user.id} className="hover:bg-gray-50">
                                                <td className="py-3 px-4 border-b">{user.username}</td>
                                                <td className="py-3 px-4 border-b">{user.email}</td>
                                                <td className="py-3 px-4 border-b text-center">
                                                    <span className="flex items-center justify-center">
                                                        <FaCoins className="text-yellow-500 mr-1" />
                                                        {user.coins || 0}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 border-b text-right">
                                                    <button
                                                        onClick={() => setSelectedUser(user)}
                                                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                                                    >
                                                        Tambah Koin
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="py-6 text-center text-gray-500">
                                                Tidak ada pengguna yang ditemukan
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Modal for adding coins */}
                {selectedUser && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl p-6 w-96">
                            <h2 className="text-xl font-bold mb-4">Tambah Koin untuk {selectedUser.username}</h2>
                            <p className="mb-4">Saldo Koin Saat Ini: {selectedUser.coins || 0}</p>
                            
                            <div className="mb-4">
                                <label className="block text-gray-700 mb-2">Jumlah Koin</label>
                                <div className="flex items-center">
                                    <FaCoins className="text-yellow-500 mr-2" />
                                    <input
                                        type="number"
                                        min="1"
                                        value={coinAmount}
                                        onChange={(e) => setCoinAmount(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => setSelectedUser(null)}
                                    className="px-4 py-2 border rounded-lg hover:bg-gray-100"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleAddCoins}
                                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center"
                                >
                                    <FaPlus className="mr-1" /> Tambah Koin
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminCoinsManagement;
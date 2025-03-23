// In ProfilePage.js, modify the component to use the new function
import React, { useState, useEffect } from "react";
import { useUser } from "../context/UserContext";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Security from "./Security";

const ProfilePage = () => {
  const { user, updateUserProfile } = useUser(); // Use updateUserProfile instead of updateUser
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("userDetails");
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    firstName: "",
    lastName: "",
    avatar: null,
  });
  const [isActivated, setIsActivated] = useState(true);
  const [isBanned, setIsBanned] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [groups, setGroups] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email || "",
        username: user.username || "",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        avatar: user.avatar || null,
      });
      setPreviewImage(user.avatar || null);
      setIsActivated(user.isActivated !== undefined ? user.isActivated : true);
      setIsBanned(user.isBanned || false);
      setGroups(user.groups || ["User"]);
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    // Clear any error or success message when user makes changes
    setError("");
    setSuccessMessage("");
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        avatar: file,
      });

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUserDetailsSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccessMessage("");
  
    try {
      // Create FormData to handle file upload
      const formDataToSend = new FormData();
      formDataToSend.append("email", formData.email);
      formDataToSend.append("username", formData.username);
      
      // Only append avatar if a new file was selected
      if (formData.avatar && formData.avatar instanceof File) {
        formDataToSend.append("avatar", formData.avatar);
      }
  
      const result = await updateUserProfile(formDataToSend);
  
      if (result.success) {
        setSuccessMessage(result.message || "Profil berhasil diperbarui!");
      } else {
        setError(result.error || "Gagal memperbarui profil!");
      }
    } catch (err) {
      setError("Terjadi kesalahan saat memperbarui profil.");
      console.error("Error submitting profile:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 pt-24 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-800"
          >
            <FaArrowLeft className="mr-2" />
            Back
          </button>
          <h1 className="text-2xl font-bold ml-4">Edit Profile</h1>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="flex">
            <div className="w-full">
              <ul className="flex border-b">
                <li className="mr-1">
                  <a
                    className={`inline-block border-l border-t border-r rounded-t py-2 px-4 font-semibold ${
                      activeTab === "userDetails" 
                        ? "bg-white text-blue-700"
                        : "bg-gray-200 text-gray-500 hover:text-gray-800"
                    }`}
                    href="#userDetails"
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveTab("userDetails");
                    }}
                  >
                    User Details
                  </a>
                </li>
                <li className="mr-1">
                  <a
                    className={`inline-block border-l border-t border-r rounded-t py-2 px-4 font-semibold ${
                      activeTab === "security" 
                        ? "bg-white text-blue-700"
                        : "bg-gray-200 text-gray-500 hover:text-gray-800"
                    }`}
                    href="#security"
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveTab("security");
                    }}
                  >
                    Security
                  </a>
                </li>
              </ul>

              {activeTab === "userDetails" && (
                <form onSubmit={handleUserDetailsSubmit} className="p-6">
                  <h2 className="text-xl font-semibold mb-6">Basic Info</h2>
                  
                  {/* Show error message if there is one */}
                  {error && (
                    <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                      {error}
                    </div>
                  )}
                  
                  {/* Show success message if there is one */}
                  {successMessage && (
                    <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                      {successMessage}
                    </div>
                  )}
                  
                  <div className="flex flex-wrap -mx-3 mb-8">
                    <div className="w-full md:w-1/4 px-3 mb-6 md:mb-0 flex flex-col items-center">
                      <div className="w-32 h-32 rounded-full bg-blue-500 overflow-hidden mb-4">
                        {previewImage ? (
                          <img
                            src={previewImage}
                            alt="User avatar preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white text-5xl">
                            {formData.username?.charAt(0).toUpperCase() || "U"}
                          </div>
                        )}
                      </div>
                      <div className="w-full">
                        <label className="block w-full px-4 py-2 bg-blue-500 text-white text-center rounded cursor-pointer hover:bg-blue-600">
                          Choose File
                          <input
                            type="file"
                            className="hidden"
                            onChange={handleFileChange}
                            accept="image/*"
                          />
                        </label>
                        <p className="text-sm text-center mt-2">
                          {formData.avatar?.name || "No file chosen"}
                        </p>
                      </div>
                    </div>

                    <div className="w-full md:w-3/4 px-3">
                      <div className="mb-6">
                        <label className="block text-gray-700 font-bold mb-2">
                          Email Address
                        </label>
                        <div className="flex">
                          <span className="inline-flex items-center px-3 border border-r-0 border-gray-300 bg-gray-200 text-gray-500 text-sm rounded-l-md">
                            @
                          </span>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="flex-1 appearance-none border border-gray-300 rounded-r-md py-2 px-4 bg-white text-gray-700 leading-tight focus:outline-none focus:border-blue-500"
                            required
                          />
                        </div>
                      </div>

                      <div className="mb-6">
                        <label className="block text-gray-700 font-bold mb-2">
                          Username
                        </label>
                        <input
                          type="text"
                          name="username"
                          value={formData.username}
                          onChange={handleInputChange}
                          className="appearance-none border border-gray-300 rounded w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:border-blue-500"
                          required
                        />
                      </div>

                      <div className="flex flex-wrap -mx-3">
                        <div className="w-full md:w-1/2 px-3 mb-6 md:mb-0">
                          <label className="block text-gray-700 font-bold mb-2">
                            First Name
                          </label>
                          <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            className="appearance-none border border-gray-300 rounded w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div className="w-full md:w-1/2 px-3">
                          <label className="block text-gray-700 font-bold mb-2">
                            Last Name
                          </label>
                          <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            className="appearance-none border border-gray-300 rounded w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Only show admin sections if the user has admin privileges */}
                  {user && user.role === 'admin' && (
                    <>
                      <div className="border-t pt-6">
                        <h2 className="text-xl font-semibold mb-6">User Status</h2>
                        <div className="mb-4">
                          <label className="inline-flex items-center">
                            <input
                              type="checkbox"
                              checked={isActivated}
                              onChange={(e) => setIsActivated(e.target.checked)}
                              className="form-checkbox h-5 w-5 text-blue-600"
                            />
                            <span className="ml-2 text-gray-700">User is activated</span>
                          </label>
                        </div>
                        <div className="mb-6">
                          <label className="inline-flex items-center">
                            <input
                              type="checkbox"
                              checked={isBanned}
                              onChange={(e) => setIsBanned(e.target.checked)}
                              className="form-checkbox h-5 w-5 text-blue-600"
                            />
                            <span className="ml-2 text-gray-700">User is banned</span>
                          </label>
                        </div>
                      </div>

                      <div className="border-t pt-6">
                        <h2 className="text-xl font-semibold mb-6">Groups</h2>
                        <p className="text-sm text-gray-600 mb-4">
                          Groups that the user belongs to (you do not have permission to modify the list).
                        </p>
                        <div className="border rounded-md overflow-y-auto h-32">
                          <ul className="p-2">
                            {groups.map((group, index) => (
                              <li
                                key={index}
                                className="py-1 px-2 bg-gray-200 text-gray-700 mb-1"
                              >
                                {group}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="mt-8 text-right">
                    <button
                      type="submit"
                      className={`bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
                        isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Saving..." : "Save Profile"}
                    </button>
                  </div>
                </form>
              )}

              {activeTab === "security" && <Security user={user} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
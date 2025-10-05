// // src/components/Profile.js
// import React, { useState, useEffect } from 'react';
// import { useAuth } from '../contexts/AuthContext';
// import { useNavigate } from 'react-router-dom';

// function Profile() {
//   const { user, isAuthenticated, loading: authLoading, makeAuthenticatedRequest } = useAuth();
//   const navigate = useNavigate();

//   const [profileData, setProfileData] = useState(null);
//   const [formValues, setFormValues] = useState({
//     first_name: '',
//     last_name: '',
//     email: '',
//     phone_number: '',
//     password: '',
//   });
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [successMessage, setSuccessMessage] = useState('');
//   const [isEditing, setIsEditing] = useState(false);

//   useEffect(() => {
//     if (!authLoading && !isAuthenticated) {
//       navigate('/login');
//       return;
//     }
//     if (isAuthenticated && !profileData) {
//       fetchUserProfile();
//     }
//   }, [isAuthenticated, authLoading, navigate, profileData]);

//   const fetchUserProfile = async () => {
//     setLoading(true);
//     setError('');
//     try {
//       const result = await makeAuthenticatedRequest('/auth/me', 'GET');
//       if (result?.success) {
//         setProfileData(result.data.user);
//         setFormValues({
//           first_name: result.data.user.first_name,
//           last_name: result.data.user.last_name,
//           email: result.data.user.email,
//           phone_number: result.data.user.phone_number,
//           password: '',
//         });
//       } else {
//         setError(result?.error || 'Failed to fetch profile data.');
//       }
//     } catch (err) {
//       console.error('Profile fetch error:', err);
//       setError('An unexpected error occurred while fetching profile data.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleFormChange = (e) => {
//     const { id, value } = e.target;
//     setFormValues((prev) => ({ ...prev, [id]: value }));
//   };

//   const handleUpdateProfile = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setError('');
//     setSuccessMessage('');

//     const payload = {};
//     if (formValues.first_name !== profileData.first_name) payload.first_name = formValues.first_name;
//     if (formValues.last_name !== profileData.last_name) payload.last_name = formValues.last_name;
//     if (formValues.email !== profileData.email) payload.email = formValues.email;
//     if (formValues.phone_number !== profileData.phone_number) payload.phone_number = formValues.phone_number;
//     if (formValues.password) {
//       if (formValues.password.length < 8) {
//         setError('Password must be at least 8 characters long.');
//         setLoading(false);
//         return;
//       }
//       payload.password = formValues.password;
//     }

//     if (Object.keys(payload).length === 0) {
//       setError('No changes to save.');
//       setLoading(false);
//       setIsEditing(false);
//       return;
//     }

//     try {
//       const result = await makeAuthenticatedRequest('/auth/me', 'PUT', payload);
//       if (result?.success) {
//         setSuccessMessage('Profile updated successfully!');
//         fetchUserProfile();
//       } else {
//         setError(result?.error || 'Failed to update profile.');
//       }
//     } catch (err) {
//       console.error('Profile update error:', err);
//       setError('An unexpected error occurred while updating profile.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (authLoading || loading) {
//     return <div className="text-center py-8 text-base sm:text-lg text-primary px-4">Loading profile...</div>;
//   }

//   if (error && !profileData) {
//     return (
//       <div className="bg-white p-4 sm:p-8 rounded-lg shadow-md w-full max-w-md mx-4 text-center text-red-500 text-sm sm:text-base">
//         Error: {error}
//       </div>
//     );
//   }

//   if (!profileData) {
//     return <div className="text-center py-8 text-base sm:text-lg text-gray-700 px-4">No profile data available.</div>;
//   }

//   return (
//     <div className="bg-white p-4 sm:p-8 rounded-lg shadow-md w-full max-w-2xl mx-4 text-center">
//       <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-primary">My Profile</h2>
//       {successMessage && <p className="text-green-500 text-xs sm:text-sm mb-4">{successMessage}</p>}
//       {error && <p className="text-red-500 text-xs sm:text-sm mb-4">{error}</p>}

//       {!isEditing ? (
//         <div className="profile-details text-left space-y-2 text-sm sm:text-base">
//           <p><strong className="font-semibold text-gray-700">First Name:</strong> {profileData.first_name}</p>
//           <p><strong className="font-semibold text-gray-700">Last Name:</strong> {profileData.last_name}</p>
//           <p className="break-words"><strong className="font-semibold text-gray-700">Email:</strong> {profileData.email}</p>
//           <p><strong className="font-semibold text-gray-700">Phone Number:</strong> {profileData.phone_number}</p>
//           <p><strong className="font-semibold text-gray-700">Roles:</strong> {profileData.roles ? profileData.roles.join(', ') : 'N/A'}</p>
//           <p><strong className="font-semibold text-gray-700">Member Since:</strong> {new Date(profileData.created_at).toLocaleDateString()}</p>
//           <button
//             onClick={() => setIsEditing(true)}
//             className="bg-secondary hover:bg-primary text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors duration-200 mt-4 text-sm sm:text-base w-full sm:w-auto"
//           >
//             Edit Profile
//           </button>
//         </div>
//       ) : (
//         <form onSubmit={handleUpdateProfile} className="profile-edit-form space-y-3 sm:space-y-4 text-left">
//           <div>
//             <label htmlFor="first_name" className="block text-gray-700 text-xs sm:text-sm font-bold mb-2">First Name:</label>
//             <input
//               type="text"
//               id="first_name"
//               className="shadow appearance-none border rounded w-full py-2 px-3 text-sm sm:text-base text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-secondary"
//               value={formValues.first_name}
//               onChange={handleFormChange}
//               required
//             />
//           </div>
//           <div>
//             <label htmlFor="last_name" className="block text-gray-700 text-xs sm:text-sm font-bold mb-2">Last Name:</label>
//             <input
//               type="text"
//               id="last_name"
//               className="shadow appearance-none border rounded w-full py-2 px-3 text-sm sm:text-base text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-secondary"
//               value={formValues.last_name}
//               onChange={handleFormChange}
//               required
//             />
//           </div>
//           <div>
//             <label htmlFor="email" className="block text-gray-700 text-xs sm:text-sm font-bold mb-2">Email:</label>
//             <input
//               type="email"
//               id="email"
//               className="shadow appearance-none border rounded w-full py-2 px-3 text-sm sm:text-base text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-secondary"
//               value={formValues.email}
//               onChange={handleFormChange}
//               required
//             />
//           </div>
//           <div>
//             <label htmlFor="phone_number" className="block text-gray-700 text-xs sm:text-sm font-bold mb-2">Phone Number:</label>
//             <input
//               type="tel"
//               id="phone_number"
//               className="shadow appearance-none border rounded w-full py-2 px-3 text-sm sm:text-base text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-secondary"
//               value={formValues.phone_number}
//               onChange={handleFormChange}
//               required
//             />
//           </div>
//           <div>
//             <label htmlFor="password" className="block text-gray-700 text-xs sm:text-sm font-bold mb-2">New Password (leave blank to keep current):</label>
//             <input
//               type="password"
//               id="password"
//               className="shadow appearance-none border rounded w-full py-2 px-3 text-sm sm:text-base text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-secondary"
//               value={formValues.password}
//               onChange={handleFormChange}
//             />
//           </div>
//           <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4 mt-4">
//             <button
//               type="submit"
//               disabled={loading}
//               className="bg-primary hover:bg-secondary text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
//             >
//               {loading ? 'Saving...' : 'Save Changes'}
//             </button>
//             <button
//               type="button"
//               onClick={() => {
//                 setIsEditing(false);
//                 setFormValues(profileData);
//                 setError('');
//                 setSuccessMessage('');
//               }}
//               className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors duration-200 text-sm sm:text-base"
//             >
//               Cancel
//             </button>
//           </div>
//         </form>
//       )}
//     </div>
//   );
// }

// export default Profile;


import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Camera, User, Mail, Phone, Calendar, Shield } from 'lucide-react';

function Profile() {
  const { user, isAuthenticated, loading: authLoading, makeAuthenticatedRequest } = useAuth();
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState(null);
  const [formValues, setFormValues] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    password: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
      return;
    }
    if (isAuthenticated && !profileData) {
      fetchUserProfile();
    }
  }, [isAuthenticated, authLoading, navigate, profileData]);

  const fetchUserProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await makeAuthenticatedRequest('/auth/me', 'GET');
      if (result?.success) {
        setProfileData(result.data.user);
        setFormValues({
          first_name: result.data.user.first_name,
          last_name: result.data.user.last_name,
          email: result.data.user.email,
          phone_number: result.data.user.phone_number,
          password: '',
        });
      } else {
        setError(result?.error || 'Failed to fetch profile data.');
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
      setError('An unexpected error occurred while fetching profile data.');
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { id, value } = e.target;
    setFormValues((prev) => ({ ...prev, [id]: value }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Avatar image must be less than 5MB');
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;

    setUploadingAvatar(true);
    setError('');
    setSuccessMessage('');

    const formData = new FormData();
    formData.append('avatar', avatarFile);

    try {
      const result = await makeAuthenticatedRequest('/auth/avatar', 'POST', formData, true);
      if (result?.success) {
        setSuccessMessage('Avatar updated successfully!');
        setAvatarFile(null);
        setAvatarPreview(null);
        fetchUserProfile();
      } else {
        setError(result?.error || 'Failed to upload avatar.');
      }
    } catch (err) {
      console.error('Avatar upload error:', err);
      setError('An unexpected error occurred while uploading avatar.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    const payload = {};
    if (formValues.first_name !== profileData.first_name) payload.first_name = formValues.first_name;
    if (formValues.last_name !== profileData.last_name) payload.last_name = formValues.last_name;
    if (formValues.email !== profileData.email) payload.email = formValues.email;
    if (formValues.phone_number !== profileData.phone_number) payload.phone_number = formValues.phone_number;
    if (formValues.password) {
      if (formValues.password.length < 8) {
        setError('Password must be at least 8 characters long.');
        setLoading(false);
        return;
      }
      payload.password = formValues.password;
    }

    if (Object.keys(payload).length === 0) {
      setError('No changes to save.');
      setLoading(false);
      setIsEditing(false);
      return;
    }

    try {
      const result = await makeAuthenticatedRequest('/auth/me', 'PUT', payload);
      if (result?.success) {
        setSuccessMessage('Profile updated successfully!');
        fetchUserProfile();
        setIsEditing(false);
      } else {
        setError(result?.error || 'Failed to update profile.');
      }
    } catch (err) {
      console.error('Profile update error:', err);
      setError('An unexpected error occurred while updating profile.');
    } finally {
      setLoading(false);
    }
  };

  const getUserInitials = () => {
    if (!profileData) return '';
    const firstInitial = profileData.first_name ? profileData.first_name.charAt(0).toUpperCase() : '';
    const lastInitial = profileData.last_name ? profileData.last_name.charAt(0).toUpperCase() : '';
    return `${firstInitial}${lastInitial}`;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-700 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error && !profileData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center border border-red-200">
          <div className="text-red-500 text-lg font-semibold">Error: {error}</div>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center px-4">
        <p className="text-lg text-gray-700">No profile data available.</p>
      </div>
    );
  }

  const showInitials = !avatarPreview && !profileData.avatar_url;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8 sm:py-12 px-4">
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>

      <div className="max-w-xl sm:max-w-4xl mx-auto space-y-4 sm:space-y-6"> {/* Responsive max-width and spacing */}
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8 animate-fade-in"> {/* Responsive margin */}
          <h1 className="text-3xl sm:text-5xl font-black mb-2 sm:mb-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"> {/* Responsive text size */}
            My Profile
          </h1>
          <p className="text-gray-600 text-base sm:text-lg">Manage your account information</p> {/* Responsive text size */}
        </div>

        {/* Alerts */}
        {successMessage && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 text-green-800 px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-lg animate-fade-in text-sm sm:text-base"> {/* Responsive padding, border-radius, and text size */}
            <p className="font-semibold">{successMessage}</p>
          </div>
        )}
        {error && (
          <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-300 text-red-800 px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-lg animate-fade-in text-sm sm:text-base"> {/* Responsive padding, border-radius, and text size */}
            <p className="font-semibold">{error}</p>
          </div>
        )}

        {/* Avatar Card */}
        <div className="bg-white/90 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl shadow-blue-500/10 p-6 sm:p-8 border border-white/20 animate-fade-in"> {/* Responsive padding and border-radius */}
          <h2 className="text-xl sm:text-2xl font-black mb-4 sm:mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> {/* Responsive text size */}
            Profile Picture
          </h2>
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6"> {/* Responsive flex direction and spacing */}
            <div className="relative group">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-purple-500 shadow-xl sm:shadow-2xl border-4 border-white transform group-hover:scale-105 transition-transform duration-300 flex items-center justify-center"> {/* Responsive size and flex centering */}
                {showInitials ? (
                  <span className="text-white text-4xl sm:text-5xl font-bold">
                    {getUserInitials()}
                  </span>
                ) : (avatarPreview || profileData.avatar_url ? (
                  <img
                    src={avatarPreview || profileData.avatar_url}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-14 h-14 sm:w-16 sm:h-16 text-white" />
                ))}
              </div>
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-2 sm:p-3 rounded-full cursor-pointer hover:shadow-2xl shadow-lg transition-all duration-300 transform hover:scale-110" 
              >
                <Camera className="w-4 h-4 sm:w-5 sm:h-5" /> {/* Responsive icon size */}
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex-1 text-center sm:text-left w-full"> {/* Responsive text alignment and full width on small screens */}
              <p className="text-gray-600 mb-3 sm:mb-4 font-medium text-sm sm:text-base"> {/* Responsive margin and text size */}
                Upload a profile picture. Max size: 5MB
              </p>
              {avatarFile && (
                <div className="space-y-3">
                  <p className="text-gray-900 font-semibold text-sm sm:text-base"> {/* Responsive text size */}
                    Selected: {avatarFile.name}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3"> {/* Responsive flex direction */}
                    <button
                      onClick={handleAvatarUpload}
                      disabled={uploadingAvatar}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-5 py-2 sm:px-6 sm:py-2.5 rounded-xl hover:shadow-2xl disabled:opacity-50 transition-all duration-300 font-semibold shadow-lg transform hover:scale-105 disabled:transform-none text-sm sm:text-base"
                    >
                      {uploadingAvatar ? 'Uploading...' : 'Upload Avatar'}
                    </button>
                    <button
                      onClick={() => {
                        setAvatarFile(null);
                        setAvatarPreview(null);
                      }}
                      className="bg-gray-200 text-gray-700 px-5 py-2 sm:px-6 sm:py-2.5 rounded-xl hover:bg-gray-300 transition-all duration-300 font-semibold text-sm sm:text-base"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Profile Information Card */}
        <div className="bg-white/90 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl shadow-blue-500/10 p-6 sm:p-8 border border-white/20 animate-fade-in"> {/* Responsive padding and border-radius */}
          <h2 className="text-xl sm:text-2xl font-black mb-4 sm:mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> {/* Responsive text size */}
            Profile Information
          </h2>

          {!isEditing ? (
            <div className="space-y-4 sm:space-y-6"> {/* Responsive spacing */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6"> {/* Responsive grid and spacing */}
                <div className="group">
                  <div className="flex items-center gap-2 mb-1 sm:mb-2"> {/* Responsive margin */}
                    <User className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" /> {/* Responsive icon size */}
                    <p className="text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-wide">First Name</p> {/* Responsive text size */}
                  </div>
                  <p className="text-base sm:text-lg font-semibold text-gray-900 pl-6 sm:pl-7">{profileData.first_name}</p> {/* Responsive text size and padding */}
                </div>
                <div className="group">
                  <div className="flex items-center gap-2 mb-1 sm:mb-2">
                    <User className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                    <p className="text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-wide">Last Name</p>
                  </div>
                  <p className="text-base sm:text-lg font-semibold text-gray-900 pl-6 sm:pl-7">{profileData.last_name}</p>
                </div>
                <div className="group">
                  <div className="flex items-center gap-2 mb-1 sm:mb-2">
                    <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                    <p className="text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-wide">Email</p>
                  </div>
                  <p className="text-base sm:text-lg font-semibold text-gray-900 break-words pl-6 sm:pl-7">{profileData.email}</p>
                </div>
                <div className="group">
                  <div className="flex items-center gap-2 mb-1 sm:mb-2">
                    <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                    <p className="text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-wide">Phone Number</p>
                  </div>
                  <p className="text-base sm:text-lg font-semibold text-gray-900 pl-6 sm:pl-7">{profileData.phone_number}</p>
                </div>
                <div className="group">
                  <div className="flex items-center gap-2 mb-1 sm:mb-2">
                    <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                    <p className="text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-wide">Roles</p>
                  </div>
                  <p className="text-base sm:text-lg font-semibold text-gray-900 pl-6 sm:pl-7">{profileData.roles ? profileData.roles.join(', ') : 'N/A'}</p>
                </div>
                <div className="group">
                  <div className="flex items-center gap-2 mb-1 sm:mb-2">
                    <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-pink-600" />
                    <p className="text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-wide">Member Since</p>
                  </div>
                  <p className="text-base sm:text-lg font-semibold text-gray-900 pl-6 sm:pl-7">{new Date(profileData.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditing(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl hover:shadow-2xl transition-all duration-300 font-bold shadow-lg transform hover:scale-105 mt-4 sm:mt-6 text-sm sm:text-base"
              >
                Edit Profile
              </button>
            </div>
          ) : (
            <form onSubmit={handleUpdateProfile} className="space-y-4 sm:space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <div>
                  <label htmlFor="first_name" className="block text-xs sm:text-sm font-bold text-gray-700 mb-1 sm:mb-2 uppercase tracking-wide">
                    First Name
                  </label>
                  <input
                    type="text"
                    id="first_name"
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border-2 border-gray-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white text-gray-900 font-medium text-sm sm:text-base"
                    value={formValues.first_name}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="last_name" className="block text-xs sm:text-sm font-bold text-gray-700 mb-1 sm:mb-2 uppercase tracking-wide">
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="last_name"
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border-2 border-gray-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white text-gray-900 font-medium text-sm sm:text-base"
                    value={formValues.last_name}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-xs sm:text-sm font-bold text-gray-700 mb-1 sm:mb-2 uppercase tracking-wide">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border-2 border-gray-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white text-gray-900 font-medium text-sm sm:text-base"
                    value={formValues.email}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="phone_number" className="block text-xs sm:text-sm font-bold text-gray-700 mb-1 sm:mb-2 uppercase tracking-wide">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone_number"
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border-2 border-gray-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white text-gray-900 font-medium text-sm sm:text-base"
                    value={formValues.phone_number}
                    onChange={handleFormChange}
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor="password" className="block text-xs sm:text-sm font-bold text-gray-700 mb-1 sm:mb-2 uppercase tracking-wide">
                  New Password (leave blank to keep current)
                </label>
                <input
                  type="password"
                  id="password"
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border-2 border-gray-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white text-gray-900 font-medium text-sm sm:text-base"
                  value={formValues.password}
                  onChange={handleFormChange}
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-3 sm:pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl hover:shadow-2xl disabled:opacity-50 transition-all duration-300 font-bold shadow-lg transform hover:scale-105 disabled:transform-none text-sm sm:text-base" /* Responsive padding and text size */
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setFormValues({
                      first_name: profileData.first_name,
                      last_name: profileData.last_name,
                      email: profileData.email,
                      phone_number: profileData.phone_number,
                      password: '',
                    });
                    setError('');
                    setSuccessMessage('');
                  }}
                  className="bg-gray-200 text-gray-700 px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl hover:bg-gray-300 transition-all duration-300 font-bold text-sm sm:text-base" /* Responsive padding and text size */
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;
import axios from 'axios';

// Create a central Axios instance pointing to your Node.js backend
const api = axios.create({
    // FIX: Use Vercel's live URL first, and fallback to localhost only if we are testing locally
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
});

// Automatically attach the JWT token to every request if the user is logged in
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;

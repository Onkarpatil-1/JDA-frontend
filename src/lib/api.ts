// Central API configuration
// Change VITE_API_BASE_URL in .env to point to a different backend
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1';

export default API_BASE;

const API_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : 'http://localhost:5000/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    Authorization: token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json'
  };
};

export const api = {
  // OCR & Prescription upload
  uploadPrescription: async (formData) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/ocr/upload`, {
      method: 'POST',
      headers: {
        Authorization: token ? `Bearer ${token}` : ''
        // Content-Type is set automatically by fetch when using FormData
      },
      body: formData
    });
    return res.json();
  },

  getPrescriptions: async () => {
    const res = await fetch(`${API_URL}/ocr/prescriptions`, {
      headers: getHeaders()
    });
    return res.json();
  },

  getPrescriptionById: async (id, lang = 'en') => {
    const res = await fetch(`${API_URL}/ocr/prescriptions/${id}?lang=${lang}`, {
      headers: getHeaders()
    });
    return res.json();
  },

  deletePrescription: async (id) => {
    const res = await fetch(`${API_URL}/ocr/prescriptions/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return res.json();
  },

  downloadPDFUrl: (id) => {
    return `${API_URL}/ocr/prescriptions/${id}/pdf?token=${localStorage.getItem('token')}`;
  },

  // Medicines
  searchMedicines: async (query, lang = 'en') => {
    const res = await fetch(`${API_URL}/medicines/search?q=${encodeURIComponent(query)}&lang=${lang}`, {
      headers: getHeaders()
    });
    return res.json();
  },

  getMedicineById: async (id, lang = 'en') => {
    const res = await fetch(`${API_URL}/medicines/${id}?lang=${lang}`, {
      headers: getHeaders()
    });
    return res.json();
  },

  addMedicine: async (medicineData) => {
    const res = await fetch(`${API_URL}/medicines`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(medicineData)
    });
    return res.json();
  },

  updateMedicine: async (id, medicineData) => {
    const res = await fetch(`${API_URL}/medicines/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(medicineData)
    });
    return res.json();
  },

  deleteMedicine: async (id) => {
    const res = await fetch(`${API_URL}/medicines/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return res.json();
  },

  // AI Chat
  sendChatMessage: async (chatHistory, message, language) => {
    const res = await fetch(`${API_URL}/chat`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ chatHistory, message, language })
    });
    return res.json();
  },

  simplifyTerm: async (term, lang = 'en') => {
    const res = await fetch(`${API_URL}/chat/simplify?term=${encodeURIComponent(term)}&lang=${lang}`, {
      headers: getHeaders()
    });
    return res.json();
  },

  // Emergency Info
  getEmergencyData: async () => {
    const res = await fetch(`${API_URL}/emergency`, {
      headers: getHeaders()
    });
    return res.json();
  },

  // Admin
  getAdminAnalytics: async () => {
    const res = await fetch(`${API_URL}/admin/analytics`, {
      headers: getHeaders()
    });
    return res.json();
  },

  getAllUsers: async () => {
    const res = await fetch(`${API_URL}/admin/users`, {
      headers: getHeaders()
    });
    return res.json();
  },

  updateUserRole: async (id, role) => {
    const res = await fetch(`${API_URL}/admin/users/${id}/role`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ role })
    });
    return res.json();
  },

  submitFeedback: async (rating, comments) => {
    const res = await fetch(`${API_URL}/admin/feedback`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ rating, comments })
    });
    return res.json();
  },

  getAllFeedback: async () => {
    const res = await fetch(`${API_URL}/admin/feedback`, {
      headers: getHeaders()
    });
    return res.json();
  }
};

import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useLanguage } from '../context/LanguageContext';
import { useAccessibility } from '../context/AccessibilityContext';
import {
  Settings,
  Users,
  FileText,
  Pill,
  MessageSquare,
  Star,
  Plus,
  Trash2,
  Check,
  AlertCircle
} from 'lucide-react';

const AdminPanel = () => {
  const { t } = useLanguage();
  const { speakText } = useAccessibility();

  const [analytics, setAnalytics] = useState(null);
  const [userList, setUserList] = useState([]);
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state for adding new medicines manually
  const [newMed, setNewMed] = useState({
    name: '',
    genericName: '',
    descriptionSimple: '',
    uses: '',
    dosage: '',
    sideEffects: '',
    warnings: '',
    precautions: '',
    alternatives: ''
  });

  const [activeTab, setActiveTab] = useState('analytics'); // analytics, users, medicines, feedback

  useEffect(() => {
    fetchAdminData();
  }, [activeTab]);

  const fetchAdminData = async () => {
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'analytics') {
        const res = await api.getAdminAnalytics();
        if (res.success) setAnalytics(res.data);
      } else if (activeTab === 'users') {
        const res = await api.getAllUsers();
        if (res.success) setUserList(res.data);
      } else if (activeTab === 'feedback') {
        const res = await api.getAllFeedback();
        if (res.success) setFeedbackList(res.data);
      }
    } catch (err) {
      setError('Failed to retrieve administrative records.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    setError('');
    setSuccess('');
    try {
      const res = await api.updateUserRole(userId, newRole);
      if (res.success) {
        setSuccess('User role updated successfully');
        // Refresh users
        const updatedUsers = await api.getAllUsers();
        if (updatedUsers.success) setUserList(updatedUsers.data);
      } else {
        setError(res.message || 'Failed to update role');
      }
    } catch (err) {
      setError('Error updating user role.');
    }
  };

  const handleMedSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Format fields
    const payload = {
      name: newMed.name.trim(),
      genericName: newMed.genericName.trim(),
      descriptionSimple: newMed.descriptionSimple.trim(),
      uses: newMed.uses.split(',').map((x) => x.trim()).filter((x) => x !== ''),
      dosage: newMed.dosage.trim(),
      sideEffects: newMed.sideEffects.split(',').map((x) => x.trim()).filter((x) => x !== ''),
      warnings: newMed.warnings.split(',').map((x) => x.trim()).filter((x) => x !== ''),
      precautions: newMed.precautions.split(',').map((x) => x.trim()).filter((x) => x !== ''),
      alternatives: newMed.alternatives.split(',').map((x) => x.trim()).filter((x) => x !== '')
    };

    try {
      const res = await api.addMedicine(payload);
      if (res.success) {
        setSuccess(`Medicine "${payload.name}" added successfully.`);
        // Reset form
        setNewMed({
          name: '',
          genericName: '',
          descriptionSimple: '',
          uses: '',
          dosage: '',
          sideEffects: '',
          warnings: '',
          precautions: '',
          alternatives: ''
        });
      } else {
        setError(res.message || 'Failed to add medicine profile.');
      }
    } catch (err) {
      setError('Error adding medicine record.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-healthcare-500 flex items-center justify-center text-white shadow-md">
          <Settings className="w-5.5 h-5.5" />
        </div>
        <div>
          <h2 className="font-bold text-2xl text-gray-800 dark:text-white">Admin Control Panel</h2>
          <p className="text-xs sm:text-sm text-gray-500">Monitor system registers, user credentials, and medicine cache databases.</p>
        </div>
      </div>

      {/* Tabs bar */}
      <div className="flex border-b border-gray-100 dark:border-navy-850 gap-2 overflow-x-auto pb-px">
        {[
          { id: 'analytics', label: 'Analytics', icon: FileText },
          { id: 'users', label: 'User Roles', icon: Users },
          { id: 'medicines', label: 'Add Medicine', icon: Pill },
          { id: 'feedback', label: 'Feedbacks', icon: MessageSquare }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-xs sm:text-sm transition-all rounded-t-xl whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-healthcare-500 text-healthcare-600 dark:text-healthcare-400 bg-healthcare-50/10'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-navy-850'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 text-xs sm:text-sm font-semibold text-red-700 dark:text-red-300 flex items-center gap-2">
          <AlertCircle className="w-4.5 h-4.5 text-red-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/50 text-xs sm:text-sm font-semibold text-green-700 dark:text-green-300 flex items-center gap-2">
          <Check className="w-4.5 h-4.5 text-green-500 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Tab Panel Canvas */}
      <div className="bg-white dark:bg-navy-900 border border-gray-100 dark:border-navy-800 rounded-3xl p-5 shadow-sm min-h-[50vh]">
        
        {loading && activeTab !== 'medicines' ? (
          <div className="text-center py-20 text-gray-450">{t('loading')}</div>
        ) : (
          <>
            {/* Analytics Tab */}
            {activeTab === 'analytics' && analytics && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Users', count: analytics.counts.users, icon: Users, color: 'text-blue-500 bg-blue-50' },
                    { label: 'Scanned Prescriptions', count: analytics.counts.prescriptions, icon: FileText, color: 'text-emerald-500 bg-emerald-50' },
                    { label: 'Medicines Cached', count: analytics.counts.medicines, icon: Pill, color: 'text-purple-500 bg-purple-50' },
                    { label: 'Feedback Reviews', count: analytics.counts.feedback, icon: MessageSquare, color: 'text-pink-500 bg-pink-50' }
                  ].map((c, idx) => {
                    const Icon = c.icon;
                    return (
                      <div key={idx} className="p-4 bg-gray-50 dark:bg-navy-800/40 border border-gray-100 dark:border-navy-800 rounded-2xl flex items-center gap-3">
                        <div className={`p-3 rounded-xl ${c.color} dark:bg-opacity-10 shadow-sm`}>
                          <Icon className="w-5.5 h-5.5" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-500 dark:text-navy-400">{c.label}</p>
                          <h4 className="font-bold text-xl text-gray-800 dark:text-white mt-0.5">{c.count}</h4>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-50 dark:border-navy-850">
                  {/* User Roles details */}
                  <div className="p-4 border border-gray-100 dark:border-navy-800 rounded-2xl">
                    <h4 className="font-bold text-sm text-gray-500 dark:text-navy-450 mb-3 uppercase tracking-wider">User Roles</h4>
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center text-sm font-semibold">
                        <span className="text-gray-600 dark:text-navy-300">Patients (मरीज):</span>
                        <span className="font-bold text-gray-800 dark:text-white">{analytics.roles.patient}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm font-semibold">
                        <span className="text-gray-600 dark:text-navy-300">Doctors (चिकित्सक):</span>
                        <span className="font-bold text-gray-800 dark:text-white">{analytics.roles.doctor}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm font-semibold">
                        <span className="text-gray-600 dark:text-navy-300">Administrators:</span>
                        <span className="font-bold text-gray-800 dark:text-white">{analytics.roles.admin}</span>
                      </div>
                    </div>
                  </div>

                  {/* Feedback Ratings */}
                  <div className="p-4 border border-gray-100 dark:border-navy-800 rounded-2xl flex flex-col justify-center items-center text-center">
                    <h4 className="font-bold text-sm text-gray-500 dark:text-navy-450 mb-2 uppercase tracking-wider">Average Platform Rating</h4>
                    <div className="flex items-center gap-1.5 text-yellow-500">
                      <Star className="w-8 h-8 fill-current" />
                      <span className="text-4xl font-extrabold text-gray-850 dark:text-white">{analytics.averageRating}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-2 font-semibold">Out of {analytics.counts.feedback} ratings</p>
                  </div>
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-navy-800 text-gray-500 dark:text-navy-450">
                      <th className="py-3 px-2">Name / Email</th>
                      <th className="py-3 px-2">Role</th>
                      <th className="py-3 px-2">Language Preference</th>
                      <th className="py-3 px-2 text-right">Edit Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userList.map((usr) => (
                      <tr key={usr._id} className="border-b border-gray-50 dark:border-navy-800/40">
                        <td className="py-3.5 px-2">
                          <div className="font-bold text-gray-800 dark:text-white">{usr.name}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{usr.email}</div>
                        </td>
                        <td className="py-3.5 px-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                            usr.role === 'admin' ? 'bg-red-100 text-red-700' : usr.role === 'doctor' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {usr.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-2 text-xs uppercase text-gray-500">{usr.languagePreference}</td>
                        <td className="py-3.5 px-2 text-right">
                          <select
                            value={usr.role}
                            onChange={(e) => handleRoleChange(usr._id, e.target.value)}
                            className="px-2 py-1 bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-lg text-xs font-bold text-gray-700 dark:text-navy-200"
                          >
                            <option value="patient">Patient</option>
                            <option value="doctor">Doctor</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Medicines Form Tab */}
            {activeTab === 'medicines' && (
              <form onSubmit={handleMedSubmit} className="space-y-4 max-w-2xl mx-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Brand Name (English)</label>
                    <input
                      type="text"
                      required
                      value={newMed.name}
                      onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
                      placeholder="e.g. Paracetamol 650mg"
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-xl text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Generic Name</label>
                    <input
                      type="text"
                      required
                      value={newMed.genericName}
                      onChange={(e) => setNewMed({ ...newMed, genericName: e.target.value })}
                      placeholder="e.g. Acetaminophen"
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-xl text-sm focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Simplified Purpose (descriptionSimple)</label>
                  <input
                    type="text"
                    required
                    value={newMed.descriptionSimple}
                    onChange={(e) => setNewMed({ ...newMed, descriptionSimple: e.target.value })}
                    placeholder="e.g. Reduces body fever and provides relief from joint pains."
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-xl text-sm focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Common Uses (comma-separated)</label>
                    <input
                      type="text"
                      required
                      value={newMed.uses}
                      onChange={(e) => setNewMed({ ...newMed, uses: e.target.value })}
                      placeholder="Fever, Toothache, Muscle pain"
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-xl text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Typical Dosage</label>
                    <input
                      type="text"
                      required
                      value={newMed.dosage}
                      onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })}
                      placeholder="1 tablet three times daily after food"
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-xl text-sm focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Side Effects (comma-separated)</label>
                    <input
                      type="text"
                      value={newMed.sideEffects}
                      onChange={(e) => setNewMed({ ...newMed, sideEffects: e.target.value })}
                      placeholder="Nausea, Sleepiness, Dizziness"
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-xl text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Alternatives (comma-separated brands)</label>
                    <input
                      type="text"
                      value={newMed.alternatives}
                      onChange={(e) => setNewMed({ ...newMed, alternatives: e.target.value })}
                      placeholder="Dolo 650, Calpol 650"
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-xl text-sm focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Warnings (comma-separated)</label>
                    <input
                      type="text"
                      value={newMed.warnings}
                      onChange={(e) => setNewMed({ ...newMed, warnings: e.target.value })}
                      placeholder="Avoid alcohol, Do not drive"
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-xl text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Precautions (comma-separated)</label>
                    <input
                      type="text"
                      value={newMed.precautions}
                      onChange={(e) => setNewMed({ ...newMed, precautions: e.target.value })}
                      placeholder="Consult doctor during pregnancy"
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-xl text-sm focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-healthcare-500 hover:bg-healthcare-600 text-white font-bold rounded-2xl shadow-md transition-all focus:outline-none"
                >
                  Create Medicine Entry
                </button>
              </form>
            )}

            {/* Feedbacks Tab */}
            {activeTab === 'feedback' && (
              <div className="space-y-4">
                {feedbackList.map((fb) => (
                  <div key={fb._id} className="p-4 bg-gray-50 dark:bg-navy-800/40 border border-gray-100 dark:border-navy-800 rounded-2xl flex items-start gap-4">
                    <div className="flex items-center gap-0.5 text-yellow-500 mt-1">
                      {Array.from({ length: fb.rating }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800 dark:text-white">"{fb.comments}"</p>
                      <p className="text-xs text-gray-400 mt-1 font-semibold">
                        Submitted by: {fb.user?.name || 'Anonymous Patient'} ({fb.user?.email || 'N/A'}) • {new Date(fb.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
};

export default AdminPanel;

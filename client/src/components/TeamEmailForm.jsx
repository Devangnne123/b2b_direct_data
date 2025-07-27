import React, { useState } from 'react';
import axios from 'axios';

const TeamEmailForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    name: ''
  });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    setSuccess(false);

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/team-emails`, formData);
      setSuccess(true);
      setFormData({ email: '', name: '' }); // Reset form
      console.log('Team email added:', response.data);
    } catch (error) {
      if (error.response) {
        // Backend validation errors
        if (error.response.data.errors) {
          const errorMap = {};
          error.response.data.errors.forEach(err => {
            const field = err.path || 'general';
            errorMap[field] = err.message;
          });
          setErrors(errorMap);
        } else if (error.response.data.error) {
          setErrors({ general: error.response.data.error });
        }
      } else {
        setErrors({ general: 'Network error or server unavailable' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Add Team Email</h2>
      
      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
          Team email added successfully!
        </div>
      )}

      {errors.general && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`mt-1 block w-full rounded-md border ${errors.email ? 'border-red-500' : 'border-gray-300'} shadow-sm p-2`}
            required
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
          )}
        </div>

        <div className="mb-4">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Name (Optional)
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2"
            maxLength="100"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isSubmitting ? 'Submitting...' : 'Add Team Email'}
        </button>
      </form>
    </div>
  );
};

export default TeamEmailForm;
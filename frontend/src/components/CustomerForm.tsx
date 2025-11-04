import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Customer } from '../types/Customer';

interface CustomerFormProps {
  apiBaseUrl: string;
}

const CustomerForm: React.FC<CustomerFormProps> = ({ apiBaseUrl }) => {
  const navigate = useNavigate();
  const { email } = useParams<{ email: string }>();
  const isEdit = Boolean(email);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isEdit && email) {
      fetchCustomer(decodeURIComponent(email));
    }
  }, [isEdit, email]);

  const fetchCustomer = async (customerEmail: string) => {
    try {
      setLoading(true);
      const response = await fetch(`${apiBaseUrl}/api/customers/${encodeURIComponent(customerEmail)}`);
      if (!response.ok) throw new Error('Customer not found');
      const customer: Customer = await response.json();
      setFormData({
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load customer');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Invalid email format';
    if (!formData.phone.trim()) errors.phone = 'Phone is required';
    if (!formData.address.trim()) errors.address = 'Address is required';

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError(null);

      const url = isEdit 
        ? `${apiBaseUrl}/api/customers/${encodeURIComponent(email!)}`
        : `${apiBaseUrl}/api/customers`;
      
      const method = isEdit ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save customer');
      }

      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleCancel = () => {
    navigate('/');
  };

  if (loading && isEdit) return <div className="loading">Loading customer...</div>;

  return (
    <div className="customer-form">
      <div className="form-header">
        <h2>{isEdit ? 'Edit Customer' : 'Add New Customer'}</h2>
      </div>

      {error && <div className="message error">{error}</div>}

      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label htmlFor="name">Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={validationErrors.name ? 'error' : ''}
            disabled={loading}
          />
          {validationErrors.name && <span className="error-text">{validationErrors.name}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="email">Email *</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={validationErrors.email ? 'error' : ''}
            disabled={loading || isEdit}
          />
          {validationErrors.email && <span className="error-text">{validationErrors.email}</span>}
          {isEdit && <small className="help-text">Email cannot be changed</small>}
        </div>

        <div className="form-group">
          <label htmlFor="phone">Phone *</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className={validationErrors.phone ? 'error' : ''}
            disabled={loading}
          />
          {validationErrors.phone && <span className="error-text">{validationErrors.phone}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="address">Address *</label>
          <textarea
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            className={validationErrors.address ? 'error' : ''}
            disabled={loading}
            rows={3}
          />
          {validationErrors.address && <span className="error-text">{validationErrors.address}</span>}
        </div>

        <div className="form-actions">
          <button type="button" onClick={handleCancel} className="btn btn-secondary" disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : (isEdit ? 'Update Customer' : 'Create Customer')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CustomerForm;

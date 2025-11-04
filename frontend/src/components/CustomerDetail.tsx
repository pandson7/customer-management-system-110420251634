import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Customer } from '../types/Customer';
import ConfirmDialog from './ConfirmDialog';

interface CustomerDetailProps {
  apiBaseUrl: string;
}

const CustomerDetail: React.FC<CustomerDetailProps> = ({ apiBaseUrl }) => {
  const { email } = useParams<{ email: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (email) {
      fetchCustomer(decodeURIComponent(email));
    }
  }, [email]);

  const fetchCustomer = async (customerEmail: string) => {
    try {
      setLoading(true);
      const response = await fetch(`${apiBaseUrl}/api/customers/${encodeURIComponent(customerEmail)}`);
      if (!response.ok) throw new Error('Customer not found');
      const data = await response.json();
      setCustomer(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load customer');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!customer) return;
    
    try {
      const response = await fetch(`${apiBaseUrl}/api/customers/${encodeURIComponent(customer.email)}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete customer');
      
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete customer');
    }
  };

  if (loading) return <div className="loading">Loading customer...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!customer) return <div className="error">Customer not found</div>;

  return (
    <div className="customer-detail">
      <div className="detail-header">
        <h2>Customer Details</h2>
        <div className="actions">
          <Link to={`/edit/${encodeURIComponent(customer.email)}`} className="btn btn-warning">Edit</Link>
          <button onClick={() => setShowDeleteDialog(true)} className="btn btn-danger">Delete</button>
          <Link to="/" className="btn btn-secondary">Back to List</Link>
        </div>
      </div>

      <div className="detail-content">
        <div className="detail-section">
          <h3>Personal Information</h3>
          <div className="detail-grid">
            <div className="detail-item">
              <label>Name:</label>
              <span>{customer.name}</span>
            </div>
            <div className="detail-item">
              <label>Email:</label>
              <span>{customer.email}</span>
            </div>
            <div className="detail-item">
              <label>Phone:</label>
              <span>{customer.phone}</span>
            </div>
            <div className="detail-item">
              <label>Address:</label>
              <span>{customer.address}</span>
            </div>
          </div>
        </div>

        <div className="detail-section">
          <h3>System Information</h3>
          <div className="detail-grid">
            <div className="detail-item">
              <label>Customer ID:</label>
              <span>{customer.customerId}</span>
            </div>
            <div className="detail-item">
              <label>Registration Date:</label>
              <span>{new Date(customer.registrationDate).toLocaleString()}</span>
            </div>
            <div className="detail-item">
              <label>Last Modified:</label>
              <span>{new Date(customer.lastModified).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {showDeleteDialog && (
        <ConfirmDialog
          title="Delete Customer"
          message={`Are you sure you want to delete ${customer.name}? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteDialog(false)}
        />
      )}
    </div>
  );
};

export default CustomerDetail;

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Customer } from '../types/Customer';
import SearchBar from './SearchBar';
import ConfirmDialog from './ConfirmDialog';

interface CustomerListProps {
  apiBaseUrl: string;
}

const CustomerList: React.FC<CustomerListProps> = ({ apiBaseUrl }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteCustomer, setDeleteCustomer] = useState<Customer | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiBaseUrl}/api/customers`);
      if (!response.ok) throw new Error('Failed to fetch customers');
      const data = await response.json();
      setCustomers(data);
      setFilteredCustomers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    if (!query.trim()) {
      setFilteredCustomers(customers);
    } else {
      const filtered = customers.filter(customer =>
        customer.name.toLowerCase().includes(query.toLowerCase()) ||
        customer.email.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredCustomers(filtered);
    }
  };

  const handleDeleteClick = (customer: Customer) => {
    setDeleteCustomer(customer);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteCustomer) return;
    
    try {
      const response = await fetch(`${apiBaseUrl}/api/customers/${encodeURIComponent(deleteCustomer.email)}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete customer');
      
      setMessage('Customer deleted successfully');
      setDeleteCustomer(null);
      fetchCustomers();
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete customer');
    }
  };

  const handleDeleteCancel = () => {
    setDeleteCustomer(null);
  };

  if (loading) return <div className="loading">Loading customers...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="customer-list">
      <div className="list-header">
        <h2>Customer List</h2>
        <Link to="/add" className="btn btn-primary">Add New Customer</Link>
      </div>

      {message && <div className="message success">{message}</div>}

      <SearchBar onSearch={handleSearch} />

      {filteredCustomers.length === 0 ? (
        <div className="empty-state">
          <p>No customers found.</p>
          <Link to="/add" className="btn btn-primary">Add your first customer</Link>
        </div>
      ) : (
        <div className="table-container">
          <table className="customers-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Registration Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map(customer => (
                <tr key={customer.email}>
                  <td>{customer.name}</td>
                  <td>{customer.email}</td>
                  <td>{customer.phone}</td>
                  <td>{new Date(customer.registrationDate).toLocaleDateString()}</td>
                  <td className="actions">
                    <Link to={`/customer/${encodeURIComponent(customer.email)}`} className="btn btn-sm btn-info">View</Link>
                    <Link to={`/edit/${encodeURIComponent(customer.email)}`} className="btn btn-sm btn-warning">Edit</Link>
                    <button onClick={() => handleDeleteClick(customer)} className="btn btn-sm btn-danger">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {deleteCustomer && (
        <ConfirmDialog
          title="Delete Customer"
          message={`Are you sure you want to delete ${deleteCustomer.name}? This action cannot be undone.`}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      )}
    </div>
  );
};

export default CustomerList;

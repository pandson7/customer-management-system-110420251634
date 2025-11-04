import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import CustomerList from './components/CustomerList';
import CustomerForm from './components/CustomerForm';
import CustomerDetail from './components/CustomerDetail';
import './App.css';

const API_BASE_URL = 'https://dkmxi2x441.execute-api.us-east-1.amazonaws.com/prod';

function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <nav className="navbar">
            <div className="nav-brand">
              <h1>Customer Management System</h1>
            </div>
            <div className="nav-links">
              <Link to="/" className="nav-link">Customers</Link>
              <Link to="/add" className="nav-link">Add Customer</Link>
            </div>
          </nav>
        </header>
        
        <main className="main-content">
          <Routes>
            <Route path="/" element={<CustomerList apiBaseUrl={API_BASE_URL} />} />
            <Route path="/add" element={<CustomerForm apiBaseUrl={API_BASE_URL} />} />
            <Route path="/edit/:email" element={<CustomerForm apiBaseUrl={API_BASE_URL} />} />
            <Route path="/customer/:email" element={<CustomerDetail apiBaseUrl={API_BASE_URL} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

import React from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate, useLocation } from 'react-router-dom';
import './Header.css';

function Header({ user }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Only show header if we're on the main page and user is logged in
  if (location.pathname !== '/' || !user) {
    return null;
  }

  return (
    <header className="app-header">
      <div className="header-content">
        <h1>Track Your Money</h1>
        <button 
          className="sign-out-btn"
          onClick={handleSignOut}
        >
          Sign Out
        </button>
      </div>
    </header>
  );
}

export default Header; 
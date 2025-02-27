import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const SideNav = () => {
    const location = useLocation();
    
    return (
        <nav className="sidenav">
            <div className="sidenav-content">
                <Link 
                    to="/admin" 
                    className={`nav-item ${location.pathname === '/admin' ? 'active' : ''}`}
                >
                    Admin
                </Link>
                <Link 
                    to="/user" 
                    className={`nav-item ${location.pathname === '/user' ? 'active' : ''}`}
                >
                    User
                </Link>
            </div>
        </nav>
    );
};

export default SideNav; 
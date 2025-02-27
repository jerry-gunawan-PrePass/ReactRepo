import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import '../assets/sidenav.css';

const SideNav: React.FC = () => {
    const location = useLocation();
    
    // Check if the current path matches the link
    const isActive = (path: string) => {
        return location.pathname === path;
    };

    return (
        <div className="sidenav">
            <div className="sidenav-header">
                <h2 className="sidenav-title">Taskboard</h2>
            </div>
            <nav className="sidenav-nav">
                <Link to="/admin" className={`sidenav-link ${isActive('/admin') ? 'active' : ''}`}>
                    Parent View
                </Link>
                <Link to="/user" className={`sidenav-link ${isActive('/user') ? 'active' : ''}`}>
                    User View
                </Link>
                <Link to="/kid/profile" className={`sidenav-link ${isActive('/kid/profile') ? 'active' : ''}`}>
                    Kid Profile
                </Link>
            </nav>
            <div className="sidenav-footer">
                <ThemeToggle />
            </div>
        </div>
    );
};

export default SideNav; 
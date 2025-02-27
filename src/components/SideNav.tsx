import React from 'react';
import { NavLink } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

const SideNav = () => {
    return (
        <nav className="sidenav">
            <div className="sidenav-content">
                <NavLink 
                    to="/admin" 
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                    Admin View
                </NavLink>
                <NavLink 
                    to="/user" 
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                    User View
                </NavLink>
                <div className="mt-auto pt-4 flex justify-center">
                    <ThemeToggle />
                </div>
            </div>
        </nav>
    );
};

export default SideNav; 
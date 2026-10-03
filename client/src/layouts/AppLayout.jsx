import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const AppLayout = () => {
  return (
    <div className="layout-container">
      <Sidebar />
      <div className="main-content">
        <Navbar />
        <div className="content-area">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AppLayout;

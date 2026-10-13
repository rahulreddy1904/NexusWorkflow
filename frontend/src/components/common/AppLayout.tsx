import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { useAuth } from '../../context/AuthContext';
import { WorkspaceOnboarding } from './WorkspaceOnboarding';

export const AppLayout: React.FC = () => {
  const { hasWorkspace } = useAuth();

  if (!hasWorkspace) {
    return <WorkspaceOnboarding />;
  }

  return (
    <div className="flex min-h-screen bg-[#0f1115] text-slate-100 font-sans selection:bg-cyan-500 selection:text-black">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 p-5 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;

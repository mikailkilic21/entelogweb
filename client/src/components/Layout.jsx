import React from 'react';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
    return (
        <div className="min-h-screen bg-slate-950 flex">
            <Sidebar />
            <main className="flex-1 ml-64 min-h-screen bg-slate-950/50 relative">
                {/* Background Decor */}
                <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-blue-900/10 to-transparent pointer-events-none -z-10" />

                {/* Content Area */}
                <div className="p-0">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;

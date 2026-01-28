import React from 'react';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
    return (
        <div className="min-h-screen bg-slate-950 flex print:bg-white print:block">
            <div className="print:hidden">
                <Sidebar />
            </div>
            <main className="flex-1 ml-64 print:ml-0 min-h-screen bg-slate-950/50 relative print:bg-white print:w-full print:h-auto print:overflow-visible">
                {/* Background Decor */}
                <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-blue-900/10 to-transparent pointer-events-none -z-10 print:hidden" />

                {/* Content Area */}
                <div className="p-0 print:p-0">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;

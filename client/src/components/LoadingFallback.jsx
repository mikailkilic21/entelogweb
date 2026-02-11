import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingFallback = () => {
    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-950">
            <Loader2 className="animate-spin text-emerald-500" size={48} />
        </div>
    );
};

export default LoadingFallback;

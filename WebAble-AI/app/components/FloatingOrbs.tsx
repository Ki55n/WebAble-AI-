"use client";

export default function FloatingOrbs() {
    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
            {/* Floating orbs with different speeds and positions */}
            <div className="absolute top-20 left-10 w-40 h-40 bg-blue-400 rounded-full blur-3xl opacity-15 animate-float" style={{ animationDelay: '0s' }}></div>
            <div className="absolute top-40 right-20 w-32 h-32 bg-cyan-400 rounded-full blur-3xl opacity-15 animate-float" style={{ animationDelay: '2s' }}></div>
            <div className="absolute bottom-40 left-1/3 w-48 h-48 bg-purple-400 rounded-full blur-3xl opacity-15 animate-float" style={{ animationDelay: '4s' }}></div>
            <div className="absolute bottom-20 right-10 w-36 h-36 bg-blue-300 rounded-full blur-3xl opacity-15 animate-float" style={{ animationDelay: '6s' }}></div>
            <div className="absolute top-1/2 left-1/2 w-44 h-44 bg-cyan-400 rounded-full blur-3xl opacity-10 animate-float" style={{ animationDelay: '3s' }}></div>
        </div>
    );
}

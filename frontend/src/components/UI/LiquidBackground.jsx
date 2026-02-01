import React from 'react';

const LiquidBackground = () => {
    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
            {/* Dark base */}
            <div className="absolute inset-0 bg-[#050505] transition-colors duration-500" />

            {/* Blob 1 - Rose/Pink */}
            <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-rose-500/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob"></div>

            {/* Blob 2 - Indigo/Blue */}
            <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-indigo-500/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-2000"></div>

            {/* Blob 3 - Purple */}
            <div className="absolute -bottom-32 left-[20%] w-[50vw] h-[50vw] bg-purple-500/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-4000"></div>

            {/* Glass Overlay (Noise/Texture if needed, currently clean) */}
            <div className="absolute inset-0 bg-transparent" />
        </div>
    );
};

export default LiquidBackground;

    import React, { useState, useEffect } from 'react';

    const Preloader = ({ isLoading }) => {
    const [shouldRender, setShouldRender] = useState(true);

    // Handle the unmounting logic after the fade-out animation
    useEffect(() => {
        if (!isLoading) {
        const timer = setTimeout(() => {
            setShouldRender(false);
        }, 500); // Match CSS transition duration
        return () => clearTimeout(timer);
        }
    }, [isLoading]);

    // Lock body scroll when loading
    useEffect(() => {
        if (shouldRender) {
        document.body.style.overflow = 'hidden';
        } else {
        document.body.style.overflow = 'auto';
        }
        return () => { document.body.style.overflow = 'auto'; };
    }, [shouldRender]);

    if (!shouldRender) return null;

    // Configuration for the 5 wave bars
    const bars = [
        { height: '60%', color: '#A5B4FC', delay: '0s' },
        { height: '80%', color: '#818CF8', delay: '0.1s' },
        { height: '100%', color: '#6366F1', delay: '0.2s' },
        { height: '80%', color: '#4F46E5', delay: '0.3s' },
        { height: '60%', color: '#4338CA', delay: '0.4s' },
    ];

    return (
        <>
        <style>
            {`
            @keyframes wave {
                0%, 100% { transform: scaleY(0.3); }
                50% { transform: scaleY(1); }
            }
            .wave-bar {
                animation: wave 1.2s ease-in-out infinite;
            }
            `}
        </style>
        
        <div 
            className={`fixed inset-0 z-[9999] flex items-center justify-center bg-white transition-opacity duration-500 ease-out ${
            isLoading ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
        >
            <div className="flex flex-col items-center gap-8">
            {/* Audio Wave Animation */}
            <div className="flex items-center justify-center gap-[6px] h-[60px] w-[100px]">
                {bars.map((bar, index) => (
                <span
                    key={index}
                    className="wave-bar block w-2 rounded-full relative"
                    style={{
                    height: '100%', 
                    maxHeight: bar.height, 
                    backgroundColor: bar.color,
                    animationDelay: bar.delay,
                    }}
                />
                ))}
            </div>

            {/* Loading Text */}
            <div className="flex flex-col items-center">
                <p className="text-indigo-900 font-bold text-lg tracking-widest uppercase">
                Initializing Voice Notes AI
                </p>
            </div>
            </div>
        </div>
        </>
    );
    };

    export default Preloader;
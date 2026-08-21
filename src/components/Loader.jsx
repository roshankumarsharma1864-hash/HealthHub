import React, { useEffect, useRef } from 'react';
import lottie from 'lottie-web';
import animationData from '../assets/heart-lottie.json';

export const Loader = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const anim = lottie.loadAnimation({
      container: containerRef.current,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      animationData: animationData
    });

    // Cleanup to prevent duplicate initializations on re-renders
    return () => anim.destroy();
  }, []);

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/65 dark:bg-slate-950/80 backdrop-blur-md animate-fade-in select-none">
      <div className="flex flex-col items-center gap-3">
        <div ref={containerRef} className="w-36 h-36" />
        <span className="text-xs font-bold text-blue-500 dark:text-blue-400 tracking-widest uppercase animate-pulse">
          Loading HEALTH HUB Records...
        </span>
      </div>
    </div>
  );
};
export default Loader;

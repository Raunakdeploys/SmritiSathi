import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export const BackToTopButton: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const checkScroll = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', checkScroll, { passive: true });
    return () => window.removeEventListener('scroll', checkScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!isVisible) return null;

  return (
    <button
      id="btn-back-to-top"
      onClick={scrollToTop}
      title="Scroll back to top"
      aria-label="Back to top"
      className="fixed bottom-24 right-6 z-40 bg-white/90 dark:bg-slate-800/90 text-[#002045] dark:text-white p-3 rounded-full shadow-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all hover:scale-110 active:scale-95 cursor-pointer flex items-center justify-center"
    >
      <ArrowUp className="w-5 h-5 text-[#FF6321]" />
    </button>
  );
};

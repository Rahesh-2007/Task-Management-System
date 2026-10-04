import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, X } from 'lucide-react';

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('todoist_cookie_consent');
    if (!consent) {
      // Show after small delay for smooth entrance
      const timer = setTimeout(() => setIsVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('todoist_cookie_consent', 'accepted');
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('todoist_cookie_consent', 'declined');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-6 pointer-events-none"
          role="region"
          aria-label="Cookie consent banner"
        >
          <div className="max-w-4xl mx-auto bg-white/95 backdrop-blur-md rounded-2xl shadow-modal border border-neutral-200/80 p-5 sm:p-6 pointer-events-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-brand-light flex items-center justify-center text-brand flex-shrink-0 mt-0.5">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h2 className="text-sm font-semibold text-todoist-text">We respect your privacy</h2>
                <p className="text-xs sm:text-sm text-todoist-subtext leading-relaxed">
                  We use cookies to improve your experience, analyze usage, and provide tailored task management features. You can customize your preferences anytime.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full md:w-auto justify-end flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-neutral-100">
              <button
                type="button"
                onClick={handleDecline}
                className="px-4 py-2 text-xs sm:text-sm font-medium text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-brand"
              >
                Decline
              </button>
              <button
                type="button"
                onClick={handleAccept}
                className="px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-brand hover:bg-brand-hover active:bg-brand-active rounded-lg transition-all shadow-sm hover:shadow focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
              >
                Accept All
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

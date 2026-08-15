import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer
      id="app-footer"
      className="border-t border-[#DDDDD6] dark:border-[#262B26] bg-transparent py-6 text-center text-xs text-[#7A837A] dark:text-[#A0AAA0] mt-12 transition-colors duration-200"
    >
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-center gap-2">
        <nav
          aria-label="Attribution credits"
          className="flex flex-wrap items-center justify-center gap-1.5 leading-relaxed"
        >
          <span>Challenge by</span>
          <a
            href="https://www.frontendmentor.io?ref=challenge"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline transition-colors"
          >
            FrontendMentor
          </a>
          <span className="text-[#A0AAA0] dark:text-[#525E52]">•</span>
          <span>Coded by</span>
          <a
            href="https://www.frontendmentor.io/profile/Rocabor"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline transition-colors"
          >
            @Rocabor
          </a>
          <span className="ml-1 text-[#7A837A] dark:text-[#6B766B]">&copy; 2026</span>
        </nav>
      </div>
    </footer>
  );
};

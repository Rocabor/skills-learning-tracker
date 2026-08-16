import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer
      id="app-footer"
      className="border-t border-[#DDDDD6] dark:border-[#262B26] bg-transparent py-4 text-center text-xs text-[#5F6A5F] dark:text-[#A0AAA0] transition-colors duration-200"
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
    
    <span className="hidden sm:inline text-[#A0AAA0] dark:text-[#525E52]">•</span>   
       
    <div className="basis-full  sm:hidden" />

    <span>Coded by</span>
    <a
      href="https://www.frontendmentor.io/profile/Rocabor"
      target="_blank"
      rel="noopener noreferrer"
      className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline transition-colors"
    >
      @Rocabor
    </a>
    <span className="ml-1 text-[#5F6A5F] dark:text-[#A0AAA0]">&copy; 2026</span>
  </nav>
</div>

    </footer>
  );
};

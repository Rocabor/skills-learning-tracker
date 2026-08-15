import React from 'react';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  id?: string;
}

export const Switch: React.FC<SwitchProps> = ({ checked, onChange, label, id }) => {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative w-12 h-7 rounded-full transition-colors duration-150 cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F9F9F7] dark:focus-visible:ring-offset-[#232823] ${
        checked ? 'bg-emerald-700' : 'bg-[#D8DCD8] dark:bg-[#3A403A]'
      }`}
    >
      <span
        aria-hidden="true"
        className={`absolute top-1/2 -translate-y-1/2 text-[8px] font-bold tracking-wide leading-none transition-colors duration-150 ${
          checked ? 'left-2 text-white' : 'right-2 text-[#5F6A5F] dark:text-[#A0AAA0]'
        }`}
      >
        {checked ? 'ON' : 'OFF'}
      </span>
      <span
        aria-hidden="true"
        className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-150 ${
          checked ? 'right-0.5' : 'left-0.5'
        }`}
      />
    </button>
  );
};

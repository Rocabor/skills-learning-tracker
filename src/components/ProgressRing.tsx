import React from 'react';

interface ProgressRingProps {
  progress: number; // 0 to 100+
  size?: number; // diameter in pixels
  strokeWidth?: number;
  color?: string; // hex color or css color
  trackColor?: string;
  label?: string;
  sublabel?: string;
  showPercent?: boolean;
  animate?: boolean;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 130,
  strokeWidth = 10,
  color = '#059669',
  trackColor,
  label,
  sublabel,
  showPercent = true,
  animate = true,
}) => {
  const clampedProgress = Math.max(0, Math.min(progress, 100));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (clampedProgress / 100) * circumference;

  return (
    <div
      className="relative inline-flex flex-col items-center justify-center"
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label || `Progress: ${Math.round(progress)}%`}
    >
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        style={{ overflow: 'visible' }}
      >
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor || 'currentColor'}
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-[#E8E8E3] dark:text-[#262B26]"
        />

        {/* Foreground Progress Arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          style={{
            transition: animate ? 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
          }}
        />
      </svg>

      {/* Inner Label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
        {showPercent && (
          <span className="font-display font-bold text-2xl tracking-tight text-[#1A1D1A] dark:text-[#ECF0EC]">
            {Math.round(progress)}%
          </span>
        )}
        {label && (
          <span className="text-[11px] font-medium text-[#5F6A5F] dark:text-[#A0AAA0] leading-tight mt-0.5">
            {label}
          </span>
        )}
        {sublabel && (
          <span className="text-[10px] text-[#5F6A5F] dark:text-[#6B766B]">
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
};

import React from 'react';

type TournamentNavbarItemVariant = 'active' | 'default' | 'disabled';

interface TournamentNavbarItemProps {
  label: string;
  icon: React.ReactNode;
  variant?: TournamentNavbarItemVariant;
  onClick?: () => void;
}

export default function TournamentNavbarItem({
  label,
  icon,
  variant = 'default',
  onClick,
}: TournamentNavbarItemProps) {
  const baseClasses =
    'group w-[374px] h-[53px] rounded-[16px] flex flex-col items-center justify-center gap-0.5 select-none transition-all duration-200';

  const isDisabled = variant === 'disabled';
  const isActive = variant === 'active';

  const containerClasses = [
    baseClasses,
    isActive ? 'bg-[#172339] text-white shadow-md cursor-pointer hover:bg-[#172339]/90 hover:backdrop-blur-sm hover:shadow-[0_0_10px_rgba(23,35,57,0.1)]' : 'cursor-pointer hover:bg-[#172339]/85 hover:backdrop-blur-sm hover:shadow-[0_0_10px_rgba(23,35,57,0.1)] text-[#A3AED0]',
    isDisabled ? 'opacity-60 pointer-events-none' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const labelClasses = isActive
    ? "text-white font-medium text-[16px] leading-[24px] font-['Montserrat']"
    : isDisabled
      ? 'text-gray-400 text-[16px] leading-[24px] font-["Montserrat"]'
      : "text-[#37393E] group-hover:text-white font-normal group-hover:font-medium text-[16px] leading-[24px] font-['Montserrat']";

  return (
    <button
      type="button"
      className={containerClasses}
      onClick={onClick}
      aria-disabled={isDisabled}
    >
      <div className="w-5 h-5 inline-flex justify-center items-center mb-0.5 translate-y-[3px]">{icon}</div>
      <div className={`${labelClasses} -translate-y-[3px]`}>{label}</div>
    </button>
  );
}



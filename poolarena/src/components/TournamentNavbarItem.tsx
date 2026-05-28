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
    'group flex-1 flex flex-col items-center justify-center select-none transition-all duration-200 h-[40px] sm:h-[54px] rounded-[12px] sm:rounded-[14px] px-1 min-[360px]:px-2.5 sm:px-4';

  const isDisabled = variant === 'disabled';
  const isActive = variant === 'active';

  const containerClasses = [
    baseClasses,
    isActive
      ? 'bg-[#172339] text-white shadow-sm cursor-pointer'
      : 'cursor-pointer text-[#37393E] hover:bg-[#172339]/10 hover:text-[#172339]',
    isDisabled ? 'opacity-40 pointer-events-none' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const labelClasses = isActive
    ? "text-white font-medium text-[10px] sm:text-[16px] leading-[14px] sm:leading-[20px] font-['Montserrat']"
    : isDisabled
      ? 'text-gray-400 text-[10px] sm:text-[16px] leading-[14px] sm:leading-[20px] font-["Montserrat"]'
      : "text-[#37393E] font-normal text-[10px] sm:text-[16px] leading-[14px] sm:leading-[20px] font-['Montserrat'] group-hover:text-[#172339]";

  return (
    <button
      type="button"
      className={containerClasses}
      onClick={onClick}
      aria-disabled={isDisabled}
    >
      <div className="w-5 h-5 sm:w-5 sm:h-5 inline-flex justify-center items-center mb-0.5 sm:mb-1 [&>svg]:sm:w-5 [&>svg]:sm:h-5">{icon}</div>
      <div className={labelClasses}>{label}</div>
    </button>
  );
}



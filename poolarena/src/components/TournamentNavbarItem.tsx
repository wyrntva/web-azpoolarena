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
    'group flex-1 flex flex-col items-center justify-center select-none transition-all duration-200 h-[40px] sm:h-[53px] rounded-[12px] sm:rounded-[14px] px-1 sm:px-4';

  const isDisabled = variant === 'disabled';
  const isActive = variant === 'active';

  const containerClasses = [
    baseClasses,
    isActive
      ? 'bg-[#172339] text-white shadow-sm cursor-pointer'
      : isDisabled
        ? 'cursor-default text-[#37393E] opacity-40 hover:opacity-100 hover:bg-[#afb2ba] hover:text-white'
        : 'cursor-pointer text-[#37393E] hover:bg-[#2e394c] hover:text-white',
  ]
    .filter(Boolean)
    .join(' ');

  const labelClasses = isActive
    ? "text-white font-medium text-[10px] sm:text-[16px] leading-[14px] sm:leading-[20px] font-['Montserrat']"
    : isDisabled
      ? 'text-gray-400 text-[10px] sm:text-[16px] leading-[14px] sm:leading-[20px] font-["Montserrat"] group-hover:text-white'
      : "text-[#37393E] font-normal text-[10px] sm:text-[16px] leading-[14px] sm:leading-[20px] font-['Montserrat'] group-hover:text-white";

  return (
    <button
      type="button"
      className={containerClasses}
      onClick={isDisabled ? undefined : onClick}
      aria-disabled={isDisabled}
    >
      <div className="w-5 h-5 sm:w-5 sm:h-5 inline-flex justify-center items-center mb-0.5 sm:mb-1 [&>svg]:sm:w-5 [&>svg]:sm:h-5">{icon}</div>
      <div className={labelClasses}>{label}</div>
    </button>
  );
}



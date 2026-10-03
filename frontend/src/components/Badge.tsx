import React from 'react';
import clsx from 'clsx';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'solid' | 'outline' | 'muted';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'solid', className }) => {
  const baseClasses = 'px-2 py-1 text-xs font-semibold rounded-full inline-block';
  const variantClasses = {
    solid: 'bg-black text-white',
    outline: 'bg-white text-black border border-black',
    muted: 'bg-gray-200 text-gray-800'
  };

  return (
    <span className={clsx(baseClasses, variantClasses[variant], className)}>
      {children}
    </span>
  );
};

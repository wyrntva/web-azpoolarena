import type { ElementType } from 'react';

export interface navItemProps {
  item: {
    icon: string;
    href?: string;
    disabled?: boolean;
    title?: string;
    subtitle?: string;
    chip?: string;
    chipColor?: string;
    variant?: string;
    external?: boolean;
    id: number;
  };
}

export interface listItemType {
  component: ElementType;
  href?: string;
  target?: string;
  to?: string;
}

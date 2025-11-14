/**
 * Type declaration for @radix-ui/react-checkbox
 * This ensures TypeScript can find the module types
 */
declare module '@radix-ui/react-checkbox' {
  import * as React from 'react';

  export interface CheckboxProps extends React.ComponentPropsWithoutRef<'button'> {
    checked?: boolean | 'indeterminate';
    defaultChecked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
    disabled?: boolean;
    required?: boolean;
    name?: string;
    value?: string;
  }

  export const Root: React.ForwardRefExoticComponent<
    CheckboxProps & React.RefAttributes<HTMLButtonElement>
  >;

  export interface CheckboxIndicatorProps extends React.ComponentPropsWithoutRef<'span'> {
    forceMount?: boolean;
  }

  export const Indicator: React.ForwardRefExoticComponent<
    CheckboxIndicatorProps & React.RefAttributes<HTMLSpanElement>
  >;
}


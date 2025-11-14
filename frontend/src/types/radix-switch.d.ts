/**
 * Type declaration for @radix-ui/react-switch
 * This ensures TypeScript can find the module types
 */
declare module '@radix-ui/react-switch' {
  import * as React from 'react';

  export interface SwitchProps extends React.ComponentPropsWithoutRef<'button'> {
    checked?: boolean;
    defaultChecked?: boolean;
    required?: boolean;
    onCheckedChange?(checked: boolean): void;
  }

  export interface SwitchThumbProps extends React.ComponentPropsWithoutRef<'span'> {}

  export const Root: React.ForwardRefExoticComponent<
    SwitchProps & React.RefAttributes<HTMLButtonElement>
  >;

  export const Thumb: React.ForwardRefExoticComponent<
    SwitchThumbProps & React.RefAttributes<HTMLSpanElement>
  >;
}


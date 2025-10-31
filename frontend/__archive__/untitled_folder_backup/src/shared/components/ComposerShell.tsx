import React from "react";

type Props = React.HTMLAttributes<HTMLDivElement>;

export function ComposerShell({ className = "", ...props }: Props) {
  return (
    <div
      className={`flex items-center gap-2 p-2 border-2 border-slate-200 rounded-2xl focus-within:border-lime-400 bg-white ${className}`}
      {...props}
    />
  );
}
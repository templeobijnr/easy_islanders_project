import React from "react";

type Props = React.HTMLAttributes<HTMLDivElement>;

export function BubbleAgent({ className = "", ...props }: Props) {
  return (
    <div
      className={`max-w-[60%] text-sm p-3 rounded-2xl bg-slate-100 inline-flex items-center gap-2 ${className}`}
      {...props}
    />
  );
}
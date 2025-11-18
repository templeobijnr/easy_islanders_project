import React from "react";

type Props = React.HTMLAttributes<HTMLDivElement>;

export function BubbleAgent({ className = "", ...props }: Props) {
  return (
    <div
      className={`max-w-[60%] text-sm p-3 rounded-2xl bg-white border border-sand-200 shadow-sm inline-flex items-center gap-2 ${className}`}
      {...props}
    />
  );
}
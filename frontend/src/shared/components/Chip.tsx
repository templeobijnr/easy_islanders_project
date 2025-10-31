import React from "react";

type Props = React.HTMLAttributes<HTMLSpanElement>;

export function Chip({ className = "", ...props }: Props) {
  return <span className={`text-[11px] px-2 py-0.5 rounded-full border ${className}`} {...props} />;
}
import React from "react";

type Props = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className = "", ...props }: Props) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white hover:shadow-md overflow-hidden ${className}`}
      {...props}
    />
  );
}
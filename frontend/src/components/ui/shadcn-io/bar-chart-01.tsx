"use client";
import React, { useState } from "react";
import { MotionDiv, MotionSpan } from "../motion-wrapper";
import { cn } from "../../../lib/utils";

interface ChartData {
  label: string;
  value: number;
  color?: string;
}

const defaultData: ChartData[] = [
  { label: "Real Estate", value: 450, color: "from-blue-500 to-cyan-500" },
  { label: "Services", value: 320, color: "from-purple-500 to-pink-500" },
  { label: "Events", value: 280, color: "from-orange-500 to-red-500" },
  { label: "Marketplace", value: 180, color: "from-green-500 to-emerald-500" },
  { label: "Jobs", value: 150, color: "from-yellow-500 to-amber-500" },
];

export function ChartBarInteractive({
  data = defaultData,
  title = "Category Performance",
  subtitle = "View activity by category",
}: {
  data?: ChartData[];
  title?: string;
  subtitle?: string;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const maxValue = Math.max(...data.map((d) => d.value));

  return (
    <div className="w-full bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-lg p-6">
      {/* Header */}
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-neutral-900 dark:text-white">
          {title}
        </h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          {subtitle}
        </p>
      </div>

      {/* Chart */}
      <div className="space-y-6">
        {data.map((item, index) => {
          const percentage = (item.value / maxValue) * 100;
          const isHovered = hoveredIndex === index;

          return (
            <div key={item.label} className="relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                  {item.label}
                </span>
                <MotionSpan
                  className="text-sm font-bold text-neutral-900 dark:text-white"
                  animate={{
                    scale: isHovered ? 1.1 : 1,
                  }}
                  transition={{ duration: 0.2 }}
                >
                  {item.value}
                </MotionSpan>
              </div>

              {/* Bar Background */}
              <div className="relative h-12 bg-neutral-100 dark:bg-neutral-800 rounded-xl overflow-hidden">
                {/* Animated Bar */}
                <MotionDiv
                  className={cn(
                    "absolute inset-y-0 left-0 bg-gradient-to-r rounded-xl",
                    item.color || "from-brand-500 to-cyan-500"
                  )}
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{
                    duration: 0.8,
                    delay: index * 0.1,
                    ease: "easeOut",
                  }}
                  whileHover={{
                    scale: 1.02,
                    transition: { duration: 0.2 },
                  }}
                  onHoverStart={() => setHoveredIndex(index)}
                  onHoverEnd={() => setHoveredIndex(null)}
                >
                  {/* Shimmer Effect */}
                  <MotionDiv
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    animate={{
                      x: ["-100%", "200%"],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                </MotionDiv>

                {/* Value Label Inside Bar */}
                <div className="absolute inset-0 flex items-center px-4">
                  <MotionSpan
                    className="text-sm font-semibold text-white drop-shadow-md z-10"
                    animate={{
                      opacity: percentage > 20 ? 1 : 0,
                    }}
                  >
                    {percentage.toFixed(1)}%
                  </MotionSpan>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-800">
        <div className="flex flex-wrap gap-4 justify-center">
          {data.map((item, index) => (
            <MotionDiv
              key={item.label}
              className="flex items-center space-x-2 cursor-pointer"
              whileHover={{ scale: 1.05 }}
              onHoverStart={() => setHoveredIndex(index)}
              onHoverEnd={() => setHoveredIndex(null)}
            >
              <div
                className={cn(
                  "w-3 h-3 rounded-full bg-gradient-to-r",
                  item.color || "from-brand-500 to-cyan-500"
                )}
              />
              <span
                className={cn(
                  "text-xs font-medium transition-colors",
                  hoveredIndex === index
                    ? "text-neutral-900 dark:text-white"
                    : "text-neutral-600 dark:text-neutral-400"
                )}
              >
                {item.label}
              </span>
            </MotionDiv>
          ))}
        </div>
      </div>
    </div>
  );
}

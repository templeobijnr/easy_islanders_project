import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { spotlightSwap } from '../../../shared/motion/variants';
import { IconButton } from '../../../shared/components';
import { ChevronLeft, ChevronRight } from '../../../shared/icons';

type SpotlightItem = {
  id: string;
  title: string;
  description: string;
  image: string;
  ctaText?: string;
  onCtaClick?: () => void;
};

interface SpotlightProps {
  items: SpotlightItem[];
  intervalMs?: number;
}

const Spotlight: React.FC<SpotlightProps> = ({ items, intervalMs = 3500 }) => {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (!items?.length) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % items.length), intervalMs);
    return () => clearInterval(id);
  }, [items, intervalMs]);

  if (!items?.length) return null;
  const active = items[idx];

  return (
    <div className="relative rounded-2xl border border-slate-200 bg-gradient-to-r from-lime-50 to-emerald-50 p-4 overflow-hidden">
      <div className="absolute right-2 top-2 flex gap-1">
        <IconButton aria-label="Previous" onClick={() => setIdx((i) => (i - 1 + items.length) % items.length)}>
          <ChevronLeft />
        </IconButton>
        <IconButton aria-label="Next" onClick={() => setIdx((i) => (i + 1) % items.length)}>
          <ChevronRight />
        </IconButton>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={active.id}
          variants={spotlightSwap}
          initial="enter"
          animate="center"
          exit="exit"
          className="flex items-center justify-between gap-4"
        >
          <div>
            <div className="text-sm font-semibold">{active.title}</div>
            <div className="text-xs text-slate-600">{active.description}</div>
            {active.ctaText && (
              <button
                onClick={active.onCtaClick}
                className="mt-2 inline-flex items-center px-3 py-1.5 text-xs rounded-xl bg-lime-600 text-white hover:bg-lime-700"
              >
                {active.ctaText}
              </button>
            )}
          </div>
          <div className="h-20 w-28 bg-white/60 rounded-lg border border-white/70 shadow-inner flex items-center justify-center text-slate-400">
            image
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Spotlight;
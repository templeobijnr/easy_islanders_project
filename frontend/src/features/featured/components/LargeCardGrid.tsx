import React from 'react';
import { motion } from 'framer-motion';
import { cardHover, listStagger } from '../../../shared/motion/variants';
import { Card } from '../../../shared/components';

type LargeCardItem = {
  id: string;
  title: string;
  description: string;
  image: string;
  badge: string;
};

interface LargeCardGridProps {
  items: LargeCardItem[];
}

const LargeCardGrid: React.FC<LargeCardGridProps> = ({ items }) => {

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <motion.div
        variants={listStagger}
        initial="hidden"
        animate="visible"
      >
        {items.map((it) => (
          <motion.div key={it.id} variants={cardHover} whileHover="hover">
            <Card className="p-0 overflow-hidden">
            <div className="h-36 bg-slate-100 flex items-center justify-center text-slate-400">
              image
            </div>
            <div className="p-3">
              <div className="text-sm font-semibold line-clamp-1">{it.title}</div>
              <div className="text-xs text-slate-600 line-clamp-2">{it.description}</div>
              <div className="mt-2 text-[11px] px-2 py-0.5 rounded-full border inline-block">
                {it.badge}
              </div>
            </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default LargeCardGrid;
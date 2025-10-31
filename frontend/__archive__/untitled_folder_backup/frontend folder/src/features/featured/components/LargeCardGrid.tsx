import React from 'react';
import { motion } from 'framer-motion';
import { listStagger, cardHover } from '@/shared/motion/variants';
import Card from '@/shared/components';

interface LargeCardItem {
  id: string;
  title: string;
  description: string;
  image?: string;
  badge?: string;
  onClick?: () => void;
}

interface LargeCardGridProps {
  items: LargeCardItem[];
  columns?: 1 | 2 | 3 | 4;
}

const LargeCardGrid = ({ items, columns = 3 }: LargeCardGridProps) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };

  return (
    <motion.div
      className={`grid ${gridCols[columns]} gap-6`}
      variants={listStagger}
      initial="hidden"
      animate="show"
    >
      {items.map((item) => (
        <motion.div
          key={item.id}
          variants={cardHover}
          initial="rest"
          whileHover="hover"
        >
          <Card onClick={item.onClick} className="h-full cursor-pointer">
            {item.image && (
              <div className="relative mb-4">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-48 object-cover rounded-t-2xl"
                />
                {item.badge && (
                  <div className="absolute top-3 left-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1 rounded-2xl text-sm font-medium">
                    {item.badge}
                  </div>
                )}
              </div>
            )}

            <div className="flex-1">
              <h3 className="text-xl font-semibold text-slate-900 mb-2">{item.title}</h3>
              <p className="text-slate-600 leading-relaxed">{item.description}</p>
            </div>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default LargeCardGrid;
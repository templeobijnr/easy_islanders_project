import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { fadeInUp } from '../../../shared/motion/variants';
import { Button } from '../../../shared/components/index';

interface QuickAction {
  id: string;
  label: string;
  onClick: () => void;
}

interface QuickActionsProps {
  actions: QuickAction[];
}

const QuickActions = ({ actions }: QuickActionsProps) => {
  const [selectedJob, setSelectedJob] = useState<string>(() => {
    return localStorage.getItem('quickActions_selectedJob') || '';
  });

  useEffect(() => {
    localStorage.setItem('quickActions_selectedJob', selectedJob);
  }, [selectedJob]);
  return (
    <motion.div
      className="flex flex-wrap gap-2 px-6 py-4"
      variants={fadeInUp}
      initial="hidden"
      animate="show"
    >
      {actions.map((action) => (
        <Button
          key={action.id}
          variant={selectedJob === action.id ? "default" : "secondary"}
          size="sm"
          onClick={() => {
            setSelectedJob(action.id);
            action.onClick();
          }}
        >
          {action.label}
        </Button>
      ))}
    </motion.div>
  );
};

export default QuickActions;
/**
 * StatusBadge Component
 * Display booking status with color-coded badge
 */

import React from 'react';
import { Badge } from '../../../components/ui/badge';
import { statusConfig, type BookingStatus } from '../utils/bookingUtils';

interface StatusBadgeProps {
  status: BookingStatus;
  showIcon?: boolean;
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  showIcon = true,
  className = '',
}) => {
  const config = statusConfig[status];

  return (
    <Badge
      className={`${config.bgColor} ${config.color} border-0 ${className}`}
      variant="secondary"
    >
      {showIcon && <span className="mr-1">{config.icon}</span>}
      {config.label}
    </Badge>
  );
};

export default StatusBadge;

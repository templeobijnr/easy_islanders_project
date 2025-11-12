/**
 * PaymentBadge Component
 * Display payment status with color-coded badge
 */

import React from 'react';
import { Badge } from '../../../components/ui/badge';
import { paymentStatusConfig, type PaymentStatus } from '../utils/bookingUtils';

interface PaymentBadgeProps {
  paymentStatus: PaymentStatus;
  className?: string;
}

const PaymentBadge: React.FC<PaymentBadgeProps> = ({
  paymentStatus,
  className = '',
}) => {
  const config = paymentStatusConfig[paymentStatus];

  return (
    <Badge
      className={`${config.bgColor} ${config.color} border-0 ${className}`}
      variant="secondary"
    >
      {config.label}
    </Badge>
  );
};

export default PaymentBadge;

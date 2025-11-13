import React from 'react';
import { Variants } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import * as animations from '../../lib/animations';
import { MotionDiv } from './motion-wrapper';

interface AnimatedWrapperProps {
  children: React.ReactNode;
  animation?: keyof typeof animations;
  className?: string;
  delay?: number;
  duration?: number;
  as?: keyof JSX.IntrinsicElements;
}

/**
 * Easy-to-use animated wrapper component
 *
 * Usage:
 * <AnimatedWrapper animation="fadeInUp">
 *   <div>Your content</div>
 * </AnimatedWrapper>
 */
export const AnimatedWrapper: React.FC<AnimatedWrapperProps> = ({
  children,
  animation = 'fadeInUp',
  className = '',
  delay = 0,
  duration,
  as = 'div'
}) => {
  const MotionComponent = MotionDiv;
  const variant = animations[animation] as Variants;

  // Override duration if provided
  const customVariant = duration && variant.visible
    ? {
        ...variant,
        visible: {
          ...(variant.visible as any),
          transition: {
            ...(variant.visible as any).transition,
            duration,
            delay
          }
        }
      }
    : variant;

  return (
    <MotionComponent
      variants={customVariant}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </MotionComponent>
  );
};

/**
 * Page transition wrapper for smooth route changes
 * 
 * Usage:
 * <PageTransition>
 *   <YourPageContent />
 * </PageTransition>
 */
export const PageTransition: React.FC<{
  children: React.ReactNode;
  className?: string;
  delay?: number;
}> = ({ children, className = '', delay = 0 }) => {
  const location = useLocation();

  return (
    <MotionDiv
      key={location.pathname}
      variants={animations.pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ delay }}
      className={className}
    >
      {children}
    </MotionDiv>
  );
};

/**
 * Stagger container for list animations
 *
 * Usage:
 * <StaggerContainer>
 *   <StaggerItem>Item 1</StaggerItem>
 *   <StaggerItem>Item 2</StaggerItem>
 * </StaggerContainer>
 */
export const StaggerContainer: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return (
    <MotionDiv
      variants={animations.staggerContainer}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </MotionDiv>
  );
};

export const StaggerItem: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return (
    <MotionDiv variants={animations.staggerItem} className={className}>
      {children}
    </MotionDiv>
  );
};

/**
 * Animated card with hover effects
 */
export const AnimatedCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}> = ({ children, className = '', glow = false }) => {
  return (
    <MotionDiv
      variants={glow ? animations.cardHoverGlow : animations.cardHover}
      initial="rest"
      whileHover="hover"
      className={className}
    >
      {children}
    </MotionDiv>
  );
};

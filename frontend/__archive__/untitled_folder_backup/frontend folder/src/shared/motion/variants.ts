import { Variants, Transition } from 'framer-motion'

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.22 } },
}

export const cardHover = {
  rest: { scale: 1, boxShadow: '0 6px 30px -12px rgba(15, 23, 42, 0.25)' },
  hover: { scale: 1.015, boxShadow: '0 10px 35px -12px rgba(15, 23, 42, 0.30)', transition: { duration: 0.15 } },
}

export const spotlightSwap: Variants = {
  enter: { opacity: 0, x: 16 },
  center: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 420, damping: 32 } },
  exit: { opacity: 0, x: -16, transition: { duration: 0.22 } },
}

export const listStagger: Variants = {
  show: { transition: { staggerChildren: 0.05 } },
}

export const getMotionProps = (prefersReducedMotion: boolean) => {
  return prefersReducedMotion ? { animate: false } : {};
}
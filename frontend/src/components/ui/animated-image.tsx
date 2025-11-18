/**
 * AnimatedImage - Dual-state hover image component
 * Smoothly transitions between default and hover images
 */

import React, { useState } from 'react';
import { cn } from '@/lib/utils';

export interface AnimatedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  defaultSrc: string;
  hoverSrc?: string;
  alt: string;
}

const AnimatedImage = React.forwardRef<HTMLDivElement, AnimatedImageProps>(
  ({ defaultSrc, hoverSrc, alt, className, ...props }, ref) => {
    const [imageLoaded, setImageLoaded] = useState(false);

    // If no hover image, just show regular image
    if (!hoverSrc) {
      return (
        <img
          src={defaultSrc}
          alt={alt}
          className={className}
          loading="lazy"
          {...props}
        />
      );
    }

    return (
      <div ref={ref} className={cn('image-swap-container relative', className)}>
        {/* Default image */}
        <img
          src={defaultSrc}
          alt={alt}
          className="image-swap-default w-full h-full object-cover"
          loading="lazy"
          {...props}
        />

        {/* Hover image - preload */}
        <img
          src={hoverSrc}
          alt={`${alt} (hover)`}
          className="image-swap-hover w-full h-full object-cover"
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          {...props}
        />
      </div>
    );
  }
);

AnimatedImage.displayName = 'AnimatedImage';

export { AnimatedImage };
export default AnimatedImage;

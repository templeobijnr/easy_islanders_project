import React from "react";
import { HTMLMotionProps, MotionProps } from "framer-motion";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "motion.div": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLDivElement>,
        HTMLDivElement
      > &
        MotionProps & {
          ref?: React.Ref<HTMLDivElement>;
        };
      "motion.span": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLSpanElement>,
        HTMLSpanElement
      > &
        MotionProps & {
          ref?: React.Ref<HTMLSpanElement>;
        };
      "motion.a": React.DetailedHTMLProps<
        React.AnchorHTMLAttributes<HTMLAnchorElement>,
        HTMLAnchorElement
      > &
        MotionProps & {
          ref?: React.Ref<HTMLAnchorElement>;
        };
      "motion.img": React.DetailedHTMLProps<
        React.ImgHTMLAttributes<HTMLImageElement>,
        HTMLImageElement
      > &
        MotionProps & {
          ref?: React.Ref<HTMLImageElement>;
        };
      "motion.button": React.DetailedHTMLProps<
        React.ButtonHTMLAttributes<HTMLButtonElement>,
        HTMLButtonElement
      > &
        MotionProps & {
          ref?: React.Ref<HTMLButtonElement>;
        };
    }
  }
}

export {};

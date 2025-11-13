import React from "react";
import { MotionProps } from "framer-motion";

// Extend JSX intrinsic elements to support motion components with HTML attributes
declare global {
  namespace JSX {
    interface IntrinsicElements {
      "motion.div": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLDivElement>,
        HTMLDivElement
      > &
        MotionProps;
      "motion.span": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLSpanElement>,
        HTMLSpanElement
      > &
        MotionProps;
      "motion.a": React.DetailedHTMLProps<
        React.AnchorHTMLAttributes<HTMLAnchorElement>,
        HTMLAnchorElement
      > &
        MotionProps;
      "motion.img": React.DetailedHTMLProps<
        React.ImgHTMLAttributes<HTMLImageElement>,
        HTMLImageElement
      > &
        MotionProps;
      "motion.button": React.DetailedHTMLProps<
        React.ButtonHTMLAttributes<HTMLButtonElement>,
        HTMLButtonElement
      > &
        MotionProps;
      "motion.ul": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLUListElement>,
        HTMLUListElement
      > &
        MotionProps;
      "motion.li": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLLIElement>,
        HTMLLIElement
      > &
        MotionProps;
      "motion.p": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLParagraphElement>,
        HTMLParagraphElement
      > &
        MotionProps;
      "motion.h1": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLHeadingElement>,
        HTMLHeadingElement
      > &
        MotionProps;
      "motion.h2": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLHeadingElement>,
        HTMLHeadingElement
      > &
        MotionProps;
      "motion.h3": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLHeadingElement>,
        HTMLHeadingElement
      > &
        MotionProps;
    }
  }
}

export {};

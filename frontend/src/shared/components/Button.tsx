/**
 * Premium Button Component
 *
 * This component now exports the enhanced shadcn/ui button with premium variants.
 *
 * Migration from old Button:
 * - variant="primary" → variant="premium"
 * - variant="secondary" → variant="secondary"
 * - variant="outline" → variant="outline"
 *
 * New premium variants:
 * - variant="premium" - Gradient background
 * - variant="glass" - Glass morphism effect
 * - variant="default" - Standard with shadow
 *
 * Example:
 * <Button variant="premium" size="lg">Click me</Button>
 */

// Re-export the enhanced shadcn button as the default Button
export { Button, buttonVariants } from "../../components/ui/button";
export type { ButtonProps } from "../../components/ui/button";
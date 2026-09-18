import { ButtonHTMLAttributes, forwardRef } from "react";

export type Variant = "primary" | "secondary" | "ghost" | "danger";

const variantClasses: Record<Variant, string> = {
  primary: "bg-ink text-paper hover:bg-ink/90 border border-ink",
  secondary: "bg-transparent text-ink border border-ink hover:bg-canvas",
  ghost: "bg-transparent text-ink border border-transparent hover:bg-canvas",
  danger: "bg-rust text-paper border border-rust hover:bg-rust/90",
};

export function buttonClasses(variant: Variant = "primary", className = "") {
  return `inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${className}`;
}

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }
>(({ className = "", variant = "primary", ...props }, ref) => {
  return (
    <button ref={ref} className={buttonClasses(variant, className)} {...props} />
  );
});
Button.displayName = "Button";

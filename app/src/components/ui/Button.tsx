import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
  fullWidth?: boolean;
};

export function Button({ className = "", variant = "primary", fullWidth, ...props }: ButtonProps) {
  return <button className={`btn btn-${variant}${fullWidth ? " btn-full" : ""} ${className}`} {...props} />;
}

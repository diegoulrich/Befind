import * as React from "react";

import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none transition-colors placeholder:text-stone-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20",
        className,
      )}
      {...props}
    />
  ),
);

Input.displayName = "Input";

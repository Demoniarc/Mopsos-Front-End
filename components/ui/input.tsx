import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-2xl glass-effect dark:glass-effect-dark px-4 py-3 text-base shadow-lg transition-all duration-300 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-white placeholder:text-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:shadow-xl focus-visible:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50 text-white backdrop-filter backdrop-blur-lg",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }

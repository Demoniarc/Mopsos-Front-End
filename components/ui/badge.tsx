import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 backdrop-filter backdrop-blur-lg",
  {
    variants: {
      variant: {
        default:
          "glass-effect dark:glass-effect-dark text-white shadow-lg hover:shadow-xl hover:scale-105",
        secondary:
          "liquid-gradient dark:liquid-gradient-dark text-white shadow-lg hover:shadow-xl hover:scale-105",
        destructive:
          "bg-gradient-to-r from-red-500/80 to-pink-500/80 text-white shadow-lg hover:shadow-xl hover:scale-105",
        outline: "border-white/30 text-white hover:glass-effect dark:hover:glass-effect-dark",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }

import * as React from "react"

import { cn } from "@/react-app/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  function Input({ className, type, ...props }, ref) {
    return (
      <input
        ref={ref}
        type={type}
        data-slot="input"
        className={cn(
          "input-premium focus-visible:border-ring focus-visible:ring-ring/30 aria-invalid:ring-destructive/20 aria-invalid:border-destructive h-11 border px-4 py-2 text-base transition-all file:h-7 file:text-sm file:font-medium focus-visible:ring-[4px] aria-invalid:ring-[3px] md:text-sm file:text-foreground placeholder:text-muted-foreground w-full min-w-0 outline-none file:inline-flex file:border-0 file:bg-transparent disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    )
  }
)

Input.displayName = "Input"

export { Input }

import * as React from "react"

import { cn } from "@/react-app/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "input-premium focus-visible:border-ring focus-visible:ring-ring/30 aria-invalid:ring-destructive/20 aria-invalid:border-destructive resize-none border px-4 py-3 text-base transition-all focus-visible:ring-[4px] aria-invalid:ring-[3px] md:text-sm placeholder:text-muted-foreground flex min-h-24 w-full outline-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }

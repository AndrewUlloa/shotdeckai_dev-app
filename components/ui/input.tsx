import * as React from "react"
// import { ButtonIcon } from "./input-button"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  // Add a dummy property to avoid the empty interface error
  // TODO: Remove this when actual properties are added
  _dummy?: never;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <div className="flex flex-grow items-center mr-2">
        <input
          type={type}
          className={cn(
          "flex w-full pl-2 bg-transparent text-base shadow-sm placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
        />
        {/* <ButtonIcon /> */}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }

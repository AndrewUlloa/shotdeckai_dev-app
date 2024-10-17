import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        default: [
          "rounded-3xl flex justify-center items-center",
          "shadow-[inset_0_0px_1.5px_rgba(0,0,0,0.35)]",
          "max-w",
        ],
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        blue: [
          "rounded-[100px] justify-center items-center",
          "shadow-[inset_0_0px_1.5px_rgba(0,0,0,0.35)]",
          "max-w-[21px] max-h-[21px]",
        ]
      },
      size: {
        default: "",
        sm: "h-9 rounded-3xl px-3",
        lg: "h-11 rounded-3xl px-8",
        icon: "h-8 w-8",
        input: "h-6 w-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const IconButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        <div className="rounded-3xl flex-1 flex justify-center items-center shadow-[inset_0_0px_1.5px_rgba(0,0,0,0.35)]">
          <div className="rounded-3xl flex-grow flex justify-center items-center bg-gradient-to-b from-black via-black 0% .to-black 50% to-[#96959370] 100% p-[0.13px] shadow-[inset_0_-0.2px_1px_rgba(0,0,0,0.25)]">
            <div className="rounded-3xl flex-grow flex justify-center items-center bg-gradient-to-b from-white via-[#3c3c3c] to-[white] m-[0.2px] p-[1.6px]">
              <div className="rounded-3xl flex-grow flex justify-center items-center shadow-[0_5px_15px_rgba(0,0,0,0.25), inset_0_-2px_10px_#9e9eaa] bg-gradient-to-b from-[#c2c2c2] to-[#9b9b9b] .shadow-[inset_0_-2px_10px_#9e9eaa] shadow-[0_5px_15px_rgba(0,0,0,0.25)]">
                <div className="rounded-3xl flex-grow flex justify-center items-center px-1 py-[4px] text-base  text-white text-shadow-[0_5px_#3d3d3d,0_0.05px_1px_rgba(0,0,0,0.15)]">
                  {props.children}
                </div>
              </div>
            </div>
          </div>
        </div>

      </Comp>
    )
  }
)
IconButton.displayName = "IconButton"

export { IconButton, buttonVariants }

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const labelVariants = cva(
  "text-sm font-medium leading-none text-slate-700 peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
);

type LabelProps = React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
  VariantProps<typeof labelVariants> & {
    required?: boolean;
    optional?: boolean;
  };

const Label = React.forwardRef<React.ElementRef<typeof LabelPrimitive.Root>, LabelProps>(
  ({ className, children, required, optional, ...props }, ref) => (
    <LabelPrimitive.Root ref={ref} className={cn(labelVariants(), className)} {...props}>
      <span className="inline-flex flex-wrap items-center gap-1">
        {children}
        {required && (
          <>
            <span className="text-brand-light font-semibold leading-none" aria-hidden="true">*</span>
            <span className="sr-only"> (obligatorio)</span>
          </>
        )}
        {optional && !required && (
          <span className="text-[11px] font-normal normal-case text-muted-foreground">(opcional)</span>
        )}
      </span>
    </LabelPrimitive.Root>
  ),
);
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };

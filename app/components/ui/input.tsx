import * as React from "react";

import { cn } from "~/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  inputClassName?: string;
  startContent?: React.ReactNode;
  endContent?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, inputClassName, startContent, endContent, ...props }, ref) => {
    return (
      <div
        className={cn(
          "px-3 flex items-center w-full rounded-md border border-input bg-surface file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground",
          className,
        )}
      >
        {startContent}
        <input
          className={cn(
            "py-2 !outline-none grow text-sm bg-transparent disabled:cursor-not-allowed disabled:opacity-50",
            inputClassName,
          )}
          type={type}
          ref={ref}
          {...props}
        />
        {endContent}
      </div>
    );
  },
);
Input.displayName = "Input";

export { Input };

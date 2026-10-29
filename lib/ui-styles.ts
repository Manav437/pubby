import { cn } from "./utils";

// Shared Tailwind primitives. Component layouts stay beside their markup.
export const buttonClassName = "inline-flex min-h-10 items-center justify-center gap-2 rounded-[2px] border border-border bg-transparent px-[15px] py-2 text-foreground whitespace-nowrap hover:bg-surface";
export const primaryButtonClassName = cn(buttonClassName, "border-accent bg-accent font-semibold text-background hover:bg-accent hover:brightness-[.92]");
export const inputClassName = "h-11 w-full min-w-0 rounded-[2px] border border-border focus:border-accent bg-background px-3 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none";

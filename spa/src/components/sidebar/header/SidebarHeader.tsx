import { cn } from "@/lib/utils";

interface SidebarHeaderProps {
  className?: string;
}

export function SidebarHeader({ className }: SidebarHeaderProps) {
  return (
    <div
      className={cn(
        "text-foreground text-3xl font-extrabold font-sans leading-10",
        className,
      )}
      data-testid="sidebar-header"
    >
      STUF
    </div>
  );
}

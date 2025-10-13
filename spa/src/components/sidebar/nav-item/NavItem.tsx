import { cn } from "@/lib/utils";

interface NavItemProps {
  label: string;
  icon: string;
  onClick?: () => void;
  className?: string;
}

export function NavItem({ label, icon, onClick, className }: NavItemProps) {
  const testId = label.toLowerCase().replace(/\s+/g, "-");

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full py-2 rounded inline-flex justify-start items-center gap-3 transition-colors cursor-pointer hover:bg-black/10 dark:hover:bg-white/10",
        className,
      )}
      data-testid={`nav-item-${testId}`}
    >
      <img
        src={icon}
        alt=""
        className="w-6 h-6 shrink-0 dark:invert"
        aria-hidden="true"
      />
      <span className="text-base font-normal font-sans leading-snug text-foreground">
        {label}
      </span>
    </button>
  );
}

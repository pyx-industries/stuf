import { cn, getInitials } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface SidebarProfileProps {
  name: string;
  email: string;
  avatarUrl?: string;
  className?: string;
}

export function SidebarProfile({
  name,
  email,
  avatarUrl,
  className,
}: SidebarProfileProps) {
  return (
    <div
      className={cn("flex items-center gap-2", className)}
      data-testid="sidebar-profile"
    >
      <Avatar className="w-10 h-10 rounded-[20px]">
        <AvatarImage src={avatarUrl} alt={`${name}'s avatar`} />
        <AvatarFallback
          className="rounded-[20px] bg-primary text-primary-text text-sm font-medium"
          data-testid="sidebar-profile-avatar-fallback"
        >
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col min-w-0 flex-1">
        <div
          className="text-foreground text-base font-normal leading-7 truncate"
          data-testid="sidebar-profile-name"
        >
          {name}
        </div>
        <div
          className="text-foreground text-sm font-normal leading-none truncate"
          data-testid="sidebar-profile-email"
        >
          {email}
        </div>
      </div>
    </div>
  );
}

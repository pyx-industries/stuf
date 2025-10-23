import { cn, getInitials } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import type { User } from "@/types";

interface SidebarProfileProps {
  user: User;
  className?: string;
}

export function SidebarProfile({ user, className }: SidebarProfileProps) {
  return (
    <div
      className={cn("flex items-center gap-2", className)}
      data-testid="sidebar-profile"
    >
      <Avatar className="w-10 h-10 rounded-[20px]">
        <AvatarImage src={user.avatarUrl} alt={`${user.name}'s avatar`} />
        <AvatarFallback
          className="rounded-[20px] bg-primary text-primary-text text-sm font-medium"
          data-testid="sidebar-profile-avatar-fallback"
        >
          {getInitials(user.name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col min-w-0 flex-1">
        <div
          className="text-foreground text-base font-normal leading-7 truncate"
          data-testid="sidebar-profile-name"
        >
          {user.name}
        </div>
        <div
          className="text-foreground text-sm font-normal leading-none truncate"
          data-testid="sidebar-profile-email"
        >
          {user.email}
        </div>
      </div>
    </div>
  );
}

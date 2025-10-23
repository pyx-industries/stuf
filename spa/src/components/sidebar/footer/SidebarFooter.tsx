import { cn } from "@/lib/utils";
import { SidebarProfile } from "../profile/SidebarProfile";
import { MoreOptions } from "../../utility/more-options/MoreOptions";
import { LogOut } from "lucide-react";
import type { User } from "@/types";

interface SidebarFooterProps {
  user: User;
  onLogout: () => void;
  className?: string;
}

export function SidebarFooter({
  user,
  onLogout,
  className,
}: SidebarFooterProps) {
  return (
    <div
      className={cn("self-stretch flex items-center gap-2", className)}
      data-testid="sidebar-footer"
    >
      <SidebarProfile user={user} className="flex-1 min-w-0" />
      <MoreOptions
        testId="sidebar-menu"
        groups={[
          {
            options: [
              {
                label: (
                  <div className="flex items-center gap-3">
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </div>
                ),
                onClick: () => onLogout(),
              },
            ],
          },
        ]}
      />
    </div>
  );
}

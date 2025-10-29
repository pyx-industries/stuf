import { cn } from "@/lib/utils";
import { SidebarHeader } from "./header/SidebarHeader";
import { SidebarFooter } from "./footer/SidebarFooter";
import { CollectionNav } from "./collection-nav/CollectionNav";
import { NavItem } from "./nav-item/NavItem";
import { SidebarSkeleton } from "./SidebarSkeleton";
import { isAdmin, type Collection, type User } from "@/types";

// TODO: Consume AuthProvider for user data and isAdmin function
// TODO: Consume CollectionsProvider for collections data

interface SidebarProps {
  collections: Collection[];
  selectedCollectionId?: string | null;
  onCollectionSelect: (collectionId: string) => void;
  onHomeClick: () => void;
  isHomeSelected?: boolean;
  onConfigClick: () => void;
  user: User;
  onLogout: () => void;
  isLoading?: boolean;
  hideHeader?: boolean;
  className?: string;
}

export function Sidebar({
  collections,
  selectedCollectionId,
  onCollectionSelect,
  onHomeClick,
  isHomeSelected = false,
  onConfigClick,
  user,
  onLogout,
  isLoading = false,
  hideHeader = false,
  className,
}: SidebarProps) {
  if (isLoading) {
    return <SidebarSkeleton hideHeader={hideHeader} className={className} />;
  }

  return (
    <aside
      className={cn(
        "w-72 h-full bg-sidebar px-6 py-7 flex flex-col justify-between items-start overflow-hidden",
        className,
      )}
      data-testid="sidebar"
    >
      <div className="self-stretch flex flex-col justify-start items-start gap-6">
        {!hideHeader && <SidebarHeader />}

        <div className="self-stretch flex flex-col justify-start items-start gap-2">
          <CollectionNav
            collections={collections}
            selectedCollectionId={selectedCollectionId}
            onCollectionSelect={onCollectionSelect}
            onHomeClick={onHomeClick}
            isHomeSelected={isHomeSelected}
          />

          {isAdmin(user) && (
            <NavItem
              label="Configuration"
              icon="/icons/settings.svg"
              onClick={onConfigClick}
            />
          )}
        </div>
      </div>

      <SidebarFooter user={user} onLogout={onLogout} />
    </aside>
  );
}

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { SidebarHeader } from "./header/SidebarHeader";

interface SidebarSkeletonProps {
  hideHeader?: boolean;
  className?: string;
}

export function SidebarSkeleton({
  hideHeader = false,
  className,
}: SidebarSkeletonProps) {
  // Primary color for both light and dark modes
  const skeletonClass = "bg-primary/30 dark:bg-primary/20";

  return (
    <aside
      className={cn(
        "w-72 h-screen bg-sidebar px-6 py-7 flex flex-col justify-between items-start overflow-hidden",
        className,
      )}
      data-testid="sidebar-skeleton"
    >
      {/* Top section */}
      <div className="self-stretch flex flex-col justify-start items-start gap-6 w-full">
        {/* Real header - conditionally visible */}
        {!hideHeader && <SidebarHeader />}

        {/* Navigation skeleton */}
        <div className="self-stretch flex flex-col justify-start items-start gap-2 w-full">
          {/* Files home skeleton */}
          <div className="flex justify-between items-center gap-2 w-full">
            <div className="flex items-center gap-3 flex-1">
              <Skeleton className={cn("w-6 h-6 rounded", skeletonClass)} />
              <Skeleton className={cn("h-5 w-24", skeletonClass)} />
            </div>
            <Skeleton className={cn("w-6 h-6 rounded", skeletonClass)} />
          </div>

          {/* Collection items skeleton */}
          <div className="self-stretch pl-9 flex flex-col justify-start items-start gap-2 w-full">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 w-full">
                <Skeleton className={cn("w-6 h-6 rounded", skeletonClass)} />
                <Skeleton className={cn("h-5 flex-1", skeletonClass)} />
              </div>
            ))}
          </div>

          {/* Configuration skeleton */}
          <div className="flex items-center gap-3 w-full">
            <Skeleton className={cn("w-6 h-6 rounded", skeletonClass)} />
            <Skeleton className={cn("h-5 w-28", skeletonClass)} />
          </div>
        </div>
      </div>

      {/* Bottom section skeleton */}
      <div className="self-stretch flex items-center gap-2 w-full">
        {/* Profile skeleton */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Skeleton
            className={cn("w-10 h-10 rounded-full shrink-0", skeletonClass)}
          />
          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <Skeleton className={cn("h-4 w-24", skeletonClass)} />
            <Skeleton className={cn("h-3 w-32", skeletonClass)} />
          </div>
        </div>
        {/* Menu skeleton */}
        <Skeleton className={cn("w-8 h-8 rounded", skeletonClass)} />
      </div>
    </aside>
  );
}

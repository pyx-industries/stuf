import { CollectionCard } from "@/components/collection/collection-card/CollectionCard";
import { CreateCollectionCard } from "@/components/collection/create-collection-card/CreateCollectionCard";
import { Skeleton } from "@/components/ui/skeleton";
import type { Collection } from "@/types";

export interface CollectionsGridProps {
  collections: Collection[];
  loading?: boolean;
  onCollectionClick: (collectionId: string) => void;
  onCollectionSettings: (collectionId: string) => void;
  onCreateCollection: () => void;
  showCreateCollection?: boolean;
}

export function CollectionsGrid({
  collections,
  loading = false,
  onCollectionClick,
  onCollectionSettings,
  onCreateCollection,
  showCreateCollection = true,
}: CollectionsGridProps) {
  if (loading) {
    return (
      <div
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-8"
        data-testid="collections-grid-loading"
      >
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton
            key={i}
            className="h-[140px] xl:h-[132px] rounded-[4px]"
            data-testid={`collection-skeleton-${i}`}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-8"
      data-testid="collections-grid"
    >
      {collections.map((collection) => (
        <CollectionCard
          key={collection.id}
          name={collection.name}
          fileCount={collection.fileCount || 0}
          onViewClick={() => onCollectionClick(collection.id)}
          onSettingsClick={() => onCollectionSettings(collection.id)}
        />
      ))}
      {showCreateCollection && (
        <CreateCollectionCard onClick={onCreateCollection} />
      )}
    </div>
  );
}

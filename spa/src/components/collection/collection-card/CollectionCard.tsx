import {
  Card,
  CardHeader,
  CardTitle,
  CardAction,
  CardFooter,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CollectionCardProps {
  name: string;
  fileCount: number;
  className?: string;
  onSettingsClick?: () => void;
  onViewClick?: () => void;
}

export function CollectionCard({
  name,
  fileCount,
  className,
  onSettingsClick,
  onViewClick,
}: CollectionCardProps) {
  const testId = name.toLowerCase().replace(/\s+/g, "-");

  return (
    <Card
      className={cn(
        "w-full overflow-hidden rounded-[4px] border border-foreground gap-[44px] shadow-none py-0",
        className,
      )}
      data-testid={`collection-card-${testId}`}
    >
      <CardHeader className="px-4 pt-4 pb-0 gap-0">
        <CardTitle
          className="text-base font-medium leading-5 text-foreground"
          data-testid={`collection-name-${testId}`}
        >
          {name}
        </CardTitle>
        <CardAction>
          <button
            onClick={onSettingsClick}
            className="cursor-pointer"
            aria-label={`Settings for ${name}`}
            data-testid={`settings-button-${testId}`}
          >
            <img
              src="/icons/settings.svg"
              alt="Settings"
              width={24}
              height={24}
              className="dark:invert"
            />
          </button>
        </CardAction>
      </CardHeader>

      <CardFooter className="bg-primary px-4 py-2 justify-between items-start">
        <div className="flex items-start gap-1">
          <img src="/icons/draft.svg" alt="Files" width={20} height={20} />
          <span
            className="text-base font-medium leading-5 text-primary-text"
            data-testid={`file-count-${testId}`}
          >
            {fileCount}
          </span>
        </div>
        <button
          onClick={onViewClick}
          className="cursor-pointer"
          aria-label={`View ${name}`}
          data-testid={`view-button-${testId}`}
        >
          <img
            src="/icons/arrow_right_alt.svg"
            alt="View"
            width={24}
            height={24}
          />
        </button>
      </CardFooter>
    </Card>
  );
}

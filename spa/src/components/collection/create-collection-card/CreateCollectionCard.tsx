import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CreateCollectionCardProps {
  className?: string;
  onClick?: () => void;
}

export function CreateCollectionCard({
  className,
  onClick,
}: CreateCollectionCardProps) {
  return (
    <Card
      className={cn(
        "w-full overflow-hidden rounded-[4px] outline-dashed outline-1 outline-offset-[-1px] outline-foreground border-none shadow-none py-0 cursor-pointer hover:bg-accent transition-colors",
        className,
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label="Create new collection"
      data-testid="create-collection-card"
    >
      <div className="flex flex-col justify-center items-center gap-4 pt-[52px] pb-[48px]">
        {/* Inline svg to control the colour */}
        <svg
          width={26}
          height={26}
          viewBox="0 0 25 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          className="text-primary-mid"
        >
          <mask
            id="mask0_9_2470"
            style={{ maskType: "alpha" }}
            maskUnits="userSpaceOnUse"
            x="0"
            y="0"
            width="25"
            height="24"
          >
            <rect x="0.75" width="24" height="24" fill="#D9D9D9" />
          </mask>
          <g mask="url(#mask0_9_2470)">
            <path
              d="M11.75 21V13H3.75V11H11.75V3H13.75V11H21.75V13H13.75V21H11.75Z"
              fill="currentColor"
            />
          </g>
        </svg>
      </div>
    </Card>
  );
}

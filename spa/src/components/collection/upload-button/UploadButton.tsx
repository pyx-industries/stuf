import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface UploadButtonProps {
  className?: string;
  onClick?: () => void;
}

export function UploadButton({ className, onClick }: UploadButtonProps) {
  return (
    <Button
      onClick={onClick}
      className={cn(
        "bg-primary-mid hover:bg-primary-mid/90 cursor-pointer",
        className,
      )}
      aria-label="Add files"
      data-testid="upload-button"
    >
      <img src="/icons/cloud_upload.svg" alt="Upload" width={24} height={24} />
      <span className="text-primary-text text-sm font-medium font-['Inter'] leading-normal">
        Add files
      </span>
    </Button>
  );
}

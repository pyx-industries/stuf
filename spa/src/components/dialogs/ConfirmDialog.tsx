import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  dangerAlert?: {
    message: string;
  };
  children?: React.ReactNode;
  isLoading?: boolean;
  loadingText?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmText = "Continue",
  cancelText = "Cancel",
  dangerAlert,
  children,
  isLoading = false,
  loadingText,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <AlertDialogPrimitive.Root
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onCancel();
        }
      }}
    >
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <AlertDialogPrimitive.Content
          {...(!description && { "aria-describedby": "confirm-dialog-title" })}
          data-testid="confirm-dialog"
          className={cn(
            "fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%]",
            "w-96 bg-background rounded-xl shadow-[0px_2px_4px_0px_rgba(0,0,0,0.24)] outline outline-1 outline-offset-[-1px] outline-border",
            "inline-flex flex-col justify-start items-start gap-6 overflow-hidden",
          )}
        >
          {/* Content Section */}
          <div
            id="confirm-dialog-title"
            className="self-stretch px-6 pt-6 flex flex-col justify-start items-start gap-4"
          >
            {/* Title */}
            <AlertDialogPrimitive.Title
              data-testid="confirm-dialog-title"
              className="self-stretch justify-start text-foreground text-xl font-semibold font-sans leading-7"
            >
              {title}
            </AlertDialogPrimitive.Title>

            {/* Description */}
            {description && (
              <AlertDialogPrimitive.Description
                data-testid="confirm-dialog-description"
                className="self-stretch justify-start text-foreground text-base font-normal font-sans leading-snug"
              >
                {description}
              </AlertDialogPrimitive.Description>
            )}

            {/* Custom Children (e.g., dropdowns, additional fields) */}
            {children && (
              <div data-testid="confirm-dialog-children">{children}</div>
            )}

            {/* Danger Alert */}
            {dangerAlert && (
              <div
                data-testid="confirm-dialog-danger-alert"
                className="self-stretch p-4 bg-red-50 dark:bg-red-950 rounded outline outline-1 outline-offset-[-1px] outline-red-900 dark:outline-red-700 inline-flex justify-start items-start gap-2.5 overflow-hidden"
              >
                <AlertCircle className="w-4 h-4 text-red-900 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 justify-start text-red-900 dark:text-red-400 text-base font-normal font-sans leading-snug">
                  {dangerAlert.message}
                </div>
              </div>
            )}
          </div>

          {/* Footer with Buttons */}
          <div className="self-stretch py-4 bg-neutral-100 dark:bg-neutral-800 inline-flex justify-between items-center">
            <div className="w-96 px-6 flex justify-between items-center">
              {/* Cancel Button */}
              <button
                data-testid="confirm-dialog-cancel"
                onClick={onCancel}
                type="button"
                disabled={isLoading}
                className="px-4 py-2 bg-background rounded-md outline outline-1 outline-offset-[-1px] outline-neutral-700 dark:outline-neutral-500 flex justify-center items-center gap-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-background dark:disabled:hover:bg-background"
              >
                <span className="text-foreground text-sm font-medium leading-normal">
                  {cancelText}
                </span>
              </button>

              {/* Confirm Button */}
              <button
                data-testid="confirm-dialog-confirm"
                onClick={onConfirm}
                type="button"
                disabled={isLoading}
                className="px-4 py-2 bg-primary-mid rounded-md flex justify-center items-center gap-2.5 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:opacity-50"
              >
                {isLoading && (
                  <Loader2 className="w-4 h-4 text-primary-text animate-spin" />
                )}
                <span className="text-primary-text text-sm font-medium leading-normal">
                  {isLoading && loadingText ? loadingText : confirmText}
                </span>
              </button>
            </div>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}

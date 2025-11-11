export interface ViewToggleProps {
  viewMode: "list" | "grid";
  onViewModeChange?: (mode: "list" | "grid") => void;
  testId?: string;
}

export function ViewToggle({
  viewMode = "list",
  onViewModeChange,
  testId = "view-toggle",
}: ViewToggleProps) {
  return (
    <div
      className="p-[3px] bg-neutral-100 dark:bg-neutral-800 rounded-md inline-flex justify-start items-center gap-0.5 ml-auto md:ml-0"
      data-testid={testId}
    >
      <button
        onClick={() => onViewModeChange?.("list")}
        className={`px-3 py-[5px] rounded-md flex justify-start items-center gap-2.5 transition-all cursor-pointer ${
          viewMode === "list"
            ? "bg-white dark:bg-neutral-700 shadow-[0px_2px_4px_0px_rgba(0,0,0,0.20)]"
            : "hover:bg-white/50 dark:hover:bg-neutral-700/50"
        }`}
        data-testid={`${testId}-list`}
      >
        <svg
          className="w-6 h-6 text-foreground"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M5 21C4.45 21 3.97917 20.8042 3.5875 20.4125C3.19583 20.0208 3 19.55 3 19V5C3 4.45 3.19583 3.97917 3.5875 3.5875C3.97917 3.19583 4.45 3 5 3H19C19.55 3 20.0208 3.19583 20.4125 3.5875C20.8042 3.97917 21 4.45 21 5V19C21 19.55 20.8042 20.0208 20.4125 20.4125C20.0208 20.8042 19.55 21 19 21H5ZM5 8.325H19V5H5V8.325ZM5 13.675H19V10.325H5V13.675ZM5 19H19V15.675H5V19ZM6 7.65V5.65H8V7.65H6ZM6 13V11H8V13H6ZM6 18.35V16.35H8V18.35H6Z"
            fill="currentColor"
          />
        </svg>
      </button>
      <button
        onClick={() => onViewModeChange?.("grid")}
        className={`px-3 py-[5px] rounded-md flex justify-start items-center gap-2.5 transition-all cursor-pointer ${
          viewMode === "grid"
            ? "bg-white dark:bg-neutral-700 shadow-[0px_2px_4px_0px_rgba(0,0,0,0.20)]"
            : "hover:bg-white/50 dark:hover:bg-neutral-700/50"
        }`}
        data-testid={`${testId}-grid`}
      >
        <svg
          className="w-6 h-6 text-foreground"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M5 11C4.45 11 3.97917 10.8042 3.5875 10.4125C3.19583 10.0208 3 9.55 3 9V5C3 4.45 3.19583 3.97917 3.5875 3.5875C3.97917 3.19583 4.45 3 5 3H9C9.55 3 10.0208 3.19583 10.4125 3.5875C10.8042 3.97917 11 4.45 11 5V9C11 9.55 10.8042 10.0208 10.4125 10.4125C10.0208 10.8042 9.55 11 9 11H5ZM5 21C4.45 21 3.97917 20.8042 3.5875 20.4125C3.19583 20.0208 3 19.55 3 19V15C3 14.45 3.19583 13.9792 3.5875 13.5875C3.97917 13.1958 4.45 13 5 13H9C9.55 13 10.0208 13.1958 10.4125 13.5875C10.8042 13.9792 11 14.45 11 15V19C11 19.55 10.8042 20.0208 10.4125 20.4125C10.0208 20.8042 9.55 21 9 21H5ZM15 11C14.45 11 13.9792 10.8042 13.5875 10.4125C13.1958 10.0208 13 9.55 13 9V5C13 4.45 13.1958 3.97917 13.5875 3.5875C13.9792 3.19583 14.45 3 15 3H19C19.55 3 20.0208 3.19583 20.4125 3.5875C20.8042 3.97917 21 4.45 21 5V9C21 9.55 20.8042 10.0208 20.4125 10.4125C20.0208 10.8042 19.55 11 19 11H15ZM15 21C14.45 21 13.9792 20.8042 13.5875 20.4125C13.1958 20.0208 13 19.55 13 19V15C13 14.45 13.1958 13.9792 13.5875 13.5875C13.9792 13.1958 14.45 13 15 13H19C19.55 13 20.0208 13.1958 20.4125 13.5875C20.8042 13.9792 21 14.45 21 15V19C21 19.55 20.8042 20.0208 20.4125 20.4125C20.0208 20.8042 19.55 21 19 21H15ZM5 9H9V5H5V9ZM15 9H19V5H15V9ZM15 19H19V15H15V19ZM5 19H9V15H5V19Z"
            fill="currentColor"
          />
        </svg>
      </button>
    </div>
  );
}

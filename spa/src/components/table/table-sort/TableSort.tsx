import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface SortOption {
  value: string;
  label: string;
}

export interface TableSortProps {
  value?: string;
  onValueChange: (value: string) => void;
  options: SortOption[];
  placeholder?: string;
  className?: string;
  testId?: string;
}

export function TableSort({
  value,
  onValueChange,
  options,
  placeholder = "Sort by",
  className,
  testId = "table-sort",
}: TableSortProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger
        className={cn(
          "w-48 px-3 py-2 bg-background rounded-md border border-input inline-flex justify-start items-center gap-2.5 focus:ring-0 focus:ring-offset-0 shadow-none [&_svg]:opacity-100 [&_svg]:text-foreground [&_svg]:stroke-[2.5] h-auto [&>span]:text-foreground [&>span]:text-sm [&>span]:font-normal [&>span]:font-['Inter'] [&>span]:leading-normal [&>span]:flex-1 [&>span]:text-left",
          className,
        )}
        data-testid={testId}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent
        className="w-48 rounded-md shadow-[0px_2px_4px_0px_rgba(0,0,0,0.24)] p-0 overflow-hidden"
        data-testid={`${testId}-content`}
      >
        <div className="w-full flex flex-col justify-start items-stretch">
          {options.map((option, index) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className={cn(
                "w-full px-2 py-1.5 flex justify-start items-center gap-2 rounded-none cursor-pointer focus:bg-accent hover:bg-accent border-0 outline-none text-sm font-medium font-['Inter'] leading-tight text-muted-foreground focus:text-muted-foreground data-[state=checked]:text-foreground [&>span.absolute]:hidden pr-2",
                index === 0 ? "mt-[5px]" : "",
                index === options.length - 1 ? "mb-[5px]" : "",
              )}
              data-testid={`${testId}-option-${option.value}`}
            >
              {option.label}
            </SelectItem>
          ))}
        </div>
      </SelectContent>
    </Select>
  );
}

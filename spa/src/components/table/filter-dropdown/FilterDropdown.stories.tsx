import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { FilterDropdown } from "./FilterDropdown";

const meta: Meta<typeof FilterDropdown> = {
  title: "Components/Table/FilterDropdown",
  component: FilterDropdown,
  parameters: {
    layout: "centered",
    parameters: {
      layout: "padded",
      design: {
        type: "figma",
        url: "",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    isOpen: {
      control: "boolean",
      description: "Controls whether the filter dropdown is open or closed",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "false" },
      },
    },
    onOpenChange: {
      action: "openChange",
      description:
        "Callback function triggered when the dropdown open state changes",
      table: {
        type: { summary: "(open: boolean) => void" },
      },
    },
    availableUploaders: {
      control: "object",
      description:
        "Array of available uploader email addresses to display in the filter. If empty, the uploader section won't be shown.",
      table: {
        type: { summary: "string[]" },
        defaultValue: { summary: "[]" },
      },
    },
    selectedUploaders: {
      control: "object",
      description: "Array of currently selected uploader email addresses",
      table: {
        type: { summary: "string[]" },
        defaultValue: { summary: "[]" },
      },
    },
    onToggleUploader: {
      action: "toggleUploader",
      description:
        "Callback function triggered when an uploader checkbox is toggled. Receives the uploader email as parameter.",
      table: {
        type: { summary: "(uploader: string) => void" },
      },
    },
    selectedStatuses: {
      control: "object",
      description:
        "Array of currently selected status values (In progress, Review, Done)",
      table: {
        type: { summary: "string[]" },
        defaultValue: { summary: "[]" },
      },
    },
    onToggleStatus: {
      action: "toggleStatus",
      description:
        "Callback function triggered when a status checkbox is toggled. Receives the status value as parameter.",
      table: {
        type: { summary: "(status: string) => void" },
      },
    },
    dateRange: {
      control: "object",
      description:
        "Object containing start and end date strings (YYYY-MM-DD format)",
      table: {
        type: { summary: "{ start: string; end: string }" },
        defaultValue: { summary: "{ start: '', end: '' }" },
      },
    },
    onDateRangeChange: {
      action: "dateRangeChange",
      description:
        "Callback function triggered when either date input changes. Receives the complete dateRange object.",
      table: {
        type: {
          summary: "(dateRange: { start: string; end: string }) => void",
        },
      },
    },
    onApply: {
      action: "apply",
      description:
        "Callback function triggered when the Apply button is clicked",
      table: {
        type: { summary: "() => void" },
      },
    },
    testId: {
      control: "text",
      description: "Test ID for the component (used for testing)",
      table: {
        type: { summary: "string" },
        defaultValue: { summary: '"filter-dropdown"' },
      },
    },
  },
  decorators: [
    (Story) => {
      return (
        <div className="bg-background p-4">
          <Story />
        </div>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof FilterDropdown>;

export const Default: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedUploaders, setSelectedUploaders] = useState<string[]>([]);
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
    const [dateRange, setDateRange] = useState({ start: "", end: "" });

    return (
      <FilterDropdown
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        availableUploaders={[
          "user1@example.com",
          "user2@example.com",
          "user3@example.com",
        ]}
        selectedUploaders={selectedUploaders}
        onToggleUploader={(uploader) =>
          setSelectedUploaders((prev) =>
            prev.includes(uploader)
              ? prev.filter((u) => u !== uploader)
              : [...prev, uploader],
          )
        }
        selectedStatuses={selectedStatuses}
        onToggleStatus={(status) =>
          setSelectedStatuses((prev) =>
            prev.includes(status)
              ? prev.filter((s) => s !== status)
              : [...prev, status],
          )
        }
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        onApply={() => {
          console.log("Apply filters", {
            selectedUploaders,
            selectedStatuses,
            dateRange,
          });
          setIsOpen(false);
        }}
      />
    );
  },
};

export const WithoutUploaders: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
    const [dateRange, setDateRange] = useState({ start: "", end: "" });

    return (
      <FilterDropdown
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        availableUploaders={[]}
        selectedUploaders={[]}
        onToggleUploader={() => {}}
        selectedStatuses={selectedStatuses}
        onToggleStatus={(status) =>
          setSelectedStatuses((prev) =>
            prev.includes(status)
              ? prev.filter((s) => s !== status)
              : [...prev, status],
          )
        }
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        onApply={() => {
          console.log("Apply filters", { selectedStatuses, dateRange });
          setIsOpen(false);
        }}
      />
    );
  },
};

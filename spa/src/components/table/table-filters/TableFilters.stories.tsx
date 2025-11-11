import type { Meta, StoryObj } from "@storybook/react-vite";
import { TableFilters } from "./TableFilters";

const meta: Meta<typeof TableFilters> = {
  title: "Components/Table/TableFilters",
  component: TableFilters,
  parameters: {
    layout: "padded",
    design: {
      type: "figma",
      url: "https://www.figma.com/design/SQOopW8mFNB8TLQSZvOySp/RBTP-UI?node-id=121-1891&t=X1ojbU0VMwecFl97-4",
    },
  },
  tags: ["autodocs"],
  argTypes: {
    selectedCount: {
      control: { type: "number", min: 0 },
      description:
        "Number of files currently selected. Controls the state of bulk action buttons.",
      table: {
        type: { summary: "number" },
        defaultValue: { summary: "0" },
      },
    },
    sortValue: {
      control: "text",
      description: "Current sort field value",
      table: {
        type: { summary: "string" },
      },
    },
    sortOptions: {
      control: "object",
      description:
        "Array of available sort options with value and label. If empty, sort control won't be shown.",
      table: {
        type: { summary: "Array<{ value: string; label: string }>" },
        defaultValue: { summary: "[]" },
      },
    },
    viewMode: {
      control: { type: "radio" },
      options: ["list", "grid"],
      description: "Current view mode (list or grid)",
      table: {
        type: { summary: '"list" | "grid"' },
        defaultValue: { summary: '"list"' },
      },
    },
    showViewToggle: {
      control: "boolean",
      description: "Whether to show the view mode toggle buttons",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "true" },
      },
    },
    activeFilters: {
      control: "object",
      description:
        "Array of currently active filters to display as chips. Each filter has an id, label, and type (uploader, status, or date).",
      table: {
        type: { summary: "ActiveFilter[]" },
        defaultValue: { summary: "[]" },
      },
    },
    availableUploaders: {
      control: "object",
      description:
        "Array of available uploader email addresses for the filter dropdown",
      table: {
        type: { summary: "string[]" },
        defaultValue: { summary: "[]" },
      },
    },
    onDownload: {
      action: "download",
      description: "Callback triggered when the Download button is clicked",
      table: {
        type: { summary: "() => void" },
      },
    },
    onChangeStatus: {
      action: "changeStatus",
      description:
        "Callback triggered when a status option is selected from bulk actions. Receives the status value.",
      table: {
        type: { summary: "(status: string) => void" },
      },
    },
    onSortChange: {
      action: "sortChange",
      description:
        "Callback triggered when sort option changes. Receives the new sort value.",
      table: {
        type: { summary: "(value: string) => void" },
      },
    },
    onViewModeChange: {
      action: "viewModeChange",
      description:
        "Callback triggered when view mode toggle is clicked. Receives the new view mode.",
      table: {
        type: { summary: '(mode: "list" | "grid") => void' },
      },
    },
    onApplyFilters: {
      action: "applyFilters",
      description:
        "Callback triggered when filters are applied. Receives arrays of selected uploaders and statuses.",
      table: {
        type: { summary: "(uploaders: string[], statuses: string[]) => void" },
      },
    },
    onApplyDateFilter: {
      action: "applyDateFilter",
      description:
        "Callback triggered when date filter is applied. Receives start and end date strings.",
      table: {
        type: { summary: "(startDate: string, endDate: string) => void" },
      },
    },
    onRemoveFilter: {
      action: "removeFilter",
      description:
        "Callback triggered when a filter chip is removed. Receives the filter ID.",
      table: {
        type: { summary: "(id: string) => void" },
      },
    },
    onClearAllFilters: {
      action: "clearAllFilters",
      description:
        "Callback triggered when the 'Clear all' button is clicked to remove all active filters",
      table: {
        type: { summary: "() => void" },
      },
    },
    testId: {
      control: "text",
      description: "Test ID for the component (used for testing)",
      table: {
        type: { summary: "string" },
        defaultValue: { summary: '"table-filters"' },
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
type Story = StoryObj<typeof TableFilters>;

const sortOptions = [
  { value: "name", label: "Name" },
  { value: "date", label: "Date" },
  { value: "size", label: "Size" },
  { value: "status", label: "Status" },
];

export const Default: Story = {
  args: {
    selectedCount: 0,
    sortValue: "name",
    sortOptions,
    viewMode: "list",
    showViewToggle: true,
    activeFilters: [],
    availableUploaders: [
      "user1@example.com",
      "user2@example.com",
      "user3@example.com",
    ],
    onDownload: () => console.log("Download clicked"),
    onChangeStatus: (status) => console.log("Change status to:", status),
    onSortChange: (value) => console.log("Sort by:", value),
    onViewModeChange: (mode) => console.log("View mode:", mode),
    onApplyFilters: (uploaders, statuses) =>
      console.log("Apply filters:", { uploaders, statuses }),
    onApplyDateFilter: (start, end) =>
      console.log("Apply date filter:", { start, end }),
    onRemoveFilter: (id) => console.log("Remove filter:", id),
    onClearAllFilters: () => console.log("Clear all filters"),
  },
};

export const WithSelection: Story = {
  args: {
    ...Default.args,
    selectedCount: 5,
  },
};

export const WithActiveFilters: Story = {
  args: {
    ...Default.args,
    activeFilters: [
      {
        id: "uploader-user1",
        label: "Uploader: user1@example.com",
        type: "uploader",
      },
      { id: "status-Done", label: "Status: Done", type: "status" },
      {
        id: "date-2024-01-01-2024-01-31",
        label: "Jan 1, 2024 – Jan 31, 2024",
        type: "date",
      },
    ],
  },
};

export const GridView: Story = {
  args: {
    ...Default.args,
    viewMode: "grid",
  },
};

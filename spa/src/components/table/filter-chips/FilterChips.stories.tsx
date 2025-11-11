import type { Meta, StoryObj } from "@storybook/react-vite";
import { FilterChips } from "./FilterChips";

const meta: Meta<typeof FilterChips> = {
  title: "Components/Table/FilterChips",
  component: FilterChips,
  parameters: {
    layout: "centered",
    design: {
      type: "figma",
      url: "https://www.figma.com/design/SQOopW8mFNB8TLQSZvOySp/RBTP-UI?node-id=121-1925&t=X1ojbU0VMwecFl97-4",
    },
  },
  tags: ["autodocs"],
  argTypes: {
    filters: {
      control: "object",
      description: "Array of active filters to display as chips",
      table: {
        type: { summary: "ActiveFilter[]" },
        defaultValue: { summary: "[]" },
      },
    },
    onRemoveFilter: {
      action: "removeFilter",
      description:
        "Callback function triggered when a filter chip's remove button is clicked. Receives the filter ID as parameter.",
      table: {
        type: { summary: "(id: string) => void" },
      },
    },
    testId: {
      control: "text",
      description: "Test ID for the component (used for testing)",
      table: {
        type: { summary: "string" },
        defaultValue: { summary: '"filter-chips"' },
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
type Story = StoryObj<typeof FilterChips>;

export const Default: Story = {
  args: {
    filters: [
      {
        id: "uploader-user1",
        label: "Uploader: user1@example.com",
        type: "uploader",
      },
      { id: "status-Done", label: "Status: Done", type: "status" },
    ],
    onRemoveFilter: (id) => console.log("Remove filter:", id),
  },
};

export const WithDateFilter: Story = {
  args: {
    filters: [
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
    onRemoveFilter: (id) => console.log("Remove filter:", id),
  },
};

export const ManyFilters: Story = {
  args: {
    filters: [
      {
        id: "uploader-user1",
        label: "Uploader: user1@example.com",
        type: "uploader",
      },
      {
        id: "uploader-user2",
        label: "Uploader: user2@example.com",
        type: "uploader",
      },
      {
        id: "uploader-user3",
        label: "Uploader: user3@example.com",
        type: "uploader",
      },
      {
        id: "status-In-progress",
        label: "Status: In progress",
        type: "status",
      },
      { id: "status-Review", label: "Status: Review", type: "status" },
      { id: "status-Done", label: "Status: Done", type: "status" },
      {
        id: "date-2024-01-01-2024-01-31",
        label: "Jan 1, 2024 – Jan 31, 2024",
        type: "date",
      },
    ],
    onRemoveFilter: (id) => console.log("Remove filter:", id),
  },
};

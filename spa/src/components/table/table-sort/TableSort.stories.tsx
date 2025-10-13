import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { TableSort, SortOption } from "./TableSort";

const meta: Meta<typeof TableSort> = {
  title: "Components/Table/TableSort",
  component: TableSort,
  parameters: {
    layout: "centered",
    design: {
      type: "figma",
      url: "https://www.figma.com/design/SQOopW8mFNB8TLQSZvOySp/RBTP-UI?node-id=90-1763&m=dev",
    },
  },
  decorators: [
    (Story) => {
      return (
        <div className="bg-background p-8 min-h-[400px]">
          <Story />
        </div>
      );
    },
  ],
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

const defaultSortOptions: SortOption[] = [
  { value: "status", label: "Status" },
  { value: "uploader", label: "Uploader" },
  { value: "date", label: "Date" },
];

// Default state (unselected)
export const Default: Story = {
  args: {
    options: defaultSortOptions,
    onValueChange: (value) => console.log("Sort changed:", value),
  },
};

// With selected value
export const WithSelectedValue: Story = {
  args: {
    value: "status",
    options: defaultSortOptions,
    onValueChange: (value) => console.log("Sort changed:", value),
  },
};

// With icons
export const WithIcons: Story = {
  render: () => {
    const [sortBy, setSortBy] = useState<string>();

    const iconOptions: SortOption[] = [
      {
        value: "status",
        label: (
          <div className="flex items-center gap-2">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="8"
                cy="8"
                r="6"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
            Status
          </div>
        ),
      },
      {
        value: "uploader",
        label: (
          <div className="flex items-center gap-2">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="8"
                cy="5"
                r="2.5"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M3 13C3 10.5 5 9 8 9C11 9 13 10.5 13 13"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
            Uploader
          </div>
        ),
      },
      {
        value: "date",
        label: (
          <div className="flex items-center gap-2">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="2"
                y="3"
                width="12"
                height="11"
                rx="1"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path d="M2 6H14" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            Date
          </div>
        ),
      },
    ];

    return (
      <TableSort
        value={sortBy}
        onValueChange={setSortBy}
        options={iconOptions}
      />
    );
  },
};

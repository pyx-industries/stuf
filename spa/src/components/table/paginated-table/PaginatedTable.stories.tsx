import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { PaginatedTable } from "./PaginatedTable";

interface SampleData {
  id: number;
  name: string;
  email: string;
  status: string;
  role: string;
}

// Generate sample data
const generateData = (count: number): SampleData[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `User ${i + 1}`,
    email: `user${i + 1}@example.com`,
    status: i % 3 === 0 ? "Active" : i % 3 === 1 ? "Inactive" : "Pending",
    role: i % 2 === 0 ? "Admin" : "User",
  }));
};

const columns: ColumnDef<SampleData>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "status",
    header: "Status",
  },
  {
    accessorKey: "role",
    header: "Role",
  },
];

const meta: Meta<typeof PaginatedTable> = {
  title: "Components/Table/PaginatedTable",
  component: PaginatedTable,
  parameters: {
    layout: "padded",
  },
  decorators: [
    (Story) => (
      <div className="bg-background">
        <Story />
      </div>
    ),
  ],
  tags: ["autodocs"],
  argTypes: {
    columns: {
      control: "object",
      description: "Column definitions for the table",
    },
    data: {
      control: "object",
      description: "Data to display in the table",
    },
    isLoading: {
      control: "boolean",
      description: "Whether the table is in a loading state",
    },
    emptyMessage: {
      control: "text",
      description: "Message to display when there is no data",
    },
    currentPage: {
      control: "number",
      description: "Current page number (1-indexed)",
    },
    totalPages: {
      control: "number",
      description: "Total number of pages",
    },
    totalResults: {
      control: "number",
      description: "Total number of results across all pages",
    },
    pageSize: {
      control: "number",
      description: "Number of items per page",
    },
    onPageChange: {
      action: "page changed",
      description: "Callback when page changes",
    },
    onPageSizeChange: {
      action: "page size changed",
      description: "Callback when page size changes",
    },
    pageSizeOptions: {
      control: "object",
      description: "Available page size options",
    },
    className: {
      control: "text",
      description: "Additional CSS classes for the table",
    },
    testId: {
      control: "text",
      description: "Test ID for the component",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Interactive story with state management
export const Default: Story = {
  render: () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const totalData = generateData(50);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const currentData = totalData.slice(startIndex, endIndex);
    const totalPages = Math.ceil(totalData.length / pageSize);

    return (
      <PaginatedTable
        columns={columns}
        data={currentData}
        currentPage={currentPage}
        totalPages={totalPages}
        totalResults={totalData.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={(newSize) => {
          setPageSize(newSize);
          setCurrentPage(1); // Reset to first page
        }}
      />
    );
  },
};

// Loading state
export const Loading: Story = {
  args: {
    columns: columns as any,
    data: [],
    isLoading: true,
    currentPage: 1,
    totalPages: 5,
    totalResults: 50,
    pageSize: 10,
    onPageChange: () => {},
    onPageSizeChange: () => {},
  },
};

// Empty state
export const Empty: Story = {
  args: {
    columns: columns as any,
    data: [],
    isLoading: false,
    currentPage: 1,
    totalPages: 0,
    totalResults: 0,
    pageSize: 10,
    onPageChange: () => {},
    onPageSizeChange: () => {},
  },
};

// Empty with custom message
export const EmptyCustomMessage: Story = {
  args: {
    columns: columns as any,
    data: [],
    isLoading: false,
    emptyMessage: "No users found. Try adjusting your filters.",
    currentPage: 1,
    totalPages: 0,
    totalResults: 0,
    pageSize: 10,
    onPageChange: () => {},
    onPageSizeChange: () => {},
  },
};

// Single page
export const SinglePage: Story = {
  args: {
    columns: columns as any,
    data: generateData(5),
    isLoading: false,
    currentPage: 1,
    totalPages: 1,
    totalResults: 5,
    pageSize: 10,
    onPageChange: () => {},
    onPageSizeChange: () => {},
  },
};

// Custom page size options
export const CustomPageSizes: Story = {
  render: () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);

    const totalData = generateData(50);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const currentData = totalData.slice(startIndex, endIndex);
    const totalPages = Math.ceil(totalData.length / pageSize);

    return (
      <PaginatedTable
        columns={columns}
        data={currentData}
        currentPage={currentPage}
        totalPages={totalPages}
        totalResults={totalData.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={(newSize) => {
          setPageSize(newSize);
          setCurrentPage(1);
        }}
        pageSizeOptions={[5, 15, 30, 60]}
      />
    );
  },
};

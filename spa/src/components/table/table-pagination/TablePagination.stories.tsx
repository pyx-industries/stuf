import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { TablePagination } from "./TablePagination";

const meta: Meta<typeof TablePagination> = {
  title: "Components/Table/TablePagination",
  component: TablePagination,
  parameters: {
    layout: "padded",
    design: {
      type: "figma",
      url: "https://www.figma.com/design/SQOopW8mFNB8TLQSZvOySp/RBTP-UI?node-id=95-2628&m=dev",
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
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default pagination
export const Default: Story = {
  render: () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    return (
      <TablePagination
        currentPage={currentPage}
        totalPages={13}
        totalResults={123}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />
    );
  },
};

// First page
export const FirstPage: Story = {
  args: {
    currentPage: 1,
    totalPages: 10,
    totalResults: 100,
    pageSize: 10,
    onPageChange: (page) => console.log("Page changed:", page),
    onPageSizeChange: (size) => console.log("Page size changed:", size),
  },
};

// Middle page
export const MiddlePage: Story = {
  args: {
    currentPage: 5,
    totalPages: 10,
    totalResults: 100,
    pageSize: 10,
    onPageChange: (page) => console.log("Page changed:", page),
    onPageSizeChange: (size) => console.log("Page size changed:", size),
  },
};

// Last page
export const LastPage: Story = {
  args: {
    currentPage: 10,
    totalPages: 10,
    totalResults: 100,
    pageSize: 10,
    onPageChange: (page) => console.log("Page changed:", page),
    onPageSizeChange: (size) => console.log("Page size changed:", size),
  },
};

// Few pages (only 1 page)
export const FewPages: Story = {
  args: {
    currentPage: 1,
    totalPages: 1,
    totalResults: 10,
    pageSize: 10,
    onPageChange: (page) => console.log("Page changed:", page),
    onPageSizeChange: (size) => console.log("Page size changed:", size),
  },
};

// Many pages with ellipsis
export const ManyPages: Story = {
  args: {
    currentPage: 15,
    totalPages: 50,
    totalResults: 500,
    pageSize: 10,
    onPageChange: (page) => console.log("Page changed:", page),
    onPageSizeChange: (size) => console.log("Page size changed:", size),
  },
};

// Custom page size options
export const CustomPageSizes: Story = {
  args: {
    currentPage: 1,
    totalPages: 10,
    totalResults: 200,
    pageSize: 20,
    pageSizeOptions: [20, 50, 100, 200],
    onPageChange: (page) => console.log("Page changed:", page),
    onPageSizeChange: (size) => console.log("Page size changed:", size),
  },
};

// Interactive example
export const Interactive: Story = {
  render: () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const totalResults = 237;
    const totalPages = Math.ceil(totalResults / pageSize);

    return (
      <div className="space-y-4">
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalResults={totalResults}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            // Reset to page 1 when changing page size
            setCurrentPage(1);
          }}
        />
        <div className="text-sm text-muted-foreground">
          Current page: {currentPage} | Page size: {pageSize} | Total pages:{" "}
          {totalPages}
        </div>
      </div>
    );
  },
};

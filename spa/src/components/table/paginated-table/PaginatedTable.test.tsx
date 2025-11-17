import type { ColumnDef } from "@tanstack/react-table";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PaginatedTable } from "./PaginatedTable";

interface TestData {
  id: number;
  name: string;
  status: string;
}

describe("PaginatedTable", () => {
  const mockColumns: ColumnDef<TestData>[] = [
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "status",
      header: "Status",
    },
  ];

  const mockData: TestData[] = [
    { id: 1, name: "Item 1", status: "Active" },
    { id: 2, name: "Item 2", status: "Inactive" },
    { id: 3, name: "Item 3", status: "Active" },
  ];

  const defaultProps = {
    columns: mockColumns,
    data: mockData,
    currentPage: 1,
    totalPages: 5,
    totalResults: 50,
    pageSize: 10,
    onPageChange: vi.fn(),
    onPageSizeChange: vi.fn(),
  };

  it("renders table with data", () => {
    render(<PaginatedTable {...defaultProps} />);

    expect(screen.getByTestId("paginated-table")).toBeInTheDocument();
    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Item 2")).toBeInTheDocument();
    expect(screen.getByText("Item 3")).toBeInTheDocument();
  });

  it("renders pagination controls", () => {
    render(<PaginatedTable {...defaultProps} />);

    expect(
      screen.getByTestId("paginated-table-pagination"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("paginated-table-pagination-results-info"),
    ).toHaveTextContent("1-10 of 50 results");
  });

  it("shows loading state", () => {
    render(<PaginatedTable {...defaultProps} isLoading={true} />);

    expect(screen.getByTestId("paginated-table")).toBeInTheDocument();
    expect(
      screen.getByTestId("paginated-table-skeleton-row-0"),
    ).toBeInTheDocument();
  });

  it("shows empty message when no data", () => {
    render(
      <PaginatedTable
        {...defaultProps}
        data={[]}
        currentPage={1}
        totalPages={0}
        totalResults={0}
      />,
    );

    expect(screen.getByTestId("paginated-table")).toBeInTheDocument();
    expect(
      screen.getByTestId("paginated-table-empty-message"),
    ).toHaveTextContent("No results.");
  });

  it("shows custom empty message", () => {
    render(
      <PaginatedTable
        {...defaultProps}
        data={[]}
        currentPage={1}
        totalPages={0}
        totalResults={0}
        emptyMessage="No items found"
      />,
    );

    expect(
      screen.getByTestId("paginated-table-empty-message"),
    ).toHaveTextContent("No items found");
  });

  it("calls onPageChange when clicking next page", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();

    render(<PaginatedTable {...defaultProps} onPageChange={onPageChange} />);

    const nextButton = screen.getByTestId("paginated-table-pagination-next");
    await user.click(nextButton);

    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("calls onPageChange when clicking previous page", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();

    render(
      <PaginatedTable
        {...defaultProps}
        currentPage={3}
        onPageChange={onPageChange}
      />,
    );

    const prevButton = screen.getByTestId(
      "paginated-table-pagination-previous",
    );
    await user.click(prevButton);

    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("calls onPageChange when clicking page number", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();

    render(<PaginatedTable {...defaultProps} onPageChange={onPageChange} />);

    const pageButton = screen.getByTestId("paginated-table-pagination-page-3");
    await user.click(pageButton);

    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it("calls onPageSizeChange when changing page size", async () => {
    const user = userEvent.setup();
    const onPageSizeChange = vi.fn();

    render(
      <PaginatedTable {...defaultProps} onPageSizeChange={onPageSizeChange} />,
    );

    const pageSizeTrigger = screen.getByTestId(
      "paginated-table-pagination-page-size-trigger",
    );
    await user.click(pageSizeTrigger);

    const option25 = screen.getByTestId(
      "paginated-table-pagination-page-size-option-25",
    );
    await user.click(option25);

    expect(onPageSizeChange).toHaveBeenCalledWith(25);
  });

  it("does not render pagination when totalPages is 0", () => {
    render(
      <PaginatedTable
        {...defaultProps}
        data={[]}
        currentPage={1}
        totalPages={0}
        totalResults={0}
      />,
    );

    expect(screen.getByTestId("paginated-table")).toBeInTheDocument();
    expect(
      screen.queryByTestId("paginated-table-pagination"),
    ).not.toBeInTheDocument();
  });

  it("uses custom testId", () => {
    render(<PaginatedTable {...defaultProps} testId="custom-table" />);

    expect(screen.getByTestId("custom-table")).toBeInTheDocument();
    expect(screen.getByTestId("custom-table-pagination")).toBeInTheDocument();
  });

  it("passes custom className to DataTable", () => {
    render(<PaginatedTable {...defaultProps} className="custom-class" />);

    const table = screen.getByTestId("paginated-table");
    expect(table).toHaveClass("custom-class");
  });

  it("passes custom pageSizeOptions to TablePagination", async () => {
    const user = userEvent.setup();
    const customOptions = [5, 15, 30];

    render(
      <PaginatedTable {...defaultProps} pageSizeOptions={customOptions} />,
    );

    const pageSizeTrigger = screen.getByTestId(
      "paginated-table-pagination-page-size-trigger",
    );
    await user.click(pageSizeTrigger);

    expect(
      screen.getByTestId("paginated-table-pagination-page-size-option-5"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("paginated-table-pagination-page-size-option-15"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("paginated-table-pagination-page-size-option-30"),
    ).toBeInTheDocument();
  });
});

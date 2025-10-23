import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TablePagination } from "./TablePagination";

describe("TablePagination", () => {
  const mockOnPageChange = vi.fn();
  const mockOnPageSizeChange = vi.fn();

  const defaultProps = {
    currentPage: 1,
    totalPages: 10,
    totalResults: 100,
    pageSize: 10,
    onPageChange: mockOnPageChange,
    onPageSizeChange: mockOnPageSizeChange,
  };

  beforeEach(() => {
    mockOnPageChange.mockClear();
    mockOnPageSizeChange.mockClear();
  });

  describe("Basic Rendering", () => {
    it("renders pagination component", () => {
      render(<TablePagination {...defaultProps} />);

      expect(screen.getByTestId("table-pagination")).toBeInTheDocument();
    });

    it("displays results info correctly", () => {
      render(<TablePagination {...defaultProps} />);

      expect(
        screen.getByTestId("table-pagination-results-info"),
      ).toHaveTextContent("1-10 of 100 results");
    });

    it("displays correct results info on middle page", () => {
      render(<TablePagination {...defaultProps} currentPage={5} />);

      expect(
        screen.getByTestId("table-pagination-results-info"),
      ).toHaveTextContent("41-50 of 100 results");
    });

    it("displays correct results info on last page with partial results", () => {
      render(
        <TablePagination
          {...defaultProps}
          currentPage={10}
          totalResults={95}
        />,
      );

      expect(
        screen.getByTestId("table-pagination-results-info"),
      ).toHaveTextContent("91-95 of 95 results");
    });

    it("renders with custom testId", () => {
      render(<TablePagination {...defaultProps} testId="custom-pagination" />);

      expect(screen.getByTestId("custom-pagination")).toBeInTheDocument();
      expect(
        screen.getByTestId("custom-pagination-results-info"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("custom-pagination-controls"),
      ).toBeInTheDocument();
    });

    it("applies custom className", () => {
      render(<TablePagination {...defaultProps} className="custom-class" />);

      const pagination = screen.getByTestId("table-pagination");
      expect(pagination).toHaveClass("custom-class");
    });
  });

  describe("Navigation Controls", () => {
    it("renders previous and next buttons", () => {
      render(<TablePagination {...defaultProps} />);

      expect(
        screen.getByTestId("table-pagination-previous"),
      ).toBeInTheDocument();
      expect(screen.getByTestId("table-pagination-next")).toBeInTheDocument();
    });

    it("disables previous button on first page", () => {
      render(<TablePagination {...defaultProps} currentPage={1} />);

      const prevButton = screen.getByTestId("table-pagination-previous");
      expect(prevButton).toBeDisabled();
      expect(prevButton).toHaveClass("opacity-50", "cursor-not-allowed");
    });

    it("disables next button on last page", () => {
      render(<TablePagination {...defaultProps} currentPage={10} />);

      const nextButton = screen.getByTestId("table-pagination-next");
      expect(nextButton).toBeDisabled();
      expect(nextButton).toHaveClass("opacity-50", "cursor-not-allowed");
    });

    it("enables both buttons on middle page", () => {
      render(<TablePagination {...defaultProps} currentPage={5} />);

      const prevButton = screen.getByTestId("table-pagination-previous");
      const nextButton = screen.getByTestId("table-pagination-next");

      expect(prevButton).not.toBeDisabled();
      expect(nextButton).not.toBeDisabled();
      expect(prevButton).toHaveClass("cursor-pointer");
      expect(nextButton).toHaveClass("cursor-pointer");
    });

    it("calls onPageChange when previous button is clicked", async () => {
      const user = userEvent.setup();
      render(<TablePagination {...defaultProps} currentPage={5} />);

      await user.click(screen.getByTestId("table-pagination-previous"));

      expect(mockOnPageChange).toHaveBeenCalledWith(4);
      expect(mockOnPageChange).toHaveBeenCalledTimes(1);
    });

    it("calls onPageChange when next button is clicked", async () => {
      const user = userEvent.setup();
      render(<TablePagination {...defaultProps} currentPage={5} />);

      await user.click(screen.getByTestId("table-pagination-next"));

      expect(mockOnPageChange).toHaveBeenCalledWith(6);
      expect(mockOnPageChange).toHaveBeenCalledTimes(1);
    });

    it("has correct aria-labels for navigation buttons", () => {
      render(<TablePagination {...defaultProps} />);

      expect(screen.getByTestId("table-pagination-previous")).toHaveAttribute(
        "aria-label",
        "Go to previous page",
      );
      expect(screen.getByTestId("table-pagination-next")).toHaveAttribute(
        "aria-label",
        "Go to next page",
      );
    });
  });

  describe("Page Number Display Logic", () => {
    it("shows all pages when totalPages is 6 or less", () => {
      render(<TablePagination {...defaultProps} totalPages={6} />);

      for (let i = 1; i <= 6; i++) {
        expect(
          screen.getByTestId(`table-pagination-page-${i}`),
        ).toBeInTheDocument();
      }

      // Should not show ellipsis
      expect(
        screen.queryByTestId(/table-pagination-ellipsis/),
      ).not.toBeInTheDocument();
    });

    it("shows all pages when totalPages is less than 6", () => {
      render(<TablePagination {...defaultProps} totalPages={4} />);

      for (let i = 1; i <= 4; i++) {
        expect(
          screen.getByTestId(`table-pagination-page-${i}`),
        ).toBeInTheDocument();
      }

      expect(
        screen.queryByTestId(/table-pagination-ellipsis/),
      ).not.toBeInTheDocument();
    });

    it("shows first 5 pages + ellipsis when on page 1", () => {
      render(
        <TablePagination {...defaultProps} currentPage={1} totalPages={20} />,
      );

      // Should show pages 1-5
      for (let i = 1; i <= 5; i++) {
        expect(
          screen.getByTestId(`table-pagination-page-${i}`),
        ).toBeInTheDocument();
      }

      // Should show ellipsis
      expect(
        screen.getByTestId("table-pagination-ellipsis-5"),
      ).toBeInTheDocument();

      // Should not show page 6 or beyond
      expect(
        screen.queryByTestId("table-pagination-page-6"),
      ).not.toBeInTheDocument();
    });

    it("shows first 5 pages + ellipsis when on page 5", () => {
      render(
        <TablePagination {...defaultProps} currentPage={5} totalPages={20} />,
      );

      for (let i = 1; i <= 5; i++) {
        expect(
          screen.getByTestId(`table-pagination-page-${i}`),
        ).toBeInTheDocument();
      }

      expect(
        screen.getByTestId("table-pagination-ellipsis-5"),
      ).toBeInTheDocument();
    });

    it("shows 5 pages + ellipsis when in middle range", () => {
      render(
        <TablePagination {...defaultProps} currentPage={10} totalPages={20} />,
      );

      // Should show pages 9-13 (currentPage - 1 to currentPage + 3)
      for (let i = 9; i <= 13; i++) {
        expect(
          screen.getByTestId(`table-pagination-page-${i}`),
        ).toBeInTheDocument();
      }

      expect(
        screen.getByTestId("table-pagination-ellipsis-5"),
      ).toBeInTheDocument();
    });

    it("shows last 6 pages without ellipsis when near the end", () => {
      render(
        <TablePagination {...defaultProps} currentPage={18} totalPages={20} />,
      );

      // Should show pages 15-20 (last 6 pages)
      for (let i = 15; i <= 20; i++) {
        expect(
          screen.getByTestId(`table-pagination-page-${i}`),
        ).toBeInTheDocument();
      }

      // Should not show ellipsis
      expect(
        screen.queryByTestId(/table-pagination-ellipsis/),
      ).not.toBeInTheDocument();
    });

    it("shows last 6 pages when on last page", () => {
      render(
        <TablePagination {...defaultProps} currentPage={20} totalPages={20} />,
      );

      for (let i = 15; i <= 20; i++) {
        expect(
          screen.getByTestId(`table-pagination-page-${i}`),
        ).toBeInTheDocument();
      }

      expect(
        screen.queryByTestId(/table-pagination-ellipsis/),
      ).not.toBeInTheDocument();
    });

    it("renders single page correctly", () => {
      render(
        <TablePagination
          {...defaultProps}
          currentPage={1}
          totalPages={1}
          totalResults={5}
        />,
      );

      expect(screen.getByTestId("table-pagination-page-1")).toBeInTheDocument();
      expect(
        screen.queryByTestId(/table-pagination-ellipsis/),
      ).not.toBeInTheDocument();
    });
  });

  describe("Page Selection", () => {
    it("calls onPageChange when page number is clicked", async () => {
      const user = userEvent.setup();
      render(<TablePagination {...defaultProps} currentPage={1} />);

      await user.click(screen.getByTestId("table-pagination-page-3"));

      expect(mockOnPageChange).toHaveBeenCalledWith(3);
      expect(mockOnPageChange).toHaveBeenCalledTimes(1);
    });

    it("applies active styling to current page", () => {
      render(<TablePagination {...defaultProps} currentPage={5} />);

      const currentPageButton = screen.getByTestId("table-pagination-page-5");
      expect(currentPageButton).toHaveClass("bg-foreground", "text-background");
    });

    it("applies hover styling to non-current pages", () => {
      render(<TablePagination {...defaultProps} currentPage={5} />);

      const nonCurrentPageButton = screen.getByTestId(
        "table-pagination-page-3",
      );
      expect(nonCurrentPageButton).toHaveClass(
        "text-foreground",
        "hover:bg-accent",
      );
    });

    it("displays correct page numbers", () => {
      render(
        <TablePagination {...defaultProps} currentPage={1} totalPages={6} />,
      );

      for (let i = 1; i <= 6; i++) {
        const pageButton = screen.getByTestId(`table-pagination-page-${i}`);
        expect(pageButton).toHaveTextContent(i.toString());
      }
    });
  });

  describe("Page Size Selection", () => {
    it("renders page size selector", () => {
      render(<TablePagination {...defaultProps} />);

      expect(
        screen.getByTestId("table-pagination-page-size"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("table-pagination-page-size-trigger"),
      ).toBeInTheDocument();
    });

    it("displays 'Per page' label", () => {
      render(<TablePagination {...defaultProps} />);

      expect(screen.getByText("Per page")).toBeInTheDocument();
    });

    it("renders default page size options", async () => {
      const user = userEvent.setup();
      render(<TablePagination {...defaultProps} />);

      await user.click(
        screen.getByTestId("table-pagination-page-size-trigger"),
      );

      const defaultOptions = [10, 20, 50, 100];
      for (const size of defaultOptions) {
        expect(
          screen.getByTestId(`table-pagination-page-size-option-${size}`),
        ).toBeInTheDocument();
      }
    });

    it("renders custom page size options", async () => {
      const user = userEvent.setup();
      const customOptions = [25, 50, 75, 150];

      render(
        <TablePagination {...defaultProps} pageSizeOptions={customOptions} />,
      );

      await user.click(
        screen.getByTestId("table-pagination-page-size-trigger"),
      );

      for (const size of customOptions) {
        expect(
          screen.getByTestId(`table-pagination-page-size-option-${size}`),
        ).toBeInTheDocument();
      }
    });

    it("displays current page size value", async () => {
      const user = userEvent.setup();
      render(<TablePagination {...defaultProps} pageSize={20} />);

      await user.click(
        screen.getByTestId("table-pagination-page-size-trigger"),
      );

      // The trigger should display the current value
      const content = screen.getByTestId("table-pagination-page-size-content");
      expect(content).toBeInTheDocument();
    });

    it("calls onPageSizeChange when selecting a different page size", async () => {
      const user = userEvent.setup();
      render(<TablePagination {...defaultProps} pageSize={10} />);

      await user.click(
        screen.getByTestId("table-pagination-page-size-trigger"),
      );
      await user.click(
        screen.getByTestId("table-pagination-page-size-option-20"),
      );

      expect(mockOnPageSizeChange).toHaveBeenCalledWith(20);
      expect(mockOnPageSizeChange).toHaveBeenCalledTimes(1);
    });
  });

  describe("Edge Cases", () => {
    it("handles first page with pageSize 1", () => {
      render(
        <TablePagination
          {...defaultProps}
          currentPage={1}
          pageSize={1}
          totalResults={100}
          totalPages={100}
        />,
      );

      expect(
        screen.getByTestId("table-pagination-results-info"),
      ).toHaveTextContent("1-1 of 100 results");
    });

    it("handles last page with partial results", () => {
      render(
        <TablePagination
          {...defaultProps}
          currentPage={11}
          pageSize={10}
          totalResults={103}
          totalPages={11}
        />,
      );

      expect(
        screen.getByTestId("table-pagination-results-info"),
      ).toHaveTextContent("101-103 of 103 results");
    });

    it("handles very large datasets", () => {
      render(
        <TablePagination
          {...defaultProps}
          currentPage={50}
          pageSize={100}
          totalResults={10000}
          totalPages={100}
        />,
      );

      expect(
        screen.getByTestId("table-pagination-results-info"),
      ).toHaveTextContent("4901-5000 of 10000 results");
    });

    it("handles single result", () => {
      render(
        <TablePagination
          {...defaultProps}
          currentPage={1}
          pageSize={10}
          totalResults={1}
          totalPages={1}
        />,
      );

      expect(
        screen.getByTestId("table-pagination-results-info"),
      ).toHaveTextContent("1-1 of 1 results");
    });

    it("handles exactly one full page", () => {
      render(
        <TablePagination
          {...defaultProps}
          currentPage={1}
          pageSize={10}
          totalResults={10}
          totalPages={1}
        />,
      );

      expect(
        screen.getByTestId("table-pagination-results-info"),
      ).toHaveTextContent("1-10 of 10 results");
      expect(screen.getByTestId("table-pagination-previous")).toBeDisabled();
      expect(screen.getByTestId("table-pagination-next")).toBeDisabled();
    });

    it("custom testId propagates to all sub-elements", async () => {
      const user = userEvent.setup();
      render(
        <TablePagination
          {...defaultProps}
          testId="custom"
          currentPage={1}
          totalPages={10}
        />,
      );

      expect(screen.getByTestId("custom")).toBeInTheDocument();
      expect(screen.getByTestId("custom-results-info")).toBeInTheDocument();
      expect(screen.getByTestId("custom-controls")).toBeInTheDocument();
      expect(screen.getByTestId("custom-previous")).toBeInTheDocument();
      expect(screen.getByTestId("custom-next")).toBeInTheDocument();
      expect(screen.getByTestId("custom-page-1")).toBeInTheDocument();
      expect(screen.getByTestId("custom-page-size")).toBeInTheDocument();
      expect(
        screen.getByTestId("custom-page-size-trigger"),
      ).toBeInTheDocument();

      await user.click(screen.getByTestId("custom-page-size-trigger"));

      expect(
        screen.getByTestId("custom-page-size-content"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("custom-page-size-option-10"),
      ).toBeInTheDocument();
    });

    it("handles boundary transition from page 5 to page 6", () => {
      render(
        <TablePagination {...defaultProps} currentPage={6} totalPages={20} />,
      );

      // Should now be in middle range showing 5-9 + ellipsis
      for (let i = 5; i <= 9; i++) {
        expect(
          screen.getByTestId(`table-pagination-page-${i}`),
        ).toBeInTheDocument();
      }

      expect(
        screen.getByTestId("table-pagination-ellipsis-5"),
      ).toBeInTheDocument();
    });

    it("handles boundary transition to last 6 pages", () => {
      render(
        <TablePagination {...defaultProps} currentPage={16} totalPages={20} />,
      );

      // Should show last 6 pages (15-20)
      for (let i = 15; i <= 20; i++) {
        expect(
          screen.getByTestId(`table-pagination-page-${i}`),
        ).toBeInTheDocument();
      }

      expect(
        screen.queryByTestId(/table-pagination-ellipsis/),
      ).not.toBeInTheDocument();
    });
  });

  describe("Integration Tests", () => {
    it("navigates through pages correctly", async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <TablePagination {...defaultProps} currentPage={1} totalPages={5} />,
      );

      // Click next
      await user.click(screen.getByTestId("table-pagination-next"));
      expect(mockOnPageChange).toHaveBeenCalledWith(2);

      // Simulate page change
      rerender(
        <TablePagination {...defaultProps} currentPage={2} totalPages={5} />,
      );

      // Click page 4
      await user.click(screen.getByTestId("table-pagination-page-4"));
      expect(mockOnPageChange).toHaveBeenCalledWith(4);

      // Simulate page change
      rerender(
        <TablePagination {...defaultProps} currentPage={4} totalPages={5} />,
      );

      // Click previous
      await user.click(screen.getByTestId("table-pagination-previous"));
      expect(mockOnPageChange).toHaveBeenCalledWith(3);
    });

    it("updates results display when page size changes", () => {
      const { rerender } = render(
        <TablePagination
          {...defaultProps}
          currentPage={1}
          pageSize={10}
          totalResults={100}
        />,
      );

      expect(
        screen.getByTestId("table-pagination-results-info"),
      ).toHaveTextContent("1-10 of 100 results");

      rerender(
        <TablePagination
          {...defaultProps}
          currentPage={1}
          pageSize={20}
          totalResults={100}
        />,
      );

      expect(
        screen.getByTestId("table-pagination-results-info"),
      ).toHaveTextContent("1-20 of 100 results");
    });
  });
});

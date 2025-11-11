import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SortOption, TableSort } from "./TableSort";

describe("TableSort", () => {
  const mockOnValueChange = vi.fn();

  const defaultSortOptions: SortOption[] = [
    { value: "status", label: "Status" },
    { value: "uploader", label: "Uploader" },
    { value: "date", label: "Date" },
  ];

  const defaultProps = {
    options: defaultSortOptions,
    onValueChange: mockOnValueChange,
  };

  beforeEach(() => {
    mockOnValueChange.mockClear();
  });

  describe("Basic Rendering", () => {
    it("renders table sort component", () => {
      render(<TableSort {...defaultProps} />);

      expect(screen.getByTestId("table-sort")).toBeInTheDocument();
    });

    it("displays placeholder when no value is selected", () => {
      render(<TableSort {...defaultProps} placeholder="Sort by field" />);

      expect(screen.getByText("Sort by field")).toBeInTheDocument();
    });

    it("displays default placeholder", () => {
      render(<TableSort {...defaultProps} />);

      expect(screen.getByText("Sort by")).toBeInTheDocument();
    });

    it("displays selected value", () => {
      render(<TableSort {...defaultProps} value="status" />);

      expect(screen.getByText("Status")).toBeInTheDocument();
    });

    it("applies custom className", () => {
      render(<TableSort {...defaultProps} className="custom-sort-class" />);

      const trigger = screen.getByTestId("table-sort");
      expect(trigger).toHaveClass("custom-sort-class");
    });

    it("renders with custom testId", () => {
      render(<TableSort {...defaultProps} testId="custom-sort" />);

      expect(screen.getByTestId("custom-sort")).toBeInTheDocument();
    });

    it("custom testId propagates to content", async () => {
      const user = userEvent.setup();
      render(<TableSort {...defaultProps} testId="custom-sort" />);

      await user.click(screen.getByTestId("custom-sort"));

      expect(screen.getByTestId("custom-sort-content")).toBeInTheDocument();
    });
  });

  describe("Options Rendering", () => {
    it("renders all provided options", async () => {
      const user = userEvent.setup();
      render(<TableSort {...defaultProps} />);

      await user.click(screen.getByTestId("table-sort"));

      expect(
        screen.getByTestId("table-sort-option-status"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("table-sort-option-uploader"),
      ).toBeInTheDocument();
      expect(screen.getByTestId("table-sort-option-date")).toBeInTheDocument();
    });

    it("displays correct labels for options", async () => {
      const user = userEvent.setup();
      render(<TableSort {...defaultProps} />);

      await user.click(screen.getByTestId("table-sort"));

      expect(screen.getByText("Status")).toBeInTheDocument();
      expect(screen.getByText("Uploader")).toBeInTheDocument();
      expect(screen.getByText("Date")).toBeInTheDocument();
    });

    it("handles single option", async () => {
      const user = userEvent.setup();
      const singleOption: SortOption[] = [{ value: "name", label: "Name" }];

      render(<TableSort {...defaultProps} options={singleOption} />);

      await user.click(screen.getByTestId("table-sort"));

      expect(screen.getByTestId("table-sort-option-name")).toBeInTheDocument();
      expect(screen.getByText("Name")).toBeInTheDocument();
    });

    it("handles many options", async () => {
      const user = userEvent.setup();
      const manyOptions: SortOption[] = [
        { value: "status", label: "Status" },
        { value: "name", label: "Name" },
        { value: "date", label: "Date" },
        { value: "size", label: "Size" },
        { value: "type", label: "Type" },
        { value: "uploader", label: "Uploader" },
      ];

      render(<TableSort {...defaultProps} options={manyOptions} />);

      await user.click(screen.getByTestId("table-sort"));

      for (const option of manyOptions) {
        expect(
          screen.getByTestId(`table-sort-option-${option.value}`),
        ).toBeInTheDocument();
        if (typeof option.label === "string") {
          expect(screen.getByText(option.label)).toBeInTheDocument();
        }
      }
    });

    it("handles ReactNode labels with icons", async () => {
      const user = userEvent.setup();
      const iconOptions: SortOption[] = [
        {
          value: "status",
          label: (
            <div className="flex items-center gap-2">
              <span className="icon">📊</span>
              Status
            </div>
          ),
        },
      ];

      render(<TableSort {...defaultProps} options={iconOptions} />);

      await user.click(screen.getByTestId("table-sort"));

      expect(screen.getByText("📊")).toBeInTheDocument();
      expect(screen.getByText("Status")).toBeInTheDocument();
    });

    it("renders empty options array without error", async () => {
      const user = userEvent.setup();
      render(<TableSort {...defaultProps} options={[]} />);

      await user.click(screen.getByTestId("table-sort"));

      expect(screen.getByTestId("table-sort-content")).toBeInTheDocument();
    });
  });

  describe("User Interactions", () => {
    it("opens dropdown when trigger is clicked", async () => {
      const user = userEvent.setup();
      render(<TableSort {...defaultProps} />);

      await user.click(screen.getByTestId("table-sort"));

      expect(screen.getByTestId("table-sort-content")).toBeInTheDocument();
    });

    it("calls onValueChange when option is selected", async () => {
      const user = userEvent.setup();
      render(<TableSort {...defaultProps} />);

      await user.click(screen.getByTestId("table-sort"));
      await user.click(screen.getByTestId("table-sort-option-status"));

      expect(mockOnValueChange).toHaveBeenCalledWith("status");
      expect(mockOnValueChange).toHaveBeenCalledTimes(1);
    });

    it("calls onValueChange with correct value for multiple options", async () => {
      const user = userEvent.setup();
      render(<TableSort {...defaultProps} />);

      await user.click(screen.getByTestId("table-sort"));
      await user.click(screen.getByTestId("table-sort-option-date"));

      expect(mockOnValueChange).toHaveBeenCalledWith("date");
      expect(mockOnValueChange).not.toHaveBeenCalledWith("status");
      expect(mockOnValueChange).not.toHaveBeenCalledWith("uploader");
    });

    it("updates selected value when different option is chosen", async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <TableSort {...defaultProps} value="status" />,
      );

      expect(screen.getByText("Status")).toBeInTheDocument();

      await user.click(screen.getByTestId("table-sort"));
      await user.click(screen.getByTestId("table-sort-option-date"));

      expect(mockOnValueChange).toHaveBeenCalledWith("date");

      // Simulate parent component updating the value prop
      rerender(<TableSort {...defaultProps} value="date" />);

      expect(screen.getByText("Date")).toBeInTheDocument();
    });
  });

  describe("Value Prop Behavior", () => {
    it("shows placeholder when value is undefined", () => {
      render(<TableSort {...defaultProps} value={undefined} />);

      expect(screen.getByText("Sort by")).toBeInTheDocument();
    });

    it("shows selected option when value matches option", () => {
      render(<TableSort {...defaultProps} value="uploader" />);

      expect(screen.getByText("Uploader")).toBeInTheDocument();
    });

    it("handles value changes correctly", () => {
      const { rerender } = render(
        <TableSort {...defaultProps} value="status" />,
      );

      expect(screen.getByText("Status")).toBeInTheDocument();

      rerender(<TableSort {...defaultProps} value="uploader" />);

      expect(screen.getByText("Uploader")).toBeInTheDocument();
    });

    it("returns to placeholder when value is cleared", () => {
      const { rerender } = render(
        <TableSort {...defaultProps} value="status" />,
      );

      expect(screen.getByText("Status")).toBeInTheDocument();

      rerender(<TableSort {...defaultProps} value={undefined} />);

      expect(screen.getByText("Sort by")).toBeInTheDocument();
    });
  });

  describe("TestId Generation", () => {
    it("generates correct testIds for all options with default testId", async () => {
      const user = userEvent.setup();
      render(<TableSort {...defaultProps} />);

      await user.click(screen.getByTestId("table-sort"));

      expect(
        screen.getByTestId("table-sort-option-status"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("table-sort-option-uploader"),
      ).toBeInTheDocument();
      expect(screen.getByTestId("table-sort-option-date")).toBeInTheDocument();
    });

    it("generates correct testIds for all options with custom testId", async () => {
      const user = userEvent.setup();
      render(<TableSort {...defaultProps} testId="custom" />);

      await user.click(screen.getByTestId("custom"));

      expect(screen.getByTestId("custom-option-status")).toBeInTheDocument();
      expect(screen.getByTestId("custom-option-uploader")).toBeInTheDocument();
      expect(screen.getByTestId("custom-option-date")).toBeInTheDocument();
    });

    it("generates testIds correctly for options with special characters", async () => {
      const user = userEvent.setup();
      const specialOptions: SortOption[] = [
        { value: "created-date", label: "Created Date" },
        { value: "updated_at", label: "Updated At" },
        { value: "file.name", label: "File Name" },
      ];

      render(<TableSort {...defaultProps} options={specialOptions} />);

      await user.click(screen.getByTestId("table-sort"));

      expect(
        screen.getByTestId("table-sort-option-created-date"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("table-sort-option-updated_at"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("table-sort-option-file.name"),
      ).toBeInTheDocument();
    });
  });

  describe("Integration", () => {
    it("works with controlled state pattern", async () => {
      const user = userEvent.setup();
      let currentValue = "status";

      const mockControlledOnChange = vi.fn((value: string) => {
        currentValue = value;
      });

      const { rerender } = render(
        <TableSort
          {...defaultProps}
          value={currentValue}
          onValueChange={mockControlledOnChange}
        />,
      );

      expect(screen.getByText("Status")).toBeInTheDocument();

      await user.click(screen.getByTestId("table-sort"));
      await user.click(screen.getByTestId("table-sort-option-date"));

      expect(mockControlledOnChange).toHaveBeenCalledWith("date");

      // Simulate parent updating state
      rerender(
        <TableSort
          {...defaultProps}
          value="date"
          onValueChange={mockControlledOnChange}
        />,
      );

      expect(screen.getByText("Date")).toBeInTheDocument();
    });

    it("maintains selection across re-renders", () => {
      const { rerender } = render(
        <TableSort {...defaultProps} value="status" />,
      );

      expect(screen.getByText("Status")).toBeInTheDocument();

      rerender(<TableSort {...defaultProps} value="status" />);

      expect(screen.getByText("Status")).toBeInTheDocument();
    });
  });
});

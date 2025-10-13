import { render, screen } from "@testing-library/react";
import { DataTable } from "./DataTable";
import { ColumnDef } from "@tanstack/react-table";

describe("DataTable", () => {
  type TestData = {
    id: string;
    name: string;
    value: number;
  };

  const mockData: TestData[] = [
    { id: "1", name: "Item 1", value: 100 },
    { id: "2", name: "Item 2", value: 200 },
    { id: "3", name: "Item 3", value: 300 },
  ];

  const mockColumns: ColumnDef<TestData>[] = [
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "value",
      header: "Value",
    },
  ];

  it("renders table with data", () => {
    render(<DataTable columns={mockColumns} data={mockData} />);

    expect(screen.getByTestId("data-table")).toBeInTheDocument();
    expect(screen.getByTestId("data-table-header-row")).toBeInTheDocument();
    expect(screen.getByTestId("data-table-body")).toBeInTheDocument();
  });

  it("renders column headers correctly", () => {
    render(<DataTable columns={mockColumns} data={mockData} />);

    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Value")).toBeInTheDocument();
  });

  it("renders all data rows", () => {
    render(<DataTable columns={mockColumns} data={mockData} />);

    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Item 2")).toBeInTheDocument();
    expect(screen.getByText("Item 3")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("200")).toBeInTheDocument();
    expect(screen.getByText("300")).toBeInTheDocument();
  });

  it("renders correct number of rows", () => {
    render(<DataTable columns={mockColumns} data={mockData} />);

    const rows = screen.getAllByTestId(/data-table-row-\d+/);
    expect(rows).toHaveLength(3);
  });

  it("renders loading state with skeleton rows", () => {
    render(<DataTable columns={mockColumns} data={[]} isLoading={true} />);

    const skeletonRows = screen.getAllByTestId(/data-table-skeleton-row-\d+/);
    expect(skeletonRows).toHaveLength(5);
  });

  it("renders empty state when no data", () => {
    render(<DataTable columns={mockColumns} data={[]} />);

    expect(screen.getByTestId("data-table-empty-row")).toBeInTheDocument();
    expect(screen.getByTestId("data-table-empty-message")).toHaveTextContent(
      "No results.",
    );
  });

  it("renders custom empty message", () => {
    const customMessage = "No items found";
    render(
      <DataTable
        columns={mockColumns}
        data={[]}
        emptyMessage={customMessage}
      />,
    );

    expect(screen.getByTestId("data-table-empty-message")).toHaveTextContent(
      customMessage,
    );
  });

  it("applies custom className", () => {
    render(
      <DataTable
        columns={mockColumns}
        data={mockData}
        className="custom-class"
      />,
    );

    const table = screen.getByTestId("data-table");
    expect(table).toHaveClass("custom-class");
  });

  it("uses custom testId", () => {
    render(
      <DataTable
        columns={mockColumns}
        data={mockData}
        testId="custom-test-id"
      />,
    );

    expect(screen.getByTestId("custom-test-id")).toBeInTheDocument();
    expect(screen.getByTestId("custom-test-id-header-row")).toBeInTheDocument();
    expect(screen.getByTestId("custom-test-id-body")).toBeInTheDocument();
  });

  it("renders custom cell content", () => {
    const customColumns: ColumnDef<TestData>[] = [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ getValue }) => (
          <span className="font-bold">{getValue() as string}</span>
        ),
      },
    ];

    render(<DataTable columns={customColumns} data={mockData} />);

    const item1 = screen.getByText("Item 1");
    expect(item1).toBeInTheDocument();
    expect(item1).toHaveClass("font-bold");
  });

  it("renders header cells with correct testIds", () => {
    render(<DataTable columns={mockColumns} data={mockData} />);

    expect(screen.getByTestId("data-table-header-name")).toBeInTheDocument();
    expect(screen.getByTestId("data-table-header-value")).toBeInTheDocument();
  });

  it("renders data cells with correct testIds", () => {
    render(<DataTable columns={mockColumns} data={mockData} />);

    expect(screen.getByTestId("data-table-cell-0_name")).toBeInTheDocument();
    expect(screen.getByTestId("data-table-cell-0_value")).toBeInTheDocument();
    expect(screen.getByTestId("data-table-cell-1_name")).toBeInTheDocument();
    expect(screen.getByTestId("data-table-cell-1_value")).toBeInTheDocument();
  });

  it("renders with single row", () => {
    const singleRow = [mockData[0]];
    render(<DataTable columns={mockColumns} data={singleRow} />);

    const rows = screen.getAllByTestId(/data-table-row-\d+/);
    expect(rows).toHaveLength(1);
    expect(screen.getByText("Item 1")).toBeInTheDocument();
  });

  it("renders with many columns", () => {
    const manyColumns: ColumnDef<TestData>[] = [
      { accessorKey: "id", header: "ID" },
      { accessorKey: "name", header: "Name" },
      { accessorKey: "value", header: "Value" },
    ];

    render(<DataTable columns={manyColumns} data={mockData} />);

    expect(screen.getByText("ID")).toBeInTheDocument();
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Value")).toBeInTheDocument();
  });

  it("does not render data when loading", () => {
    render(
      <DataTable columns={mockColumns} data={mockData} isLoading={true} />,
    );

    expect(screen.queryByText("Item 1")).not.toBeInTheDocument();
    expect(screen.queryByText("Item 2")).not.toBeInTheDocument();
    expect(screen.queryByText("Item 3")).not.toBeInTheDocument();
  });

  it("renders skeleton with correct number of columns", () => {
    const threeColumns: ColumnDef<TestData>[] = [
      { accessorKey: "id", header: "ID" },
      { accessorKey: "name", header: "Name" },
      { accessorKey: "value", header: "Value" },
    ];

    render(<DataTable columns={threeColumns} data={[]} isLoading={true} />);

    const firstSkeletonRow = screen.getByTestId("data-table-skeleton-row-0");
    const cells = firstSkeletonRow.querySelectorAll("td");
    expect(cells).toHaveLength(3);
  });

  it("empty state spans all columns", () => {
    render(<DataTable columns={mockColumns} data={[]} />);

    const emptyCell = screen.getByTestId("data-table-empty-message");
    expect(emptyCell).toHaveAttribute("colspan", "2");
  });

  it("renders with custom header renderer", () => {
    const customColumns: ColumnDef<TestData>[] = [
      {
        accessorKey: "name",
        header: () => <span className="custom-header">Custom Name</span>,
      },
    ];

    render(<DataTable columns={customColumns} data={mockData} />);

    const customHeader = screen.getByText("Custom Name");
    expect(customHeader).toBeInTheDocument();
    expect(customHeader).toHaveClass("custom-header");
  });

  it("handles large datasets", () => {
    const largeData = Array.from({ length: 100 }, (_, i) => ({
      id: `${i}`,
      name: `Item ${i}`,
      value: i * 10,
    }));

    render(<DataTable columns={mockColumns} data={largeData} />);

    const rows = screen.getAllByTestId(/data-table-row-\d+/);
    expect(rows).toHaveLength(100);
  });
});

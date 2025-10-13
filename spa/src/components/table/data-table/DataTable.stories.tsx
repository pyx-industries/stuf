import type { Meta, StoryObj } from "@storybook/react-vite";
import { DataTable } from "./DataTable";
import { Checkbox } from "@/components/ui/checkbox";
import { ColumnDef } from "@tanstack/react-table";
import { MoreOptions } from "@/components/utility/more-options";

const meta: Meta<typeof DataTable> = {
  title: "Components/Table/DataTable",
  component: DataTable,
  parameters: {
    layout: "padded",
    design: {
      type: "figma",
      url: "https://www.figma.com/design/SQOopW8mFNB8TLQSZvOySp/RBTP-UI?node-id=94-1758&t=dx0TvueGuipOyoi7-4",
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

// Sample file data type based on the screenshots
type FileData = {
  id: string;
  name: string;
  uploadDate: string;
  uploader: string;
  size: string;
  status: string;
};

// Sample file data based on the screenshots
const sampleFileData: FileData[] = [
  {
    id: "1",
    name: "Annual reporting of the lorem ipsum dolar sit amet",
    uploadDate: "23/01/2025 08:58 PM",
    uploader: "Cindy Readon",
    size: "24",
    status: "In progress",
  },
  {
    id: "2",
    name: "Change log of the lorem ipsum dolar sit amet",
    uploadDate: "08/02/2025 09:01 AM",
    uploader: "Melville Frohicky",
    size: "24",
    status: "In progress",
  },
  {
    id: "3",
    name: "Board Meeting Q3 2025",
    uploadDate: "11/03/2025 12:15 PM",
    uploader: "e.tombs@longeremail...",
    size: "38",
    status: "In progress",
  },
  {
    id: "4",
    name: "Annual reporting of the lorem ipsum dolar sit amet",
    uploadDate: "20/04/2025 10:59 AM",
    uploader: "Cassandra Spender",
    size: "38",
    status: "Review",
  },
  {
    id: "5",
    name: "Mandatory reporting Q1 2024 to Q4 2025",
    uploadDate: "10/05/2025 12:28 PM",
    uploader: "Luther Lee Boggs",
    size: "1.4",
    status: "In progress",
  },
];

// Default story - just text data
const defaultColumns: ColumnDef<FileData>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "uploadDate",
    header: "Upload date and time",
  },
  {
    accessorKey: "uploader",
    header: "Uploader",
  },
  {
    accessorKey: "size",
    header: "Size (mb)",
  },
  {
    accessorKey: "status",
    header: "Status",
  },
];

export const Default: Story = {
  args: {
    columns: defaultColumns as any,
    data: sampleFileData,
  },
};

// Story with checkbox as first column
export const WithCheckbox: Story = {
  render: () => {
    const columns: ColumnDef<FileData>[] = [
      {
        id: "select",
        header: ({ table }) => (
          <div className="flex items-center px-4">
            <Checkbox
              checked={table.getIsAllPageRowsSelected()}
              onCheckedChange={(value) =>
                table.toggleAllPageRowsSelected(!!value)
              }
              aria-label="Select all"
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center px-4">
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label="Select row"
            />
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
        size: 50,
      },
      {
        accessorKey: "name",
        header: "Name",
      },
      {
        accessorKey: "uploadDate",
        header: "Upload date and time",
      },
      {
        accessorKey: "uploader",
        header: "Uploader",
      },
      {
        accessorKey: "size",
        header: "Size (mb)",
      },
      {
        accessorKey: "status",
        header: "Status",
      },
    ];

    return <DataTable columns={columns} data={sampleFileData} />;
  },
};

// Story with checkbox and more options (vertical three dots)
export const WithCheckboxAndMoreOptions: Story = {
  render: () => {
    const columns: ColumnDef<FileData>[] = [
      {
        id: "select",
        header: ({ table }) => (
          <div className="flex items-center px-4">
            <Checkbox
              checked={table.getIsAllPageRowsSelected()}
              onCheckedChange={(value) =>
                table.toggleAllPageRowsSelected(!!value)
              }
              aria-label="Select all"
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center px-4">
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label="Select row"
            />
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
        size: 50,
      },
      {
        accessorKey: "name",
        header: "Name",
      },
      {
        accessorKey: "uploadDate",
        header: "Upload date and time",
      },
      {
        accessorKey: "uploader",
        header: "Uploader",
      },
      {
        accessorKey: "size",
        header: "Size (mb)",
      },
      {
        accessorKey: "status",
        header: "Status",
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex items-center justify-center px-4">
            <MoreOptions
              groups={[
                {
                  options: [
                    {
                      label: "View",
                      onClick: () => console.log("View", row.original),
                    },
                    {
                      label: "Download",
                      onClick: () => console.log("Download", row.original),
                    },
                  ],
                },
                {
                  options: [
                    {
                      label: "Delete",
                      onClick: () => console.log("Delete", row.original),
                      destructive: true,
                    },
                  ],
                },
              ]}
            />
          </div>
        ),
        enableSorting: false,
        size: 50,
      },
    ];

    return <DataTable columns={columns} data={sampleFileData} />;
  },
};

// Story with custom cell rendering
export const CustomCellRendering: Story = {
  args: {
    columns: [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ getValue }: any) => (
          <span className="font-medium">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: "uploadDate",
        header: "Upload date and time",
      },
      {
        accessorKey: "uploader",
        header: "Uploader",
        cell: ({ getValue }: any) => (
          <span className="text-muted-foreground">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: "size",
        header: "Size (mb)",
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }: any) => {
          const value = getValue() as string;
          const statusColors: Record<string, string> = {
            "In progress": "bg-blue-500/10 text-blue-600 dark:text-blue-400",
            Review: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
            Done: "bg-green-500/10 text-green-600 dark:text-green-400",
          };
          return (
            <span
              className={`inline-flex rounded-full px-2 py-1 text-xs ${statusColors[value] || ""}`}
            >
              {value}
            </span>
          );
        },
      },
    ] as any,
    data: sampleFileData,
  },
};

// Small dataset
export const SmallDataset: Story = {
  args: {
    columns: defaultColumns.slice(0, 3) as any,
    data: sampleFileData.slice(0, 2),
  },
};

// Empty state
export const EmptyState: Story = {
  args: {
    columns: defaultColumns.slice(0, 3) as any,
    data: [],
  },
};

// Loading state
export const LoadingState: Story = {
  args: {
    columns: defaultColumns as any,
    data: [],
    isLoading: true,
  },
};

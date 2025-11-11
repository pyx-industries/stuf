import type { Meta, StoryObj } from "@storybook/react-vite";
import { BulkActions } from "./BulkActions";

const meta: Meta<typeof BulkActions> = {
  title: "Components/Table/BulkActions",
  component: BulkActions,
  parameters: {
    layout: "centered",
    design: {
      type: "figma",
      url: "https://www.figma.com/design/SQOopW8mFNB8TLQSZvOySp/RBTP-UI?node-id=121-1899&t=X1ojbU0VMwecFl97-4",
    },
  },
  tags: ["autodocs"],
  argTypes: {
    selectedCount: {
      control: { type: "number", min: 0, max: 100 },
      description: "Number of files currently selected",
      table: {
        type: { summary: "number" },
        defaultValue: { summary: "0" },
      },
    },
    onDownload: {
      action: "download",
      description:
        "Callback function triggered when the Download button is clicked",
      table: {
        type: { summary: "() => void" },
      },
    },
    onChangeStatus: {
      action: "changeStatus",
      description:
        "Callback function triggered when a status option is selected",
      table: {
        type: { summary: "(status: string) => void" },
      },
    },
    testId: {
      control: "text",
      description: "Test ID for the component (used for testing)",
      table: {
        type: { summary: "string" },
        defaultValue: { summary: '"bulk-actions"' },
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
type Story = StoryObj<typeof BulkActions>;

export const Default: Story = {
  args: {
    selectedCount: 3,
    onDownload: () => console.log("Download clicked"),
    onChangeStatus: (status) => console.log("Change status to:", status),
  },
};

export const NoSelection: Story = {
  args: {
    selectedCount: 0,
    onDownload: () => console.log("Download clicked"),
    onChangeStatus: (status) => console.log("Change status to:", status),
  },
};

export const SingleSelection: Story = {
  args: {
    selectedCount: 1,
    onDownload: () => console.log("Download clicked"),
    onChangeStatus: (status) => console.log("Change status to:", status),
  },
};

export const ManySelected: Story = {
  args: {
    selectedCount: 42,
    onDownload: () => console.log("Download clicked"),
    onChangeStatus: (status) => console.log("Change status to:", status),
  },
};

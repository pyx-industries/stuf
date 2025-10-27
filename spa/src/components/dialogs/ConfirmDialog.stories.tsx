import type { Meta, StoryObj } from "@storybook/react-vite";
import { ConfirmDialog } from "./ConfirmDialog";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const meta = {
  title: "Components/Dialogs/ConfirmDialog",
  component: ConfirmDialog,
  parameters: {
    layout: "centered",
    design: {
      type: "figma",
      url: "https://www.figma.com/design/SQOopW8mFNB8TLQSZvOySp/RBTP-UI?node-id=691-7584&m=dev",
    },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="min-h-screen min-w-screen flex items-center justify-center bg-background p-4">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    open: {
      control: "boolean",
      description: "Controls whether the dialog is open or closed",
    },
    title: {
      control: "text",
      description: "The main title of the dialog",
    },
    description: {
      control: "text",
      description: "Optional description text displayed below the title",
    },
    confirmText: {
      control: "text",
      description: "Text for the confirm button",
    },
    cancelText: {
      control: "text",
      description: "Text for the cancel button",
    },
    dangerAlert: {
      control: "object",
      description:
        "Optional danger alert object with a message property for destructive actions",
    },
    children: {
      control: false,
      description: "Optional custom content (e.g., form fields, selects)",
    },
    isLoading: {
      control: "boolean",
      description: "Shows loading spinner and disables buttons when true",
    },
    loadingText: {
      control: "text",
      description: "Text to display on confirm button during loading state",
    },
    onConfirm: {
      action: "confirmed",
      description: "Callback function when user confirms",
    },
    onCancel: {
      action: "cancelled",
      description: "Callback function when user cancels",
    },
  },
} satisfies Meta<typeof ConfirmDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

// Wrapper component to handle state for interactive stories
function ConfirmDialogWrapper({
  title,
  description,
  confirmText,
  cancelText,
  dangerAlert,
  children,
  loadingText,
  simulateAsync = false,
  onConfirmCallback,
  onCancelCallback,
}: {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  dangerAlert?: { message: string };
  children?: React.ReactNode;
  loadingText?: string;
  simulateAsync?: boolean;
  onConfirmCallback?: () => void;
  onCancelCallback?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    if (simulateAsync) {
      setIsLoading(true);
      // Simulate async operation (e.g., API call)
      await new Promise((resolve) => setTimeout(resolve, 3000));
      console.log("Operation completed");
      setIsLoading(false);
    } else {
      console.log("Confirmed");
    }

    if (onConfirmCallback) {
      onConfirmCallback();
    }

    setOpen(false);
  };

  const handleCancel = () => {
    console.log("Cancelled");
    setIsLoading(false);

    if (onCancelCallback) {
      onCancelCallback();
    }

    setOpen(false);
  };

  return (
    <div>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-primary-mid text-primary-text rounded-md font-medium hover:opacity-90 transition-opacity"
      >
        Open Dialog
      </button>
      <ConfirmDialog
        open={open}
        title={title}
        description={description}
        confirmText={confirmText}
        cancelText={cancelText}
        dangerAlert={dangerAlert}
        isLoading={isLoading}
        loadingText={loadingText}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      >
        {children}
      </ConfirmDialog>
    </div>
  );
}

// Default variant
export const Default: Story = {
  args: {} as any,
  render: () => (
    <ConfirmDialogWrapper
      title="Are you sure?"
      description="This action cannot be undone."
      confirmText="Continue"
      cancelText="Cancel"
    />
  ),
};

// File Delete
export const DeleteFile: Story = {
  args: {} as any,
  render: () => (
    <ConfirmDialogWrapper
      title="Delete file"
      description="Are you sure you want to delete this file? This action can't be undone."
      confirmText="Delete file"
      cancelText="Cancel"
    />
  ),
};

// Archive File
export const ArchiveFile: Story = {
  args: {} as any,
  render: () => (
    <ConfirmDialogWrapper
      title="Archive file"
      description='Are you sure you want to archive "report.xlsx"?'
      confirmText="Archive"
      cancelText="Cancel"
    />
  ),
};

// With Long Description
export const WithLongDescription: Story = {
  args: {} as any,
  render: () => (
    <ConfirmDialogWrapper
      title="Delete file"
      description="This action will permanently delete all selected files and their associated metadata. This includes any comments, tags, and version history."
      confirmText="Delete file"
      cancelText="Cancel"
    />
  ),
};

// Destructive action with danger alert
export const DestructiveWithDangerAlert: Story = {
  args: {} as any,
  render: () => (
    <ConfirmDialogWrapper
      title="Delete collection"
      description="This will permanently delete the collection and all files within it."
      confirmText="Delete collection"
      cancelText="Cancel"
      dangerAlert={{
        message:
          "Warning: This action cannot be undone. All data will be permanently lost.",
      }}
    />
  ),
};

// With loading state
export const WithLoadingState: Story = {
  args: {} as any,
  render: () => (
    <ConfirmDialogWrapper
      title="Process files"
      description="This will process all selected files. This may take a few moments."
      confirmText="Process"
      cancelText="Cancel"
      loadingText="Processing..."
      simulateAsync={true}
    />
  ),
};

// With child component (select dropdown)
export const WithSelectChild: Story = {
  args: {} as any,
  render: () => {
    const [selectedCollection, setSelectedCollection] = useState("");

    return (
      <ConfirmDialogWrapper
        title="Move file"
        description="Select a collection to move this file to."
        confirmText="Move"
        cancelText="Cancel"
        onConfirmCallback={() => {
          console.log("Moving to collection:", selectedCollection);
          setSelectedCollection("");
        }}
        onCancelCallback={() => {
          setSelectedCollection("");
        }}
      >
        <div className="self-stretch flex flex-col gap-2">
          <label
            htmlFor="collection-select"
            className="text-foreground text-sm font-medium"
          >
            Destination collection
          </label>
          <Select
            value={selectedCollection}
            onValueChange={setSelectedCollection}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a collection..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="research">Research Data</SelectItem>
              <SelectItem value="reports">Reports</SelectItem>
              <SelectItem value="archive">Archive</SelectItem>
              <SelectItem value="shared">Shared Files</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </ConfirmDialogWrapper>
    );
  },
};

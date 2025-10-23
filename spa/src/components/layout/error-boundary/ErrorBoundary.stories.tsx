import type { Meta, StoryObj } from "@storybook/react-vite";
import { ErrorBoundary } from "./ErrorBoundary";

// Helper component that throws an error for demonstrating error state
const ThrowError = () => {
  throw new Error("This is a simulated error for Storybook");
};

const meta = {
  title: "Components/Layout/ErrorBoundary",
  component: ErrorBoundary,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  argTypes: {
    children: {
      control: false,
      description: "The child components to render when there is no error",
    },
  },
} satisfies Meta<typeof ErrorBoundary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full text-center space-y-4">
          <h1 className="text-3xl font-bold text-foreground">
            Normal Application Content
          </h1>
          <p className="text-base text-muted-foreground">
            This shows the ErrorBoundary in its normal state, rendering children
            without any errors. The error boundary is invisible when everything
            works correctly.
          </p>
        </div>
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          "Default state where no error has occurred. The ErrorBoundary simply renders its children.",
      },
    },
  },
};

export const ErrorState: Story = {
  args: {
    children: <ThrowError />,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Error state displayed when an unexpected error occurs in a child component. Shows a user-friendly error message with a reload button.",
      },
    },
  },
};

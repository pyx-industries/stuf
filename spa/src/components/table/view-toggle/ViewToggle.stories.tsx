import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { ViewToggle } from "./ViewToggle";

const meta: Meta<typeof ViewToggle> = {
  title: "Components/Table/ViewToggle",
  component: ViewToggle,
  parameters: {
    layout: "centered",
    design: {
      type: "figma",
      url: "https://www.figma.com/design/SQOopW8mFNB8TLQSZvOySp/RBTP-UI?node-id=121-1916&t=X1ojbU0VMwecFl97-4",
    },
  },
  tags: ["autodocs"],
  argTypes: {
    viewMode: {
      control: { type: "radio" },
      options: ["list", "grid"],
      description: "The current view mode (list or grid)",
      table: {
        type: { summary: '"list" | "grid"' },
        defaultValue: { summary: '"list"' },
      },
    },
    onViewModeChange: {
      action: "viewModeChange",
      description:
        "Callback function triggered when a view mode button is clicked. Receives the new view mode as parameter.",
      table: {
        type: { summary: '(mode: "list" | "grid") => void' },
      },
    },
    testId: {
      control: "text",
      description: "Test ID for the component (used for testing)",
      table: {
        type: { summary: "string" },
        defaultValue: { summary: '"view-toggle"' },
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
type Story = StoryObj<typeof ViewToggle>;

export const ListView: Story = {
  args: {
    viewMode: "list",
    onViewModeChange: (mode) => console.log("View mode changed to:", mode),
  },
};

export const GridView: Story = {
  args: {
    viewMode: "grid",
    onViewModeChange: (mode) => console.log("View mode changed to:", mode),
  },
};

export const Interactive: Story = {
  render: () => {
    const [viewMode, setViewMode] = useState<"list" | "grid">("list");

    return (
      <div className="flex flex-col gap-4 items-center">
        <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
        <p className="text-sm text-muted-foreground">
          Current view: <strong>{viewMode}</strong>
        </p>
      </div>
    );
  },
};

import type { Meta, StoryObj } from "@storybook/react-vite";
import { SidebarSkeleton } from "./SidebarSkeleton";

const meta = {
  title: "Components/Sidebar/SidebarSkeleton",
  component: SidebarSkeleton,
  decorators: [
    (Story) => (
      <div style={{ height: "100vh" }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: "fullscreen",
    design: {
      type: "figma",
      url: "https://www.figma.com/design/SQOopW8mFNB8TLQSZvOySp/RBTP-UI?node-id=365-4002&m=dev",
    },
  },
  tags: ["autodocs"],
  argTypes: {
    hideHeader: {
      control: "boolean",
      description: "Whether to hide the sidebar header",
    },
    className: {
      control: "text",
      description: "Additional CSS classes",
    },
  },
} satisfies Meta<typeof SidebarSkeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story:
          "Default skeleton state with header visible. Shows loading placeholders for all sidebar elements.",
      },
    },
  },
};

export const HiddenHeader: Story = {
  args: {
    hideHeader: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Skeleton with header hidden. Useful for embedded or mobile views where the header is shown elsewhere.",
      },
    },
  },
};

import type { Meta, StoryObj } from "@storybook/react-vite";
import { SidebarHeader } from "./SidebarHeader";

const meta = {
  title: "Components/Sidebar/SidebarHeader",
  component: SidebarHeader,
  parameters: {
    layout: "centered",
    design: {
      type: "figma",
      url: "https://www.figma.com/design/SQOopW8mFNB8TLQSZvOySp/RBTP-UI?node-id=365-5297&m=dev",
    },
  },
  decorators: [
    (Story) => {
      return (
        <div className="bg-background p-8">
          <Story />
        </div>
      );
    },
  ],
  tags: ["autodocs"],
} satisfies Meta<typeof SidebarHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

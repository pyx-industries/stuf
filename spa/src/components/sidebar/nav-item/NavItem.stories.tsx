import type { Meta, StoryObj } from "@storybook/react-vite";
import { NavItem } from "./NavItem";

const meta = {
  title: "Components/Sidebar/NavItem",
  component: NavItem,
  parameters: {
    layout: "centered",
    design: {
      type: "figma",
      url: "https://www.figma.com/design/SQOopW8mFNB8TLQSZvOySp/RBTP-UI?node-id=365-3966&m=dev",
    },
  },
  decorators: [
    (Story) => {
      return (
        <div className="bg-background p-8" style={{ width: "288px" }}>
          <Story />
        </div>
      );
    },
  ],
  tags: ["autodocs"],
  argTypes: {
    label: {
      control: "text",
      description: "The label text for the nav item",
    },
    icon: {
      control: "text",
      description: "Path to the icon SVG",
    },
    onClick: {
      action: "clicked",
      description: "Callback when nav item is clicked",
    },
  },
} satisfies Meta<typeof NavItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: "Configuration",
    icon: "/icons/settings.svg",
  },
};

export const CustomLabel: Story = {
  args: {
    label: "My Settings",
    icon: "/icons/settings.svg",
  },
};

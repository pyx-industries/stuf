import type { Meta, StoryObj } from "@storybook/react-vite";
import { faker } from "@faker-js/faker";
import { SidebarProfile } from "./SidebarProfile";

const meta = {
  title: "Components/Sidebar/SidebarProfile",
  component: SidebarProfile,
  parameters: {
    layout: "centered",
    design: {
      type: "figma",
      url: "https://www.figma.com/design/SQOopW8mFNB8TLQSZvOySp/STUF-UI?node-id=9-2254&m=dev",
    },
  },
  decorators: [
    (Story) => {
      return (
        <div className="w-[280px] bg-background p-4">
          <Story />
        </div>
      );
    },
  ],
  tags: ["autodocs"],
  argTypes: {
    name: {
      control: "text",
      description: "User's full name",
    },
    email: {
      control: "text",
      description: "User's email address",
    },
    avatarUrl: {
      control: "text",
      description: "URL to user's avatar image",
    },
  },
} satisfies Meta<typeof SidebarProfile>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    name: faker.person.fullName(),
    email: faker.internet.email(),
    avatarUrl: faker.image.avatar(),
  },
};

export const WithPlaceholder: Story = {
  args: {
    name: "Cindy Reardon",
    email: "c.reardon@emailadress.com",
  },
};

export const TruncatedName: Story = {
  args: {
    name: "Dr. Christopher Alexander Montgomery Wellington III",
    email: "c.montgomery@example.com",
    avatarUrl: faker.image.avatar(),
  },
};

export const TruncatedEmail: Story = {
  args: {
    name: "Jane Doe",
    email:
      "jane.doe.with.a.very.long.email.address@corporate-company-domain.com",
    avatarUrl: faker.image.avatar(),
  },
};

export const BothTruncated: Story = {
  args: {
    name: "Dr. Alexander Christopher Montgomery Wellington",
    email: "alexander.christopher.montgomery@very-long-corporate-domain.com",
    avatarUrl: faker.image.avatar(),
  },
};

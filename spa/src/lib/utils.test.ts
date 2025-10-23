import { getInitials } from "./utils";

describe("getInitials", () => {
  it("returns initials from full name", () => {
    expect(getInitials("John Doe")).toBe("JD");
  });

  it("returns initials from name with multiple words", () => {
    expect(getInitials("John Michael Doe")).toBe("JM");
  });

  it("returns uppercase initials", () => {
    expect(getInitials("john doe")).toBe("JD");
  });

  it("handles hyphenated names", () => {
    expect(getInitials("Mary-Jane Watson")).toBe("MJ");
  });

  it("handles names with multiple hyphens", () => {
    expect(getInitials("Jean-Claude Van-Damme")).toBe("JC");
  });

  it("returns single initial for single name", () => {
    expect(getInitials("Madonna")).toBe("M");
  });

  it("returns empty string for empty name", () => {
    expect(getInitials("")).toBe("");
  });

  it("handles names with extra whitespace", () => {
    expect(getInitials("  John   Doe  ")).toBe("JD");
  });

  it("respects maxLetters parameter", () => {
    expect(getInitials("John Michael Doe", 3)).toBe("JMD");
  });

  it("handles names with mixed spaces and hyphens", () => {
    expect(getInitials("Mary Jane-Watson Smith")).toBe("MJ");
  });

  it("handles names with only spaces", () => {
    expect(getInitials("   ")).toBe("");
  });

  it("handles names with special characters", () => {
    expect(getInitials("O'Brien Smith")).toBe("OS");
  });

  it("returns first two initials by default", () => {
    expect(getInitials("Alexander Benjamin Christopher David")).toBe("AB");
  });
});

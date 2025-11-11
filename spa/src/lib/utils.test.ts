import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { downloadBlob, getInitials } from "./utils";

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

describe("downloadBlob", () => {
  let createElementSpy: any;
  let mockAnchor: HTMLAnchorElement;

  beforeEach(() => {
    // Create a real anchor element
    mockAnchor = document.createElement("a");

    // Spy on document.createElement and return our mock anchor
    createElementSpy = vi
      .spyOn(document, "createElement")
      .mockReturnValue(mockAnchor);

    // Spy on appendChild and removeChild
    vi.spyOn(document.body, "appendChild");
    vi.spyOn(document.body, "removeChild");

    // Spy on anchor click
    vi.spyOn(mockAnchor, "click").mockImplementation(() => {});

    // Mock URL methods
    window.URL.createObjectURL = vi.fn(() => "blob:mock-url");
    window.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("creates an anchor element with correct attributes", () => {
    const blob = new Blob(["test content"], { type: "text/plain" });
    const filename = "test.txt";

    downloadBlob(blob, filename);

    expect(createElementSpy).toHaveBeenCalledWith("a");
    expect(mockAnchor.href).toBe("blob:mock-url");
    expect(mockAnchor.download).toBe(filename);
  });

  it("creates object URL from blob", () => {
    const blob = new Blob(["test content"], { type: "text/plain" });

    downloadBlob(blob, "test.txt");

    expect(window.URL.createObjectURL).toHaveBeenCalledWith(blob);
  });

  it("appends anchor to document body", () => {
    const blob = new Blob(["test content"], { type: "text/plain" });

    downloadBlob(blob, "test.txt");

    expect(document.body.appendChild).toHaveBeenCalledWith(mockAnchor);
  });

  it("clicks the anchor element", () => {
    const blob = new Blob(["test content"], { type: "text/plain" });

    downloadBlob(blob, "test.txt");

    expect(mockAnchor.click).toHaveBeenCalled();
  });

  it("revokes object URL after download", () => {
    const blob = new Blob(["test content"], { type: "text/plain" });

    downloadBlob(blob, "test.txt");

    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
  });

  it("removes anchor from document body", () => {
    const blob = new Blob(["test content"], { type: "text/plain" });

    downloadBlob(blob, "test.txt");

    expect(document.body.removeChild).toHaveBeenCalledWith(mockAnchor);
  });

  it("handles different blob types", () => {
    const blob = new Blob(["<html></html>"], { type: "text/html" });

    downloadBlob(blob, "index.html");

    expect(window.URL.createObjectURL).toHaveBeenCalledWith(blob);
    expect(mockAnchor.download).toBe("index.html");
  });

  it("handles filenames with special characters", () => {
    const blob = new Blob(["test"], { type: "text/plain" });
    const filename = "my file (2024).txt";

    downloadBlob(blob, filename);

    expect(mockAnchor.download).toBe(filename);
  });

  it("performs operations in correct order", () => {
    const blob = new Blob(["test"], { type: "text/plain" });
    const calls: string[] = [];

    window.URL.createObjectURL = vi.fn(() => {
      calls.push("createObjectURL");
      return "blob:mock-url";
    });

    vi.spyOn(document.body, "appendChild").mockImplementation(() => {
      calls.push("appendChild");
      return mockAnchor;
    });

    vi.spyOn(mockAnchor, "click").mockImplementation(() => {
      calls.push("click");
    });

    window.URL.revokeObjectURL = vi.fn(() => {
      calls.push("revokeObjectURL");
    });

    vi.spyOn(document.body, "removeChild").mockImplementation(() => {
      calls.push("removeChild");
      return mockAnchor;
    });

    downloadBlob(blob, "test.txt");

    expect(calls).toEqual([
      "createObjectURL",
      "appendChild",
      "click",
      "revokeObjectURL",
      "removeChild",
    ]);
  });
});

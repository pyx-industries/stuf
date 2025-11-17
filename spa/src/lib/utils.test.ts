import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  downloadBlob,
  formatDateTime,
  formatDateShort,
  formatFileSize,
  getInitials,
} from "./utils";

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

describe("formatFileSize", () => {
  it("returns '0' for undefined", () => {
    expect(formatFileSize(undefined)).toBe("0");
  });

  it("returns '0' for 0 bytes", () => {
    expect(formatFileSize(0)).toBe("0");
  });

  it("formats 1 MB correctly", () => {
    expect(formatFileSize(1048576)).toBe("1.0");
  });

  it("formats bytes to MB with 1 decimal place", () => {
    expect(formatFileSize(2621440)).toBe("2.5"); // 2.5 MB
  });

  it("formats small file sizes", () => {
    expect(formatFileSize(512000)).toBe("0.5"); // 0.5 MB
  });

  it("formats large file sizes", () => {
    expect(formatFileSize(10485760)).toBe("10.0"); // 10 MB
  });

  it("rounds to 1 decimal place", () => {
    expect(formatFileSize(1572864)).toBe("1.5"); // 1.5 MB exactly
  });

  it("handles fractional MB values", () => {
    expect(formatFileSize(1677721)).toBe("1.6"); // ~1.6 MB
  });

  it("formats very large files", () => {
    expect(formatFileSize(1073741824)).toBe("1024.0"); // 1 GB = 1024 MB
  });

  it("formats very small files", () => {
    expect(formatFileSize(1024)).toBe("0.0"); // 1 KB
  });

  it("handles file size less than 1 KB", () => {
    expect(formatFileSize(512)).toBe("0.0"); // 512 bytes
  });
});

describe("formatDateTime", () => {
  it("formats ISO date string correctly", () => {
    const result = formatDateTime("2024-01-15T14:30:00Z");
    // Result will be in GB format: DD/MM/YYYY HH:MM AM/PM
    expect(result).toMatch(/\d{2}\/\d{2}\/\d{4} \d{2}:\d{2} (AM|PM|am|pm)/);
  });

  it("includes date in DD/MM/YYYY format", () => {
    const result = formatDateTime("2024-03-25T10:00:00Z");
    expect(result).toMatch(/25\/03\/2024/);
  });

  it("includes time in 12-hour format", () => {
    const result = formatDateTime("2024-01-15T14:30:00Z");
    // Should contain time with AM/PM
    expect(result).toMatch(/\d{2}:\d{2} (AM|PM|am|pm)/);
  });

  it("formats time with AM/PM indicator", () => {
    const result = formatDateTime("2024-01-15T09:30:00Z");
    // Should contain AM or PM (case may vary by browser/locale)
    expect(result).toMatch(/(AM|PM|am|pm)/);
  });

  it("formats time in 12-hour format", () => {
    const result = formatDateTime("2024-01-15T15:30:00Z");
    // Should contain time and AM/PM indicator
    expect(result).toMatch(/\d{2}:\d{2} (AM|PM|am|pm)/);
  });

  it("formats date consistently", () => {
    const result = formatDateTime("2024-01-15T00:00:00Z");
    // Should contain the date in DD/MM/YYYY format
    expect(result).toMatch(/\d{2}\/01\/2024/);
  });

  it("handles different times of day", () => {
    const result = formatDateTime("2024-01-15T12:00:00Z");
    // Should contain a valid date
    expect(result).toMatch(/\d{2}\/\d{2}\/2024/);
  });

  it("formats year-end dates", () => {
    const result = formatDateTime("2024-12-31T23:59:59Z");
    // Should contain month 12 and year 2024 or next day's date if timezone shifted
    expect(result).toMatch(/\d{2}\/(12|01)\/202(4|5)/);
  });

  it("formats with consistent spacing", () => {
    const result = formatDateTime("2024-06-15T10:30:00Z");
    // Should have exactly one space between date and time
    const parts = result.split(" ");
    expect(parts.length).toBe(3); // DD/MM/YYYY HH:MM AM/PM
  });

  it("pads single digit hours and minutes", () => {
    const result = formatDateTime("2024-01-15T09:05:00Z");
    // Should have two-digit hour and minute
    expect(result).toMatch(/\d{2}:\d{2}/);
  });
});

describe("formatDateShort", () => {
  it("formats ISO date string in GB short format", () => {
    const result = formatDateShort("2024-01-15");
    // Result should be "15 Jan 2024" in GB format
    expect(result).toBe("15 Jan 2024");
  });

  it("formats single digit day without leading zero", () => {
    const result = formatDateShort("2024-03-05");
    expect(result).toBe("5 Mar 2024");
  });

  it("formats different months correctly", () => {
    expect(formatDateShort("2024-01-01")).toBe("1 Jan 2024");
    expect(formatDateShort("2024-06-15")).toBe("15 Jun 2024");
    expect(formatDateShort("2024-12-31")).toBe("31 Dec 2024");
  });

  it("handles year-end dates", () => {
    const result = formatDateShort("2024-12-31");
    expect(result).toBe("31 Dec 2024");
  });

  it("handles year-start dates", () => {
    const result = formatDateShort("2024-01-01");
    expect(result).toBe("1 Jan 2024");
  });

  it("formats leap year dates", () => {
    const result = formatDateShort("2024-02-29");
    expect(result).toBe("29 Feb 2024");
  });

  it("uses short month names", () => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    months.forEach((month, index) => {
      const monthNum = String(index + 1).padStart(2, "0");
      const result = formatDateShort(`2024-${monthNum}-15`);
      expect(result).toContain(month);
    });
  });
});

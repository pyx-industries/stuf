#!/usr/bin/env python3
"""Generate stakeholder presentation from BDD test artifacts.

This script combines:
- BDD scenario text from .feature files
- Sequential screenshots from test runs
- Video recordings
- Test results

Into a presentation-ready HTML report for non-technical stakeholders.
"""

import re
from pathlib import Path
from typing import Dict, List
from datetime import datetime


class PresentationReportGenerator:
    """Generate stakeholder-friendly presentation from E2E test artifacts."""

    def __init__(self, base_dir: Path = None):
        """Initialize generator with base directory."""
        self.base_dir = base_dir or Path(__file__).parent
        self.reports_dir = self.base_dir / "reports"
        self.features_dir = self.base_dir / "features"

    def parse_feature_files(self) -> List[Dict]:
        """Parse Gherkin feature files into structured data."""
        scenarios = []

        for feature_file in self.features_dir.glob("*.feature"):
            with open(feature_file, "r") as f:
                content = f.read()

            # Extract feature title and description
            feature_match = re.search(r"Feature: (.+?)(?:\n|$)", content)
            feature_title = (
                feature_match.group(1).strip() if feature_match else "Unknown Feature"
            )

            # Extract scenarios
            scenario_blocks = re.findall(
                r"Scenario: (.+?)(?=\n  Scenario:|\n\nScenario:|\Z)", content, re.DOTALL
            )

            for scenario_block in scenario_blocks:
                lines = scenario_block.strip().split("\n")
                scenario_title = lines[0].strip()

                steps = []
                for line in lines[1:]:
                    line = line.strip()
                    if line and (
                        line.startswith("Given")
                        or line.startswith("When")
                        or line.startswith("Then")
                        or line.startswith("And")
                    ):
                        steps.append(line)

                scenarios.append(
                    {
                        "feature": feature_title,
                        "title": scenario_title,
                        "steps": steps,
                        "file": feature_file.name,
                    }
                )

        return scenarios

    def _clean_name_for_path(self, name: str) -> str:
        """Clean a name for use in file paths - no spaces, safe characters only."""
        # Convert to lowercase, replace spaces with hyphens
        clean = name.lower().replace(" ", "-").replace("_", "-")
        # Remove non-alphanumeric characters except hyphens
        clean = re.sub(r"[^a-z0-9-]", "", clean)
        # Remove multiple consecutive hyphens
        clean = re.sub(r"-+", "-", clean)
        # Remove leading/trailing hyphens
        return clean.strip("-")

    def _find_screenshot_for_step(self, screenshot_files: List, step_number: int):
        """Find the screenshot that corresponds to a specific step number."""
        for screenshot in screenshot_files:
            # Check if this screenshot is for the requested step number
            name = screenshot.stem
            step_match = re.match(r"step-(\d+)", name)
            if step_match and int(step_match.group(1)) == step_number:
                return screenshot
            # Legacy format: check for step number at beginning
            legacy_match = re.match(rf".*{step_number:02d}", name)
            if legacy_match:
                return screenshot
        return None

    def find_artifacts_for_scenario(self, scenario_title: str) -> Dict:
        """Find screenshots, videos, and results for a scenario using BDD hierarchical storage."""
        # Clean scenario title for directory matching (same logic as BasePage._clean_name_for_path)
        clean_title = self._clean_name_for_path(scenario_title)

        artifacts = {"screenshots": [], "videos": [], "traces": []}

        # Find screenshots in BDD hierarchical structure
        bdd_screenshots_dir = self.reports_dir / "screenshots" / "bdd"
        scenario_dir = bdd_screenshots_dir / clean_title

        if scenario_dir.exists() and scenario_dir.is_dir():
            # Get all step screenshots in the scenario directory
            screenshot_files = list(scenario_dir.glob("step-*.png"))

            # Sort by step number
            def get_step_number(screenshot_path):
                name = screenshot_path.stem
                step_match = re.match(r"step-(\d+)", name)
                return int(step_match.group(1)) if step_match else 999

            screenshot_files.sort(key=get_step_number)
            artifacts["screenshots"] = screenshot_files

        # Find videos in BDD hierarchical structure
        bdd_videos_dir = self.reports_dir / "videos" / "bdd"
        scenario_video_dir = bdd_videos_dir / clean_title

        if scenario_video_dir.exists() and scenario_video_dir.is_dir():
            # Get the main scenario video file
            video_files = list(scenario_video_dir.glob(f"{clean_title}.webm"))
            if video_files:
                artifacts["videos"] = video_files

        # Find traces
        traces_dir = self.reports_dir / "traces"
        if traces_dir.exists():
            for trace in traces_dir.glob("*.zip"):
                if clean_title in trace.name:
                    artifacts["traces"].append(trace)

        return artifacts

    def generate_html_report(self, scenarios: List[Dict]) -> str:
        """Generate HTML presentation report."""
        html_parts = [
            """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>STUF E2E Test Results - Stakeholder Presentation</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
        }
        .container { 
            max-width: 1200px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 10px; 
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            overflow: hidden;
        }
        .header { 
            background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); 
            color: white; 
            padding: 30px; 
            text-align: center; 
        }
        .header h1 { margin: 0; font-size: 2.5em; }
        .header p { margin: 10px 0 0; font-size: 1.2em; opacity: 0.9; }
        .scenario { 
            margin: 30px; 
            border: 1px solid #ddd; 
            border-radius: 8px; 
            overflow: hidden;
            background: #fafafa;
        }
        .scenario-header { 
            background: #f5f5f5; 
            padding: 20px; 
            border-bottom: 1px solid #ddd; 
        }
        .scenario-title { 
            font-size: 1.4em; 
            font-weight: bold; 
            color: #2c5282; 
            margin-bottom: 10px;
        }
        .feature-tag { 
            background: #e2e8f0; 
            color: #4a5568; 
            padding: 4px 12px; 
            border-radius: 15px; 
            font-size: 0.9em; 
            display: inline-block;
        }
        .steps { 
            padding: 20px; 
        }
        .step { 
            margin: 10px 0; 
            padding: 8px 12px; 
            border-left: 4px solid #4CAF50; 
            background: white; 
            border-radius: 4px;
        }
        .step-given { border-left-color: #2196F3; }
        .step-when { border-left-color: #FF9800; }
        .step-then { border-left-color: #4CAF50; }
        .artifacts { 
            padding: 20px; 
            background: white; 
            border-top: 1px solid #eee; 
        }
        .artifacts h4 { 
            color: #4a5568; 
            margin-bottom: 15px; 
            font-size: 1.1em;
        }
        .steps-with-evidence {
            padding: 20px;
        }
        .scenario-video {
            padding: 20px;
            background: #f8f9fa;
            border-bottom: 1px solid #eee;
            text-align: center;
        }
        .scenario-video h4 {
            color: #4a5568;
            margin-bottom: 15px;
            font-size: 1.1em;
        }
        .video-container {
            margin: 15px 0;
        }
        .step-screenshot { 
            text-align: center; 
            margin: 15px 0 25px 20px;
            border: 1px solid #ddd; 
            border-radius: 6px; 
            overflow: hidden; 
            background: white;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
            max-width: 600px;
        }
        .step-screenshot:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        .step-screenshot a {
            display: block;
            text-decoration: none;
            cursor: zoom-in;
        }
        .step-screenshot img { 
            width: 100%; 
            max-height: 400px;
            object-fit: contain; 
            border-bottom: 1px solid #eee;
            transition: opacity 0.2s ease;
        }
        .step-screenshot img:hover {
            opacity: 0.9;
        }
        .screenshot-caption { 
            padding: 8px; 
            font-size: 0.85em; 
            color: #666; 
            background: #f8f9fa;
            font-style: italic;
        }
        .additional-artifacts {
            padding: 20px;
            border-top: 1px solid #eee;
            margin-top: 20px;
        }
        .screenshot-gallery { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
            gap: 15px; 
            margin: 15px 0; 
        }
        .screenshot { 
            text-align: center; 
            border: 1px solid #ddd; 
            border-radius: 6px; 
            overflow: hidden; 
            background: white;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .screenshot:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        .screenshot a {
            display: block;
            text-decoration: none;
            cursor: zoom-in;
        }
        .screenshot img { 
            width: 100%; 
            height: 180px; 
            object-fit: cover; 
            border-bottom: 1px solid #eee;
            transition: opacity 0.2s ease;
        }
        .screenshot img:hover {
            opacity: 0.9;
        }
        .screenshot-title { 
            padding: 10px; 
            font-size: 0.9em; 
            color: #666; 
            background: #f8f9fa;
        }
        .video-link, .trace-link { 
            display: inline-block; 
            margin: 5px 10px 5px 0; 
            padding: 8px 16px; 
            background: #4CAF50; 
            color: white; 
            text-decoration: none; 
            border-radius: 5px; 
            font-size: 0.9em;
        }
        .video-link:hover, .trace-link:hover { 
            background: #45a049; 
        }
        .trace-link { background: #2196F3; }
        .trace-link:hover { background: #1976D2; }
        .no-artifacts { 
            color: #999; 
            font-style: italic; 
            text-align: center; 
            padding: 20px;
        }
        .summary { 
            background: #f8f9fa; 
            padding: 20px; 
            margin: 30px; 
            border-radius: 8px; 
            border: 1px solid #e9ecef;
        }
        .summary h3 { color: #2c5282; margin-top: 0; }
        .stats { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 15px; 
            margin-top: 15px;
        }
        .stat { 
            text-align: center; 
            padding: 15px; 
            background: white; 
            border-radius: 6px; 
            border: 1px solid #ddd;
        }
        .stat-number { 
            font-size: 2em; 
            font-weight: bold; 
            color: #4CAF50; 
        }
        .stat-label { 
            color: #666; 
            font-size: 0.9em; 
            margin-top: 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>STUF E2E Test Results</h1>
            <p>Automated End-to-End Testing Demonstration</p>
            <p>Generated: """
            + datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            + """</p>
        </div>
        
        <div class="summary">
            <h3>Test Execution Summary</h3>
            <div class="stats">
                <div class="stat">
                    <div class="stat-number">"""
            + str(len(scenarios))
            + """</div>
                    <div class="stat-label">Scenarios Tested</div>
                </div>
                <div class="stat">
                    <div class="stat-number">"""
            + str(len(set(s["feature"] for s in scenarios)))
            + """</div>
                    <div class="stat-label">Features Covered</div>
                </div>
                <div class="stat">
                    <div class="stat-number">"""
            + str(sum(len(s["steps"]) for s in scenarios))
            + """</div>
                    <div class="stat-label">Test Steps</div>
                </div>
            </div>
        </div>
"""
        ]

        for scenario in scenarios:
            artifacts = self.find_artifacts_for_scenario(scenario["title"])

            html_parts.append(f"""
        <div class="scenario">
            <div class="scenario-header">
                <div class="scenario-title">{scenario["title"]}</div>
                <span class="feature-tag">{scenario["feature"]}</span>
            </div>
""")

            # Show video at the top if available
            if artifacts["videos"]:
                html_parts.append('            <div class="scenario-video">\n')
                for video in artifacts["videos"]:
                    rel_path = video.relative_to(self.reports_dir)
                    html_parts.append(f"""                <div class="video-container">
                    <video controls width="100%" style="max-width: 800px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
                        <source src="{rel_path}" type="video/webm">
                        <p>Your browser doesn't support HTML5 video. <a href="{rel_path}">Download the video</a> instead.</p>
                    </video>
                </div>
""")
                html_parts.append("            </div>\n")

            html_parts.append('            <div class="steps-with-evidence">\n')

            # Intersperse steps with screenshots
            for step_index, step in enumerate(scenario["steps"]):
                step_class = "step"
                if step.startswith("Given"):
                    step_class += " step-given"
                elif step.startswith("When"):
                    step_class += " step-when"
                elif step.startswith("Then"):
                    step_class += " step-then"

                # Output step
                html_parts.append(
                    f'                <div class="{step_class}">{step}</div>\n'
                )

                # Find corresponding screenshot for this step
                step_screenshot = self._find_screenshot_for_step(
                    artifacts["screenshots"], step_index + 1
                )
                if step_screenshot:
                    screenshot_name = step_screenshot.stem.replace("-", " ").title()
                    rel_path = step_screenshot.relative_to(self.reports_dir)
                    html_parts.append(f"""                <div class="step-screenshot">
                    <a href="{rel_path}" target="_blank" title="Click to view full resolution">
                        <img src="{rel_path}" alt="{screenshot_name}" />
                    </a>
                    <div class="screenshot-caption">Visual evidence for step {step_index + 1}</div>
                </div>
""")

            html_parts.append("            </div>\n")

            # Additional artifacts (traces only - videos are shown at top)
            if artifacts["traces"]:
                html_parts.append('            <div class="additional-artifacts">\n')
                html_parts.append("                <h4>Debug Traces:</h4>\n")
                for trace in artifacts["traces"]:
                    rel_path = trace.relative_to(self.reports_dir)
                    html_parts.append(
                        f'                <a href="{rel_path}" class="trace-link">View Detailed Trace</a>\n'
                    )
                html_parts.append("            </div>\n")

            html_parts.append("        </div>\n")

        html_parts.append("""    </div>
</body>
</html>""")

        return "".join(html_parts)

    def generate(self, output_file: str = "stakeholder_presentation.html") -> Path:
        """Generate the complete presentation report."""
        print("Parsing BDD feature files...")
        scenarios = self.parse_feature_files()

        print(
            f"Found {len(scenarios)} scenarios across {len(set(s['feature'] for s in scenarios))} features"
        )

        print("Generating HTML presentation...")
        html_content = self.generate_html_report(scenarios)

        output_path = self.reports_dir / output_file
        output_path.parent.mkdir(parents=True, exist_ok=True)

        with open(output_path, "w", encoding="utf-8") as f:
            f.write(html_content)

        print(f"Presentation generated: {output_path}")
        print(f"Open in browser: file://{output_path.absolute()}")

        return output_path


if __name__ == "__main__":
    generator = PresentationReportGenerator()
    generator.generate()

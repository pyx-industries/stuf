"""BDD Screenshot Helper for hierarchical screenshot organization."""

import re
from typing import Optional
from pathlib import Path
from playwright.sync_api import Page


class BDDScreenshotHelper:
    """Helper class to manage hierarchical screenshots and videos for BDD tests."""

    def __init__(self, page: Page, request):
        """Initialize with page and pytest request fixture."""
        self.page = page
        self.request = request
        self._step_counter = 0
        self._video_saved = False

    def get_scenario_name(self) -> Optional[str]:
        """Extract scenario name from pytest request."""
        try:
            # pytest-bdd stores scenario info in the request node
            if hasattr(self.request, "node") and hasattr(self.request.node, "scenario"):
                return self.request.node.scenario.name
            elif hasattr(self.request, "node") and hasattr(self.request.node, "name"):
                # Fallback: extract from test function name
                test_name = self.request.node.name
                if test_name.startswith("test_"):
                    # Convert test_some_scenario_name to Some Scenario Name
                    clean_name = test_name[5:].replace("_", " ").title()
                    return clean_name
            return None
        except Exception:
            return None

    def take_bdd_screenshot(
        self, page_obj, screenshot_name: str, step_text: str = ""
    ) -> str:
        """Take a hierarchical BDD screenshot with proper organization."""
        self._step_counter += 1
        scenario_name = self.get_scenario_name() or "Unknown Scenario"

         # Check if it's a Playwright Page object (doesn't have take_screenshot method)
        if hasattr(page_obj, 'screenshot') and not hasattr(page_obj, 'take_screenshot'):
            # It's a Playwright Page - handle it directly
            from pathlib import Path
            import re
            
            # Create screenshot directory structure
            base_screenshots_dir = (
                Path(__file__).parent.parent / "reports" / "screenshots" / "bdd"
            )
            
            # Clean scenario name for directory
            clean_scenario = scenario_name.lower().replace(" ", "-")
            clean_scenario = re.sub(r"[^a-z0-9-]", "", clean_scenario)
            clean_scenario = re.sub(r"-+", "-", clean_scenario).strip("-")
            
            scenario_dir = base_screenshots_dir / clean_scenario
            scenario_dir.mkdir(parents=True, exist_ok=True)
            
            # Create filename with step number
            clean_name = screenshot_name.lower().replace(" ", "-")
            clean_name = re.sub(r"[^a-z0-9-]", "", clean_name)
            filename = f"{self._step_counter:02d}_{clean_name}.png"
            
            screenshot_path = scenario_dir / filename
            
            # Take the screenshot
            page_obj.screenshot(path=str(screenshot_path))
            
            print(f"✓ Screenshot saved: {screenshot_path}")
            return str(screenshot_path)
        else:
            # It's a custom page object with take_screenshot method
            return page_obj.take_screenshot(
                name=screenshot_name,
                scenario_name=scenario_name,
                step_index=self._step_counter,
                step_text=step_text,
                test_type="bdd",
            )

        # Use the page object's take_screenshot method with BDD context
        return page_obj.take_screenshot(
            name=screenshot_name,
            scenario_name=scenario_name,
            step_index=self._step_counter,
            step_text=step_text,
            test_type="bdd",
        )

    def save_scenario_video(self) -> Optional[str]:
        """Save video for the current scenario at the end of the test."""
        if self._video_saved:
            return None

        scenario_name = self.get_scenario_name()
        if not scenario_name:
            return None

        try:
            # Get video path without forcing synchronous encoding
            video_path = self.page.video.path()
            if not video_path:
                return None

            # Create target video directory structure
            base_videos_dir = (
                Path(__file__).parent.parent / "reports" / "videos" / "bdd"
            )
            clean_scenario = scenario_name.lower().replace(" ", "-")
            clean_scenario = re.sub(r"[^a-z0-9-]", "", clean_scenario)
            clean_scenario = re.sub(r"-+", "-", clean_scenario).strip("-")

            scenario_video_dir = base_videos_dir / clean_scenario
            scenario_video_dir.mkdir(parents=True, exist_ok=True)

            # Set target path for post-test processing
            target_path = scenario_video_dir / f"{clean_scenario}.webm"

            # Store paths for later processing (avoid blocking operations)
            self._video_source_path = video_path
            self._video_target_path = str(target_path)

            self._video_saved = True
            return str(target_path)

        except Exception:
            return None

    def finalize_video(self):
        """Move video file to final location after test completion."""
        if not hasattr(self, "_video_source_path") or not hasattr(
            self, "_video_target_path"
        ):
            return

        try:
            import shutil
            import time
            from pathlib import Path

            source_path = Path(self._video_source_path)
            target_path = Path(self._video_target_path)

            # Wait for video file to exist and be ready (up to 3 seconds)
            for i in range(30):  # 30 * 0.1 = 3 seconds max
                if source_path.exists():
                    try:
                        shutil.move(str(source_path), str(target_path))
                        return
                    except (OSError, IOError) as e:
                        # File might still be being written
                        if i < 29:  # Not the last attempt
                            time.sleep(0.1)
                            continue
                        else:
                            raise e
                else:
                    time.sleep(0.1)

            pass  # Video source not found after waiting

        except Exception:
            pass  # Failed to finalize video

    def reset_step_counter(self):
        """Reset step counter for new scenario."""
        self._step_counter = 0
        self._video_saved = False


# Fixture to provide BDD screenshot helper
def pytest_runtest_setup(item):
    """pytest hook to add BDD screenshot helper to test items."""
    if hasattr(item, "function") and "bdd" in str(item.function):
        # This is a BDD test, prepare for screenshot tracking
        pass

from pathlib import Path

from pytest_bdd import when, then, parsers
from playwright.sync_api import Page

from pages.dashboard_page import DashboardPage


def _get_resources_dir() -> Path:
    """Path to test resource files."""
    return Path(__file__).parent.parent / "resources"

@when("I select a valid file to upload")
def select_valid_file_to_upload(authenticated_page: Page, bdd_screenshot_helper):
    print(f"Test is using URL: {authenticated_page.url}")
    """
    Choose a valid test file; this should enable the Upload button.
    """
    page = authenticated_page
    resources_dir = _get_resources_dir()
    file_path = resources_dir / "sample-valid.pdf"

    assert file_path.exists(), f"Missing test file: {file_path}"

    # Wait for file input to appear
    file_input_selector = 'input[type="file"]'
    
    file_input = page.locator(file_input_selector).first
    file_input.wait_for(state="attached", timeout=10000)
    
    # Attach the file
    file_input.set_input_files(str(file_path))
    print(f"Selected file: {file_path.name}")
    
    collection_dropdown = page.locator('select').first 
    collection_dropdown.wait_for(state="visible", timeout=5000)
    collection_dropdown.select_option("test")
    print("Selected collection: test")
    
    page.wait_for_timeout(1000)

    bdd_screenshot_helper.take_bdd_screenshot(
        authenticated_page,
        "valid-file-selected",
        "When I select a valid file to upload",
    )


@when("I select any collection")
def select_collection(authenticated_page: Page, bdd_screenshot_helper):
    """
    Select the 'test' collection from the sidebar or cards.
    """
    page = authenticated_page
    dashboard = DashboardPage(page)
    
    dashboard.assert_on_dashboard()
    dashboard.assert_user_logged_in()

    collection_name = "test"
    
    print(f"\n=== Selecting collection: {collection_name} ===")
    
    # clicking collection from sidebar first
    sidebar_item = page.locator(f'text="{collection_name}"').first
    if sidebar_item.is_visible():
        print(f"✓ Found collection in sidebar")
        sidebar_item.click()
    else:
        # Fallback: click collection card
        card = page.locator(f'[data-slot="card"]:has-text("{collection_name}")').first
        if card.count() > 0:
            print(f"✓ Found collection card")
            card.click()
        else:
            raise AssertionError(f"Could not find collection '{collection_name}'")
    
    page.wait_for_timeout(3000)
    
    # Verify we're on the collection page
    page.wait_for_selector(f'text="{collection_name}"', timeout=5000)
    print(f"On collection detail page for '{collection_name}'")
    
    # Now click the "Add files" button
    add_files_btn = page.locator('button:has-text("Add files"), button[aria-label="Add files"]').first
    add_files_btn.wait_for(state="visible", timeout=5000)
    print("Found 'Add files' button")
    
    add_files_btn.click()
    print("Clicked 'Add files' button")

    page.wait_for_timeout(2000)

    # Check for file input
    file_inputs = page.locator('input[type="file"]')
    print(f"File inputs found: {file_inputs.count()}")

    bdd_screenshot_helper.take_bdd_screenshot(
        page,
        f"collection-{collection_name}-upload-dialog",
        "After clicking Add files",
    )

@when("I click the upload button")
def click_upload_button(authenticated_page: Page, bdd_screenshot_helper):
    """
    Click the Upload button to submit the selected file.
    """
    page = authenticated_page

    upload_button = page.get_by_role("button", name="Upload")
    assert upload_button.is_visible(), "Upload button should be visible"
    assert upload_button.is_enabled(), "Upload button should be enabled after file selection"

    upload_button.click()

    bdd_screenshot_helper.take_bdd_screenshot(
        page,
        "clicked-upload-button",
        "And I click the upload button",
    )


@then("I should see a success message")
def should_see_success_message(authenticated_page: Page, bdd_screenshot_helper):
    """Verify the green 'Upload successful!' panel appears."""
    page = authenticated_page
    page.get_by_text("File uploaded successfully", exact=False).wait_for(timeout=10000)

    bdd_screenshot_helper.take_bdd_screenshot(
        page,
        "upload-success-message",
        "Then I should see a success message",
    )
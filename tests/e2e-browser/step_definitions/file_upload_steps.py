from pathlib import Path

from pytest_bdd import when, then, parsers
from playwright.sync_api import Page

from pages.dashboard_page import DashboardPage


def _get_resources_dir() -> Path:
    """Path to test resource files."""
    return Path(__file__).parent.parent / "resources"


@when(parsers.parse('I select the "{collection_name}" collection'))
def select_collection(authenticated_page: Page, collection_name: str, bdd_screenshot_helper):
    page = authenticated_page
    dashboard = DashboardPage(page)
    dashboard.assert_on_dashboard()
    dashboard.assert_user_logged_in()

    # Find and click the collection card
    card = page.locator("div", has_text=f"Collection: {collection_name}").first
    assert card.is_visible(), f'Could not find collection card for "{collection_name}"'

    card.click()
    
    # Wait for the upload form to actually appear (more robust check)
    # page.wait_for_load_state("networkidle", timeout=5000)  # Wait for any API calls
    page.wait_for_selector(
        'input[type="file"], [role="button"]:has-text("Upload"), button:has-text("Upload")',
        timeout=10000
    )
    
    bdd_screenshot_helper.take_bdd_screenshot(
        dashboard,
        f"collection-{collection_name}-opened",
        f'When I select the "{collection_name}" collection',
    )


@when("I select any collection")
def select_collection(authenticated_page: Page, bdd_screenshot_helper):
    page = authenticated_page
    dashboard = DashboardPage(page)
    
    dashboard.assert_on_dashboard()
    dashboard.assert_user_logged_in()

    # Try collections that have write permissions
    # Skip "collection-2-contracts" as it only has "read" permission
    collections_to_try = [
        "test",
        "collection-1-docs", 
        "collection-3-cat-pics"
    ]
    
    working_collection = None
    
    for test_collection in collections_to_try:
        print(f"\n=== Trying collection: {test_collection} ===")
        
        # Find the card
        card = page.locator(f'[data-slot="card"]:has-text("Collection: {test_collection}")').first
        
        # Make sure card exists and is visible
        try:
            card.wait_for(state="visible", timeout=3000)
        except Exception as e:
            print(f"✗ {test_collection}: Card not found - {e}")
            continue
        
        # Click it
        card.evaluate('element => element.click()')
        page.wait_for_timeout(2000)
        
        # Check for error
        error = page.locator('text=/Failed to load files/i')
        if error.is_visible():
            print(f"✗ {test_collection}: API error - {error.inner_text()}")
            # Reload to go back to collection list
            page.reload()
            page.wait_for_timeout(2000)
            continue
        
        # Check for upload UI
        file_input = page.locator('input[type="file"]')
        upload_button = page.locator('button:has-text("Upload")')
        
        if file_input.count() > 0 or upload_button.count() > 0:
            print(f"✓ {test_collection}: Upload UI found!")
            print(f"   File inputs: {file_input.count()}")
            print(f"   Upload buttons: {upload_button.count()}")
            working_collection = test_collection
            break
        else:
            print(f"✗ {test_collection}: No upload UI found")
            # Reload to go back
            page.reload()
            page.wait_for_timeout(2000)
    
    if not working_collection:
        print("\n=== ALL COLLECTIONS FAILED ===")
    
    bdd_screenshot_helper.take_bdd_screenshot(
        dashboard,
        f"collection-{working_collection}-opened",
        "When I select any collection",
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

    page.get_by_text("Upload successful!", exact=False).wait_for(timeout=10000)

    bdd_screenshot_helper.take_bdd_screenshot(
        page,
        "upload-success-message",
        "Then I should see a success message",
    )


@then("I should see the uploaded file listed in the collection")
def should_see_uploaded_file_in_collection(authenticated_page: Page, bdd_screenshot_helper):
    """
    Verify a file appears under 'Files in collection'.

    Filenames are timestamped, so we just assert there is at least
    one file row with a Download button.
    """
    page = authenticated_page

    page.get_by_text("Files in collection", exact=False).wait_for(timeout=10000)

    download_button = page.get_by_role("button", name="Download").first
    download_button.wait_for(timeout=10000)

    bdd_screenshot_helper.take_bdd_screenshot(
        page,
        "file-listed-in-collection",
        "And I should see the uploaded file listed in the collection",
    )
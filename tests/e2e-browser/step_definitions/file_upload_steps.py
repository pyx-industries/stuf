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

    # Wait for file input to appear (ignore any error messages about loading existing files)
    file_input_selector = 'input[type="file"]'
    
    try:
        file_input = page.locator(file_input_selector).first
        file_input.wait_for(state="attached", timeout=10000)
    except Exception as e:
        print(f"\n=== File input not found ===")
        print(f"Current page content: {page.inner_text('body')[:500]}")
        raise AssertionError(f"File input not found. Error: {e}")

    # Attach the file
    file_input.set_input_files(str(file_path))

    bdd_screenshot_helper.take_bdd_screenshot(
        page,
        "valid-file-selected",
        "When I select a valid file to upload",
    )

@when("I select any collection")
def select_collection(authenticated_page: Page, bdd_screenshot_helper):
    """
    Select the 'test' collection.
    """
    page = authenticated_page
    dashboard = DashboardPage(page)
    
    dashboard.assert_on_dashboard()
    dashboard.assert_user_logged_in()

    collection_name = "test"
    
    print(f"\n=== Selecting collection: {collection_name} ===")
    
    # Debug: See what cards are on the page
    all_cards = page.locator('[data-slot="card"]')
    print(f"Total cards found: {all_cards.count()}")
    for i in range(all_cards.count()):
        card_text = all_cards.nth(i).inner_text()
        print(f"  Card {i} text: {card_text[:150]}")
    
    # Try to find the card - try multiple selectors
    card = None
    
    # Try 1: With "Collection: " prefix
    selector1 = f'[data-slot="card"]:has-text("Collection: {collection_name}")'
    if page.locator(selector1).count() > 0:
        print(f"✓ Found with selector: {selector1}")
        card = page.locator(selector1).first
    
    # Try 2: Just the collection name
    if not card:
        selector2 = f'[data-slot="card"]:has-text("{collection_name}")'
        if page.locator(selector2).count() > 0:
            print(f"✓ Found with selector: {selector2}")
            card = page.locator(selector2).first
    
    # Try 3: Case insensitive
    if not card:
        for i in range(all_cards.count()):
            if collection_name.lower() in all_cards.nth(i).inner_text().lower():
                print(f"✓ Found card by text search in card {i}")
                card = all_cards.nth(i)
                break
    
    if not card:
        raise AssertionError(f"Could not find collection card for '{collection_name}'")
    
    # Click the card
    print("Clicking card...")
    card.click()
    page.wait_for_timeout(3000)
    
    print(f"Page content after click:\n{page.inner_text('body')[:500]}")
    
    bdd_screenshot_helper.take_bdd_screenshot(
        dashboard,
        f"collection-{collection_name}-opened",
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
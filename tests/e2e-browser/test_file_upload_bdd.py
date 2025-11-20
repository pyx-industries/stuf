"""BDD test file that executes file upload scenarios with visual artifacts."""

from pathlib import Path
from pytest_bdd import scenarios

from step_definitions.authentication_steps import *  # noqa: F403,F401
from step_definitions.file_upload_steps import *  # noqa: F403,F401

# Register all scenarios from the file_upload.feature file
scenarios(str(Path(__file__).parent / "features" / "file_upload.feature"))
"""BDD test file that executes authentication scenarios with visual artifacts."""

from pytest_bdd import scenarios
from pathlib import Path

# Register all scenarios from the authentication feature file
scenarios(str(Path(__file__).parent / "features" / "authentication.feature"))

# Import step definitions AFTER scenarios to ensure they're registered
from step_definitions.authentication_steps import *
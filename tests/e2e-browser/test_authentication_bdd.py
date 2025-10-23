"""BDD test file that executes authentication scenarios with visual artifacts."""

from pathlib import Path

from pytest_bdd import scenarios

# Import step definitions first
from step_definitions.authentication_steps import *  # noqa: F403,F401

# Register all scenarios from the authentication feature file
scenarios(str(Path(__file__).parent / "features" / "authentication.feature"))

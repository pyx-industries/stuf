# Makefile for STUF project
# TODO: Consider dockerizing docs build for better consistency and team onboarding
# Benefits: eliminates PlantUML system dependency, consistent build environment,
# easier CI/CD integration, and no "works on my machine" issues

.PHONY: help docs serve clean spa-dev spa-prod spa-build spa-stop

# Test command variable
PYTEST = python -m pytest api/tests --tb=short

# Default target - show help
help:
	@echo "STUF Project - Available Make Targets:"
	@echo ""
	@echo "Documentation:"
	@echo "  docs          Generate documentation from PlantUML and build MkDocs site"
	@echo "  serve         Start local documentation server for development"
	@echo "  clean         Remove generated PNG files and documentation site"
	@echo ""
	@echo "Testing:"
	@echo "  test          Run unit and integration tests (default, fast)"
	@echo "  test-unit     Run only unit tests (fastest)"
	@echo "  test-integration  Run only integration tests (medium speed)"
	@echo "  test-api-e2e  Run API end-to-end tests (requires Docker services)"
	@echo "  test-e2e-browser  Run browser end-to-end tests (requires Docker services)"
	@echo "  test-e2e      Run all E2E tests (API + browser)"
	@echo "  test-complete Run all tests including E2E (comprehensive)"
	@echo "  test-cov      Run tests with coverage report"
	@echo ""
	@echo "SPA Development:"
	@echo "  spa-dev       Start SPA in development mode with hot reloading"
	@echo "  spa-prod      Start SPA in production mode"
	@echo "  spa-build     Build SPA for production"
	@echo "  spa-stop      Stop SPA services"
	@echo ""
	@echo "Browser E2E Environment:"
	@echo "  test-e2e-browser-env-up    Start browser E2E services"
	@echo "  test-e2e-browser-env-down  Stop browser E2E services"
	@echo "  test-e2e-browser-env-logs  Show browser E2E service logs"
	@echo "  test-e2e-browser-debug     Run browser tests with debugging"
	@echo "  test-e2e-browser-clean     Clean browser test artifacts"
	@echo "  test-e2e-browser-report    Open browser test report"
	@echo "  test-e2e-browser-presentation  Generate stakeholder presentation from test artifacts"
	@echo ""
	@echo "Usage: make <target>"
	@echo "Example: make spa-dev"

# Generate documentation
docs:
	@echo "Generating diagrams from PlantUML files..."
	@which plantuml > /dev/null || (echo "Error: PlantUML not found. Please install it first." && exit 1)
	@plantuml docs/img/*.puml
	@echo "Diagrams generated successfully in docs/img/ directory."
	@echo "Building documentation website..."
	@which mkdocs > /dev/null || (echo "Error: MkDocs not found. Please install it with 'pip install mkdocs mkdocs-material'" && exit 1)
	@mkdocs build
	@echo "Documentation built successfully in site/ directory."

# Serve documentation locally
serve:
	@echo "Starting local documentation server..."
	@which mkdocs > /dev/null || (echo "Error: MkDocs not found. Please install it with 'pip install mkdocs mkdocs-material'" && exit 1)
	@mkdocs serve

# Clean generated files
clean:
	@echo "Cleaning all generated files and artifacts..."
	@rm -f img/*.png
	@rm -rf site/
	@tests/run.sh clean
	@echo "Clean complete."

# Test targets
.PHONY: test test-unit test-integration test-api-e2e test-e2e-browser test-e2e test-complete test-cov
.PHONY: test-e2e-browser-env-up test-e2e-browser-env-down test-e2e-browser-env-logs test-e2e-browser-clean test-e2e-browser-report test-e2e-browser-debug test-e2e-browser-presentation

# Run unit tests only (fast)
test-unit:
	@echo "Running unit tests..."
	@$(PYTEST) -m "unit"

# Run integration tests (medium speed)
test-integration:
	@echo "Running integration tests..."
	@$(PYTEST) -m "integration"

# Run API E2E tests (renamed from test-e2e for clarity)
test-api-e2e:
	@echo "Running API E2E tests..."
	@set -a; if [ -f .env ]; then source .env; fi; set +a; $(PYTEST) -m "e2e"

# Browser E2E test environment management
test-e2e-browser-env-up:
	@echo "Starting browser E2E services..."
	@tests/run.sh env-up

test-e2e-browser-env-down:
	@echo "Stopping browser E2E services..."
	@tests/run.sh env-down

test-e2e-browser-env-logs:
	@echo "Showing browser E2E service logs..."
	@tests/run.sh env-logs

# Browser E2E testing
test-e2e-browser:
	@echo "Running browser E2E tests..."
	@tests/run.sh test

test-e2e-browser-debug:
	@echo "Running browser E2E tests in debug mode..."
	@tests/run.sh debug

test-e2e-browser-clean:
	@echo "Cleaning browser E2E artifacts..."
	@tests/run.sh clean

test-e2e-browser-report:
	@echo "Opening browser E2E test report..."
	@tests/run.sh report

test-e2e-browser-presentation:
	@echo "Generating stakeholder presentation from E2E test artifacts..."
	@cd tests/e2e-browser && python generate_presentation_report.py
	@echo "Presentation generated at: tests/e2e-browser/reports/stakeholder_presentation.html"

# Combined E2E tests (both API and browser)
test-e2e:
	@echo "Running all E2E tests (API and browser)..."
	@$(MAKE) test-api-e2e
	@$(MAKE) test-e2e-browser

# Run all tests except E2E (default)
test:
	@echo "Running unit and integration tests..."
	@$(PYTEST) -m "not e2e"

# Run all tests including both API and browser E2E (renamed from test-all)
test-complete:
	@echo "Running all tests (unit, integration, API E2E, browser E2E)..."
	@$(PYTEST)
	@$(MAKE) test-e2e-browser

# Run tests with coverage
test-cov:
	@echo "Running tests with coverage..."
	@$(PYTEST) -m "not e2e" --cov=api --cov-report=html --cov-report=term-missing

# SPA development and production targets
.PHONY: spa-dev spa-prod spa-build spa-stop

# Start SPA in development mode with hot reloading
spa-dev:
	@echo "Starting SPA in development mode with hot reloading..."
	@echo "This includes full environment (API, Keycloak, MinIO) + fast SPA reloading"
	@echo "Access at: http://localhost:3000"
	@docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# Start SPA in production mode
spa-prod:
	@echo "Starting SPA in production mode..."
	@echo "Access at: http://localhost:3000"
	@docker-compose up --build spa

# Build SPA for production
spa-build:
	@echo "Building SPA for production..."
	@docker-compose build --target production spa

# Stop SPA services
spa-stop:
	@echo "Stopping SPA services..."
	@docker-compose down

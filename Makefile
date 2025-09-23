# Makefile for STUF project
# TODO: Consider dockerizing docs build for better consistency and team onboarding
# Benefits: eliminates PlantUML system dependency, consistent build environment,
# easier CI/CD integration, and no "works on my machine" issues

.PHONY: help docs serve clean spa-dev spa-prod spa-build spa-stop

# Test command variable
PYTEST = python -m pytest api/tests --tb=short -v

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
	@echo "  test          Run fast tests (unit + integration)"
	@echo "  test-e2e      Run end-to-end tests (API + browser)"
	@echo "  test-all      Run all tests (fast + E2E)"
	@echo "  test-cov      Run tests with coverage report"
	@echo ""
	@echo "SPA Development:"
	@echo "  spa-dev       Start SPA in development mode with hot reloading"
	@echo "  spa-prod      Start SPA in production mode"
	@echo "  spa-build     Build SPA for production"
	@echo "  spa-stop      Stop SPA services"
	@echo ""
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
	@rm -rf api/htmlcov/
	@rm -f api/.coverage
	@tests/run.sh clean
	@echo "Clean complete."

# Test targets
.PHONY: test test-e2e test-all test-cov

# Run fast tests (unit + integration) - default
test:
	@echo "Running fast tests (unit + integration)..."
	@$(PYTEST) -m "not e2e"

# Run end-to-end tests (API + browser) with coverage
test-e2e:
	@echo "Running end-to-end tests with coverage..."
	@echo "Starting browser E2E services..."
	@cd tests/e2e-browser && docker compose -f docker-compose.e2e-browser.yml build test-runner && docker compose -f docker-compose.e2e-browser.yml --profile testing up -d
	@echo "Running API E2E and browser E2E tests (inside container)..."
	@cd tests/e2e-browser && docker compose -f docker-compose.e2e-browser.yml --profile testing run --rm -T test-runner bash -c "pytest --tb=short -s -x -m e2e /app/api/tests/e2e/ --html=reports/api-e2e-report.html --self-contained-html && pytest --tb=short -s -x -v --html=reports/browser-e2e-report.html --self-contained-html --alluredir=reports/allure-results . && python generate_presentation_report.py"
	@echo "Stopping browser E2E services..."
	@cd tests/e2e-browser && docker compose -f docker-compose.e2e-browser.yml down

# Run all tests (fast + E2E)
test-all:
	@echo "Running all tests (fast + E2E)..."
	@$(MAKE) test
	@$(MAKE) test-e2e

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
	@docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# Start SPA in production mode
spa-prod:
	@echo "Starting SPA in production mode..."
	@echo "Access at: http://localhost:3000"
	@docker compose up --build spa

# Build SPA for production
spa-build:
	@echo "Building SPA for production..."
	@docker compose build --target production spa

# Stop SPA services
spa-stop:
	@echo "Stopping SPA services..."
	@docker compose down

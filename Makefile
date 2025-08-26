# Makefile for STUF project

.PHONY: help docs clean serve

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
	@echo "  test-e2e      Run end-to-end tests (slow, requires Docker services)"
	@echo "  test-all      Run all tests including E2E"
	@echo "  test-cov      Run tests with coverage report"
	@echo ""
	@echo "Usage: make <target>"
	@echo "Example: make test-unit"

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
	@echo "Cleaning generated PNG files and documentation site..."
	@rm -f img/*.png
	@rm -rf site/
	@echo "Clean complete."

# Test targets
.PHONY: test test-unit test-integration test-e2e test-all test-cov

# Run unit tests only (fast)
test-unit:
	@echo "Running unit tests..."
	@cd api && python -m pytest -m "unit" --tb=short

# Run integration tests (medium speed)
test-integration:
	@echo "Running integration tests..."
	@cd api && python -m pytest -m "integration" --tb=short

# Run E2E tests (slow, requires services)
test-e2e:
	@echo "Running E2E tests..."
	@docker-compose up -d keycloak minio
	@sleep 10  # Wait for services to be ready
	@cd api && python -m pytest -m "e2e" --tb=short
	@docker-compose down

# Run all tests except E2E (default)
test:
	@echo "Running unit and integration tests..."
	@cd api && python -m pytest -m "not e2e" --tb=short

# Run all tests including E2E
test-all:
	@echo "Running all tests..."
	@docker-compose up -d keycloak minio
	@sleep 10
	@cd api && python -m pytest --tb=short
	@docker-compose down

# Run tests with coverage
test-cov:
	@echo "Running tests with coverage..."
	@cd api && python -m pytest -m "not e2e" --cov=. --cov-report=html --cov-report=term-missing

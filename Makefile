# Makefile for STUF project
# TODO: Consider dockerizing docs build for better consistency and team onboarding
# Benefits: eliminates PlantUML system dependency, consistent build environment,
# easier CI/CD integration, and no "works on my machine" issues

.PHONY: help docs serve clean spa-dev spa-prod spa-build spa-stop build-containers publish-containers publish-dev publish-release

# Virtual environment directory
VENV_DIR = .venv
PYTHON = $(VENV_DIR)/bin/python
PIP = $(VENV_DIR)/bin/pip

# Test command variable
PYTEST = $(PYTHON) -m pytest api/tests --tb=short -v

# Container registry configuration
REGISTRY = ghcr.io
# Extract "owner/repo" from any GitHub remote URL (SSH or HTTPS, with or without .git)
REPO_PATH = $(shell git config --get remote.origin.url \
                | sed 's#\.git$$##' \
                | sed 's#.*/\([^/]*\/[^/]*\)$$#\1#')
REPO_OWNER = $(shell echo $(REPO_PATH) | cut -d/ -f1)
REPO_NAME  = $(shell echo $(REPO_PATH) | cut -d/ -f2)
IMAGE_PREFIX = $(REGISTRY)/$(REPO_OWNER)/$(REPO_NAME)

# Git information for tagging
GIT_COMMIT = $(shell git rev-parse --short HEAD)
GIT_BRANCH = $(shell git rev-parse --abbrev-ref HEAD)
GIT_TAG = $(shell git describe --tags --exact-match 2>/dev/null || echo "")

# Container image names
API_IMAGE = $(IMAGE_PREFIX)-api
SPA_IMAGE = $(IMAGE_PREFIX)-spa

# Default target - show help
help:
	@echo "STUF Project - Available Make Targets:"
	@echo ""
	@echo "Setup:"
	@echo "  Virtual environment is automatically created when running test targets"
	@echo ""
	@echo "Documentation:"
	@echo "  docs          Generate documentation from PlantUML and build MkDocs site"
	@echo "  serve         Start local documentation server for development"
	@echo "  clean         Remove generated PNG files and documentation site"
	@echo ""
	@echo "Testing:"
	@echo "  test              Run fast tests (unit + integration)"
	@echo "  test-e2e          Run end-to-end tests against Keycloak (API + browser)"
	@echo "  test-e2e-zitadel  Run end-to-end tests against Zitadel (API + browser)"
	@echo "  test-all          Run all tests (fast + E2E)"
	@echo "  test-cov          Run tests with coverage report"
	@echo ""
	@echo "SPA Development:"
	@echo "  spa-dev       Start SPA in development mode with hot reloading"
	@echo "  spa-prod      Start SPA in production mode"
	@echo "  spa-build     Build SPA for production"
	@echo "  spa-stop      Stop SPA services"
	@echo ""
	@echo "Container Publishing:"
	@echo "  build-containers    Build all containers for publishing"
	@echo "  publish-containers  Build and push containers (for CI)"
	@echo "  publish-dev         Push with development tags (branch + commit)"
	@echo "  publish-release     Push with release tags (requires git tag)"
	@echo ""
	@echo ""
	@echo "Usage: make <target>"
	@echo "Example: make spa-dev"

# Create virtual environment and install dependencies
$(VENV_DIR)/pyvenv.cfg:
	@echo "Creating Python virtual environment..."
	@python3 -m venv $(VENV_DIR)

$(VENV_DIR)/api-requirements.stamp: $(VENV_DIR)/pyvenv.cfg api/requirements.txt
	@echo "Installing API requirements..."
	@$(PIP) install -r api/requirements.txt
	@touch $(VENV_DIR)/api-requirements.stamp

$(VENV_DIR)/dev-requirements.stamp: $(VENV_DIR)/api-requirements.stamp requirements-dev.txt
	@echo "Installing development requirements..."
	@$(PIP) install -r requirements-dev.txt
	@touch $(VENV_DIR)/dev-requirements.stamp
	@echo "Virtual environment created at $(VENV_DIR)"



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
	@rm -f docs/img/*.png
	@rm -f img/*.png
	@rm -rf site/
	@rm -rf api/htmlcov/
	@rm -f api/.coverage
	@rm -rf $(VENV_DIR)
	@tests/run.sh clean
	@echo "Cleaning Keycloak local state..."
	@rm -rf docker/keycloak/data/h2
	@rm -rf docker/keycloak/data/transaction-logs
	@echo "Cleaning Zitadel e2e bootstrap..."
	@rm -f tests/e2e-browser/.zitadel-bootstrap/*.env tests/e2e-browser/.zitadel-bootstrap/*.json
	@echo "Cleaning SPA generated config..."
	@rm -f spa/public/config.js spa/build/config.js
	@echo "Clean complete."

# Test targets
.PHONY: test test-e2e test-e2e-zitadel test-all test-cov

# Run fast tests (unit + integration) - default
test: $(VENV_DIR)/dev-requirements.stamp
	@echo "Running fast tests (unit + integration)..."
	@$(PYTEST) -m "not e2e"

# Run end-to-end tests (API + browser) with Keycloak (default)
test-e2e:
	@echo "Running end-to-end tests with coverage (Keycloak profile)..."
	@echo "Starting browser E2E services..."
	@cd tests/e2e-browser && docker compose -f docker-compose.e2e-browser.yml build test-runner spa-e2e && docker compose -f docker-compose.e2e-browser.yml --profile keycloak --profile testing up -d --wait
	@echo "Running API E2E and browser E2E tests (inside container)..."
	@cd tests/e2e-browser && docker compose -f docker-compose.e2e-browser.yml --profile keycloak --profile testing run --rm -T test-runner bash -c "pytest --tb=short -s -x -m e2e /app/api/tests/e2e/ --html=reports/api-e2e-report.html --self-contained-html && pytest --tb=short -s -x -v --html=reports/browser-e2e-report.html --self-contained-html --alluredir=reports/allure-results . && python generate_presentation_report.py"
	@echo "Stopping browser E2E services..."
	@cd tests/e2e-browser && docker compose -f docker-compose.e2e-browser.yml --profile keycloak down

# Run end-to-end tests against Zitadel
# Usage: make test-e2e-zitadel
# After the Zitadel stack starts and init completes, the generated.env is written to
# tests/e2e-browser/.zitadel-bootstrap/generated.env.  The make target sources it and
# exports the Zitadel-specific OIDC env vars before running the tests.
test-e2e-zitadel:
	@echo "Running end-to-end tests against Zitadel..."
	@mkdir -p tests/e2e-browser/.zitadel-bootstrap
	@echo "Starting Zitadel stack and browser E2E services..."
	@cd tests/e2e-browser && docker compose -f docker-compose.e2e-browser.yml build test-runner zitadel-init-e2e api-e2e spa-e2e
	@cd tests/e2e-browser && docker compose -f docker-compose.e2e-browser.yml --profile zitadel up -d --wait zitadel-postgres-e2e zitadel-bootstrap-init-e2e zitadel-e2e
	@echo "Running Zitadel provisioning (foreground; container kept so depends_on tracking works)..."
	@cd tests/e2e-browser && docker compose -f docker-compose.e2e-browser.yml --profile zitadel up --no-deps zitadel-init-e2e
	@cd tests/e2e-browser && docker compose -f docker-compose.e2e-browser.yml --profile zitadel up -d --no-deps --wait zitadel-login-e2e minio-e2e
	@echo "Reading generated Zitadel credentials..."
	@test -f tests/e2e-browser/.zitadel-bootstrap/generated.env || (echo "ERROR: generated.env not found"; exit 1)
	@echo "Starting API and SPA with Zitadel configuration..."
	@( \
		set -a; . tests/e2e-browser/.zitadel-bootstrap/generated.env; set +a; \
		export OIDC_ISSUER_URL=http://zitadel-e2e:8080; \
		export OIDC_BASE_URL=http://zitadel-e2e:8080; \
		export OIDC_VALID_AUDIENCES="$${ZITADEL_SPA_CLIENT_ID},$${ZITADEL_API_APP_CLIENT_ID},$${ZITADEL_STUF_PROJECT_ID}"; \
		export OIDC_SPA_CLIENT_ID="$${ZITADEL_SPA_CLIENT_ID}"; \
		export OIDC_AUTHORITY=http://zitadel-e2e:8080; \
		export OIDC_CLIENT_ID="$${ZITADEL_SPA_CLIENT_ID}"; \
		export IDP_URL=http://zitadel-e2e:8080; \
		export OIDC_SERVICE_ACCOUNT_CLIENT_ID="$${ZITADEL_BACKUP_SERVICE_CLIENT_ID}"; \
		export OIDC_SERVICE_ACCOUNT_CLIENT_SECRET="$${ZITADEL_BACKUP_SERVICE_CLIENT_SECRET}"; \
		export OIDC_SERVICE_ACCOUNT_SCOPES="openid urn:zitadel:iam:org:project:id:$${ZITADEL_STUF_PROJECT_ID}:aud"; \
		cd tests/e2e-browser && \
		docker compose -f docker-compose.e2e-browser.yml --profile zitadel --profile testing up -d --wait api-e2e spa-e2e && \
		docker compose -f docker-compose.e2e-browser.yml --profile zitadel --profile testing run --rm -T test-runner bash -c \
			"pytest --tb=short -s -x -m e2e /app/api/tests/e2e/ --html=reports/api-e2e-zitadel-report.html --self-contained-html && \
			 pytest --tb=short -s -x -v --html=reports/browser-e2e-zitadel-report.html --self-contained-html --alluredir=reports/allure-results-zitadel . && \
			 python generate_presentation_report.py" \
	)
	@echo "Stopping Zitadel E2E services..."
	@cd tests/e2e-browser && docker compose -f docker-compose.e2e-browser.yml --profile zitadel down

# Run all tests (fast + E2E)
test-all:
	@echo "Running all tests (fast + E2E)..."
	@$(MAKE) test
	@$(MAKE) test-e2e

# Run tests with coverage
test-cov: $(VENV_DIR)/dev-requirements.stamp
	@echo "Running tests with coverage..."
	@$(PYTEST) -m "not e2e" --cov=api --cov-report=html --cov-report=term-missing

# SPA development and production targets
.PHONY: spa-dev spa-prod spa-build spa-stop

# Start SPA in development mode with hot reloading
spa-dev:
	@echo "Starting SPA in development mode with hot reloading..."
	@echo "This includes full environment (API, IDP, MinIO) + fast SPA reloading"
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
	@echo "Cleaning Keycloak local state..."
	@rm -rf docker/keycloak/data/h2
	@rm -rf docker/keycloak/data/transaction-logs
	@echo "Cleaning Zitadel e2e bootstrap..."
	@rm -f tests/e2e-browser/.zitadel-bootstrap/*.env tests/e2e-browser/.zitadel-bootstrap/*.json
	@echo "Cleaning generated config..."
	@rm -f spa/public/config.js spa/build/config.js

# Container building and publishing targets

# Build all containers for publishing
build-containers:
	@echo "Building containers for publishing..."
	@echo "API Image: $(API_IMAGE)"
	@echo "SPA Image: $(SPA_IMAGE)"
	@echo ""
	@echo "Building API container..."
	@docker build -t $(API_IMAGE):latest ./api
	@echo "Building SPA container..."
	@docker build --target production -t $(SPA_IMAGE):latest ./spa
	@echo "All containers built successfully!"

# Tag and push containers (used by CI)
publish-containers: build-containers
	@echo "Publishing containers to $(REGISTRY)..."
	@if [ -z "$$GITHUB_TOKEN" ] && [ -z "$$REGISTRY_TOKEN" ]; then \
		echo "Error: GITHUB_TOKEN or REGISTRY_TOKEN environment variable required"; \
		exit 1; \
	fi
	@echo "Logging in to container registry..."
	@echo "$${GITHUB_TOKEN:-$$REGISTRY_TOKEN}" | docker login $(REGISTRY) -u $${GITHUB_ACTOR:-token} --password-stdin
	@echo "Tagging and pushing images..."
	@docker tag $(API_IMAGE):latest $(API_IMAGE):$(GIT_COMMIT)
	@docker tag $(SPA_IMAGE):latest $(SPA_IMAGE):$(GIT_COMMIT)
	@if [ "$(GIT_BRANCH)" = "master" ] || [ "$(GIT_BRANCH)" = "main" ]; then \
		echo "Pushing latest tags for main branch..."; \
		docker push $(API_IMAGE):latest; \
		docker push $(SPA_IMAGE):latest; \
	fi
	@echo "Pushing commit-specific tags..."
	@docker push $(API_IMAGE):$(GIT_COMMIT)
	@docker push $(SPA_IMAGE):$(GIT_COMMIT)
	@echo "Successfully published all containers!"

# Push with development tags (for feature branches)
publish-dev: build-containers
	@echo "Publishing development containers..."
	@if [ -z "$$GITHUB_TOKEN" ] && [ -z "$$REGISTRY_TOKEN" ]; then \
		echo "Error: GITHUB_TOKEN or REGISTRY_TOKEN environment variable required"; \
		exit 1; \
	fi
	@echo "$${GITHUB_TOKEN:-$$REGISTRY_TOKEN}" | docker login $(REGISTRY) -u $${GITHUB_ACTOR:-token} --password-stdin
	@docker tag $(API_IMAGE):latest $(API_IMAGE):$(GIT_BRANCH)-$(GIT_COMMIT)
	@docker tag $(SPA_IMAGE):latest $(SPA_IMAGE):$(GIT_BRANCH)-$(GIT_COMMIT)
	@docker push $(API_IMAGE):$(GIT_BRANCH)-$(GIT_COMMIT)
	@docker push $(SPA_IMAGE):$(GIT_BRANCH)-$(GIT_COMMIT)
	@echo "Published development containers with tags: $(GIT_BRANCH)-$(GIT_COMMIT)"

# Push with release tags (requires git tag)
publish-release: build-containers
	@echo "Publishing release containers..."
	@if [ -z "$(GIT_TAG)" ]; then \
		echo "Error: No git tag found. Create a tag first with: git tag v1.0.0"; \
		exit 1; \
	fi
	@if [ -z "$$GITHUB_TOKEN" ] && [ -z "$$REGISTRY_TOKEN" ]; then \
		echo "Error: GITHUB_TOKEN or REGISTRY_TOKEN environment variable required"; \
		exit 1; \
	fi
	@echo "Publishing release $(GIT_TAG)..."
	@echo "$${GITHUB_TOKEN:-$$REGISTRY_TOKEN}" | docker login $(REGISTRY) -u $${GITHUB_ACTOR:-token} --password-stdin
	@docker tag $(API_IMAGE):latest $(API_IMAGE):$(GIT_TAG)
	@docker tag $(SPA_IMAGE):latest $(SPA_IMAGE):$(GIT_TAG)
	@docker push $(API_IMAGE):$(GIT_TAG)
	@docker push $(SPA_IMAGE):$(GIT_TAG)
	@docker push $(API_IMAGE):latest
	@docker push $(SPA_IMAGE):latest
	@echo "Published release containers with tag: $(GIT_TAG)"

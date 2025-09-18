#!/bin/bash

# STUF Browser E2E Test Runner
# This script manages the Python virtualenv, installs dependencies,
# and runs browser-based end-to-end tests using Playwright

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
E2E_DIR="$SCRIPT_DIR/e2e-browser"
VENV_DIR="$SCRIPT_DIR/.venv"
REQUIREMENTS_FILE="$E2E_DIR/requirements.txt"

# Default values
COMMAND="test"
HEADLESS="true"
WORKERS="1"
BROWSER="chromium"

# Help function
show_help() {
    echo "STUF Browser E2E Test Runner"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  test             Run browser E2E tests (default)"
    echo "  setup            Setup virtualenv and install dependencies"
    echo "  env-up           Start Docker services for testing"
    echo "  env-down         Stop Docker services"
    echo "  env-logs         Show Docker service logs"
    echo "  clean            Clean test artifacts and virtualenv"
    echo "  report           Open test report in browser"
    echo "  debug            Run tests with debugging enabled"
    echo ""
    echo "Options:"
    echo "  --headed         Run tests in headed mode (show browser)"
    echo "  --workers=N      Number of parallel workers (default: 1)"
    echo "  --browser=NAME   Browser to use: chromium, firefox, webkit (default: chromium)"
    echo "  --help           Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  E2E_USERNAME     Username for authentication (default: admin@example.com)"
    echo "  E2E_PASSWORD     Password for authentication (default: password)"
    echo "  PLAYWRIGHT_HEADLESS  Override headless mode (true/false)"
    echo ""
    echo "Examples:"
    echo "  $0 test --headed                    # Run tests showing browser"
    echo "  $0 test --workers=4 --browser=firefox  # Run in parallel with Firefox"
    echo "  $0 debug                           # Run with debugging enabled"
    echo "  $0 env-up && $0 test && $0 env-down   # Full test cycle"
}

# Logging functions
log_info() {
    echo -e "${BLUE}INFO: $1${NC}"
}

log_success() {
    echo -e "${GREEN}SUCCESS: $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}WARNING: $1${NC}"
}

log_error() {
    echo -e "${RED}ERROR: $1${NC}"
}

# Wait for services to be healthy
wait_for_services_healthy() {
    log_info "Waiting for services to be healthy..."
    
    local max_wait=300  # 5 minutes
    local wait_time=0
    local interval=10
    
    while [ $wait_time -lt $max_wait ]; do
        local healthy_services=$(docker compose -f "$E2E_DIR/docker-compose.e2e-browser.yml" ps --format "table {{.Service}}\t{{.Status}}" | grep -c "healthy\|Up (" || true)
        local total_services=4
        
        if [ "$healthy_services" -ge $total_services ]; then
            log_success "All services are healthy"
            return 0
        fi
        
        log_info "Waiting for services to be healthy... (${wait_time}s/${max_wait}s) - ${healthy_services}/${total_services} ready"
        sleep $interval
        wait_time=$((wait_time + interval))
    done
    
    log_error "Services failed to become healthy within ${max_wait} seconds"
    log_info "Current service status:"
    docker compose -f "$E2E_DIR/docker-compose.e2e-browser.yml" ps
    return 1
}

# Wait for Keycloak to be ready by checking its health endpoint
wait_for_keycloak() {
    log_info "Waiting for Keycloak to be ready..."
    
    local max_attempts=30  # 5 minutes total (30 * 10 seconds)
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        # Check if Keycloak health endpoint responds
        if curl -s -f http://localhost:8180/health/ready > /dev/null 2>&1; then
            log_success "Keycloak is ready"
            return 0
        fi
        
        # Also check if realm endpoint exists (fallback)
        if curl -s http://localhost:8180/realms/stuf/.well-known/openid_configuration > /dev/null 2>&1; then
            log_success "Keycloak realm is accessible"
            return 0
        fi
        
        attempt=$((attempt + 1))
        log_info "Waiting for Keycloak to be ready... ($attempt/$max_attempts)"
        sleep 10
    done
    
    log_error "Keycloak failed to become ready within 5 minutes"
    log_info "Checking Keycloak logs for debugging:"
    docker compose -f "$E2E_DIR/docker-compose.e2e-browser.yml" logs keycloak-e2e --tail=20
    return 1
}

# Check if Docker is running and services are available
check_docker_services() {
    log_info "Checking if Docker services are running..."
    
    # Check if docker-compose services are up
    if ! docker compose -f "$E2E_DIR/docker-compose.e2e-browser.yml" ps --services --filter "status=running" | grep -q .; then
        log_warning "Docker services are not running. Starting them..."
        start_docker_services
        
        # Wait specifically for Keycloak to be ready (most critical service)
        wait_for_keycloak
        
        # Check if key services are responding
        log_info "Checking other service connectivity..."
        local max_attempts=12
        local attempt=0
        
        while [ $attempt -lt $max_attempts ]; do
            if curl -s http://localhost:8100/api/health > /dev/null && curl -s http://localhost:3100 > /dev/null; then
                log_success "All services are responding"
                return 0
            fi
            attempt=$((attempt + 1))
            log_info "Waiting for API and SPA to be ready... ($attempt/$max_attempts)"
            sleep 10
        done
        
        log_warning "Some services may still be starting. Continuing anyway..."
    else
        log_success "Docker services are running"
        # Even if services are running, verify Keycloak is responding
        wait_for_keycloak
    fi
}

# Start Docker services
start_docker_services() {
    log_info "Starting Docker services for E2E testing..."
    cd "$PROJECT_ROOT"
    
    # Start services in detached mode
    docker compose -f "$E2E_DIR/docker-compose.e2e-browser.yml" up -d
    
    log_success "Docker services started in background"
    log_info "Services will continue starting. Use 'make test-e2e-browser-env-logs' to monitor progress."
    log_info "Health checks may take up to 2-3 minutes to complete."
}

# Stop Docker services
stop_docker_services() {
    log_info "Stopping Docker services..."
    cd "$PROJECT_ROOT"
    docker compose -f "$E2E_DIR/docker-compose.e2e-browser.yml" down -v
    log_success "Docker services stopped"
}

# Show Docker service logs
show_docker_logs() {
    log_info "Showing Docker service logs..."
    cd "$PROJECT_ROOT"
    docker compose -f "$E2E_DIR/docker-compose.e2e-browser.yml" logs -f
}

# Setup Python virtualenv and dependencies
setup_virtualenv() {
    log_info "Setting up Python virtualenv for E2E testing..."
    
    # Create virtualenv if it doesn't exist
    if [ ! -d "$VENV_DIR" ]; then
        log_info "Creating Python virtualenv at $VENV_DIR"
        python3 -m venv "$VENV_DIR"
    fi
    
    # Activate virtualenv
    source "$VENV_DIR/bin/activate"
    
    # Upgrade pip
    log_info "Upgrading pip..."
    pip install --upgrade pip
    
    # Install requirements
    if [ -f "$REQUIREMENTS_FILE" ]; then
        log_info "Installing requirements from $REQUIREMENTS_FILE"
        pip install -r "$REQUIREMENTS_FILE"
    else
        log_error "Requirements file not found: $REQUIREMENTS_FILE"
        exit 1
    fi
    
    # Install Playwright browsers
    log_info "Installing Playwright browsers..."
    playwright install chromium firefox webkit
    
    log_success "Virtualenv setup complete"
}

# Run E2E tests
run_tests() {
    log_info "Running browser E2E tests..."
    
    # Ensure virtualenv is setup
    if [ ! -d "$VENV_DIR" ]; then
        setup_virtualenv
    fi
    
    # Activate virtualenv
    source "$VENV_DIR/bin/activate"
    
    # Ensure services are running
    check_docker_services
    
    # Set environment variables
    export PLAYWRIGHT_HEADLESS="$HEADLESS"
    export PLAYWRIGHT_WORKERS="$WORKERS"
    
    # Navigate to E2E test directory
    cd "$E2E_DIR"
    
    # Global setup removed - tests use live auth via authenticated_page fixture
    
    # Run tests
    log_info "Running tests with pytest..."
    pytest \
        --tb=short \
        --html=reports/test-report.html \
        --self-contained-html \
        . \
        -v
    
    log_success "Tests completed"
}

# Debug mode
run_debug() {
    log_info "Running tests in debug mode..."
    HEADLESS="false"
    WORKERS="1"
    
    # Set debug environment variables
    export PLAYWRIGHT_SLOW_MO="1000"  # 1 second delay between actions
    export PYTEST_ARGS="--capture=no -s"  # Show print statements
    
    run_tests
}

# Clean artifacts and virtualenv
clean_all() {
    log_info "Cleaning test artifacts and virtualenv..."
    
    # Remove reports
    if [ -d "$E2E_DIR/reports" ]; then
        rm -rf "$E2E_DIR/reports"
        log_success "Removed reports directory"
    fi
    
    # Remove authentication state
    if [ -f "$E2E_DIR/auth-storage-state.json" ]; then
        rm "$E2E_DIR/auth-storage-state.json"
        log_success "Removed authentication state"
    fi
    
    # Remove virtualenv
    if [ -d "$VENV_DIR" ]; then
        rm -rf "$VENV_DIR"
        log_success "Removed virtualenv"
    fi
    
    # Remove Python cache
    find "$SCRIPT_DIR" -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
    find "$SCRIPT_DIR" -name "*.pyc" -delete 2>/dev/null || true
    
    log_success "Cleanup complete"
}

# Open test report
open_report() {
    local report_file="$E2E_DIR/reports/test-report.html"
    
    if [ -f "$report_file" ]; then
        log_info "Opening test report..."
        
        # Try to open with different commands depending on OS
        if command -v open >/dev/null 2>&1; then
            open "$report_file"  # macOS
        elif command -v xdg-open >/dev/null 2>&1; then
            xdg-open "$report_file"  # Linux
        elif command -v start >/dev/null 2>&1; then
            start "$report_file"  # Windows
        else
            log_info "Please open this file in your browser: $report_file"
        fi
    else
        log_error "Test report not found: $report_file"
        log_info "Run tests first: $0 test"
        exit 1
    fi
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        test|setup|env-up|env-down|env-logs|clean|report|debug)
            COMMAND="$1"
            shift
            ;;
        --headed)
            HEADLESS="false"
            shift
            ;;
        --workers=*)
            WORKERS="${1#*=}"
            shift
            ;;
        --browser=*)
            BROWSER="${1#*=}"
            shift
            ;;
        --help|-h)
            show_help
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Execute command
case $COMMAND in
    test)
        run_tests
        ;;
    setup)
        setup_virtualenv
        ;;
    env-up)
        start_docker_services
        ;;
    env-down)
        stop_docker_services
        ;;
    env-logs)
        show_docker_logs
        ;;
    clean)
        clean_all
        ;;
    report)
        open_report
        ;;
    debug)
        run_debug
        ;;
    *)
        log_error "Unknown command: $COMMAND"
        show_help
        exit 1
        ;;
esac
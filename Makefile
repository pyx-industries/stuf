# Makefile for STUF project

.PHONY: docs clean serve

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
	@rm -f docs/img/*.png
	@rm -rf site/
	@echo "Clean complete."

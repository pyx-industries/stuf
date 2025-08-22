# Makefile for STUF project

.PHONY: docs clean

# Generate PNG diagrams from PlantUML files
docs:
	@echo "Generating diagrams from PlantUML files..."
	@which plantuml > /dev/null || (echo "Error: PlantUML not found. Please install it first." && exit 1)
	@plantuml img/*.puml
	@echo "Diagrams generated successfully in img/ directory."

# Clean generated PNG files
clean:
	@echo "Cleaning generated PNG files..."
	@rm -f img/*.png
	@echo "Clean complete."

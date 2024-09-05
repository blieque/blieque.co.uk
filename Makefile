SHELL := /bin/bash

.DEFAULT_GOAL := build
.PHONY: clean setup styles scripts static build watch server

source = ./src
output = ./dist

clean:
	@echo "Removing output directory"
	@[[ -d $(output) ]] && rm -r $(output)

setup: $(output)
$(output):
	@echo "Creating output directory"
	@[[ -d $(output) ]] || mkdir $(output)

markup: $(output)/index.html
	@echo "Minifying markup"
$(output)/%.html: $(source)/%.html
	@node ./minify-html.js $< $@

styles: $(output)/main.min.css
$(output)/%.min.css: $(source)/styles/%.scss $(shell find $(source)/styles -type f)
	@echo "Compiling and minifying styles: $<"
	@npx sass $< $@
	@if [[ "$(NODE_ENV)" == "production" ]]; then \
		npx cleancss -o $@ $@ > /dev/null; \
	fi

scripts: $(output)/app.min.js
$(output)/%.min.js: $(source)/scripts/%.js
	@echo "Transpiling and minifying scripts: $<"
	@if [[ "$(NODE_ENV)" == "production" ]]; then \
		npx babel --no-comments --presets minify -o $@ $<; \
	else \
		npx babel -o $@ $<; \
	fi

# This will always run when `make' runs, as last-modification timestamps on
# directories aren't updated when their contents are modified. This makes it
# hard for `make' to know if the dependencies have updated. Luckily we can leave
# the cleverness to `rsync' instead.
static: $(output)/static
$(output)/static: $(shell find $(source)/static -type f  | tr '\n' ' ')
	@echo "Copying static assets"
	@[[ -d $@ ]] || mkdir $@
	@rsync \
		--update \
		--delete \
		--recursive \
		--links \
		--times \
		--perms \
		$(source)/static/ $@/
	@touch $(output)/static

build: setup markup styles scripts static

production:
	@echo "Building for production"
	@NODE_ENV="production" make build

watch:
	@echo "Building then watching for changes"
	@echo "Press ^C to stop (ignore any \`make' recipe errors)"
	@while true; do \
		make build -s; \
		fswatch --exclude .git -r . || true; \
	done

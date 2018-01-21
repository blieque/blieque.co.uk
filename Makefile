SHELL := /bin/bash
# `npm run' thinks it's a good idea to add NPM executable directories to the
# start of $PATH in the environment it executes scripts within. This causes a
# problem when an installed NPM package decides to create a CLI with the same
# name as a pre-exisiting shell command.
PATH = /usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:node_modules/.bin

.DEFAULT_GOAL := build
.PHONY: clean setup styles scripts static build watch server

output = ./dist
source = ./src
static = ./src/static

markup_list_out = $(shell find $(source) -maxdepth 1 -name "*.html" -printf '$(output)/%f ')
static_list = $(shell find $(static) -type f -printf '%p ')

clean:
	@echo "Cleaning output directory"
	@[[ -d $(output) ]] && rm -r $(output)
	@mkdir $(output)

setup: $(output)
$(output):
	@echo "Creating output directory"
	@mkdir $(output)

markup: $(markup_list_out)
$(output)/%.html: $(source)/%.html
	@echo "Minifying markup"
	@html-minifier \
		--collapse-whitespace \
		--collapse-boolean-attributes \
		--decode-entities \
		--remove-comments \
		--remove-script-type-attributes \
		--remove-style-link-type-attributes \
		--use-short-doctype \
		--file-ext html \
		-o $@ \
		$<

styles: $(output)/main.min.css
$(output)/main.min.css: $(shell find $(source)/styles -type f)
	@echo "Compiling and minifying styles"
	@node-sass $(source)/styles/main.scss $(output)/main.css
	@cleancss -o $(output)/main.min.css $(output)/main.css > /dev/null

scripts: $(output)/app.min.js
$(output)/app.min.js: $(source)/scripts/app.js
	@echo "Transpiling and minifying scripts"
	@#babel --presets babili -o $(output)/app.min.js $(source)/scripts/app.js
	@babel -o $(output)/app.min.js $(source)/scripts/app.js

# These two will probably always run when `make' runs, as last-modification
# timestamps on directories aren't updated when their contents are modified.
# This makes it hard for `make' to know if the dependencies have updated.
# Luckily we can leave the cleverness to `cp' instead.
static: $(output)/static
$(output)/static: $(static_list)
	@echo "Copying static assets"
	@[[ -d $(output)/static ]] || mkdir $(output)/static
	@rsync \
		--update \
		--delete \
		--recursive \
		--links \
		--times \
		--perms \
		$(static) $(output)
	@touch $(output)/static

build: setup markup styles scripts static

watch:
	@echo "Building then watching for changes"
	@echo "Press ^C to stop (ignore any \`make' recipe errors)"
	@while true; do \
		make build -s; \
		inotifywait --exclude .git -qqre close_write . || true; \
	done

server:
	@echo Starting server
	@npm start & \
		make watch -s; \
		trap 'kill -KILL $$(jobs -p)' SIGINT SIGTERM EXIT

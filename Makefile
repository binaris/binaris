SHELL := /bin/bash

.DEFAULT_GOAL = build

NO_CACHE = $(shell if [ $${NO_CACHE:-false} != false ]; then echo --no-cache; fi)
SUDO := $(shell if docker info 2>&1 | grep "permission denied" >/dev/null; then echo "sudo -E"; fi)
DOCKER := $(SUDO) docker
DOCKER_IMAGE := binaris

define cli_envs
	-e tag                     \
	-e BINARIS_API_KEY         \
	-e BINARIS_INVOKE_ENDPOINT \
	-e BINARIS_DEPLOY_ENDPOINT \
	-e BINARIS_LOG_ENDPOINT
endef

.PHONY: build
build: require-tag
		$(DOCKER) build $(NO_CACHE) -f binaris.Dockerfile -t $(DOCKER_IMAGE):$(tag) .

.PHONY: lint
lint: build
		$(DOCKER) run            \
			--rm                   \
			$(DOCKER_IMAGE):$(tag) \
			bash -c "cd /home/dockeruser/binaris && npm run lint"

.PHONY: test
test: build
		export tag=$(tag)
		$(DOCKER) run                                   \
			--rm                                          \
			--privileged                                  \
			-v /var/run/docker.sock:/var/run/docker.sock  \
			$(cli_envs) $(DOCKER_IMAGE):$(tag)            \
			bash -c "cd /home/dockeruser/binaris && npm run test"

.PHONY: publish
publish: build require-npm-creds
		export tag=$(tag)
		$(DOCKER) run                                                                                              \
			--rm                                                                                                     \
			$(DOCKER_IMAGE):$(tag)                                                                                   \
			bash -c 'cd /home/dockeruser/binaris && echo "//registry.npmjs.org/:_authToken=$(NPM_TOKEN)">~/.npmrc && \
				npm publish &&                                                                                         \
				rm ~/.npmrc'

.PHONY: require-tag
require-tag:
	@if [ -z $${tag+x} ]; then echo 'tag' make variable must be defined; false; fi

.PHONY: require-npm-creds
require-npm-creds:
	@if [ -z $${NPM_TOKEN+x} ]; then echo 'NPM_TOKEN' make variable must be defined; false; fi

.PHONY: all
all: lint test

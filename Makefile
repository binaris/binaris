SHELL := /bin/bash

.DEFAULT_GOAL = build

NO_CACHE = $(shell if [ $${NO_CACHE:-false} != false ]; then echo --no-cache; fi)
SUDO := $(shell if docker info 2>&1 | grep "permission denied" >/dev/null; then echo "sudo -E"; fi)
DOCKER := $(SUDO) docker
DOCKER_IMAGE := binaris/binaris

define cli_envs
	-e BINARIS_LOG_LEVEL       \
	-e tag                     \
	-e BINARIS_API_KEY         \
	-e BINARIS_INVOKE_ENDPOINT \
	-e BINARIS_DEPLOY_ENDPOINT \
	-e BINARIS_LOG_ENDPOINT
endef

BRANCH := $(shell if [[ ! -z $${BRANCH_NAME+x} ]]; then echo $${BRANCH_NAME}; else git rev-parse --abbrev-ref HEAD 2>/dev/null || echo UNKNOWN; fi)

.PHONY: build
build: require-tag
		$(DOCKER) build $(NO_CACHE) -f binaris.Dockerfile -t $(DOCKER_IMAGE):$(tag) .

.PHONY: tag
tag: require-tag
		$(DOCKER) tag $(DOCKER_IMAGE):$(tag) binaris
		$(DOCKER) tag $(DOCKER_IMAGE):$(tag) $(DOCKER_IMAGE):$(BRANCH)

.PHONY: lint
lint: build
		$(DOCKER) run                                                 \
			--rm                                                      \
			$(DOCKER_IMAGE):$(tag)                                    \
			bash -c "cd /home/dockeruser/binaris && npm run lint"

.PHONY: test
test: build
		export tag=$(tag)
		$(DOCKER) run                                     \
			$(INTERACTIVE)                                \
			--rm                                          \
			--privileged                                  \
			--user root                                   \
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

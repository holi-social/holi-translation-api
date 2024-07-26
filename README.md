# Holi Translation

The backend for handling translations.

<!-- TOC -->

- [Holi Translation API](#holi-translation)
  - [Getting started](#getting-started)
    - [Setup](#setup)
    - [Code style](#code-style)
    - [Dependencies](#dependencies)
    - [Compiling (optional)](#compiling-optional)
    - [Tasks](#tasks)
    - [VS Code extension](#vs-code-extension)
  - [Local execution](#local-execution)
  - [Continuous Integration and Deployment](#continuous-integration-and-deployment)
    - [Skipping parts of CI](#skipping-parts-of-ci)
      - [noenv Branches](#noenv-branches)
  - [Runtime / Deployment](#runtime--deployment)
    - [Configuration](#configuration)

<!-- /TOC -->

## Getting started

### Setup

Install [`deno`](https://github.com/denoland/deno_install) in version 1.40.1

as well as [`Velociraptor`](https://velociraptor.run/docs/installation/).

### Code style

Linting:

```sh
vr lint
```

Formatting:

```sh
vr fmt
```

Configuration for
[typescript](https://deno.land/manual/typescript/configuration),
[linter](https://deno.land/manual/tools/linter) or
[formatter](https://deno.land/manual/tools/formatter) can be added in
`deno.json`.

See the [deno manual](https://deno.land/manual/tools) for more tools.

### Dependencies

All dependencies should be added in `app/deps.ts` (similiar as you would do in a
Node.js `package.json`) for caching and integrity checks. After adding a
dependency run:

```sh
vr updateDeps
```

to update the `deno.lock` file (similiar to Node.js `package.lock` including
hashes).

To just install and cache dependencies locally or force a reload of
dependencies, run:

```sh
vr install
```

### Compiling (optional)

Deno will compile all TypeScript code to JavaScript and cache the resulting
files. This will happen automatically when you run the code, but you can also
trigger this manually by running

```sh
vr cache
```

### Tasks

We use [`Velociraptor`](https://velociraptor.run/) to execute scripts that are
defined beneath `velociraptor > scripts` in `deno.json` (similiar to scripts
defined in Node.js `package.json`).

You can run

```sh
vr
```

to get a list of all available tasks.

### VS Code extension

There is an official VS Code extension for Deno:
[vscode-deno](https://marketplace.visualstudio.com/items?itemName=denoland.vscode-deno).

It should already be enabled for the workspace, for more information check the
[documentation](https://deno.land/manual/vscode_deno).

JetBrains also offers a
[plugin](https://plugins.jetbrains.com/plugin/14382-deno) for WebStorm and other
JetBrains IDEs.

## Local execution

To watch for file changes during development, run

```sh
vr dev
```

To execute the application without watching for file changes run

```sh
vr start
```

or run

```sh
vr docker
```

to execute the application in a local docker container.

Afterwards you can access the graphql playground here:

`http://localhost:8089/graphql`

## Continuous Integration and Deployment

### Skipping parts of CI

Sometimes, changes don't need to be verified by the full pipeline, e.g. changes
in linting or documentation.

#### noenv Branches

When you prefix your branch name with `noenv/` (e.g. `noenv/my-readme-update`)
the pipeline only lints & builds, but does not publish, deploy or run e2e test.
This saves quite some time. Obviously, many things go untested so only use this
if "you know what you're doing".

## Runtime / Deployment

### Configuration

To run it locally, use the same Redis environment variables as those used by your local `unified-api` or `okuna`.

| Environment Variable         | Default Value | Description                                   |
| ---------------------------- | ------------- | --------------------------------------------- |
| PORT                         | 8089          | the port to listen on                         |
| CACHE_ENABLED                | true          | wether or not to enable caching               |
| CACHE_TTL_MS_LIBRE_TRANSLATE | 60 seconds    | time-to-live in ms for libretranslate caching |
| REDIS_HOST                   | localhost     | the hostname of the Redis server              |
| REDIS_PORT                   | 6380          | the port number of the Redis server           |
| REDIS_PASSWORD               | -             | the password for the Redis server             |
| REDIS_DB                     | -             | the Redis database number to use              |

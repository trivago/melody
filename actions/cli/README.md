## Usage

An example workflow to build, test, and publish an npm package.

The current CLI exposes the following environment. 
- nodejs: latest
- npm
- yarn
- Node version management using n https://github.com/tj/n 

```hcl
workflow "Build, Test, and Publish" {
  on = "push"
  resolves = ["Publish"]
}

action "Build" {
  uses = "./actions/cli"
  args = "yarn install --frozen-lockfile --non-interactive"
}

action "Test" {
  needs = "Build"
  uses = "./actions/cli"
  args = "yarn run test"
}

action "Publish" {
  needs = "Test"
  uses = "./actions/cli"
  args = "yarn publish --access public"
  secrets = ["NPM_AUTH_TOKEN"]
}
```

Please see [Main Workflow](../../.github/main.workflow) for use case or contact maintainer from [Dockerfile](./Dockerfile).

workflow "release" {
  on = "push"
  resolves = ["release:push tag"]
}

action "release:filter branch" {
  uses = "actions/bin/filter@master"
  args = "branch master"
}

action "release:check commit message" {
  needs = ["release:filter branch"]
  uses = "./actions/cli"
  args = "node bin/check-commit.js"
}

action "release:authorized users only" {
  needs = ["release:check commit message"]
  uses = "actions/bin/filter@master"
  args = ["actor", "ayusharma", "pago"]
}

action "release:build" {
  needs = ["release:authorized users only"]
  uses = "docker://node:8"
  args = "yarn install --frozen-lockfile --non-interactive"
}

action "release:test" {
  uses = "docker://node:8"
  needs = ["release:build"]
  args = "yarn test"
}

action "release:version" {
  uses = "./actions/cli"
  needs = ["release:test"]
  args = "yarn lerna version $CURRENT_COMMIT_TEXT --no-push  --yes --force-publish=*"
}

action "release:publish" {
  uses = "./actions/cli"
  needs = ["release:version"]
  args = "yarn lerna publish from-git --force-publish=* --yes --registry https://$REGISTRY_URL"
  env = {
    REGISTRY_URL = "registry.npmjs.org"
  }
  secrets = ["NPM_AUTH_TOKEN"]
}

action "release:push tag" {
  needs = ["release:publish"]
  uses = "trivago/melody/actions/cli"
  args = "git push https://$GITHUB_TOKEN@github.com/trivago/melody.git github-actions --follow-tags"
  secrets = ["GITHUB_TOKEN"]
}

workflow "pull request closed" {
  on = "pull_request"
  resolves = [
    "remove dist-tag",
  ]
}

action "filter PR closed" {
  uses = "actions/bin/filter@master"
  args = "action 'closed'"
}

action "remove dist-tag" {
  uses = "./actions/cli"
  needs = ["filter PR closed"]
  args = "node bin/dist-tag-rm.js packages $(git rev-parse --abbrev-ref HEAD) https://$REGISTRY_URL"
  env = {
    REGISTRY_URL = "registry.npmjs.org"
  }
  secrets = ["NPM_AUTH_TOKEN"]
}

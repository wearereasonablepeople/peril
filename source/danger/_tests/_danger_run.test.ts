import { dangerRepresentationForPath, dangerRunForRules, dslTypeForEvent, RunFeedback, RunType } from "../danger_run"

describe("for ping", () => {
  it("returns an action when ping is in the rules", () => {
    const rules = { ping: "dangerfile.js" }
    expect(dangerRunForRules("ping", null, rules, {})).toEqual([
      {
        action: null,
        branch: "master",
        dangerfilePath: "dangerfile.js",
        dslType: RunType.import,
        event: "ping",
        feedback: RunFeedback.silent,
        referenceString: "dangerfile.js",
        repoSlug: undefined,
      },
    ])
  })

  it("returns nothing when ping is not in the rules", () => {
    const rules = {}
    expect(dangerRunForRules("ping", null, rules, {})).toEqual([])
  })
})

describe("for PRs", () => {
  it("returns a PR when PR is in the rules", () => {
    const rules = { pull_request: "dangerfile.js" }
    expect(dangerRunForRules("pull_request", "created", rules, {})).toEqual([
      {
        action: "created",
        branch: "master",
        dangerfilePath: "dangerfile.js",
        dslType: RunType.pr,
        event: "pull_request",
        feedback: RunFeedback.commentable,
        referenceString: "dangerfile.js",
        repoSlug: undefined,
      },
    ])
  })

  it("returns two events when rule contains two files", () => {
    const rules = { pull_request: ["dangerfile.js", "anotherdangerfile.ts"] }
    expect(dangerRunForRules("pull_request", "created", rules, {}).map(r => r.dangerfilePath)).toEqual([
      "dangerfile.js",
      "anotherdangerfile.ts",
    ])
  })

  // Same semantics
  it("returns a PR run when all sub events are globbed in the rules", () => {
    const rules = { "pull_request.*": "dangerfile.js" }
    expect(dangerRunForRules("pull_request", "updated", rules, {})).toEqual([
      {
        action: "updated",
        branch: "master",
        dangerfilePath: "dangerfile.js",
        dslType: RunType.pr,
        event: "pull_request",
        feedback: RunFeedback.commentable,
        referenceString: "dangerfile.js",
        repoSlug: undefined,
      },
    ])
  })

  it("returns null when you only ask for a specific action", () => {
    const rules = { "pull_request.created": "dangerfile.js" }
    expect(dangerRunForRules("pull_request", "updated", rules, {})).toEqual([])
  })

  it("returns a PR run when event contains action suffix", () => {
    const rules = { "pull_request.deleted": "dangerfile.js" }
    expect(dangerRunForRules("pull_request", "deleted", rules, {})).toEqual([
      {
        action: "deleted",
        branch: "master",
        dangerfilePath: "dangerfile.js",
        dslType: RunType.pr,
        event: "pull_request",
        feedback: RunFeedback.commentable,
        referenceString: "dangerfile.js",
        repoSlug: undefined,
      },
    ])
  })

  it("returns many runs when there are mutliple potential matches", () => {
    const rules = {
      issue: "dangerfile.js",
      pull_request: "dangerfile.js",
      "pull_request.*": "dangerfile.js",
      "pull_request.updated": "dangerfile.js",
    }
    expect(dangerRunForRules("pull_request", "updated", rules, {}).length).toEqual(3)
  })

  it("returns a PR when multiple rules are declared inline", () => {
    const rules = {
      "issue, pull_request": "dangerfile.js",
    }
    expect(dangerRunForRules("pull_request", "created", rules, {})).toEqual([
      {
        action: "created",
        branch: "master",
        dangerfilePath: "dangerfile.js",
        dslType: RunType.pr,
        event: "pull_request",
        feedback: RunFeedback.commentable,
        referenceString: "dangerfile.js",
        repoSlug: undefined,
      },
    ])
  })

  it("returns null when no multi inline rules match", () => {
    const rules = {
      "issue.created, pull_request.closed": "dangerfile.js",
    }
    expect(dangerRunForRules("pull_request", "created", rules, {})).toEqual([])
  })

  it("returns a PR when PR is in the rules and there are multi inline rules", () => {
    const rules = {
      "issue.created, issue.closed": "dangerfile.js",
      pull_request: "dangerfile.js",
    }
    expect(dangerRunForRules("pull_request", "created", rules, {})).toEqual([
      {
        action: "created",
        branch: "master",
        dangerfilePath: "dangerfile.js",
        dslType: RunType.pr,
        event: "pull_request",
        feedback: RunFeedback.commentable,
        referenceString: "dangerfile.js",
        repoSlug: undefined,
      },
    ])
  })

  it("returns one run when there are many potential matches with inline rules", () => {
    const rules = {
      issue: "dangerfile.js",
      "pull_request, pull_request.*, pull_request.updated": "dangerfile.js",
    }
    expect(dangerRunForRules("pull_request", "updated", rules, {}).length).toEqual(1)
  })

  describe("webhook checking", () => {
    it("handles inline rules", () => {
      const rules = {
        "pull_request (hello == true)": "dangerfile.js",
      }
      expect(dangerRunForRules("pull_request", "updated", rules, { hello: true }).length).toEqual(1)
    })

    it("handles inline number rules", () => {
      const rules = {
        "pull_request (doggos.count == 3)": "dangerfile.js",
      }
      expect(dangerRunForRules("pull_request", "updated", rules, { doggos: { count: 3 } }).length).toEqual(1)
    })

    it("handles inline string rules", () => {
      const rules = {
        "pull_request (doggos.name == murphy)": "dangerfile.js",
      }
      expect(dangerRunForRules("pull_request", "updated", rules, { doggos: { name: "murphy" } }).length).toEqual(1)
    })

    it("skips when there's no inline match", () => {
      const rules = {
        "pull_request (doggos.name == little man)": "dangerfile.js",
      }
      expect(dangerRunForRules("pull_request", "updated", rules, { doggos: { name: "murphy" } }).length).toEqual(0)
    })
  })
})

describe("dangerRepresentationforPath", () => {
  it("returns just the path with master and no repo with just a path", () => {
    const path = "dangerfile.ts"
    expect(dangerRepresentationForPath(path)).toEqual({
      branch: "master",
      dangerfilePath: "dangerfile.ts",
      referenceString: "dangerfile.ts",
      repoSlug: undefined,
    })
  })

  it("returns the path and repo", () => {
    const path = "orta/eigen@dangerfile.ts"
    expect(dangerRepresentationForPath(path)).toEqual({
      branch: "master",
      dangerfilePath: "dangerfile.ts",
      referenceString: "orta/eigen@dangerfile.ts",
      repoSlug: "orta/eigen",
    })
  })

  it("returns just the path when there is no repo reference", () => {
    const path = "orta/eigen@dangerfile.ts#branch"
    expect(dangerRepresentationForPath(path)).toEqual({
      branch: "branch",
      dangerfilePath: "dangerfile.ts",
      referenceString: "orta/eigen@dangerfile.ts#branch",
      repoSlug: "orta/eigen",
    })
  })

  it("handles a branch with no repo ref", () => {
    const path = "dangerfile.ts#branch"
    expect(dangerRepresentationForPath(path)).toEqual({
      branch: "branch",
      dangerfilePath: "dangerfile.ts",
      referenceString: "dangerfile.ts#branch",
      repoSlug: undefined,
    })
  })
})

describe("dslTypeForEvent", () => {
  it("recommends importing the integration as the DSL for anything but a PR", () => {
    expect(dslTypeForEvent("ping")).toEqual(RunType.import)
    expect(dslTypeForEvent("issue")).toEqual(RunType.import)
    expect(dslTypeForEvent("user")).toEqual(RunType.import)
  })

  it("recommends creating the Dangerfile DSL for a pull request", () => {
    expect(dslTypeForEvent("pull_request")).toEqual(RunType.pr)
  })
})

import { GitHubInstallation } from "../db/index"

const emptyInstallation: GitHubInstallation = {
  iID: 123,
  login: "",
  avatarURL: "",
  repos: {},
  rules: {},
  scheduler: {},
  settings: {
    env_vars: [],
    ignored_repos: [],
    modules: [],
  },
  tasks: {},
  perilSettingsJSONURL: "",
}

/** Creates an installation from a blank template */
const generateInstallation = (diff: Partial<GitHubInstallation>): GitHubInstallation =>
  Object.assign({}, emptyInstallation, diff)

export default generateInstallation

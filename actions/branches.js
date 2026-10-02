/**
 * Canonical Git branch targets for Trailhead → aramark-mb operations.
 *
 * All inventory, scaffold, publish, and remove flows use staging.
 * (Brand overlay dirs like brands/{slug}-dev/ are EDS env folders, not Git branches.)
 */

const DEFAULT_GIT_BRANCH = 'staging'

module.exports = {
  DEFAULT_GIT_BRANCH,
  /** Branch used when listing brands/ from GitHub */
  INVENTORY_BRANCH: DEFAULT_GIT_BRANCH,
  /** Base/target branch for create-site PRs */
  SCAFFOLD_BRANCH: DEFAULT_GIT_BRANCH,
  /** Base/target branch for publish-tokens release PRs */
  RELEASE_BRANCH: DEFAULT_GIT_BRANCH,
  /** Branch for remove-brand index updates */
  REMOVE_BRANCH: DEFAULT_GIT_BRANCH
}

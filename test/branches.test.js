const {
  DEFAULT_GIT_BRANCH,
  INVENTORY_BRANCH,
  SCAFFOLD_BRANCH,
  RELEASE_BRANCH,
  REMOVE_BRANCH
} = require('../actions/branches')

describe('branch defaults', () => {
  test('all Trailhead Git operations default to staging', () => {
    expect(DEFAULT_GIT_BRANCH).toBe('staging')
    expect(INVENTORY_BRANCH).toBe('staging')
    expect(SCAFFOLD_BRANCH).toBe('staging')
    expect(RELEASE_BRANCH).toBe('staging')
    expect(REMOVE_BRANCH).toBe('staging')
  })
})

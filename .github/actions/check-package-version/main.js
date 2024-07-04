const core = require('@actions/core')
const fs = require('fs')

const TAGS_REF_PREFIX = 'refs/tags/'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
async function run() {
  try {
    const ref = process.env.GITHUB_REF
    if (!ref.startsWith(TAGS_REF_PREFIX)) {
      throw new Error('Current commit is not tagged in git')
    }

    const packagePath = core.getInput('package-path')
    const packageText = fs.readFileSync(packagePath, 'utf8')
    const packageJson = JSON.parse(packageText)
    const { version: packageVersion } = packageJson

    const tagPrefix = core.getInput('tag-prefix')

    const expectedRef = `${TAGS_REF_PREFIX}${tagPrefix}${packageVersion}`

    if (ref !== expectedRef) {
      throw new Error(`Git tag (${ref}) does not match package.json version (expected ${expectedRef})`)
    }

    core.setOutput('package-version', packageVersion)
    core.setOutput('tag-version', ref.substring(TAGS_REF_PREFIX.length))
  } catch (error) {
    core.setFailed(error.message)
  }
}

module.exports = {
  run
}

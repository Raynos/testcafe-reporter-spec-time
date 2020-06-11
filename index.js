exports.default = createReporter
module.exports = createReporter

function createReporter () {
  let fixtureStartTime = -1
  const reporterCreatedTime = Date.now()

  return {
    noColors: false,
    startTime: null,
    afterErrorList: false,
    testCount: 0,
    skipped: 0,
    currentFixtureName: null,
    timings: Object.create(null),

    reportTaskStart (startTime, userAgents, testCount) {
      this.startTime = startTime
      this.testCount = testCount

      this.setIndent(1)
        .useWordWrap(true)
        .write(this.chalk.bold('Running tests in:'))
        .newline()

      userAgents.forEach(ua => {
        this
          .write(`- ${this.chalk.blue(ua)}`)
          .newline()
      })

      this.setIndent(1)
        .write(this.chalk.grey(
          `Startup time (${this.fmtTime(startTime - reporterCreatedTime)})`
        ))
        .newline()
    },

    reportFixtureStart (name) {
      if (this.afterErrorList) {
        this.afterErrorList = false
      } else {
        this.newline()
      }

      if (this.currentFixtureName !== null) {
        const duration = Date.now() - fixtureStartTime
        this.setIndent(1)
          .write(this.chalk.grey(
            `${this.currentFixtureName} Duration (${this.fmtTime(duration)})`
          ))
          .newline()
      }
      fixtureStartTime = Date.now()

      this.currentFixtureName = name
      this.setIndent(1)
        .useWordWrap(true)

      this.write(name)
        .newline()
    },

    _renderErrors (errs) {
      this.setIndent(3)
        .newline()

      errs.forEach((err, idx) => {
        var prefix = this.chalk.red(`${idx + 1}) `)

        this.newline()
          .write(this.formatError(err, prefix))
          .newline()
          .newline()
      })
    },

    reportTestStart (name, meta) {
      const key = this.currentFixtureName + ' ' + name
      this.timings[key] = Date.now()
    },

    reportTestDone (name, testRunInfo) {
      var hasErr = !!testRunInfo.errs.length
      var symbol = null
      var nameStyle = null

      if (testRunInfo.skipped) {
        this.skipped++

        symbol = this.chalk.cyan('-')
        nameStyle = this.chalk.cyan
      } else if (hasErr) {
        symbol = this.chalk.red.bold(this.symbols.err)
        nameStyle = this.chalk.red.bold
      } else {
        symbol = this.chalk.green(this.symbols.ok)
        nameStyle = this.chalk.grey
      }

      var title = `${symbol} ${nameStyle(name)}`

      this.setIndent(1)
        .useWordWrap(true)

      if (testRunInfo.unstable) {
        title += this.chalk.yellow(' (unstable)')
      }

      if (testRunInfo.screenshotPath) {
        const screen = this.chalk.underline.grey(testRunInfo.screenshotPath)
        title += ` (screenshots: ${screen})`
      }

      const key = this.currentFixtureName + ' ' + name
      const duration = Date.now() - this.timings[key]
      this.write(title)
      this.write(' ' + this.chalk.grey('(' + this.fmtTime(duration) + ')'))

      if (hasErr) {
        this._renderErrors(testRunInfo.errs)
      }

      this.afterErrorList = hasErr

      this.newline()
    },

    _renderWarnings (warnings) {
      this.newline()
        .setIndent(1)
        .write(this.chalk.bold.yellow(`Warnings (${warnings.length}):`))
        .newline()

      warnings.forEach(msg => {
        this.setIndent(1)
          .write(this.chalk.bold.yellow('--'))
          .newline()
          .setIndent(2)
          .write(msg)
          .newline()
      })
    },

    reportTaskDone (endTime, passed, warnings) {
      var durationMs = endTime - this.startTime
      var durationStr = this.fmtTime(durationMs)
      var footer = passed === this.testCount
        ? this.chalk.bold.green(`${this.testCount} passed`)
        : this.chalk.bold.red(`${this.testCount - passed}/${this.testCount} failed`)

      footer += this.chalk.grey(` (${durationStr})`)

      if (!this.afterErrorList) {
        this.newline()
      }

      if (this.currentFixtureName !== null) {
        const duration = Date.now() - fixtureStartTime
        this.setIndent(1)
          .write(this.chalk.grey(
            `${this.currentFixtureName} Duration (${this.fmtTime(duration)})`
          ))
          .newline()
      }

      this.setIndent(1)
        .useWordWrap(true)

      this.newline()
        .write(footer)
        .newline()

      if (this.skipped > 0) {
        this.write(this.chalk.cyan(`${this.skipped} skipped`))
          .newline()
      }

      if (warnings.length) {
        this._renderWarnings(warnings)
      }

      this.write(this.chalk.grey(
        `Total time (${this.fmtTime(Date.now() - reporterCreatedTime)})`
      )).newline()
    },

    fmtTime (duration) {
      if (duration < 10 * 1000) {
        const seconds = duration / 1000
        return seconds.toFixed(2) + 's'
      }

      return this.moment.duration(duration).format('h[h] mm[m] ss[s]')
    }
  }
}

import { Command } from 'commander'
import ora from 'ora'
import chalk from 'chalk'
import { getCliContainer } from '../container.js'

export const reportCommand = new Command('report')
  .description('Generate a daily brain report')
  .option('--date <YYYY-MM-DD>', 'generate report for a specific date')
  .option('--preview', 'print report to stdout instead of saving')
  .action(async (opts) => {
    const { reportGenerator, pipeline } = getCliContainer()
    const date = opts.date ? new Date(opts.date) : undefined
    const spinner = ora('Generating daily report...').start()

    try {
      const result = await reportGenerator.generate(date)

      if (opts.preview) {
        spinner.stop()
        console.log(result.content)
      } else {
        spinner.succeed(chalk.green(`Report saved to ${chalk.cyan(result.reportPath)}`))
        console.log(chalk.dim(`Included ${result.documentsIncluded} notes`))

        // Auto-ingest the report
        await pipeline.ingestFile(result.reportPath).catch(() => {})
      }
    } catch (err) {
      spinner.fail(chalk.red(`Failed: ${err}`))
      process.exit(1)
    }
  })

import 'dotenv/config'
import { Command } from 'commander'
import { addCommand } from './commands/add.js'
import { searchCommand } from './commands/search.js'
import { askCommand } from './commands/ask.js'
import { watchCommand } from './commands/watch.js'
import { reportCommand } from './commands/report.js'
import { listCommand } from './commands/list.js'
import { statusCommand } from './commands/status.js'
import { serveCommand } from './commands/serve.js'

const program = new Command()

program
  .name('aipks')
  .description('AI Personal Knowledge System — your second brain in the terminal')
  .version('0.1.0')

program.addCommand(addCommand)
program.addCommand(searchCommand)
program.addCommand(askCommand)
program.addCommand(watchCommand)
program.addCommand(reportCommand)
program.addCommand(listCommand)
program.addCommand(statusCommand)
program.addCommand(serveCommand)

program.parseAsync(process.argv)

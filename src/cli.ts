#!/usr/bin/env node

import { log } from 'node:console'
import { argv } from 'node:process'
import { NightLight } from './nightlight.js'

async function main() {
  if (argv.includes('help')) return printHelp()
  if (argv.includes('version')) return log('1.0')
  const nightlight = new NightLight()
  if (argv.includes('on')) return nightlight.enable()
  if (argv.includes('off')) return nightlight.disable()
  if (argv.includes('toggle')) return nightlight.toggle()
  if (argv.includes('status'))
    return (await nightlight.enabled()) ? log('on') : log('off')
  return printHelp()
}

function printHelp(): void {
  console.log('Usage: nightlight [subcommand]')
  console.log('nightlight help')
  console.log('nightlight version')
  console.log('nightlight on')
  console.log('nightlight off')
  console.log('nightlight toggle')
  console.log('nightlight status')
}

main()

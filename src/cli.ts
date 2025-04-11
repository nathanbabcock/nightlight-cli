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
  
  // Handle strength commands
  const strengthIndex = argv.indexOf('strength')
  if (strengthIndex !== -1) {
    // Get current strength if no percentage provided
    if (strengthIndex === argv.length - 1) {
      const strength = await nightlight.getStrength()
      return log(`${Math.round(strength)}%`)
    }
    
    // Set strength if percentage provided
    const percentage = parseInt(argv[strengthIndex + 1])
    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      log('Error: Strength must be a number between 0 and 100')
      return printHelp()
    }
    return nightlight.setStrength(percentage)
  }

  return printHelp()
}

function printHelp(): void {
  console.log('Usage: nightlight [subcommand]')
  console.log('nightlight help            Show this help message')
  console.log('nightlight version         Show version number')
  console.log('nightlight on              Turn on Night Light')
  console.log('nightlight off             Turn off Night Light')
  console.log('nightlight toggle          Toggle Night Light on/off')
  console.log('nightlight status          Show current Night Light status')
  console.log('nightlight strength        Show current strength percentage')
  console.log('nightlight strength <0-100> Set strength percentage (0=coolest, 100=warmest)')
}

main()

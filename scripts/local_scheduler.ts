import { spawn } from 'child_process'
import { join } from 'path'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'

const LOGS_DIR = join(process.cwd(), 'logs')
const STATE_FILE = join(LOGS_DIR, 'scheduler-state.json')

interface Task {
  name: string
  script: string
  args: string[]
  scheduledHour: number // Hour of day (0-23) to run
}

const TASKS: Task[] = [
  {
    name: 'world-ingest',
    script: 'scripts/ingest_daemon.ts',
    args: ['world-batch', '5'],
    scheduledHour: 3 // 3:00 AM
  },
  {
    name: 'auto-crosser',
    script: 'scripts/auto_crosser.ts',
    args: [],
    scheduledHour: 4 // 4:00 AM
  },
  {
    name: 'sentinel',
    script: 'scripts/agents/sentinel_daemon.ts',
    args: [],
    scheduledHour: 8 // 8:00 AM
  }
]

interface State {
  lastRun: Record<string, string> // taskName -> YYYY-MM-DD
}

function loadState(): State {
  if (existsSync(STATE_FILE)) {
    try {
      return JSON.parse(readFileSync(STATE_FILE, 'utf-8'))
    } catch {
      // Ignore parse error
    }
  }
  return { lastRun: {} }
}

function saveState(state: State) {
  if (!existsSync(LOGS_DIR)) {
    mkdirSync(LOGS_DIR, { recursive: true })
  }
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8')
}

function getTodayString(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function runTask(task: Task) {
  console.log(`[Scheduler] ⏳ Starting task: ${task.name} (${task.script} ${task.args.join(' ')})`)
  
  const logFile = join(LOGS_DIR, `${task.name}.log`)
  const errFile = join(LOGS_DIR, `${task.name}.err`)
  
  const fs = require('fs')
  const out = fs.openSync(logFile, 'a')
  const err = fs.openSync(errFile, 'a')
  
  fs.writeSync(out, `\n=== Task ${task.name} started at ${new Date().toISOString()} ===\n`)
  fs.writeSync(err, `\n=== Task ${task.name} started at ${new Date().toISOString()} ===\n`)
  
  const child = spawn('npx', ['tsx', task.script, ...task.args], {
    detached: true,
    stdio: ['ignore', out, err]
  })
  
  child.unref()
  
  // Update state
  const state = loadState()
  state.lastRun[task.name] = getTodayString()
  saveState(state)
  
  console.log(`[Scheduler] 🚀 Task ${task.name} spawned in background. Logs: logs/${task.name}.log`)
}

function checkAndRunTasks() {
  const state = loadState()
  const today = getTodayString()
  const currentHour = new Date().getHours()
  
  console.log(`[Scheduler] Running check at ${new Date().toLocaleString('fr-FR')} (Current hour: ${currentHour})`)
  
  for (const task of TASKS) {
    const lastRunDate = state.lastRun[task.name]
    
    // Task is due if it hasn't run today, AND either:
    // 1. It has never run
    // 2. The last run was on a previous day, and we are either past the scheduled hour OR the last run was more than 24 hours ago (meaning we missed yesterday's run)
    const hasNeverRun = !lastRunDate
    const isDifferentDay = lastRunDate !== today
    
    if (hasNeverRun || (isDifferentDay && currentHour >= task.scheduledHour)) {
      runTask(task)
    } else {
      console.log(`[Scheduler] ✓ Task ${task.name} is up to date (Last run: ${lastRunDate || 'Never'})`)
    }
  }
}

// Ensure logs directory exists
if (!existsSync(LOGS_DIR)) {
  mkdirSync(LOGS_DIR, { recursive: true })
}

console.log('[Scheduler] Starting local background scheduler daemon...')
checkAndRunTasks()

// Check every 30 minutes
setInterval(checkAndRunTasks, 30 * 60 * 1000)

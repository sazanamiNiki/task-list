import { readFileSync, writeFileSync, existsSync, renameSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Task, TaskStatus, SessionTasks } from '../types.js';

// このファイルの場所から絶対パスを取得
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// プロジェクトルートは dist/mcp から2階層上
const PROJECT_ROOT = join(__dirname, '../..');
const TASKS_FILE = join(PROJECT_ROOT, 'tasks.json');
const BACKUP_FILE = join(PROJECT_ROOT, 'tasks.json.backup');

// デバッグログ（stderrに出力）
console.error('[DEBUG] PROJECT_ROOT:', PROJECT_ROOT);
console.error('[DEBUG] TASKS_FILE:', TASKS_FILE);

export function readSessionTasks(): SessionTasks {
  if (!existsSync(TASKS_FILE)) {
    return {};
  }

  const content = readFileSync(TASKS_FILE, 'utf-8');
  const parsed = JSON.parse(content);

  if (Array.isArray(parsed)) {
    writeFileSync(BACKUP_FILE, content, 'utf-8');
    const migrated: SessionTasks = { default: parsed };
    writeSessionTasks(migrated);
    return migrated;
  }

  return parsed as SessionTasks;
}

export function writeSessionTasks(data: SessionTasks): void {
  const tempFile = `${TASKS_FILE}.tmp`;
  writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
  renameSync(tempFile, TASKS_FILE);
}

export function addTasks(sessionId: string, titles: string[]): Task[] {
  const allSessions = readSessionTasks();
  const sessionTasks = allSessions[sessionId] || [];

  const maxId = sessionTasks.length > 0
    ? Math.max(...sessionTasks.map(t => t.id))
    : 0;

  const newTasks: Task[] = titles.map((title, index) => ({
    id: maxId + index + 1,
    title,
    status: 'pending' as TaskStatus,
  }));

  allSessions[sessionId] = [...sessionTasks, ...newTasks];
  writeSessionTasks(allSessions);

  return newTasks;
}

export function updateTask(sessionId: string, id: number, status: TaskStatus): Task | null {
  const allSessions = readSessionTasks();
  const sessionTasks = allSessions[sessionId];

  if (!sessionTasks) {
    return null;
  }

  const taskIndex = sessionTasks.findIndex(t => t.id === id);
  if (taskIndex === -1) {
    return null;
  }

  sessionTasks[taskIndex].status = status;
  writeSessionTasks(allSessions);

  return sessionTasks[taskIndex];
}

export function clearTasks(sessionId: string, clearAll: boolean): number {
  const allSessions = readSessionTasks();
  const sessionTasks = allSessions[sessionId];

  if (!sessionTasks) {
    return 0;
  }

  if (clearAll) {
    const count = sessionTasks.length;
    allSessions[sessionId] = [];
    writeSessionTasks(allSessions);
    return count;
  } else {
    const beforeCount = sessionTasks.length;
    allSessions[sessionId] = sessionTasks.filter(t => t.status !== 'done');
    const afterCount = allSessions[sessionId].length;
    writeSessionTasks(allSessions);
    return beforeCount - afterCount;
  }
}

import { readFileSync, writeFileSync, existsSync, renameSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import lockfile from 'proper-lockfile';
import { Task, TaskStatus, SessionTasks } from '../types.js';

// このファイルの場所から絶対パスを取得
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// プロジェクトルートは dist/mcp から2階層上
const PROJECT_ROOT = join(__dirname, '../..');
const TASKS_FILE = join(PROJECT_ROOT, 'tasks.json');
const BACKUP_FILE = join(PROJECT_ROOT, 'tasks.json.backup');

// ロック設定
const LOCK_OPTIONS = {
  retries: {
    retries: 10,        // 最大10回リトライ
    minTimeout: 50,     // 最小待機時間: 50ms
    maxTimeout: 1000,   // 最大待機時間: 1秒
  },
  stale: 10000,         // 10秒経過したロックは古いとみなす
};

// デバッグログ（stderrに出力）
console.error('[DEBUG] PROJECT_ROOT:', PROJECT_ROOT);
console.error('[DEBUG] TASKS_FILE:', TASKS_FILE);

/**
 * ファイルロックを取得して処理を実行する汎用関数
 */
async function withLock<T>(fn: () => T): Promise<T> {
  // tasks.jsonが存在しない場合は空オブジェクトで初期化
  if (!existsSync(TASKS_FILE)) {
    writeFileSync(TASKS_FILE, '{}', 'utf-8');
  }

  let release: (() => Promise<void>) | null = null;

  try {
    // ロックを取得
    release = await lockfile.lock(TASKS_FILE, LOCK_OPTIONS);

    // 処理を実行
    const result = fn();

    return result;
  } finally {
    // ロックを解放
    if (release) {
      await release();
    }
  }
}

/**
 * ロックなしでファイルを読み込む内部関数
 */
function readSessionTasksUnsafe(): SessionTasks {
  if (!existsSync(TASKS_FILE)) {
    return {};
  }

  const content = readFileSync(TASKS_FILE, 'utf-8');
  const parsed = JSON.parse(content);

  if (Array.isArray(parsed)) {
    writeFileSync(BACKUP_FILE, content, 'utf-8');
    const migrated: SessionTasks = { default: parsed };
    writeSessionTasksUnsafe(migrated);
    return migrated;
  }

  return parsed as SessionTasks;
}

/**
 * ロックなしでファイルに書き込む内部関数
 */
function writeSessionTasksUnsafe(data: SessionTasks): void {
  const tempFile = `${TASKS_FILE}.tmp`;
  writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
  renameSync(tempFile, TASKS_FILE);
}

/**
 * セッションタスクを読み込む（ロック付き）
 */
export async function readSessionTasks(): Promise<SessionTasks> {
  return withLock(() => readSessionTasksUnsafe());
}

/**
 * セッションタスクを書き込む（ロック付き）
 */
export async function writeSessionTasks(data: SessionTasks): Promise<void> {
  return withLock(() => writeSessionTasksUnsafe(data));
}

export async function addTasks(sessionId: string, titles: string[]): Promise<Task[]> {
  return withLock(() => {
    const allSessions = readSessionTasksUnsafe();
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
    writeSessionTasksUnsafe(allSessions);

    return newTasks;
  });
}

export async function updateTask(sessionId: string, id: number, status: TaskStatus): Promise<Task | null> {
  return withLock(() => {
    const allSessions = readSessionTasksUnsafe();
    const sessionTasks = allSessions[sessionId];

    if (!sessionTasks) {
      return null;
    }

    const taskIndex = sessionTasks.findIndex(t => t.id === id);
    if (taskIndex === -1) {
      return null;
    }

    sessionTasks[taskIndex].status = status;
    writeSessionTasksUnsafe(allSessions);

    return sessionTasks[taskIndex];
  });
}

export async function clearTasks(sessionId: string, clearAll: boolean): Promise<number> {
  return withLock(() => {
    const allSessions = readSessionTasksUnsafe();
    const sessionTasks = allSessions[sessionId];

    if (!sessionTasks) {
      return 0;
    }

    if (clearAll) {
      const count = sessionTasks.length;
      allSessions[sessionId] = [];
      writeSessionTasksUnsafe(allSessions);
      return count;
    } else {
      const beforeCount = sessionTasks.length;
      allSessions[sessionId] = sessionTasks.filter(t => t.status !== 'done');
      const afterCount = allSessions[sessionId].length;
      writeSessionTasksUnsafe(allSessions);
      return beforeCount - afterCount;
    }
  });
}

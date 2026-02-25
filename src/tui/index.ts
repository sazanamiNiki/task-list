#!/usr/bin/env node
import blessed from 'blessed';
import chokidar from 'chokidar';
import { readFileSync, existsSync, writeFileSync } from 'fs';
import { Task, Config, SessionTasks } from '../types.js';

const TASKS_FILE = 'tasks.json';
const CONFIG_FILE = 'config.json';
const BACKUP_FILE = 'tasks.json.backup';
const SESSION_ID = process.env.SESSION || 'default';

const DEFAULT_CONFIG: Config = {
  statusDisplay: {
    pending: {
      icon: '◯',
      iconColor: 'gray',
      textColor: 'gray',
      strikethrough: false,
      useSpinner: false,
    },
    in_progress: {
      icon: '',
      iconColor: 'yellow',
      textColor: 'white',
      strikethrough: false,
      useSpinner: true,
    },
    check: {
      icon: '👀',
      iconColor: 'magenta',
      textColor: 'magenta',
      strikethrough: false,
      useSpinner: false,
    },
    done: {
      icon: '✔',
      iconColor: 'green',
      textColor: 'gray',
      strikethrough: true,
      useSpinner: false,
    },
    error: {
      icon: '✖',
      iconColor: 'red',
      textColor: 'red',
      strikethrough: false,
      useSpinner: false,
    },
  },
};

const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

const screen = blessed.screen({
  smartCSR: true,
  title: 'Task Manager',
  fullUnicode: true,
  autoPadding: true,
});

const mainBox = blessed.box({
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  border: {
    type: 'line',
  },
  style: {
    border: {
      fg: 'cyan',
    },
  },
  tags: true,
});

const titleText = blessed.text({
  top: 0,
  left: 2,
  content: `{cyan-fg}{bold}⚡ Task Manager [${SESSION_ID}]{/bold}{/cyan-fg}`,
  tags: true,
});

const indicatorText = blessed.text({
  top: 1,
  left: 5,
  content: '',
  tags: true,
});

const errorText = blessed.text({
  top: 2,
  left: 2,
  content: '',
  tags: true,
  style: {
    fg: 'red',
  },
});

screen.append(mainBox);
mainBox.append(titleText);
mainBox.append(indicatorText);
mainBox.append(errorText);

let tasks: Task[] = [];
let config: Config = DEFAULT_CONFIG;
let spinnerFrame = 0;
let errorMessage: string | null = null;
let errorTimeout: NodeJS.Timeout | null = null;
let taskElements: blessed.Widgets.BlessedElement[] = [];

function showError(message: string) {
  errorMessage = message;
  if (errorTimeout) {
    clearTimeout(errorTimeout);
  }
  errorTimeout = setTimeout(() => {
    errorMessage = null;
    render();
  }, 3000);
  render();
}

// 文字列の表示幅を計算（全角文字は2幅、半角は1幅）
function getStringWidth(str: string): number {
  let width = 0;
  for (const char of str) {
    const code = char.charCodeAt(0);
    // 全角文字の判定（簡易版）
    if (
      (code >= 0x3000 && code <= 0x9FFF) || // CJK統合漢字など
      (code >= 0xFF00 && code <= 0xFFEF) || // 全角英数字
      (code >= 0xAC00 && code <= 0xD7AF)    // ハングル
    ) {
      width += 2;
    } else {
      width += 1;
    }
  }
  return width;
}

// 指定した表示幅に収まるように文字列を切り詰める
function truncateString(str: string, maxWidth: number): string {
  let width = 0;
  let result = '';

  for (const char of str) {
    const charWidth = getStringWidth(char);
    if (width + charWidth > maxWidth - 3) { // "..."の分を確保
      return result + '...';
    }
    result += char;
    width += charWidth;
  }

  return result;
}

let configContent = '';
function loadConfig() {
  try {
    if (!existsSync(CONFIG_FILE)) {
      const defaultConfigStr = JSON.stringify(DEFAULT_CONFIG);
      if (configContent !== defaultConfigStr) {
        config = DEFAULT_CONFIG;
        configContent = defaultConfigStr;
      }
      return;
    }

    const content = readFileSync(CONFIG_FILE, 'utf-8');
    if (configContent === content) {
      return;
    }

    const parsedConfig = JSON.parse(content) as Config;
    config = parsedConfig;
    configContent = content;
  } catch (error) {
    const defaultConfigStr = JSON.stringify(DEFAULT_CONFIG);
    if (configContent !== defaultConfigStr) {
      config = DEFAULT_CONFIG;
      configContent = defaultConfigStr;
    }
    if (error instanceof Error) {
      showError(`Config error: ${error.message}`);
    }
  }
}

let tasksContent = '';
function loadTasks() {
  try {
    if (!existsSync(TASKS_FILE)) {
      const emptyContent = '{}';
      if (tasksContent !== emptyContent) {
        tasks = [];
        tasksContent = emptyContent;
        render();
      }
      return;
    }

    const content = readFileSync(TASKS_FILE, 'utf-8');

    if (tasksContent === content) {
      return;
    }

    const parsedData = JSON.parse(content);

    if (Array.isArray(parsedData)) {
      writeFileSync(BACKUP_FILE, content, 'utf-8');
      const migrated: SessionTasks = { default: parsedData };
      writeFileSync(TASKS_FILE, JSON.stringify(migrated, null, 2), 'utf-8');
      tasks = SESSION_ID === 'default' ? parsedData : [];
      tasksContent = JSON.stringify(migrated, null, 2);
      render();
      return;
    }

    const sessionTasks = parsedData as SessionTasks;
    tasks = sessionTasks[SESSION_ID] || [];
    tasksContent = content;
    render();
  } catch (error) {
    return;
  }
}

function render() {
  taskElements.forEach((el) => el.destroy());
  taskElements = [];

  // 画面の高さを取得（枠とタイトル分を引く、インジケーター行も考慮）
  const availableHeight = (mainBox.height as number) - 5;

  // 未完了タスクと完了タスクに分ける
  const incompleteTasks = tasks.filter((t) => t.status !== 'done');
  const completedTasks = tasks.filter((t) => t.status === 'done');

  // スクロールインジケーターを2行目に表示
  if (tasks.length > 0 && tasks.length > availableHeight) {
    const displayCount = Math.min(incompleteTasks.length, availableHeight) +
      Math.max(0, availableHeight - incompleteTasks.length);
    const hiddenCompleted = Math.max(0, completedTasks.length - (availableHeight - incompleteTasks.length));
    indicatorText.setContent(`{gray-fg}[Showing: ${displayCount}/${tasks.length}${hiddenCompleted > 0 ? `, ${hiddenCompleted} done hidden` : ''}]{/gray-fg}`);
  } else {
    indicatorText.setContent('');
  }

  if (errorMessage) {
    errorText.setContent(`{red-fg}${errorMessage}{/red-fg}`);
  } else {
    errorText.setContent('');
  }

  if (tasks.length === 0) {
    const noTasksText = blessed.text({
      top: 3,
      left: 2,
      content: '{gray-fg}No tasks{/gray-fg}',
      tags: true,
    });
    mainBox.append(noTasksText);
    taskElements.push(noTasksText);
  } else {

    // 未完了タスクを優先度順に並び替え
    incompleteTasks.sort((a, b) => {
      const statusOrder: Record<string, number> = {
        pending: 0,
        in_progress: 1,
        check: 2,
        error: 3
      };
      return (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
    });

    // 表示するタスクを決定
    let displayTasks: Task[] = [];

    if (incompleteTasks.length >= availableHeight) {
      // 未完了タスクだけで画面が埋まる場合
      displayTasks = incompleteTasks.slice(0, availableHeight);
    } else {
      // 未完了タスクを全て表示し、残りのスペースに完了タスクを表示
      displayTasks = [...incompleteTasks];
      const remainingSpace = availableHeight - incompleteTasks.length;

      if (completedTasks.length > 0) {
        // 完了タスクが多い場合は、最新のものから表示（最後の完了から逆順）
        const displayCompletedTasks = completedTasks.slice(-remainingSpace);
        displayTasks = [...displayTasks, ...displayCompletedTasks];
      }
    }

    displayTasks.forEach((task, index) => {
      const statusConfig = config.statusDisplay[task.status];
      const icon = statusConfig.useSpinner
        ? SPINNER_FRAMES[spinnerFrame]
        : statusConfig.icon;

      const taskBox = blessed.box({
        top: 3 + index,
        left: 2,
        height: 1,
        width: '100%-4',
        tags: true,
        overflow: 'hidden',
      });

      const iconText = blessed.text({
        left: 0,
        content: `{${statusConfig.iconColor}-fg}${icon}{/${statusConfig.iconColor}-fg}`,
        tags: true,
      });

      // 利用可能な幅を計算（画面幅 - 左マージン - アイコン領域 - 右マージン - 枠線）
      const screenWidth = (mainBox.width as number);
      const availableWidth = screenWidth - 4 - 4 - 4; // 左マージン(2) + アイコン領域(4) + 右マージン(2) + 枠線(2)

      // タイトルを切り詰める（全角文字を考慮）
      let displayTitle = task.title;
      const titleWidth = getStringWidth(displayTitle);
      if (titleWidth > availableWidth) {
        displayTitle = truncateString(displayTitle, availableWidth);
      }

      const titleContent = statusConfig.strikethrough
        ? `{${statusConfig.textColor}-fg}{strikethrough}${displayTitle}{/strikethrough}{/${statusConfig.textColor}-fg}`
        : `{${statusConfig.textColor}-fg}${displayTitle}{/${statusConfig.textColor}-fg}`;

      const taskTitle = blessed.text({
        left: 4,
        width: '100%-4',
        content: titleContent,
        tags: true,
        wrap: false,
      });

      taskBox.append(iconText);
      taskBox.append(taskTitle);
      mainBox.append(taskBox);
      taskElements.push(taskBox);
    });
  }

  screen.render();
}

loadConfig();
loadTasks();
render();

const taskWatcher = chokidar.watch(TASKS_FILE, {
  persistent: true,
  ignoreInitial: true,
  awaitWriteFinish: {
    stabilityThreshold: 200,
    pollInterval: 100,
  },
});

taskWatcher.on('change', loadTasks);
taskWatcher.on('add', loadTasks);

const configWatcher = chokidar.watch(CONFIG_FILE, {
  persistent: true,
  ignoreInitial: true,
  awaitWriteFinish: {
    stabilityThreshold: 200,
    pollInterval: 100,
  },
});

configWatcher.on('change', () => {
  loadConfig();
  render();
});
configWatcher.on('add', () => {
  loadConfig();
  render();
});

const spinnerInterval = setInterval(() => {
  spinnerFrame = (spinnerFrame + 1) % SPINNER_FRAMES.length;
  render();
}, 80);

screen.key(['escape', 'q', 'C-c'], () => {
  clearInterval(spinnerInterval);
  taskWatcher.close();
  configWatcher.close();
  if (errorTimeout) {
    clearTimeout(errorTimeout);
  }
  process.exit(0);
});

screen.render();

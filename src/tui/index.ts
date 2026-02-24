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

  if (errorMessage) {
    errorText.setContent(`{red-fg}${errorMessage}{/red-fg}`);
  } else {
    errorText.setContent('');
  }

  if (tasks.length === 0) {
    const noTasksText = blessed.text({
      top: 2,
      left: 2,
      content: '{gray-fg}No tasks{/gray-fg}',
      tags: true,
    });
    mainBox.append(noTasksText);
    taskElements.push(noTasksText);
  } else {
    tasks.forEach((task, index) => {
      const statusConfig = config.statusDisplay[task.status];
      const icon = statusConfig.useSpinner
        ? SPINNER_FRAMES[spinnerFrame]
        : statusConfig.icon;

      const taskBox = blessed.box({
        top: 2 + index,
        left: 2,
        height: 1,
        width: '100%-4',
        tags: true,
      });

      const iconText = blessed.text({
        left: 0,
        content: `{${statusConfig.iconColor}-fg}${icon}{/${statusConfig.iconColor}-fg}`,
        tags: true,
      });

      const titleContent = statusConfig.strikethrough
        ? `{${statusConfig.textColor}-fg}{strikethrough}${task.title}{/strikethrough}{/${statusConfig.textColor}-fg}`
        : `{${statusConfig.textColor}-fg}${task.title}{/${statusConfig.textColor}-fg}`;

      const taskTitle = blessed.text({
        left: 4,
        content: titleContent,
        tags: true,
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

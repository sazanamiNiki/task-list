export type TaskStatus = 'pending' | 'in_progress' | 'check' | 'done' | 'error';

export interface Task {
  id: number;
  title: string;
  status: TaskStatus;
}

export type SessionId = string;
export type SessionTasks = Record<SessionId, Task[]>;

export interface AddTasksArgs {
  sessionId: string;
  titles: string[];
}

export interface UpdateTaskArgs {
  sessionId: string;
  id: number;
  status: TaskStatus;
}

export interface ClearTasksArgs {
  sessionId: string;
  clearAll?: boolean;
}

export type InkColor = 'black' | 'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan' | 'white' | 'gray' | 'grey';

export interface StatusDisplayConfig {
  icon: string;
  iconColor: InkColor;
  textColor: InkColor;
  strikethrough: boolean;
  useSpinner: boolean;
}

export interface Config {
  statusDisplay: Record<TaskStatus, StatusDisplayConfig>;
}

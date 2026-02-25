import { z } from 'zod';
import { TaskStatus } from '../types.js';
import { addTasks, updateTask, clearTasks } from './storage.js';

const TaskStatusEnum = z.enum(['pending', 'in_progress', 'check', 'done', 'error']);

export const AddTasksSchema = z.object({
  sessionId: z.string(),
  titles: z.array(z.string()).min(1),
});

export const UpdateTaskSchema = z.object({
  sessionId: z.string(),
  id: z.number().positive(),
  status: TaskStatusEnum,
});

export const ClearTasksSchema = z.object({
  sessionId: z.string(),
  clearAll: z.boolean().optional().default(false),
});

export async function handleAddTasks(args: unknown) {
  const parsed = AddTasksSchema.parse(args);
  const newTasks = await addTasks(parsed.sessionId, parsed.titles);
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({ added: newTasks }, null, 2),
      },
    ],
  };
}

export async function handleUpdateTask(args: unknown) {
  const parsed = UpdateTaskSchema.parse(args);
  const updatedTask = await updateTask(parsed.sessionId, parsed.id, parsed.status as TaskStatus);

  if (!updatedTask) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: 'Task not found' }, null, 2),
        },
      ],
      isError: true,
    };
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({ updated: updatedTask }, null, 2),
      },
    ],
  };
}

export async function handleClearTasks(args: unknown) {
  const parsed = ClearTasksSchema.parse(args);
  const count = await clearTasks(parsed.sessionId, parsed.clearAll);
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({ deleted: count }, null, 2),
      },
    ],
  };
}

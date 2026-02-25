#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { handleAddTasks, handleUpdateTask, handleClearTasks } from './tools.js';

const server = new Server(
  {
    name: 'task-manager',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'add_tasks',
        description: 'Add multiple tasks to a session',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'The session ID',
            },
            titles: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of task titles',
              minItems: 1,
            },
          },
          required: ['sessionId', 'titles'],
        },
      },
      {
        name: 'update_task',
        description: 'Update a task status',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'The session ID',
            },
            id: {
              type: 'number',
              description: 'The task ID',
              minimum: 1,
            },
            status: {
              type: 'string',
              enum: ['pending', 'in_progress', 'check', 'done', 'error'],
              description: 'The new status',
            },
          },
          required: ['sessionId', 'id', 'status'],
        },
      },
      {
        name: 'clear_tasks',
        description: 'Clear tasks from a session',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'The session ID',
            },
            clearAll: {
              type: 'boolean',
              description: 'If true, clear all tasks. If false, clear only done tasks.',
              default: false,
            },
          },
          required: ['sessionId'],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    switch (request.params.name) {
      case 'add_tasks':
        return await handleAddTasks(request.params.arguments);
      case 'update_task':
        return await handleUpdateTask(request.params.arguments);
      case 'clear_tasks':
        return await handleClearTasks(request.params.arguments);
      default:
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ error: 'Unknown tool' }, null, 2),
            },
          ],
          isError: true,
        };
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            null,
            2
          ),
        },
      ],
      isError: true,
    };
  }
});

const transport = new StdioServerTransport();
server.connect(transport).then(() => {
  console.error('Task Manager MCP Server started');
});

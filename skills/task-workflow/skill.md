# Task Workflow Skill

Automatically manages tasks based on execution plans.

## MANDATORY RULES — Claude Code MUST follow these rules when this skill is loaded

### Rule 1: Before ExitPlanMode — CRITICAL

**IMMEDIATELY before calling the ExitPlanMode tool, you MUST execute the following:**

1. Get session name: Run `basename $(pwd)`
2. Extract step titles from the execution plan (each bullet point item)
3. Call `mcp__task-workflow__add_tasks` MCP tool to create tasks
4. Record the returned task IDs (for later use with update_task)
5. Then call ExitPlanMode

**This is MANDATORY. You MUST execute these steps IMMEDIATELY before ExitPlanMode.**

### Rule 2: During Step Implementation — MANDATORY

**For each implementation step, update task status as follows:**

- **When starting a step:** Call `mcp__task-workflow__update_task` with `status: "in_progress"`
- **When completing a step:**
  - File editing complete, code generation complete → `status: "done"`
  - Build execution, test execution → `status: "check"` (requires user confirmation)
  - Error occurred → `status: "error"`

### Rule 3: When All Tasks Complete

- When all tasks become `done` or `check`, confirm with user using AskUserQuestion, then call `mcp__task-workflow__clear_tasks`

---

## Getting Session Name

The task session name is automatically obtained from the current directory name:

```typescript
// Example of getting session name
const currentDir = process.cwd();
const sessionId = currentDir.split('/').pop() || 'default';
```

In practice, get it using this bash command:

```bash
basename $(pwd)
```

## Task Management Workflow

### 1. When Creating Execution Plan (Before ExitPlanMode)

After completing the execution plan, **before calling ExitPlanMode**, add each step of the plan as a task.

**Procedure:**

1. Get session name
2. Extract step titles from the execution plan
3. Call `mcp__task-workflow__add_tasks` MCP tool to create tasks
4. Record the created task IDs (for later updates)

**Example:**

Execution plan:
```
Phase 1: Authentication System Implementation
1. Create user schema
2. Implement login API
3. Add token validation middleware

Phase 2: Testing and Documentation
4. Add unit tests
5. Update API documentation
```

MCP tool call:
```json
{
  "name": "mcp__task-workflow__add_tasks",
  "arguments": {
    "sessionId": "my-project",
    "titles": [
      "Create user schema",
      "Implement login API",
      "Add token validation middleware",
      "Add unit tests",
      "Update API documentation"
    ]
  }
}
```

### 2. When Starting Each Step

When starting to implement a step, update the corresponding task status to `in_progress`.

**MCP tool call:**
```json
{
  "name": "mcp__task-workflow__update_task",
  "arguments": {
    "sessionId": "my-project",
    "id": 1,
    "status": "in_progress"
  }
}
```

### 3. When Completing Each Step

When a step is complete, update the status according to the following rules:

#### Status: `done`

Set to `done` in the following cases:
- File creation/editing completed
- Code generation completed
- Configuration file update completed
- Dependency installation completed
- Automated operation succeeded
- **User allows automatic progression to next step**

**MCP tool call:**
```json
{
  "name": "mcp__task-workflow__update_task",
  "arguments": {
    "sessionId": "my-project",
    "id": 1,
    "status": "done"
  }
}
```

#### Status: `check`

Set to `check` in the following cases:
- Build or test executed (results need confirmation)
- Important configuration change made (review needed)
- External service deployment performed (confirmation needed)
- **User confirmation or approval required**
- Errors or warnings occurred

**MCP tool call:**
```json
{
  "name": "mcp__task-workflow__update_task",
  "arguments": {
    "sessionId": "my-project",
    "id": 2,
    "status": "check"
  }
}
```

#### Status: `error`

Set to `error` in the following cases:
- Error occurred during step execution
- Build or test failed
- Dependency installation failed

**MCP tool call:**
```json
{
  "name": "mcp__task-workflow__update_task",
  "arguments": {
    "sessionId": "my-project",
    "id": 3,
    "status": "error"
  }
}
```

### 4. Clearing Completed Tasks

When all tasks are complete, confirm with the user before clearing tasks with `done` status.

**Procedure:**

1. **Detect all tasks complete**

   Confirm that all tasks have `done` or `check` status. Do not perform clearing if any tasks remain with `pending`, `in_progress`, or `error` status.

2. **Confirm with user**

   Use the AskUserQuestion tool to request confirmation:

   ```json
   {
     "name": "AskUserQuestion",
     "arguments": {
       "questions": [
         {
           "question": "All tasks completed. Clear completed tasks (done status)?",
           "header": "Clear Tasks",
           "options": [
             {
               "label": "Clear",
               "description": "Delete tasks with done status"
             },
             {
               "label": "Keep",
               "description": "Keep tasks as is"
             }
           ],
           "multiSelect": false
         }
       ]
     }
   }
   ```

3. **Process based on user response**

   **If user selects "Clear":**

   Call `mcp__task-workflow__clear_tasks` MCP tool:
   ```json
   {
     "name": "mcp__task-workflow__clear_tasks",
     "arguments": {
       "sessionId": "my-project",
       "clearAll": false
     }
   }
   ```

   **If user selects "Keep":**

   Keep tasks without clearing. Notify user concisely:
   ```
   Tasks kept.
   ```

4. **Clear options**

   With `clearAll: false`, only tasks with `done` status are deleted. To clear all tasks, confirm separately then set `clearAll: true`.

## Important Notes

### 1. Task ID Management

Record the task IDs returned from `mcp__task-workflow__add_tasks` for later use when calling `mcp__task-workflow__update_task`.

Task IDs are managed independently within each session (ID 1 in session A and ID 1 in session B are different).

### 2. Error Handling

Even if MCP tool calls fail, continue implementation work. Task management is supplementary functionality and must not block main work.

### 3. User Notifications

When creating or updating tasks, notify the user concisely:

**Good example:**
```
Created tasks (session: my-project, 5 items)
```

**Bad example:**
```
Accessed task management system, used mcp__task-workflow__add_tasks tool to add the following 5 tasks to the my-project session...
```

### 4. Session Name Confirmation

After getting the session name, recommend confirming with user when creating first task:

```
Adding execution plan tasks to session "my-project".
```

### 5. Task Clear Confirmation

When clearing tasks, **ALWAYS ask for user confirmation**. Never automatically delete tasks.

Confirmation timing:
- When all tasks become `done` or `check`
- When user explicitly requests task clearing

Reasons not to clear without confirmation:
- User may want to reference later
- User may want to keep as work record
- User may want to check completion status in TUI

## Usage Examples

### Example 1: Implementing New Feature

**User request:**
```
Please implement a new user authentication feature
```

**Claude Code behavior:**

1. Use EnterPlanMode to create execution plan
2. Extract each step from the plan
3. Get session name: `basename $(pwd)` → "my-app"
4. Create tasks:
   ```json
   {
     "name": "mcp__task-workflow__add_tasks",
     "arguments": {
       "sessionId": "my-app",
       "titles": [
         "Create authentication schema",
         "Implement login API",
         "Add token validation",
         "Create tests"
       ]
     }
   }
   ```
5. Confirm plan with ExitPlanMode
6. When implementing each step:
   - Step start: Set to `in_progress` with `mcp__task-workflow__update_task`
   - Step complete: Set to `done` or `check` with `mcp__task-workflow__update_task`
7. When all tasks complete:
   - Confirm with user: "Clear completed tasks?"
   - Only execute `mcp__task-workflow__clear_tasks` if user approves

### Example 2: Error Handling

**Situation:**
```
TypeScript error occurred during build
```

**Claude Code behavior:**

1. Update corresponding task to `error`:
   ```json
   {
     "name": "mcp__task-workflow__update_task",
     "arguments": {
       "sessionId": "my-app",
       "id": 2,
       "status": "error"
     }
   }
   ```
2. Fix the error
3. Build again successfully, then update to `check` (build results need confirmation)

### Example 3: Clearing After All Tasks Complete

**Situation:**
```
All tasks have done or check status
```

**Claude Code behavior:**

1. Detect all tasks complete

2. Request user confirmation (AskUserQuestion):
   ```
   All tasks completed. Clear completed tasks (done status)?

   [ Clear ]  [ Keep ]
   ```

3. If user selects "Clear":
   ```json
   {
     "name": "mcp__task-workflow__clear_tasks",
     "arguments": {
       "sessionId": "my-app",
       "clearAll": false
     }
   }
   ```
   Notify: "Cleared completed tasks."

4. If user selects "Keep":
   Notify: "Tasks kept."

## Testing

To verify the skill works correctly:

1. Start TUI app:
   ```bash
   SESSION=$(basename $(pwd)) npm start
   ```

2. Request execution plan from Claude Code:
   ```
   Please implement a simple feature in 3 steps
   ```

3. Verify in TUI that tasks are created and status updates when each step completes

## Summary

By using this skill:

- ✅ Execution plan is displayed as visual task list
- ✅ Progress can be checked in real-time
- ✅ Steps requiring user approval are clearly identified
- ✅ Multiple projects can be managed in parallel (session separation)

Claude Code automatically records progress without you needing to think about task management.

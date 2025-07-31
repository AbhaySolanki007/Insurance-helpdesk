# Human-in-the-Loop (HITL) Usage Guide

## Overview
The Human-in-the-Loop system provides real-time approval for user data updates directly in the backend terminal. When a user requests to update their information, the system pauses and waits for human approval before proceeding.

## How It Works

### 1. User Request Flow
1. User sends a message like "Update my phone number to 555-1234"
2. Level2 agent detects the update request and calls `update_user_data` tool
3. System automatically pauses and shows approval prompt in backend terminal
4. User receives: "Your update request has been submitted for approval. Please wait while we review your request."

### 2. Backend Terminal Flow
1. Backend terminal shows approval request immediately:
   ```
   ============================================================
           INSURANCE HELPDESK - ADMIN CONSOLE
           Human-in-the-Loop Approval System
   ============================================================
   👤 User ID: USR1002
   📝 Requested Updates:
      • phone_number: 555-1234
   
   Available actions:
   1. Approve this request
   2. Decline this request
   ============================================================
   
   Enter your choice (1-2): 
   ```

2. Admin enters choice (1 or 2) directly in backend terminal
3. System processes the decision and updates the user

## Setup Instructions

### 1. Start the Backend
```bash
cd backend
python app.py
```

The backend will show normal startup messages and wait for requests.

### 2. Test the System
1. In the frontend, escalate to Level2: "I need to speak with a supervisor"
2. Then request an update: "Update my phone number to 555-1234"
3. Watch the backend terminal for the approval prompt
4. Enter 1 (approve) or 2 (decline) in the backend terminal
5. Check the frontend for the response

## Backend Terminal Features

- **Real-time prompts**: Approval requests appear immediately in backend terminal
- **Simple interface**: Just enter 1 (approve) or 2 (decline)
- **No separate processes**: Everything happens in one terminal
- **Clear feedback**: Immediate confirmation of decisions
- **Error handling**: Graceful handling of invalid inputs and cancellations

## Expected Terminal Output

When an update request is triggered, you'll see:

```
---EXECUTING Level2 NODE---
---UPDATE_USER_DATA TOOL DETECTED - STORING FOR HUMAN APPROVAL---
---EXTRACTED ACTION INPUT: {"phone_number": "555-1234"}---
---EXECUTING HUMAN APPROVAL NODE---
---HUMAN APPROVAL REQUEST FOR USER: USR1002---

============================================================
           INSURANCE HELPDESK - ADMIN CONSOLE
           Human-in-the-Loop Approval System
============================================================
👤 User ID: USR1002
📝 Requested Updates:
   • phone_number: 555-1234

============================================================
Available actions:
1. Approve this request
2. Decline this request
============================================================

Enter your choice (1-2): 1
✅ Request approved! Processing update...
---DATABASE UPDATE RESULT: Phone number updated successfully---
```

## Troubleshooting

### Backend not showing approval prompts?
- Ensure the Level2 agent is calling `update_user_data` tool
- Check that the request escalates to Level2 properly
- Verify the agent prompt includes the update instructions

### Backend errors?
- Check the backend logs for error messages
- Ensure all required dependencies are installed
- Verify database connection

### Frontend not receiving responses?
- Check that the approval decision was processed successfully
- Verify the database update completed
- Check backend logs for any errors

## File Structure
- `app.py`: Backend with integrated HITL prompts
- `ai/Langgraph_module/Langgraph.py`: HITL workflow logic with terminal prompts
- `ai/Level2_agent.py`: Enhanced agent with update instructions
- `ai/Langgraph_module/graph_compiler.py`: Graph assembly with HITL integration

## Key Advantages

- **Simpler Architecture**: No file management or separate processes
- **Real-time Interaction**: Immediate prompts in backend terminal
- **Single Terminal**: Everything visible in one place
- **Easy Testing**: No process coordination needed
- **Production Ready**: Can be easily adapted for production use
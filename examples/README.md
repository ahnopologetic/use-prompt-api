# Examples

This directory contains comprehensive examples demonstrating the use of the Chrome Prompt API library.

## 📚 Available Examples

### 1. Basic Chat (`basic-chat.ts`)
Simple conversational interface demonstrating basic prompt/response patterns.

**Run:**
```bash
pnpm example:basic
```

### 2. Function Calling (`function-calling.ts`)
Demonstrates how to define and use custom functions with the AI agent.

**Features:**
- Weather lookup function
- Calculator function
- Automatic function calling

**Run:**
```bash
pnpm example:functions
```

### 3. Basic Agent (`basic-agent.ts`)
Multi-turn task execution with function calling capabilities.

**Features:**
- Step-by-step task execution
- Tool usage tracking
- Iteration management

**Run:**
```bash
pnpm example:agent
```

### 4. Advanced Agent (`advanced-agent.ts`)
Sophisticated agent with planning and reflection capabilities.

**Features:**
- Task planning
- Progress reflection
- Multi-iteration execution
- Research and analysis functions

**Run:**
```bash
pnpm example:advanced
```

### 5. **Streaming Agent (`streaming-agent.ts`)** ⭐ NEW
Real-time streaming agent with visual tool call display.

**Features:**
- Real-time response streaming
- Visual separation of agent thoughts and tool calls
- JSON display of function calls and results
- Color-coded console output
- Multiple example scenarios

**Run:**
```bash
pnpm example:streaming
```

**Visual Output:**
- 🤖 Streaming agent responses in real-time
- 🔧 Tool calls displayed as formatted JSON
- ✅/❌ Tool results with success/failure indicators
- 💭 Agent reasoning and thought process
- ✨ Final answers highlighted

### 6. Structured Output (`structured-output.ts`)
Type-safe structured data extraction using Zod schemas.

**Features:**
- Schema-based output validation
- Type safety
- Complex data structures

**Run:**
```bash
pnpm example:structured
```

### 7. React Chatbot (`react-chatbot/App.tsx`)
Full-featured React chatbot with hooks integration.

**Features:**
- React hooks (`usePromptAPI`, `useAgent`)
- Session management
- Function calling in React

## 🌐 Browser Examples

### Streaming Agent (HTML)
Open `streaming-agent.html` in Chrome to see a fully interactive browser-based streaming agent.

**Features:**
- Beautiful UI with gradient design
- Real-time streaming visualization
- Tool calls displayed as JSON
- Multiple pre-configured examples
- Visual status indicators

**To Run:**
1. Build the project: `pnpm build`
2. Open `examples/streaming-agent.html` in Chrome
3. Click "Run Agent" or try the example buttons

## 🎯 Example Scenarios

### Streaming Agent Scenarios

1. **Weather Analysis**
   ```
   Get the weather for Paris and Tokyo, then calculate their temperature difference in Fahrenheit
   ```

2. **Research & Calculate**
   ```
   Search for information about AI trends, then calculate 25 * 8 + 100
   ```

3. **Multi-Tool Task**
   ```
   Get the weather in London, search for climate information, and calculate the average temperature
   ```

## 🔧 Available Functions

All agent examples include these functions:

- **`getWeather(location, units?)`**: Get current weather data
- **`search(query, category?)`**: Search for information
- **`calculate(expression)`**: Perform mathematical calculations

## 📋 Prerequisites

- Chrome 128+ with Prompt API enabled
- Built-in AI model downloaded
- Origin trial token (if required)

## 🚀 Quick Start

1. Install dependencies:
```bash
pnpm install
```

2. Build the project:
```bash
pnpm build
```

3. Run any example:
```bash
pnpm example:streaming  # Try the new streaming agent!
```

## 💡 Tips

### For Console Examples (TypeScript)
- Look for color-coded output showing agent steps
- Tool calls are displayed with clear JSON formatting
- Streaming shows real-time response updates

### For Browser Examples (HTML)
- Use the browser console to see underlying API calls
- Try modifying the task input for different scenarios
- Clear output button resets the display

## 🎨 Streaming Agent Output

The streaming agent provides rich visual feedback:

```
=================================================================================
STREAMING AGENT EXECUTION
=================================================================================

Task: Get the weather for Paris and Tokyo...

🔄 Iteration 1
--------------------------------------------------------------------------------

🤖 Agent Response (streaming):
I'll help you get the weather information for both cities...

💭 Reasoning:
Need to fetch weather data for Paris first

🔧 TOOL CALL
┌─ Tool: getWeather
└─ Arguments:
   {
     "location": "Paris",
     "units": "fahrenheit"
   }

✅ TOOL RESULT
┌─ Status: Success
└─ Result:
   {
     "location": "Paris",
     "temperature": 64,
     "unit": "°F",
     "condition": "Cloudy"
   }
```

## 📖 Learn More

- [Main Documentation](../README.md)
- [Function Calling Guide](../docs/function-calling.md)
- [Agent Documentation](../docs/agents.md)
- [Session Management](../docs/session-management.md)

## 🤝 Contributing

Feel free to add more examples! Follow the existing patterns and update this README.


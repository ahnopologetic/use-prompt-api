/**
 * Streaming Agent Example
 * Demonstrates agent with real-time streaming responses and visual tool call display
 */

import { SessionManager, createFunctionDefinition, FunctionRegistry } from '../src';
import { parseFunctionCall, buildFunctionSystemPrompt, formatFunctionResult } from '../src/function-calling/function-prompt-builder';
import { executeFunctionCall } from '../src/function-calling/function-executor';
import { StreamProcessor } from '../src/streaming/stream-processor';

// Color codes for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    gray: '\x1b[90m',
};

// Define some example functions
const weatherFunction = createFunctionDefinition(
    'getWeather',
    'Get current weather for a location',
    {
        type: 'object',
        properties: {
            location: { type: 'string', description: 'City name' },
            units: { type: 'string', enum: ['celsius', 'fahrenheit'], description: 'Temperature units' },
        },
        required: ['location'],
    },
    async ({ location, units = 'celsius' }: { location: string; units?: string }) => {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 800));

        const mockWeather = {
            Paris: { celsius: 18, fahrenheit: 64, condition: 'Cloudy', humidity: 65 },
            Tokyo: { celsius: 24, fahrenheit: 75, condition: 'Sunny', humidity: 50 },
            'New York': { celsius: 22, fahrenheit: 72, condition: 'Rainy', humidity: 80 },
            London: { celsius: 15, fahrenheit: 59, condition: 'Foggy', humidity: 75 },
        };

        const weather = mockWeather[location as keyof typeof mockWeather] || {
            celsius: 20,
            fahrenheit: 68,
            condition: 'Unknown',
            humidity: 60,
        };

        const temp = units === 'fahrenheit' ? weather.fahrenheit : weather.celsius;
        const unit = units === 'fahrenheit' ? '°F' : '°C';

        return {
            location,
            temperature: temp,
            unit,
            condition: weather.condition,
            humidity: weather.humidity,
        };
    }
);

const searchFunction = createFunctionDefinition(
    'search',
    'Search for information on a topic',
    {
        type: 'object',
        properties: {
            query: { type: 'string', description: 'Search query' },
            category: { type: 'string', enum: ['news', 'science', 'general'], description: 'Search category' },
        },
        required: ['query'],
    },
    async ({ query, category = 'general' }: { query: string; category?: string }) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        return {
            query,
            category,
            results: [
                `Result 1 about ${query}`,
                `Recent development in ${query}`,
                `Expert opinion on ${query}`,
            ],
            resultCount: 3,
        };
    }
);

const calculateFunction = createFunctionDefinition(
    'calculate',
    'Perform mathematical calculations',
    {
        type: 'object',
        properties: {
            expression: { type: 'string', description: 'Math expression to evaluate' },
        },
        required: ['expression'],
    },
    async ({ expression }: { expression: string }) => {
        try {
            const sanitized = expression.replace(/[^0-9+\-*/().\s]/g, '');
            // eslint-disable-next-line no-eval
            const result = eval(sanitized);
            return { expression, result };
        } catch {
            return { expression, error: 'Invalid expression' };
        }
    }
);

// Visual separator functions
function printHeader(text: string) {
    console.log(`\n${colors.bright}${colors.cyan}${'='.repeat(80)}${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}${text.padEnd(80)}${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}${'='.repeat(80)}${colors.reset}\n`);
}

function printSection(icon: string, title: string) {
    console.log(`\n${colors.bright}${icon} ${title}${colors.reset}`);
    console.log(`${colors.gray}${'-'.repeat(80)}${colors.reset}`);
}

function printToolCall(toolName: string, args: unknown) {
    console.log(`\n${colors.yellow}${colors.bright}🔧 TOOL CALL${colors.reset}`);
    console.log(`${colors.blue}┌─ Tool: ${colors.bright}${toolName}${colors.reset}`);
    console.log(`${colors.blue}└─ Arguments:${colors.reset}`);
    console.log(`${colors.dim}${JSON.stringify(args, null, 2).split('\n').map(line => '   ' + line).join('\n')}${colors.reset}`);
}

function printToolResult(result: unknown, success: boolean) {
    const statusColor = success ? colors.green : '\x1b[31m'; // red for failure
    const statusIcon = success ? '✅' : '❌';

    console.log(`\n${statusColor}${colors.bright}${statusIcon} TOOL RESULT${colors.reset}`);
    console.log(`${statusColor}┌─ Status: ${success ? 'Success' : 'Failed'}${colors.reset}`);
    console.log(`${statusColor}└─ Result:${colors.reset}`);
    console.log(`${colors.dim}${JSON.stringify(result, null, 2).split('\n').map(line => '   ' + line).join('\n')}${colors.reset}`);
}

function printStreaming(text: string) {
    process.stdout.write(`${colors.green}${text}${colors.reset}`);
}

// Streaming agent class
class StreamingAgent {
    private session: SessionManager | null = null;
    private registry: FunctionRegistry;
    private systemPrompt: string;
    private maxIterations: number;

    constructor(config: {
        functions: any[];
        systemPrompt?: string;
        maxIterations?: number;
    }) {
        this.registry = new FunctionRegistry();
        this.registry.registerMultiple(config.functions);
        this.systemPrompt = config.systemPrompt || 'You are a helpful AI assistant with access to tools.';
        this.maxIterations = config.maxIterations || 10;
    }

    async run(task: string): Promise<void> {
        this.session = new SessionManager();

        const fullSystemPrompt = `${this.systemPrompt}\n\n${buildFunctionSystemPrompt(this.registry)}`;

        await this.session.create({
            systemPrompt: fullSystemPrompt,
            enablePersistence: false,
        });

        let currentPrompt = task;
        let iteration = 0;

        printHeader(`STREAMING AGENT EXECUTION`);
        console.log(`${colors.bright}Task:${colors.reset} ${task}\n`);

        while (iteration < this.maxIterations) {
            iteration++;

            printSection('🔄', `Iteration ${iteration}`);

            // Stream the response
            const stream = this.session.promptStreaming(currentPrompt);
            const processor = new StreamProcessor(stream);

            console.log(`${colors.bright}${colors.magenta}🤖 Agent Response (streaming):${colors.reset}\n`);

            let fullResponse = '';

            // Stream and collect response
            for await (const chunk of processor.iterate()) {
                fullResponse = chunk;
                // Clear line and rewrite to show streaming effect
                process.stdout.write('\r\x1b[K'); // Clear current line
                printStreaming(chunk.substring(0, 150) + (chunk.length > 150 ? '...' : ''));
            }

            console.log('\n'); // New line after streaming completes

            // Parse for function calls
            const parsed = parseFunctionCall(fullResponse);

            if (parsed.functionCall) {
                // Display reasoning if present
                if (parsed.reasoning) {
                    console.log(`${colors.cyan}💭 Reasoning:${colors.reset}`);
                    console.log(`${colors.dim}${parsed.reasoning}${colors.reset}`);
                }

                // Display tool call as JSON
                printToolCall(parsed.functionCall.name, parsed.functionCall.arguments);

                // Execute function
                console.log(`\n${colors.gray}⏳ Executing tool...${colors.reset}`);
                const result = await executeFunctionCall(parsed.functionCall, this.registry);

                // Display result as JSON
                printToolResult(result.result || result.error, result.success);

                // Prepare next prompt
                const formattedResult = formatFunctionResult(
                    parsed.functionCall.name,
                    result.result || result.error,
                    result.success
                );

                currentPrompt = `${formattedResult}\n\nContinue with the task. If the task is complete, provide your final answer without calling any functions.`;

            } else {
                // No function call - check if task is complete
                const isComplete = this.isTaskComplete(fullResponse);

                if (isComplete) {
                    printSection('✨', 'TASK COMPLETE');
                    console.log(`${colors.bright}${colors.green}Final Answer:${colors.reset}`);
                    console.log(`${colors.dim}${fullResponse}${colors.reset}\n`);
                    break;
                }

                currentPrompt = 'Continue with the task.';
            }
        }

        if (iteration >= this.maxIterations) {
            printSection('⚠️', 'MAX ITERATIONS REACHED');
        }

        this.session.destroy();
    }

    private isTaskComplete(response: string): boolean {
        const completionIndicators = [
            'task is complete',
            'task complete',
            'finished',
            'final answer',
            'in conclusion',
            'to summarize',
        ];

        const lowerResponse = response.toLowerCase();
        return completionIndicators.some((indicator) => lowerResponse.includes(indicator));
    }
}

// Main execution
async function main() {
    const agent = new StreamingAgent({
        functions: [weatherFunction, searchFunction, calculateFunction],
        systemPrompt: 'You are a helpful research assistant with access to weather data, search capabilities, and calculation tools. Complete tasks step by step and provide comprehensive answers.',
        maxIterations: 8,
    });

    // Example 1: Multi-step weather task
    console.log(`${colors.bright}${colors.blue}Example 1: Multi-Step Weather Analysis${colors.reset}`);
    await agent.run(
        'Get the weather for Paris and Tokyo, calculate the temperature difference in Fahrenheit, and tell me which city is warmer.'
    );

    // Wait a bit between examples
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Example 2: Research and calculation task
    console.log(`\n\n${colors.bright}${colors.blue}Example 2: Research and Calculation${colors.reset}`);
    await agent.run(
        'Search for information about climate change, then calculate what 25 degrees Celsius is in Fahrenheit.'
    );

    console.log(`\n${colors.bright}${colors.green}✅ All examples completed!${colors.reset}\n`);
}

main().catch(console.error);


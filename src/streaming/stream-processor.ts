/**
 * Stream processing utilities for LLM responses
 */

import type { StreamingOptions } from '../types';
import { PromptAPIError } from '../types';

export class StreamProcessor {
  private reader: ReadableStreamDefaultReader<string> | null = null;
  private controller: AbortController;
  private accumulated = '';

  constructor(
    private stream: ReadableStream<string>,
    private options: StreamingOptions = {}
  ) {
    this.controller = new AbortController();

    // Wire up external abort signal if provided
    if (options.signal) {
      options.signal.addEventListener('abort', () => this.abort());
    }
  }

  async process(): Promise<string> {
    this.reader = this.stream.getReader();
    const { onChunk, onComplete, onError } = this.options;

    try {
      while (true) {
        const { done, value } = await this.reader.read();

        if (this.controller.signal.aborted) {
          throw new PromptAPIError('Stream processing aborted');
        }

        if (done) {
          break;
        }

        this.accumulated = value;

        if (onChunk) {
          onChunk(value);
        }
      }

      if (onComplete) {
        onComplete(this.accumulated);
      }

      return this.accumulated;
    } catch (error) {
      if (onError) {
        onError(error as Error);
      }
      throw error;
    } finally {
      this.reader.releaseLock();
      this.reader = null;
    }
  }

  async *iterate(): AsyncIterableIterator<string> {
    this.reader = this.stream.getReader();

    try {
      while (true) {
        const { done, value } = await this.reader.read();

        if (this.controller.signal.aborted) {
          throw new PromptAPIError('Stream processing aborted');
        }

        if (done) {
          break;
        }

        this.accumulated = value;
        yield value;
      }
    } finally {
      this.reader.releaseLock();
      this.reader = null;
    }
  }

  getPartialResult(): string {
    return this.accumulated;
  }

  abort(): void {
    this.controller.abort();
    if (this.reader) {
      this.reader.cancel();
    }
  }

  isAborted(): boolean {
    return this.controller.signal.aborted;
  }
}

export async function collectStream(stream: ReadableStream<string>): Promise<string> {
  const processor = new StreamProcessor(stream);
  return processor.process();
}

export async function* streamToAsyncIterator(
  stream: ReadableStream<string>
): AsyncIterableIterator<string> {
  const processor = new StreamProcessor(stream);
  yield* processor.iterate();
}


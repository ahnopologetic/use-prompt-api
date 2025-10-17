/**
 * Stream rendering utilities for UI updates
 */

import type { RenderMode, StreamRenderOptions } from '../types';

export class StreamRenderer {
  private buffer = '';
  private lastUpdate = 0;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private options: StreamRenderOptions) {}

  processChunk(chunk: string): void {
    this.buffer = chunk;

    const now = Date.now();
    const { debounceMs = 50 } = this.options;

    // Debounce updates to avoid excessive renders
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    if (now - this.lastUpdate >= debounceMs) {
      this.render();
    } else {
      this.debounceTimer = setTimeout(() => this.render(), debounceMs);
    }
  }

  complete(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.render();
  }

  private render(): void {
    const { mode, onUpdate } = this.options;
    const text = this.formatForMode(this.buffer, mode);
    onUpdate(text);
    this.lastUpdate = Date.now();
  }

  private formatForMode(text: string, mode: RenderMode): string {
    switch (mode) {
      case 'word':
        return text;

      case 'sentence': {
        // Only show complete sentences
        const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
        return sentences.join(' ');
      }

      case 'chunk':
      default:
        return text;
    }
  }
}

export function createStreamRenderer(
  stream: ReadableStream<string>,
  options: StreamRenderOptions
): StreamRenderer {
  const renderer = new StreamRenderer(options);

  (async () => {
    const reader = stream.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          renderer.complete();
          break;
        }
        renderer.processChunk(value);
      }
    } finally {
      reader.releaseLock();
    }
  })();

  return renderer;
}

export async function* bufferStream(
  stream: ReadableStream<string>,
  bufferSize: number
): AsyncIterableIterator<string> {
  const reader = stream.getReader();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        if (buffer.length > 0) {
          yield buffer;
        }
        break;
      }

      buffer = value;

      // Yield when buffer reaches size or on sentence boundaries
      const lastSentence = buffer.lastIndexOf('. ');
      if (buffer.length >= bufferSize && lastSentence > 0) {
        yield buffer.substring(0, lastSentence + 1);
        buffer = buffer.substring(lastSentence + 1);
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export function debounceStream(
  stream: ReadableStream<string>,
  delay: number
): ReadableStream<string> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let latestValue = '';

  return new ReadableStream<string>({
    async start(controller) {
      const reader = stream.getReader();

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            if (timeoutId) {
              clearTimeout(timeoutId);
            }
            if (latestValue) {
              controller.enqueue(latestValue);
            }
            controller.close();
            break;
          }

          latestValue = value;

          if (timeoutId) {
            clearTimeout(timeoutId);
          }

          timeoutId = setTimeout(() => {
            controller.enqueue(latestValue);
            timeoutId = null;
          }, delay);
        }
      } finally {
        reader.releaseLock();
      }
    },
  });
}

// Word-by-word streaming utility
export async function* streamWords(
  stream: ReadableStream<string>
): AsyncIterableIterator<string> {
  const reader = stream.getReader();
  let previousText = '';

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      // Extract new words
      const currentWords = value.split(/\s+/);
      const previousWords = previousText.split(/\s+/);

      for (let i = previousWords.length; i < currentWords.length; i++) {
        const word = currentWords[i];
        if (word) {
          yield word;
        }
      }

      previousText = value;
    }
  } finally {
    reader.releaseLock();
  }
}

// Sentence-by-sentence streaming utility
export async function* streamSentences(
  stream: ReadableStream<string>
): AsyncIterableIterator<string> {
  const reader = stream.getReader();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        if (buffer.trim()) {
          yield buffer;
        }
        break;
      }

      buffer = value;

      // Extract complete sentences
      const sentenceRegex = /[^.!?]+[.!?]+/g;
      const sentences = buffer.match(sentenceRegex);

      if (sentences && sentences.length > 0) {
        for (const sentence of sentences) {
          yield sentence;
        }

        // Keep incomplete sentence in buffer
        const lastSentenceEnd = buffer.lastIndexOf(sentences[sentences.length - 1]!);
        buffer = buffer.substring(
          lastSentenceEnd + sentences[sentences.length - 1]!.length
        );
      }
    }
  } finally {
    reader.releaseLock();
  }
}


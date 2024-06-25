/**
 * Type definition for an asynchronous function.
 * @template T The type of the promise result.
 * @template A The type of the arguments array.
 * @param args Arguments passed to the asynchronous function.
 * @returns A promise containing the result of type T.
 */
type AsyncFunction<T = any, A extends any[] = any[]> = (
  ...args: A
) => Promise<T>;

/**
 * A class designed to ensure that a particular asynchronous function
 * only has one active execution at a time.
 * @template T The type of the promise result.
 * @template A The type of the arguments array.
 */
export class SingletonAsyncRunner<T = any, A extends any[] = any[]> {
  private isRunning = false; // Indicates if the function is currently running.
  private promise: Promise<T> | null = null; // Holds the promise of the current or last operation.
  private func: AsyncFunction<T, A>; // The asynchronous function to be run.

  /**
   * Constructs an instance of SingletonAsyncRunner.
   * @param func The asynchronous function to be managed.
   */
  constructor(func: AsyncFunction<T, A>) {
    this.func = func;
  }

  /**
   * Runs the asynchronous function if it is not already running.
   * If it is running, it returns the promise of the ongoing operation.
   * @param args Arguments to pass to the function.
   * @returns A promise containing the result of the function execution.
   */
  run(...args: A): Promise<T> {
    if (this.isRunning) {
      console.debug("Operation is already in progress, waiting...");
      return this.promise!;
    }

    this.isRunning = true;
    this.promise = this.func(...args).finally(() => {
      this.isRunning = false;
      this.promise = null;
    });

    return this.promise;
  }
}

/**
 * Creates a singleton version of an asynchronous function.
 * This ensures that multiple calls to the function will result in only one active execution at any time.
 * @template T The type of the promise result.
 * @template A The type of the arguments array.
 * @param func The asynchronous function to be wrapped.
 * @returns A new asynchronous function that manages the execution as a singleton.
 */
export function singleton<T = any, A extends any[] = any[]>(
  func: AsyncFunction<T, A>
): AsyncFunction<T, A> {
  const runner = new SingletonAsyncRunner<T, A>(func);
  return (...args: A) => runner.run(...args);
}

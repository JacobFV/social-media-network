export function DataClass<T extends new (...args: any[]) => {}>(
  constructor: T
) {
  return class extends constructor {
    constructor(...args: any[]) {
      super(...args);
      const props: { [key: string]: any } = args[0];
      Object.assign(this, props);
    }
  };
}

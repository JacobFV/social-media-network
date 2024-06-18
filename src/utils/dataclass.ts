/**
 * This module provides decorators for enhancing classes with automatic property initialization.
 * It includes a `DataClass` decorator for creating data classes with optional default initializers,
 * and a `Default` decorator to specify default values for properties based on constructor arguments.
 */

/**
 * Decorator that assigns a default initializer function to a property.
 * This initializer is used when an instance of the class is created to set the property's value.
 *
 * @param initializer A function that returns the default value for the property.
 * @returns A decorator function that assigns the initializer to the property.
 */
export function Default<T>(initializer: (...args: any[]) => T) {
  return function (target: any, propertyKey: string) {
    if (!target.__initProperties__) {
      target.__initProperties__ = {};
    }
    target.__initProperties__[propertyKey] = initializer;
  };
}

/**
 * A class decorator that transforms a class into a data class with optional property initializers.
 * It automatically assigns properties from the first argument of the constructor and applies any
 * specified default initializers.
 *
 * @param constructor The class constructor to transform into a data class.
 * @returns A new class that extends the original constructor with enhanced functionality.
 */
export function DataClass<T extends new (...args: any[]) => {}>(
  constructor: T
) {
  return class extends constructor {
    // Explicitly declare __initProperties__ and add an index signature
    [key: string]: any;
    __initProperties__: { [key: string]: (...args: any[]) => any };

    constructor(...args: any[]) {
      super(...args);
      const props: { [key: string]: any } = args[0] || {};
      Object.assign(this, props);

      // Apply initializers
      const initializers = this.__initProperties__;
      if (initializers) {
        for (const prop in initializers) {
          this[prop] = initializers[prop].apply(this, args);
        }
      }
    }
  };
}

export type Dynamic<T> = (...args: any[]) => T;

export type StaticOrDynamic<T> = T | Dynamic<T>;

export const convertToDynamic = <T>(value: StaticOrDynamic<T>): Dynamic<T> => {
  if (typeof value === "function") return value as Dynamic<T>;
  else return (...args) => value;
};

export type Constructor<
  T extends object,
  Args extends unknown[] = any[]
> = new (...args: Args) => T;
export type AbstractClassType<T> = Function & { prototype: T };
export type ClassType<
  T extends object = object,
  Args extends unknown[] = any[]
> = Constructor<T, Args> & AbstractClassType<T>;

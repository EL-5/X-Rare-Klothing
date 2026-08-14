export type ClassValue = string | number | null | false | undefined | ClassValue[];

/** Joins truthy class-name fragments; avoids pulling in a classnames dependency for this. */
export function cn(...values: ClassValue[]): string {
  const classes: string[] = [];
  for (const value of values) {
    if (!value) continue;
    if (Array.isArray(value)) {
      const nested = cn(...value);
      if (nested) classes.push(nested);
    } else {
      classes.push(String(value));
    }
  }
  return classes.join(' ');
}

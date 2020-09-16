import { BufferUtil } from './buffer';
export * from './buffer';
export * from './js';
export * from './preconditions';
import { JSUtil } from './js';
export declare const Util: {
    buffer: typeof BufferUtil;
    js: typeof JSUtil;
    preconditions: {
        checkState: (condition: any, message: any) => void;
        checkArgument(condition: any, argumentName?: any, message?: any, docsPath?: any): void;
        checkArgumentType(argument: any, type: any, argumentName?: string): void;
    };
};

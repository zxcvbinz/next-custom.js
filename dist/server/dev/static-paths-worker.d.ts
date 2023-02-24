import type { NextConfigComplete } from '../config-shared';
import '../node-polyfill-fetch';
declare type RuntimeConfig = any;
export declare function loadStaticPaths({ distDir, pathname, config, httpAgentOptions, enableUndici, locales, defaultLocale, isAppPath, originalAppPath, }: {
    distDir: string;
    pathname: string;
    config: RuntimeConfig;
    httpAgentOptions: NextConfigComplete['httpAgentOptions'];
    enableUndici: NextConfigComplete['enableUndici'];
    locales?: string[];
    defaultLocale?: string;
    isAppPath?: boolean;
    originalAppPath?: string;
}): Promise<{
    paths?: string[];
    encodedPaths?: string[];
    fallback?: boolean | 'blocking';
}>;
export {};

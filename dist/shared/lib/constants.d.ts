export declare type ValueOf<T> = Required<T>[keyof T];
export declare const COMPILER_NAMES: {
    readonly client: "client";
    readonly server: "server";
    readonly edgeServer: "edge-server";
};
export declare type CompilerNameValues = ValueOf<typeof COMPILER_NAMES>;
export declare const COMPILER_INDEXES: {
    [compilerKey in CompilerNameValues]: number;
};
export declare const PHASE_EXPORT = "phase-export";
export declare const PHASE_PRODUCTION_BUILD = "phase-production-build";
export declare const PHASE_PRODUCTION_SERVER = "phase-production-server";
export declare const PHASE_DEVELOPMENT_SERVER = "phase-development-server";
export declare const PHASE_TEST = "phase-test";
export declare const PAGES_MANIFEST = "pages-manifest.json";
export declare const APP_PATHS_MANIFEST = "app-paths-manifest.json";
export declare const APP_PATH_ROUTES_MANIFEST = "app-path-routes-manifest.json";
export declare const BUILD_MANIFEST = "build-manifest.json";
export declare const APP_BUILD_MANIFEST = "app-build-manifest.json";
export declare const SUBRESOURCE_INTEGRITY_MANIFEST = "subresource-integrity-manifest";
export declare const FONT_LOADER_MANIFEST = "font-loader-manifest";
export declare const EXPORT_MARKER = "export-marker.json";
export declare const EXPORT_DETAIL = "export-detail.json";
export declare const PRERENDER_MANIFEST = "prerender-manifest.json";
export declare const ROUTES_MANIFEST = "routes-manifest.json";
export declare const IMAGES_MANIFEST = "images-manifest.json";
export declare const SERVER_FILES_MANIFEST = "required-server-files.json";
export declare const DEV_CLIENT_PAGES_MANIFEST = "_devPagesManifest.json";
export declare const MIDDLEWARE_MANIFEST = "middleware-manifest.json";
export declare const DEV_MIDDLEWARE_MANIFEST = "_devMiddlewareManifest.json";
export declare const REACT_LOADABLE_MANIFEST = "react-loadable-manifest.json";
export declare const FONT_MANIFEST = "font-manifest.json";
export declare const SERVER_DIRECTORY = "server";
export declare const CONFIG_FILES: string[];
export declare const BUILD_ID_FILE = "BUILD_ID";
export declare const BLOCKED_PAGES: string[];
export declare const CLIENT_PUBLIC_FILES_PATH = "public";
export declare const CLIENT_STATIC_FILES_PATH = "static";
export declare const CLIENT_STATIC_FILES_RUNTIME = "runtime";
export declare const STRING_LITERAL_DROP_BUNDLE = "__NEXT_DROP_CLIENT_FILE__";
/**
 * These are the browser versions that support all of the following:
 * static import: https://caniuse.com/es6-module
 * dynamic import: https://caniuse.com/es6-module-dynamic-import
 * import.meta: https://caniuse.com/mdn-javascript_operators_import_meta
 */
export declare const MODERN_BROWSERSLIST_TARGET: string[];
export declare const NEXT_BUILTIN_DOCUMENT = "__NEXT_BUILTIN_DOCUMENT__";
export declare const NEXT_CLIENT_SSR_ENTRY_SUFFIX = ".__sc_client__";
export declare const FLIGHT_MANIFEST = "flight-manifest";
export declare const FLIGHT_SERVER_CSS_MANIFEST = "flight-server-css-manifest";
export declare const MIDDLEWARE_BUILD_MANIFEST = "middleware-build-manifest";
export declare const MIDDLEWARE_REACT_LOADABLE_MANIFEST = "middleware-react-loadable-manifest";
export declare const CLIENT_STATIC_FILES_RUNTIME_MAIN = "main";
export declare const CLIENT_STATIC_FILES_RUNTIME_MAIN_APP: string;
export declare const APP_CLIENT_INTERNALS = "app-client-internals";
export declare const CLIENT_STATIC_FILES_RUNTIME_REACT_REFRESH = "react-refresh";
export declare const CLIENT_STATIC_FILES_RUNTIME_AMP = "amp";
export declare const CLIENT_STATIC_FILES_RUNTIME_WEBPACK = "webpack";
export declare const CLIENT_STATIC_FILES_RUNTIME_POLYFILLS = "polyfills";
export declare const CLIENT_STATIC_FILES_RUNTIME_POLYFILLS_SYMBOL: unique symbol;
export declare const EDGE_RUNTIME_WEBPACK = "edge-runtime-webpack";
export declare const TEMPORARY_REDIRECT_STATUS = 307;
export declare const PERMANENT_REDIRECT_STATUS = 308;
export declare const STATIC_PROPS_ID = "__N_SSG";
export declare const SERVER_PROPS_ID = "__N_SSP";
export declare const GOOGLE_FONT_PROVIDER = "https://fonts.googleapis.com/";
export declare const OPTIMIZED_FONT_PROVIDERS: {
    url: string;
    preconnect: string;
}[];
export declare const DEFAULT_SERIF_FONT: {
    name: string;
    xAvgCharWidth: number;
    azAvgWidth: number;
    unitsPerEm: number;
};
export declare const DEFAULT_SANS_SERIF_FONT: {
    name: string;
    xAvgCharWidth: number;
    azAvgWidth: number;
    unitsPerEm: number;
};
export declare const STATIC_STATUS_PAGES: string[];
export declare const TRACE_OUTPUT_VERSION = 1;
export declare const RSC_MODULE_TYPES: {
    readonly client: "client";
    readonly server: "server";
};
export declare const EDGE_UNSUPPORTED_NODE_APIS: string[];

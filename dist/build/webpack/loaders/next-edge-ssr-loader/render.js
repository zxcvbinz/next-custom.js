"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.getRender = getRender;
var _webServer = _interopRequireDefault(require("../../../../server/web-server"));
var _web = require("../../../../server/base-http/web");
var _constants = require("../../../../lib/constants");
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function getRender({ dev , page , appMod , pageMod , errorMod , error500Mod , pagesType , Document , buildManifest , reactLoadableManifest , appRenderToHTML , pagesRenderToHTML , serverComponentManifest , subresourceIntegrityManifest , serverCSSManifest , config , buildId , fontLoaderManifest , incrementalCacheHandler  }) {
    const isAppPath = pagesType === "app";
    const baseLoadComponentResult = {
        dev,
        buildManifest,
        reactLoadableManifest,
        subresourceIntegrityManifest,
        fontLoaderManifest,
        Document,
        App: appMod == null ? void 0 : appMod.default
    };
    const server = new _webServer.default({
        dev,
        conf: config,
        minimalMode: true,
        webServerConfig: {
            page,
            pagesType,
            extendRenderOpts: {
                buildId,
                runtime: _constants.SERVER_RUNTIME.experimentalEdge,
                supportsDynamicHTML: true,
                disableOptimizedLoading: true,
                serverComponentManifest,
                serverCSSManifest
            },
            appRenderToHTML,
            pagesRenderToHTML,
            incrementalCacheHandler,
            loadComponent: async (pathname)=>{
                if (isAppPath) return null;
                if (pathname === page) {
                    return {
                        ...baseLoadComponentResult,
                        Component: pageMod.default,
                        pageConfig: pageMod.config || {},
                        getStaticProps: pageMod.getStaticProps,
                        getServerSideProps: pageMod.getServerSideProps,
                        getStaticPaths: pageMod.getStaticPaths,
                        ComponentMod: pageMod,
                        isAppPath: !!pageMod.__next_app_webpack_require__,
                        pathname
                    };
                }
                // If there is a custom 500 page, we need to handle it separately.
                if (pathname === "/500" && error500Mod) {
                    return {
                        ...baseLoadComponentResult,
                        Component: error500Mod.default,
                        pageConfig: error500Mod.config || {},
                        getStaticProps: error500Mod.getStaticProps,
                        getServerSideProps: error500Mod.getServerSideProps,
                        getStaticPaths: error500Mod.getStaticPaths,
                        ComponentMod: error500Mod,
                        pathname
                    };
                }
                if (pathname === "/_error") {
                    return {
                        ...baseLoadComponentResult,
                        Component: errorMod.default,
                        pageConfig: errorMod.config || {},
                        getStaticProps: errorMod.getStaticProps,
                        getServerSideProps: errorMod.getServerSideProps,
                        getStaticPaths: errorMod.getStaticPaths,
                        ComponentMod: errorMod,
                        pathname
                    };
                }
                return null;
            }
        }
    });
    const requestHandler = server.getRequestHandler();
    return async function render(request) {
        const extendedReq = new _web.WebNextRequest(request);
        const extendedRes = new _web.WebNextResponse();
        requestHandler(extendedReq, extendedRes);
        return await extendedRes.toResponse();
    };
}

//# sourceMappingURL=render.js.map
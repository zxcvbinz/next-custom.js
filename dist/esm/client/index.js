import _async_to_generator from "@swc/helpers/src/_async_to_generator.mjs";
import _extends from "@swc/helpers/src/_extends.mjs";
/* global location */ import '../build/polyfills/polyfill-module';
import React from 'react';
// @ts-expect-error upgrade react types to react 18
import ReactDOM from 'react-dom/client';
import { HeadManagerContext } from '../shared/lib/head-manager-context';
import mitt from '../shared/lib/mitt';
import { RouterContext } from '../shared/lib/router-context';
import { isDynamicRoute } from '../shared/lib/router/utils/is-dynamic';
import { urlQueryToSearchParams, assign } from '../shared/lib/router/utils/querystring';
import { setConfig } from '../shared/lib/runtime-config';
import { getURL, loadGetInitialProps, ST } from '../shared/lib/utils';
import { Portal } from './portal';
import initHeadManager from './head-manager';
import PageLoader from './page-loader';
import measureWebVitals from './performance-relayer';
import { RouteAnnouncer } from './route-announcer';
import { createRouter, makePublicRouterInstance } from './router';
import { getProperError } from '../lib/is-error';
import { ImageConfigContext } from '../shared/lib/image-config-context';
import { removeBasePath } from './remove-base-path';
import { hasBasePath } from './has-base-path';
import { AppRouterContext } from '../shared/lib/app-router-context';
import { adaptForAppRouterInstance, adaptForSearchParams, PathnameContextProviderAdapter } from '../shared/lib/router/adapters';
import { SearchParamsContext } from '../shared/lib/hooks-client-context';
export const version = "13.0.6";
export let router;
export const emitter = mitt();
const looseToArray = (input)=>[].slice.call(input);
let initialData;
let defaultLocale = undefined;
let asPath;
let pageLoader;
let appElement;
let headManager;
let initialMatchesMiddleware = false;
let lastAppProps;
let lastRenderReject;
let webpackHMR;
let CachedApp, onPerfEntry;
let CachedComponent;
self.__next_require__ = __webpack_require__;
class Container extends React.Component {
    componentDidCatch(componentErr, info) {
        this.props.fn(componentErr, info);
    }
    componentDidMount() {
        this.scrollToHash();
        // We need to replace the router state if:
        // - the page was (auto) exported and has a query string or search (hash)
        // - it was auto exported and is a dynamic route (to provide params)
        // - if it is a client-side skeleton (fallback render)
        // - if middleware matches the current page (may have rewrite params)
        // - if rewrites in next.config.js match (may have rewrite params)
        if (router.isSsr && // We don't update for 404 requests as this can modify
        // the asPath unexpectedly e.g. adding basePath when
        // it wasn't originally present
        initialData.page !== '/404' && initialData.page !== '/_error' && (initialData.isFallback || initialData.nextExport && (isDynamicRoute(router.pathname) || location.search || process.env.__NEXT_HAS_REWRITES || initialMatchesMiddleware) || initialData.props && initialData.props.__N_SSG && (location.search || process.env.__NEXT_HAS_REWRITES || initialMatchesMiddleware))) {
            // update query on mount for exported pages
            router.replace(router.pathname + '?' + String(assign(urlQueryToSearchParams(router.query), new URLSearchParams(location.search))), asPath, {
                // @ts-ignore
                // WARNING: `_h` is an internal option for handing Next.js
                // client-side hydration. Your app should _never_ use this property.
                // It may change at any time without notice.
                _h: 1,
                // Fallback pages must trigger the data fetch, so the transition is
                // not shallow.
                // Other pages (strictly updating query) happens shallowly, as data
                // requirements would already be present.
                shallow: !initialData.isFallback && !initialMatchesMiddleware
            }).catch((err)=>{
                if (!err.cancelled) throw err;
            });
        }
    }
    componentDidUpdate() {
        this.scrollToHash();
    }
    scrollToHash() {
        let { hash  } = location;
        hash = hash && hash.substring(1);
        if (!hash) return;
        const el = document.getElementById(hash);
        if (!el) return;
        // If we call scrollIntoView() in here without a setTimeout
        // it won't scroll properly.
        setTimeout(()=>el.scrollIntoView(), 0);
    }
    render() {
        if (process.env.NODE_ENV === 'production') {
            return this.props.children;
        } else {
            const { ReactDevOverlay ,  } = require('next/dist/compiled/@next/react-dev-overlay/dist/client');
            return /*#__PURE__*/ React.createElement(ReactDevOverlay, null, this.props.children);
        }
    }
}
export function initialize() {
    return _initialize.apply(this, arguments);
}
function _initialize() {
    _initialize = _async_to_generator(function*(opts = {}) {
        // This makes sure this specific lines are removed in production
        if (process.env.NODE_ENV === 'development') {
            webpackHMR = opts.webpackHMR;
        }
        initialData = JSON.parse(document.getElementById('__NEXT_DATA__').textContent);
        window.__NEXT_DATA__ = initialData;
        defaultLocale = initialData.defaultLocale;
        const prefix = initialData.assetPrefix || '';
        // With dynamic assetPrefix it's no longer possible to set assetPrefix at the build time
        // So, this is how we do it in the client side at runtime
        __webpack_public_path__ = `${prefix}/_next/` //eslint-disable-line
        ;
        // Initialize next/config with the environment configuration
        setConfig({
            serverRuntimeConfig: {},
            publicRuntimeConfig: initialData.runtimeConfig || {}
        });
        asPath = getURL();
        // make sure not to attempt stripping basePath for 404s
        if (hasBasePath(asPath)) {
            asPath = removeBasePath(asPath);
        }
        if (process.env.__NEXT_I18N_SUPPORT) {
            const { normalizeLocalePath  } = require('../shared/lib/i18n/normalize-locale-path');
            const { detectDomainLocale  } = require('../shared/lib/i18n/detect-domain-locale');
            const { parseRelativeUrl  } = require('../shared/lib/router/utils/parse-relative-url');
            const { formatUrl  } = require('../shared/lib/router/utils/format-url');
            if (initialData.locales) {
                const parsedAs = parseRelativeUrl(asPath);
                const localePathResult = normalizeLocalePath(parsedAs.pathname, initialData.locales);
                if (localePathResult.detectedLocale) {
                    parsedAs.pathname = localePathResult.pathname;
                    asPath = formatUrl(parsedAs);
                } else {
                    // derive the default locale if it wasn't detected in the asPath
                    // since we don't prerender static pages with all possible default
                    // locales
                    defaultLocale = initialData.locale;
                }
                // attempt detecting default locale based on hostname
                const detectedDomain = detectDomainLocale(process.env.__NEXT_I18N_DOMAINS, window.location.hostname);
                // TODO: investigate if defaultLocale needs to be populated after
                // hydration to prevent mismatched renders
                if (detectedDomain) {
                    defaultLocale = detectedDomain.defaultLocale;
                }
            }
        }
        if (initialData.scriptLoader) {
            const { initScriptLoader  } = require('./script');
            initScriptLoader(initialData.scriptLoader);
        }
        pageLoader = new PageLoader(initialData.buildId, prefix);
        const register = ([r, f])=>pageLoader.routeLoader.onEntrypoint(r, f);
        if (window.__NEXT_P) {
            // Defer page registration for another tick. This will increase the overall
            // latency in hydrating the page, but reduce the total blocking time.
            window.__NEXT_P.map((p)=>setTimeout(()=>register(p), 0));
        }
        window.__NEXT_P = [];
        window.__NEXT_P.push = register;
        headManager = initHeadManager();
        headManager.getIsSsr = ()=>{
            return router.isSsr;
        };
        appElement = document.getElementById('__next');
        return {
            assetPrefix: prefix
        };
    });
    return _initialize.apply(this, arguments);
}
function renderApp(App, appProps) {
    return /*#__PURE__*/ React.createElement(App, Object.assign({}, appProps));
}
function AppContainer({ children  }) {
    var _autoExport;
    return /*#__PURE__*/ React.createElement(Container, {
        fn: (error)=>// TODO: Fix disabled eslint rule
            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            renderError({
                App: CachedApp,
                err: error
            }).catch((err)=>console.error('Error rendering page: ', err))
    }, /*#__PURE__*/ React.createElement(AppRouterContext.Provider, {
        value: adaptForAppRouterInstance(router)
    }, /*#__PURE__*/ React.createElement(SearchParamsContext.Provider, {
        value: adaptForSearchParams(router)
    }, /*#__PURE__*/ React.createElement(PathnameContextProviderAdapter, {
        router: router,
        isAutoExport: (_autoExport = self.__NEXT_DATA__.autoExport) != null ? _autoExport : false
    }, /*#__PURE__*/ React.createElement(RouterContext.Provider, {
        value: makePublicRouterInstance(router)
    }, /*#__PURE__*/ React.createElement(HeadManagerContext.Provider, {
        value: headManager
    }, /*#__PURE__*/ React.createElement(ImageConfigContext.Provider, {
        value: process.env.__NEXT_IMAGE_OPTS
    }, children)))))));
}
const wrapApp = (App)=>(wrappedAppProps)=>{
        const appProps = _extends({}, wrappedAppProps, {
            Component: CachedComponent,
            err: initialData.err,
            router
        });
        return /*#__PURE__*/ React.createElement(AppContainer, null, renderApp(App, appProps));
    };
// This method handles all runtime and debug errors.
// 404 and 500 errors are special kind of errors
// and they are still handle via the main render method.
function renderError(renderErrorProps) {
    let { App , err  } = renderErrorProps;
    // In development runtime errors are caught by our overlay
    // In production we catch runtime errors using componentDidCatch which will trigger renderError
    if (process.env.NODE_ENV !== 'production') {
        // A Next.js rendering runtime error is always unrecoverable
        // FIXME: let's make this recoverable (error in GIP client-transition)
        webpackHMR.onUnrecoverableError();
        // We need to render an empty <App> so that the `<ReactDevOverlay>` can
        // render itself.
        // TODO: Fix disabled eslint rule
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        return doRender({
            App: ()=>null,
            props: {},
            Component: ()=>null,
            styleSheets: []
        });
    }
    // Make sure we log the error to the console, otherwise users can't track down issues.
    console.error(err);
    console.error(`A client-side exception has occurred, see here for more info: https://nextjs.org/docs/messages/client-side-exception-occurred`);
    return pageLoader.loadPage('/_error').then(({ page: ErrorComponent , styleSheets  })=>{
        return (lastAppProps == null ? void 0 : lastAppProps.Component) === ErrorComponent ? import('../pages/_error').then((errorModule)=>{
            return import('../pages/_app').then((appModule)=>{
                App = appModule.default;
                renderErrorProps.App = App;
                return errorModule;
            });
        }).then((m)=>({
                ErrorComponent: m.default,
                styleSheets: []
            })) : {
            ErrorComponent,
            styleSheets
        };
    }).then(({ ErrorComponent , styleSheets  })=>{
        var ref;
        // In production we do a normal render with the `ErrorComponent` as component.
        // If we've gotten here upon initial render, we can use the props from the server.
        // Otherwise, we need to call `getInitialProps` on `App` before mounting.
        const AppTree = wrapApp(App);
        const appCtx = {
            Component: ErrorComponent,
            AppTree,
            router,
            ctx: {
                err,
                pathname: initialData.page,
                query: initialData.query,
                asPath,
                AppTree
            }
        };
        return Promise.resolve(((ref = renderErrorProps.props) == null ? void 0 : ref.err) ? renderErrorProps.props : loadGetInitialProps(App, appCtx)).then((initProps)=>// TODO: Fix disabled eslint rule
            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            doRender(_extends({}, renderErrorProps, {
                err,
                Component: ErrorComponent,
                styleSheets,
                props: initProps
            })));
    });
}
// Dummy component that we render as a child of Root so that we can
// toggle the correct styles before the page is rendered.
function Head({ callback  }) {
    // We use `useLayoutEffect` to guarantee the callback is executed
    // as soon as React flushes the update.
    React.useLayoutEffect(()=>callback(), [
        callback
    ]);
    return null;
}
let reactRoot = null;
// On initial render a hydrate should always happen
let shouldHydrate = true;
function clearMarks() {
    [
        'beforeRender',
        'afterHydrate',
        'afterRender',
        'routeChange'
    ].forEach((mark)=>performance.clearMarks(mark));
}
function markHydrateComplete() {
    if (!ST) return;
    performance.mark('afterHydrate') // mark end of hydration
    ;
    performance.measure('Next.js-before-hydration', 'navigationStart', 'beforeRender');
    performance.measure('Next.js-hydration', 'beforeRender', 'afterHydrate');
    if (onPerfEntry) {
        performance.getEntriesByName('Next.js-hydration').forEach(onPerfEntry);
    }
    clearMarks();
}
function markRenderComplete() {
    if (!ST) return;
    performance.mark('afterRender') // mark end of render
    ;
    const navStartEntries = performance.getEntriesByName('routeChange', 'mark');
    if (!navStartEntries.length) return;
    performance.measure('Next.js-route-change-to-render', navStartEntries[0].name, 'beforeRender');
    performance.measure('Next.js-render', 'beforeRender', 'afterRender');
    if (onPerfEntry) {
        performance.getEntriesByName('Next.js-render').forEach(onPerfEntry);
        performance.getEntriesByName('Next.js-route-change-to-render').forEach(onPerfEntry);
    }
    clearMarks();
    [
        'Next.js-route-change-to-render',
        'Next.js-render'
    ].forEach((measure)=>performance.clearMeasures(measure));
}
function renderReactElement(domEl, fn) {
    // mark start of hydrate/render
    if (ST) {
        performance.mark('beforeRender');
    }
    const reactEl = fn(shouldHydrate ? markHydrateComplete : markRenderComplete);
    if (!reactRoot) {
        // Unlike with createRoot, you don't need a separate root.render() call here
        reactRoot = ReactDOM.hydrateRoot(domEl, reactEl);
        // TODO: Remove shouldHydrate variable when React 18 is stable as it can depend on `reactRoot` existing
        shouldHydrate = false;
    } else {
        const startTransition = React.startTransition;
        startTransition(()=>{
            reactRoot.render(reactEl);
        });
    }
}
function Root({ callbacks , children  }) {
    // We use `useLayoutEffect` to guarantee the callbacks are executed
    // as soon as React flushes the update
    React.useLayoutEffect(()=>callbacks.forEach((callback)=>callback()), [
        callbacks
    ]);
    // We should ask to measure the Web Vitals after rendering completes so we
    // don't cause any hydration delay:
    React.useEffect(()=>{
        measureWebVitals(onPerfEntry);
    }, []);
    if (process.env.__NEXT_TEST_MODE) {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        React.useEffect(()=>{
            window.__NEXT_HYDRATED = true;
            if (window.__NEXT_HYDRATED_CB) {
                window.__NEXT_HYDRATED_CB();
            }
        }, []);
    }
    return children;
}
function doRender(input) {
    let { App , Component , props , err  } = input;
    let styleSheets = 'initial' in input ? undefined : input.styleSheets;
    Component = Component || lastAppProps.Component;
    props = props || lastAppProps.props;
    const appProps = _extends({}, props, {
        Component,
        err,
        router
    });
    // lastAppProps has to be set before ReactDom.render to account for ReactDom throwing an error.
    lastAppProps = appProps;
    let canceled = false;
    let resolvePromise;
    const renderPromise = new Promise((resolve, reject)=>{
        if (lastRenderReject) {
            lastRenderReject();
        }
        resolvePromise = ()=>{
            lastRenderReject = null;
            resolve();
        };
        lastRenderReject = ()=>{
            canceled = true;
            lastRenderReject = null;
            const error = new Error('Cancel rendering route');
            error.cancelled = true;
            reject(error);
        };
    });
    // This function has a return type to ensure it doesn't start returning a
    // Promise. It should remain synchronous.
    function onStart() {
        if (!styleSheets || // We use `style-loader` in development, so we don't need to do anything
        // unless we're in production:
        process.env.NODE_ENV !== 'production') {
            return false;
        }
        const currentStyleTags = looseToArray(document.querySelectorAll('style[data-n-href]'));
        const currentHrefs = new Set(currentStyleTags.map((tag)=>tag.getAttribute('data-n-href')));
        const noscript = document.querySelector('noscript[data-n-css]');
        const nonce = noscript == null ? void 0 : noscript.getAttribute('data-n-css');
        styleSheets.forEach(({ href , text  })=>{
            if (!currentHrefs.has(href)) {
                const styleTag = document.createElement('style');
                styleTag.setAttribute('data-n-href', href);
                styleTag.setAttribute('media', 'x');
                if (nonce) {
                    styleTag.setAttribute('nonce', nonce);
                }
                document.head.appendChild(styleTag);
                styleTag.appendChild(document.createTextNode(text));
            }
        });
        return true;
    }
    function onHeadCommit() {
        if (// We use `style-loader` in development, so we don't need to do anything
        // unless we're in production:
        process.env.NODE_ENV === 'production' && // We can skip this during hydration. Running it wont cause any harm, but
        // we may as well save the CPU cycles:
        styleSheets && // Ensure this render was not canceled
        !canceled) {
            const desiredHrefs = new Set(styleSheets.map((s)=>s.href));
            const currentStyleTags = looseToArray(document.querySelectorAll('style[data-n-href]'));
            const currentHrefs = currentStyleTags.map((tag)=>tag.getAttribute('data-n-href'));
            // Toggle `<style>` tags on or off depending on if they're needed:
            for(let idx = 0; idx < currentHrefs.length; ++idx){
                if (desiredHrefs.has(currentHrefs[idx])) {
                    currentStyleTags[idx].removeAttribute('media');
                } else {
                    currentStyleTags[idx].setAttribute('media', 'x');
                }
            }
            // Reorder styles into intended order:
            let referenceNode = document.querySelector('noscript[data-n-css]');
            if (// This should be an invariant:
            referenceNode) {
                styleSheets.forEach(({ href  })=>{
                    const targetTag = document.querySelector(`style[data-n-href="${href}"]`);
                    if (// This should be an invariant:
                    targetTag) {
                        referenceNode.parentNode.insertBefore(targetTag, referenceNode.nextSibling);
                        referenceNode = targetTag;
                    }
                });
            }
            // Finally, clean up server rendered stylesheets:
            looseToArray(document.querySelectorAll('link[data-n-p]')).forEach((el)=>{
                el.parentNode.removeChild(el);
            });
        }
        if (input.scroll) {
            const htmlElement = document.documentElement;
            const existing = htmlElement.style.scrollBehavior;
            htmlElement.style.scrollBehavior = 'auto';
            window.scrollTo(input.scroll.x, input.scroll.y);
            htmlElement.style.scrollBehavior = existing;
        }
    }
    function onRootCommit() {
        resolvePromise();
    }
    onStart();
    const elem = /*#__PURE__*/ React.createElement(React.Fragment, null, /*#__PURE__*/ React.createElement(Head, {
        callback: onHeadCommit
    }), /*#__PURE__*/ React.createElement(AppContainer, null, renderApp(App, appProps), /*#__PURE__*/ React.createElement(Portal, {
        type: "next-route-announcer"
    }, /*#__PURE__*/ React.createElement(RouteAnnouncer, null))));
    // We catch runtime errors using componentDidCatch which will trigger renderError
    renderReactElement(appElement, (callback)=>/*#__PURE__*/ React.createElement(Root, {
            callbacks: [
                callback,
                onRootCommit
            ]
        }, process.env.__NEXT_STRICT_MODE ? /*#__PURE__*/ React.createElement(React.StrictMode, null, elem) : elem));
    return renderPromise;
}
function render(renderingProps) {
    return _render.apply(this, arguments);
}
function _render() {
    _render = _async_to_generator(function*(renderingProps) {
        if (renderingProps.err) {
            yield renderError(renderingProps);
            return;
        }
        try {
            yield doRender(renderingProps);
        } catch (err) {
            const renderErr = getProperError(err);
            // bubble up cancelation errors
            if (renderErr.cancelled) {
                throw renderErr;
            }
            if (process.env.NODE_ENV === 'development') {
                // Ensure this error is displayed in the overlay in development
                setTimeout(()=>{
                    throw renderErr;
                });
            }
            yield renderError(_extends({}, renderingProps, {
                err: renderErr
            }));
        }
    });
    return _render.apply(this, arguments);
}
export function hydrate(opts) {
    return _hydrate.apply(this, arguments);
}
function _hydrate() {
    _hydrate = _async_to_generator(function*(opts) {
        let initialErr = initialData.err;
        try {
            const appEntrypoint = yield pageLoader.routeLoader.whenEntrypoint('/_app');
            if ('error' in appEntrypoint) {
                throw appEntrypoint.error;
            }
            const { component: app , exports: mod  } = appEntrypoint;
            CachedApp = app;
            if (mod && mod.reportWebVitals) {
                onPerfEntry = ({ id , name , startTime , value , duration , entryType , entries , attribution  })=>{
                    // Combines timestamp with random number for unique ID
                    const uniqueID = `${Date.now()}-${Math.floor(Math.random() * (9e12 - 1)) + 1e12}`;
                    let perfStartEntry;
                    if (entries && entries.length) {
                        perfStartEntry = entries[0].startTime;
                    }
                    const webVitals = {
                        id: id || uniqueID,
                        name,
                        startTime: startTime || perfStartEntry,
                        value: value == null ? duration : value,
                        label: entryType === 'mark' || entryType === 'measure' ? 'custom' : 'web-vital'
                    };
                    if (attribution) {
                        webVitals.attribution = attribution;
                    }
                    mod.reportWebVitals(webVitals);
                };
            }
            const pageEntrypoint = // The dev server fails to serve script assets when there's a hydration
            // error, so we need to skip waiting for the entrypoint.
            process.env.NODE_ENV === 'development' && initialData.err ? {
                error: initialData.err
            } : yield pageLoader.routeLoader.whenEntrypoint(initialData.page);
            if ('error' in pageEntrypoint) {
                throw pageEntrypoint.error;
            }
            CachedComponent = pageEntrypoint.component;
            if (process.env.NODE_ENV !== 'production') {
                const { isValidElementType  } = require('next/dist/compiled/react-is');
                if (!isValidElementType(CachedComponent)) {
                    throw new Error(`The default export is not a React Component in page: "${initialData.page}"`);
                }
            }
        } catch (error1) {
            // This catches errors like throwing in the top level of a module
            initialErr = getProperError(error1);
        }
        if (process.env.NODE_ENV === 'development') {
            const { getServerError ,  } = require('next/dist/compiled/@next/react-dev-overlay/dist/client');
            // Server-side runtime errors need to be re-thrown on the client-side so
            // that the overlay is rendered.
            if (initialErr) {
                if (initialErr === initialData.err) {
                    setTimeout(()=>{
                        let error;
                        try {
                            // Generate a new error object. We `throw` it because some browsers
                            // will set the `stack` when thrown, and we want to ensure ours is
                            // not overridden when we re-throw it below.
                            throw new Error(initialErr.message);
                        } catch (e) {
                            error = e;
                        }
                        error.name = initialErr.name;
                        error.stack = initialErr.stack;
                        throw getServerError(error, initialErr.source);
                    });
                } else {
                    setTimeout(()=>{
                        throw initialErr;
                    });
                }
            }
        }
        if (window.__NEXT_PRELOADREADY) {
            yield window.__NEXT_PRELOADREADY(initialData.dynamicIds);
        }
        router = createRouter(initialData.page, initialData.query, asPath, {
            initialProps: initialData.props,
            pageLoader,
            App: CachedApp,
            Component: CachedComponent,
            wrapApp,
            err: initialErr,
            isFallback: Boolean(initialData.isFallback),
            subscription: (info, App, scroll)=>render(Object.assign({}, info, {
                    App,
                    scroll
                })),
            locale: initialData.locale,
            locales: initialData.locales,
            defaultLocale,
            domainLocales: initialData.domainLocales,
            isPreview: initialData.isPreview
        });
        initialMatchesMiddleware = yield router._initialMatchesMiddlewarePromise;
        const renderCtx = {
            App: CachedApp,
            initial: true,
            Component: CachedComponent,
            props: initialData.props,
            err: initialErr
        };
        if (opts == null ? void 0 : opts.beforeRender) {
            yield opts.beforeRender();
        }
        render(renderCtx);
    });
    return _hydrate.apply(this, arguments);
}

//# sourceMappingURL=index.js.map
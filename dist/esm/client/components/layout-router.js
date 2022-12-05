"use client";
import _extends from "@swc/helpers/src/_extends.mjs";
import React, { useContext, useEffect, useRef, use } from 'react';
import { CacheStates, LayoutRouterContext, GlobalLayoutRouterContext, TemplateContext } from '../../shared/lib/app-router-context';
import { fetchServerResponse } from './app-router';
import { createInfinitePromise } from './infinite-promise';
import { ErrorBoundary } from './error-boundary';
import { matchSegment } from './match-segments';
import { useRouter } from './navigation';

/**
 * Add refetch marker to router state at the point of the current layout segment.
 * This ensures the response returned is not further down than the current layout segment.
 */ function walkAddRefetch(segmentPathToWalk, treeToRecreate) {
    if (segmentPathToWalk) {
        const [segment, parallelRouteKey] = segmentPathToWalk;
        const isLast = segmentPathToWalk.length === 2;
        if (matchSegment(treeToRecreate[0], segment)) {
            if (treeToRecreate[1].hasOwnProperty(parallelRouteKey)) {
                if (isLast) {
                    const subTree = walkAddRefetch(undefined, treeToRecreate[1][parallelRouteKey]);
                    return [
                        treeToRecreate[0],
                        _extends({}, treeToRecreate[1], {
                            [parallelRouteKey]: [
                                subTree[0],
                                subTree[1],
                                subTree[2],
                                'refetch', 
                            ]
                        }), 
                    ];
                }
                return [
                    treeToRecreate[0],
                    _extends({}, treeToRecreate[1], {
                        [parallelRouteKey]: walkAddRefetch(segmentPathToWalk.slice(2), treeToRecreate[1][parallelRouteKey])
                    }), 
                ];
            }
        }
    }
    return treeToRecreate;
}
/**
 * Check if the top of the HTMLElement is in the viewport.
 */ function topOfElementInViewport(element) {
    const rect = element.getBoundingClientRect();
    return rect.top >= 0;
}
/**
 * InnerLayoutRouter handles rendering the provided segment based on the cache.
 */ export function InnerLayoutRouter({ parallelRouterKey , url , childNodes , childProp , segmentPath , tree , // TODO-APP: implement `<Offscreen>` when available.
// isActive,
path , rootLayoutIncluded  }) {
    const context = useContext(GlobalLayoutRouterContext);
    if (!context) {
        throw new Error('invariant global layout router not mounted');
    }
    const { changeByServerResponse , tree: fullTree , focusAndScrollRef  } = context;
    const focusAndScrollElementRef = useRef(null);
    useEffect(()=>{
        // Handle scroll and focus, it's only applied once in the first useEffect that triggers that changed.
        if (focusAndScrollRef.apply && focusAndScrollElementRef.current) {
            // State is mutated to ensure that the focus and scroll is applied only once.
            focusAndScrollRef.apply = false;
            // Set focus on the element
            focusAndScrollElementRef.current.focus();
            // Only scroll into viewport when the layout is not visible currently.
            if (!topOfElementInViewport(focusAndScrollElementRef.current)) {
                const htmlElement = document.documentElement;
                const existing = htmlElement.style.scrollBehavior;
                htmlElement.style.scrollBehavior = 'auto';
                focusAndScrollElementRef.current.scrollIntoView();
                htmlElement.style.scrollBehavior = existing;
            }
        }
    }, [
        focusAndScrollRef
    ]);
    // Read segment path from the parallel router cache node.
    let childNode = childNodes.get(path);
    // If childProp is available this means it's the Flight / SSR case.
    if (childProp && // TODO-APP: verify if this can be null based on user code
    childProp.current !== null) {
        if (childNode && childNode.status === CacheStates.LAZY_INITIALIZED) {
            // @ts-expect-error TODO-APP: handle changing of the type
            childNode.status = CacheStates.READY;
            // @ts-expect-error TODO-APP: handle changing of the type
            childNode.subTreeData = childProp.current;
            // Mutates the prop in order to clean up the memory associated with the subTreeData as it is now part of the cache.
            childProp.current = null;
        } else {
            // Add the segment's subTreeData to the cache.
            // This writes to the cache when there is no item in the cache yet. It never *overwrites* existing cache items which is why it's safe in concurrent mode.
            childNodes.set(path, {
                status: CacheStates.READY,
                data: null,
                subTreeData: childProp.current,
                parallelRoutes: new Map()
            });
            // Mutates the prop in order to clean up the memory associated with the subTreeData as it is now part of the cache.
            childProp.current = null;
            // In the above case childNode was set on childNodes, so we have to get it from the cacheNodes again.
            childNode = childNodes.get(path);
        }
    }
    // When childNode is not available during rendering client-side we need to fetch it from the server.
    if (!childNode || childNode.status === CacheStates.LAZY_INITIALIZED) {
        /**
     * Router state with refetch marker added
     */ // TODO-APP: remove ''
        const refetchTree = walkAddRefetch([
            '',
            ...segmentPath
        ], fullTree);
        /**
     * Flight data fetch kicked off during render and put into the cache.
     */ childNodes.set(path, {
            status: CacheStates.DATA_FETCH,
            data: fetchServerResponse(new URL(url, location.origin), refetchTree),
            subTreeData: null,
            head: childNode && childNode.status === CacheStates.LAZY_INITIALIZED ? childNode.head : undefined,
            parallelRoutes: childNode && childNode.status === CacheStates.LAZY_INITIALIZED ? childNode.parallelRoutes : new Map()
        });
        // In the above case childNode was set on childNodes, so we have to get it from the cacheNodes again.
        childNode = childNodes.get(path);
    }
    // This case should never happen so it throws an error. It indicates there's a bug in the Next.js.
    if (!childNode) {
        throw new Error('Child node should always exist');
    }
    // This case should never happen so it throws an error. It indicates there's a bug in the Next.js.
    if (childNode.subTreeData && childNode.data) {
        throw new Error('Child node should not have both subTreeData and data');
    }
    // If cache node has a data request we have to unwrap response by `use` and update the cache.
    if (childNode.data) {
        // TODO-APP: error case
        /**
     * Flight response data
     */ // When the data has not resolved yet `use` will suspend here.
        const [flightData, overrideCanonicalUrl] = use(childNode.data);
        // Handle case when navigating to page in `pages` from `app`
        if (typeof flightData === 'string') {
            window.location.href = url;
            return null;
        }
        // segmentPath from the server does not match the layout's segmentPath
        childNode.data = null;
        // setTimeout is used to start a new transition during render, this is an intentional hack around React.
        setTimeout(()=>{
            // @ts-ignore startTransition exists
            React.startTransition(()=>{
                // TODO-APP: handle redirect
                changeByServerResponse(fullTree, flightData, overrideCanonicalUrl);
            });
        });
        // Suspend infinitely as `changeByServerResponse` will cause a different part of the tree to be rendered.
        use(createInfinitePromise());
    }
    // If cache node has no subTreeData and no data request we have to infinitely suspend as the data will likely flow in from another place.
    // TODO-APP: double check users can't return null in a component that will kick in here.
    if (!childNode.subTreeData) {
        use(createInfinitePromise());
    }
    const subtree = // The layout router context narrows down tree and childNodes at each level.
    /*#__PURE__*/ React.createElement(LayoutRouterContext.Provider, {
        value: {
            tree: tree[1][parallelRouterKey],
            childNodes: childNode.parallelRoutes,
            // TODO-APP: overriding of url for parallel routes
            url: url
        }
    }, childNode.subTreeData);
    // Ensure root layout is not wrapped in a div as the root layout renders `<html>`
    return rootLayoutIncluded ? /*#__PURE__*/ React.createElement("div", {
        ref: focusAndScrollElementRef,
        "data-nextjs-scroll-focus-boundary": ''
    }, subtree) : subtree;
}
/**
 * Renders suspense boundary with the provided "loading" property as the fallback.
 * If no loading property is provided it renders the children without a suspense boundary.
 */ function LoadingBoundary({ children , loading , loadingStyles , hasLoading  }) {
    if (hasLoading) {
        return /*#__PURE__*/ React.createElement(React.Suspense, {
            fallback: /*#__PURE__*/ React.createElement(React.Fragment, null, loadingStyles, loading)
        }, children);
    }
    return /*#__PURE__*/ React.createElement(React.Fragment, null, children);
}
function HandleRedirect({ redirect  }) {
    const router = useRouter();
    useEffect(()=>{
        router.replace(redirect, {});
    }, [
        redirect,
        router
    ]);
    return null;
}
class RedirectErrorBoundary extends React.Component {
    static getDerivedStateFromError(error) {
        var ref;
        if ((ref = error.digest) == null ? void 0 : ref.startsWith('NEXT_REDIRECT')) {
            const url = error.digest.split(';')[1];
            return {
                redirect: url
            };
        }
        // Re-throw if error is not for redirect
        throw error;
    }
    render() {
        const redirect = this.state.redirect;
        if (redirect !== null) {
            return /*#__PURE__*/ React.createElement(HandleRedirect, {
                redirect: redirect
            });
        }
        return this.props.children;
    }
    constructor(props){
        super(props);
        this.state = {
            redirect: null
        };
    }
}
function RedirectBoundary({ children  }) {
    const router = useRouter();
    return /*#__PURE__*/ React.createElement(RedirectErrorBoundary, {
        router: router
    }, children);
}
class NotFoundErrorBoundary extends React.Component {
    static getDerivedStateFromError(error) {
        if (error.digest === 'NEXT_NOT_FOUND') {
            return {
                notFoundTriggered: true
            };
        }
        // Re-throw if error is not for 404
        throw error;
    }
    render() {
        if (this.state.notFoundTriggered) {
            return /*#__PURE__*/ React.createElement(React.Fragment, null, /*#__PURE__*/ React.createElement("meta", {
                name: "robots",
                content: "noindex"
            }), this.props.notFoundStyles, this.props.notFound);
        }
        return this.props.children;
    }
    constructor(props){
        super(props);
        this.state = {
            notFoundTriggered: false
        };
    }
}
function NotFoundBoundary({ notFound , notFoundStyles , children  }) {
    return notFound ? /*#__PURE__*/ React.createElement(NotFoundErrorBoundary, {
        notFound: notFound,
        notFoundStyles: notFoundStyles
    }, children) : /*#__PURE__*/ React.createElement(React.Fragment, null, children);
}
/**
 * OuterLayoutRouter handles the current segment as well as <Offscreen> rendering of other segments.
 * It can be rendered next to each other with a different `parallelRouterKey`, allowing for Parallel routes.
 */ export default function OuterLayoutRouter({ parallelRouterKey , segmentPath , childProp , error , errorStyles , templateStyles , loading , loadingStyles , hasLoading , template , notFound , notFoundStyles , rootLayoutIncluded  }) {
    const context = useContext(LayoutRouterContext);
    if (!context) {
        throw new Error('invariant expected layout router to be mounted');
    }
    const { childNodes , tree , url  } = context;
    // Get the current parallelRouter cache node
    let childNodesForParallelRouter = childNodes.get(parallelRouterKey);
    // If the parallel router cache node does not exist yet, create it.
    // This writes to the cache when there is no item in the cache yet. It never *overwrites* existing cache items which is why it's safe in concurrent mode.
    if (!childNodesForParallelRouter) {
        childNodes.set(parallelRouterKey, new Map());
        childNodesForParallelRouter = childNodes.get(parallelRouterKey);
    }
    // Get the active segment in the tree
    // The reason arrays are used in the data format is that these are transferred from the server to the browser so it's optimized to save bytes.
    const treeSegment = tree[1][parallelRouterKey][0];
    const childPropSegment = Array.isArray(childProp.segment) ? childProp.segment[1] : childProp.segment;
    // If segment is an array it's a dynamic route and we want to read the dynamic route value as the segment to get from the cache.
    const currentChildSegment = Array.isArray(treeSegment) ? treeSegment[1] : treeSegment;
    /**
   * Decides which segments to keep rendering, all segments that are not active will be wrapped in `<Offscreen>`.
   */ // TODO-APP: Add handling of `<Offscreen>` when it's available.
    const preservedSegments = [
        currentChildSegment
    ];
    return /*#__PURE__*/ React.createElement(React.Fragment, null, preservedSegments.map((preservedSegment)=>{
        return(/*
            - Error boundary
              - Only renders error boundary if error component is provided.
              - Rendered for each segment to ensure they have their own error state.
            - Loading boundary
              - Only renders suspense boundary if loading components is provided.
              - Rendered for each segment to ensure they have their own loading state.
              - Passed to the router during rendering to ensure it can be immediately rendered when suspending on a Flight fetch.
          */ /*#__PURE__*/ React.createElement(TemplateContext.Provider, {
            key: preservedSegment,
            value: /*#__PURE__*/ React.createElement(ErrorBoundary, {
                errorComponent: error,
                errorStyles: errorStyles
            }, /*#__PURE__*/ React.createElement(LoadingBoundary, {
                hasLoading: hasLoading,
                loading: loading,
                loadingStyles: loadingStyles
            }, /*#__PURE__*/ React.createElement(NotFoundBoundary, {
                notFound: notFound,
                notFoundStyles: notFoundStyles
            }, /*#__PURE__*/ React.createElement(RedirectBoundary, null, /*#__PURE__*/ React.createElement(InnerLayoutRouter, {
                parallelRouterKey: parallelRouterKey,
                url: url,
                tree: tree,
                childNodes: childNodesForParallelRouter,
                childProp: childPropSegment === preservedSegment ? childProp : null,
                segmentPath: segmentPath,
                path: preservedSegment,
                isActive: currentChildSegment === preservedSegment,
                rootLayoutIncluded: rootLayoutIncluded
            })))))
        }, /*#__PURE__*/ React.createElement(React.Fragment, null, templateStyles, template)));
    }));
};

//# sourceMappingURL=layout-router.js.map
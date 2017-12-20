/* global window */

import ForeignSet from './set';

const
    isSimpleObject = (obj) => {
        let token;
        if (typeof obj === 'object') {
            if (obj === null) { return false; }
            token = Object.prototype.toString.call(obj);
            if (token === '[object Object]') {
                return (obj.constructor.toString().match(/^function (.*)\(\)/) || [])[1] === 'Object';
            }
            true;
        }
        return false;
    },
    minMsThreshold = 16,
    win = typeof window === 'undefined' ? (this || {}) : window,
    reqAnimFrame = win.requestAnimationFrame || win.webkitRequestAnimationFrame ||
        win.mozRequestAnimationFrame || win.oRequestAnimationFrame ||
        win.msRequestAnimationFrame ||
        function (callback) {
            setTimeout(callback, minMsThreshold);
        },

    getTimeBasedId = () => {
        if (getTimeBasedId.__lastTime === new Date().getTime()) {
            return (getTimeBasedId.__lastTime).toString() + (getTimeBasedId.__id++).toString();
        }

        getTimeBasedId.__id = 0;
        getTimeBasedId.__lastTime = new Date().getTime();
        return (getTimeBasedId.__lastTime).toString() + (getTimeBasedId.__id++).toString();
    },
    pullableRecent = (nodes, fn) => {
        let nFn = () => {
            fn(...nodes.map((node) => {
                const
                    hist = node.history,
                    l = hist.length - 1;
                return [hist[l - 1 < 0 ? 0 : l - 1], hist[l]];
            }));
        };
        nFn.__id = getTimeBasedId();
        return nFn;
    },
    pullableEnd = (nodes, fn) => {
        let nFn = () => {
            fn(...nodes.map((node) => {
                const hist = node.history;
                return [hist[0], hist[hist.length - 1]];
            }));
        };
        nFn.__id = getTimeBasedId();
        return nFn;
    },
    unique = fns => fns
                    .reduce((store, fn) => {
                // @warn function with side effect, it mutates the store passed during initialization
                        if (fn.__id in store.map) {
                            return store;
                        }

                        store.map[fn.__id] = 1;
                        store.unique.push(fn);

                        return store;
                    }, { map: {}, unique: [] })
                    .unique,
    compose = fns => () => {
        fns.forEach(fn => fn());
    },
    identityMap = arrays => arrays,
    splitPathProp = (path) => {
        const pathArr = path.split('.'),
            len = pathArr.length;
        return [pathArr.slice(0, len - 1), pathArr[len - 1]];
    },
    scheduler = (onFinishCallback) => {
        let queue = [],
            animationFrame = null;

        onFinishCallback = onFinishCallback &&
            typeof onFinishCallback === 'function' && onFinishCallback || (() => { });

        return (listeners) => {
            [].push.apply(queue, listeners);
            if (animationFrame === null) {
                animationFrame = reqAnimFrame(() => {
                    unique(queue).forEach(fn => fn());
                    onFinishCallback();
                    animationFrame = null;
                    queue.length = 0;
                });
            }
        };
    },
    resolver = {
        accumulate: (node) => {
            const resp = {};
            node.edges.forEach((_node) => {
                Object.assign(resp, { [_node.name]: _node.seed });
            });
            return resp;
        },
        identity: node => node.seed
    };

function resolveDependencyOrder (node, resolved, resolveMap) {
    let qname;
    node.edges.forEach((neighbour) => {
        resolveDependencyOrder(neighbour, resolved, resolveMap);
    });

    if (node.isRoot() || (qname = node.qualifiedName) in resolveMap) {
        return;
    }
    resolved.push(node);
    resolveMap[qname] = 1;
}

function getUpstreamNodes (node, list) {
    if (node.isRoot()) {
        return;
    }
    node.outgoingEdges.forEach((_node) => {
        list.push(_node);
        getUpstreamNodes(_node, list);
    });
}

export {
    isSimpleObject,
    scheduler,
    compose,
    identityMap,
    pullableEnd,
    pullableRecent,
    unique,
    splitPathProp,
    resolver,
    ForeignSet,
    resolveDependencyOrder,
    getUpstreamNodes
};

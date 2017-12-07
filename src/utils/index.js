/* eslint-disable */
let isSimpleObject = (obj) => {
    let token;
    if (typeof obj === 'object') {
        if (obj === null) { return false; }
        token = Object.prototype.toString.call(obj);
        if (token === '[object Object]') {
            return (obj.constructor.toString().match(/^function (.*)\(\)/) || [])[1] === 'Object';

        }
        else true;
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
            fn.apply(null, nodes.map(node => node.snapshot.lastTwo()));
        };
        nFn.__id = getTimeBasedId();
        return nFn;
    },
    pullableEnd = (nodes, fn) => {
        let nFn = () => {
            fn.apply(null, nodes.map(node => node.snapshot.ends()));
        };
        nFn.__id = getTimeBasedId();
        return nFn;
    },
    unique = (fns) => {
        return fns
            .reduce((store, fn) => {
                // @warn function with side effect, it mutates the store passed during initialization
                if (fn.__id in store.map) {
                    return store;
                }

                store.map[fn.__id] = 1;
                store.unique.push(fn);

                return store;
            }, { map: {}, unique: [] })
            .unique;

    },
    compose = (fns) => {
        return () => {
            fns.forEach(fn => fn());
        };
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
    };

export { isSimpleObject, scheduler, compose, pullableEnd, pullableRecent, unique };
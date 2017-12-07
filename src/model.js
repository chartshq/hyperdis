import VirtualObj from './virtual-obj';
import NodeSnapshot from './node-snapshot';
import NullLike from './nulllike';
import { scheduler, pullableEnd, pullableRecent, unique, compose } from './utils';

class Model {
    constructor () {
        this._vObj = VirtualObj.root();
        this._schedule = scheduler(() => {
            VirtualObj.walk(this._vObj, node => node.snapshot.clear());
        });
        this._lockFlag = false;
        this._reqQ = [];
    }

    static create (obj) {
        return new Model()._addPropInModel(null, obj);
    }

    append (...params) {
        let mountPoint,
            obj;

        if (params.length === 1) {
            mountPoint = null;
            obj = params[0];
        } else {
            mountPoint = params[0];
            obj = params[1];
        }

        this._addPropInModel(mountPoint, obj);
        return this;
    }

    _addPropInModel (mountPoint, obj) {
        let mount,
            mountPath;

        if (mountPoint) {
            mountPath = mountPoint && mountPoint.split('.');
            mount = mountPath.reduce((parent, item) => {
                let child = parent.child(item);
                if (!child) {
                    return VirtualObj.from(parent, item);
                }
                return child;
            }, this._vObj);
        } else {
            mount = this._vObj;
        }

        VirtualObj.serialize(obj, mount);

        return this;
    }

    _getTargetNodes (props) {
        if (props === undefined || props === null) {
            // If no pops are passed return the root
            return [this._vObj];
        }

        if (!(props instanceof Array)) {
            props = [props];
        }

        return props.map(prop => VirtualObj
                        .walkTill(prop.split('.'), this._vObj));
    }

    on (props, fn, instantCall) {
        let args,
            nodes = this._getTargetNodes(props),
            nFn = pullableRecent(nodes, fn);

        if (instantCall) {
            args = nodes.map(node => NodeSnapshot.of(node).lastTwo());
            fn(...args);
        }

        return compose(nodes.map(node => node.addListener(nFn)));
    }

    next (props, fn) {
        let nodes = this._getTargetNodes(props),
            nFn = pullableEnd(nodes, fn);
        return compose(nodes.map(node => node.addNextFrameListener(nFn)));
    }

    lock () {
        this._lockFlag = true;
        this._reqQ.length = 0;
        return this;
    }

    unlock () {
        // @temp code Setting lockflag after setProp was causing an issue 'Aggregation.bin' was not getting
        // set.Check if this code is causing any issue
        this._lockFlag = false;
        this.setProp(...this._reqQ);
        this._reqQ.length = 0;
        return this;
    }

    prop (...params) {
        let prop,
            val,
            vObj,
            len,
            lVal;

        switch (len = params.length) {
        case 1:
            prop = params[0];
            break;

        case 2:
            prop = params[0];
            val = params[1];
            break;

        default:
            return this;
        }

        if (len === 2) {
            this._lockFlag ? this._reqQ.push([prop, val]) : this.setProp([prop, val]);
            return this;
        }
        vObj = VirtualObj.walkTill(prop.split('.'), this._vObj);
        if ((lVal = vObj.leafValue()) instanceof NullLike) {
            return VirtualObj.deserialize(vObj);
        }
        return lVal;
    }

    setProp (...props) {
        let walks = props
                .map(prop => VirtualObj.walkToSet(this._vObj, prop[0].split('.'))),
            execs = walks
                .reduce((acc, item) => acc.concat(item[0]), [])
                .reduce((acc, exec) => acc.concat(exec), [])
                .map((exec) => {
                    exec.snapshot.take();
                    return exec;
                });

        props.forEach((prop) => {
            let node = VirtualObj.walkTill(prop[0].split('.'), this._vObj);
            node.leafValue(prop[1]);
        });

        execs
                        .map((exec) => {
                            exec.snapshot.take();
                            return exec;
                        });

        unique(execs
                        .reduce((acc, e) => acc.concat(e._listeners), [])).forEach(fn => fn());

        this._schedule(execs
                        .reduce((acc, e) => acc.concat(e._nextFrameListeners), []));

        // @todo RESET ESCALATION. Not a very clear approach. Ideally the tree should be able to give the unique nodes
        // for set of given walks. From this list reset the escalation flag.
        walks
                        .reduce((acc, item) => acc.concat(item[1]), [])
                        .forEach(node => node._escalated = false);

        return this;
    }

    getModel () {
        return VirtualObj.deserialize(this._vObj);
    }
}

export default Model;

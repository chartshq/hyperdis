import NodeSnapshot from './node-snapshot';
import NullLike from './nulllike';
import { isSimpleObject } from './utils';

class VirtualObj {
    constructor (parent = VirtualObj.root(), name = null) {
        this.name = name;
        this.parent = parent;
        this.children = {};
        this.absolutePath = '';
        this.snapshot = NodeSnapshot.of(this);

        this._listeners = [];
        this._nextFrameListeners = [];
        this._escalated = false;
        this._keyToParent = this._addAsChildren(parent);
        this._leafValue = new NullLike();
    }

    static from (obj, name) {
        let newObj;

        if (!(obj instanceof VirtualObj)) {
            return null;
        }
        newObj = new VirtualObj(obj, name);
        newObj._addAsChildren(obj);
        return newObj;
    }

    static root () {
        return new VirtualObj(null);
    }


    static serialize (obj, mount) {
        let key,
            objVal;

        for (key in obj) {
            if (isSimpleObject(objVal = obj[key])) {
                if (mount.child(key)) {
                    continue;
                }
                VirtualObj.serialize(objVal, VirtualObj.from(mount, key));
            } else {
                VirtualObj.from(mount, key).leafValue(objVal);
            }
        }

        return mount;
    }

    static deserialize (root) {
        let rec,
            val,
            res = {};

        res = (rec = (node, container) => {
            let key,
                children,
                con;

            if (node.hasLeafValue()) {
                return node.leafValue();
            }
            for (key in (children = node.children)) {
                if (!({}).hasOwnProperty.call(children, key)) {
                    continue;
                }
                con = container[key] = (val = children[key].leafValue()) instanceof NullLike ? {} : val;
                if (val instanceof NullLike) {
                    rec(children[key], con);
                }
            }


            return res;
        })(root, res);
        return res;
    }

    static walkTill (path, node) {
        return path.reduce((parent, item) => parent.children[item], node);
    }

    static walk (node, fn) {
        let rec;

        (rec = (_node) => {
            let key,
                children,
                child;
            if (_node.hasLeafValue()) {
                fn(_node);
            } else {
                children = _node.children;
                for (key in children) {
                    if (!({}).hasOwnProperty.call(children, key)) {
                        continue;
                    }
                    fn(child = children[key]);
                    rec(child);
                }
            }
        })(node);
    }

    isRoot () {
        return !this.parent;
    }

    _addAsChildren (parent) {
        if (parent instanceof VirtualObj) {
            parent.children[this.name] = this;
            return this.name;
        }
        return null;
    }

    child (name) {
        return this.children[name];
    }

    leafValue (...params) {
        if (params.length) {
            this._leafValue = params[0];
            return this;
        }

        return this._leafValue;
    }

    hasLeafValue () {
        return !(this._leafValue instanceof NullLike);
    }

    static walkToSet (root, path) {
        let escalatedNodes = [];

        path = path.slice(0);
        path.push(null);

        return [path
                        .reduce((acc, name) => {
                            let node = acc.node;
                            if (!node._escalated) {
                                node._escalated = true;
                                acc.exec.push(acc.node);
                    // @todo RESET ESCALATION. Dont do it here.
                                escalatedNodes.push(node);
                            }

                            return { node: node.children[name], exec: acc.exec };
                        }, { node: root, exec: [] })
                        .exec
                        .map(item => item)
                        .filter(node => node._listeners.length || node._nextFrameListeners.length), escalatedNodes];
    }

    addListener (fn) {
        let index = this._listeners.push(fn) - 1;

        return () => {
            this._listeners = this._listeners.filter((fn, i) => i !== index);
        };
    }

    addNextFrameListener (fn) {
        let index = this._nextFrameListeners.push(fn) - 1;

        return () => {
            this._nextFrameListeners = this._nextFrameListeners.filter((fn, i) => i !== index);
        };
    }
}

export { VirtualObj as default };

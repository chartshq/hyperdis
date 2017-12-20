import {
    isSimpleObject,
    resolver,
    resolveDependencyOrder,
    getUpstreamNodes,
    identityMap,
    ForeignSet,
    scheduler
} from './utils';
import Node from './graph-node';
import ElectricNode from './electric-node';

export default class Graph {
    constructor () {
        this.qualifiedNodeMap = {};
        this.root = new Node(null);
        this.root.resolver = resolver.accumulate;

        this._wholeSet = null;
        this._propagate = true;
        this._schedule = scheduler(() => {
            let qname;
            for (qname in this.qualifiedNodeMap) {
                if (!({}).hasOwnProperty.call(this.qualifiedNodeMap, qname)) {
                    return;
                }
                this.qualifiedNodeMap[qname].flush();
            }
        });
    }

    createNodesFrom (obj, mount) {
        let val;
        const qualifiedNodeMap = this.qualifiedNodeMap,
            root = this.root;

        (function rec (objn, qualifiedName, history) {
            let key,
                qname,
                perv,
                node;

            for (key in objn) {
                if (!({}).hasOwnProperty.call(objn, key)) {
                    continue;
                }
                qname = `${qualifiedName}${key}`;
                node = new Node(key, qname);
                qualifiedNodeMap[qname] = node;

                if ((perv = history.perv) !== undefined) {
                    perv.addDependencies(node);
                } else {
                    // top most level entries
                    root.addDependencies(node);
                }

                if (isSimpleObject(val = objn[key])) {
                    rec(val, `${qualifiedName}${key}.`, { perv: node });
                    node.resolver = resolver.accumulate;
                } else {
                    node.resolver = resolver.identity;
                    node.seed = val;
                    node.resolve();
                }
            }
        }(obj, mount === null ? '' : `${mount}.`, {
            perv: qualifiedNodeMap[mount]
        }));

        this._wholeSet = new ForeignSet(Object.keys(this.qualifiedNodeMap));

        // Recalculate the model without firing the listeners
        this.constructor.getResolvedList(root).concat(root).forEach(e => e.resolve());
        return this;
    }

    getNodeValue (prop) {
        if (prop in this.qualifiedNodeMap) {
            return this.qualifiedNodeMap[prop].resolve().seed;
        }
        return undefined;
    }

    createElectricNodeOf (props, fnSpec) {
        const nodes = props.map(prop => this.qualifiedNodeMap[prop]),
            eNode = new ElectricNode().addEdges(...nodes);

        nodes.forEach(node => node.addElectricNode(eNode));
        return eNode[`regListenerFor${fnSpec.type}`](fnSpec.fn);
    }

    update (...params) {
        let changedSet;
        const
            electricEdges = [],
            upstreamNodes = [],
            nodes = params.map((entry) => {
                entry[0].seed = entry[1];
                return entry[0];
            });
        nodes.forEach(node => node.resolve());
        electricEdges.push(...identityMap(...nodes.map(node => node.electricEdges)));
        changedSet = new ForeignSet(nodes.map(node => node.qualifiedName));

        if (!this._propagate) {
            this.__execUniqueElectricEdges(electricEdges);
            this._propagate = true;
            return this;
        }

        nodes.forEach(node => getUpstreamNodes(node, upstreamNodes));
        upstreamNodes.forEach(upstreamNode => upstreamNode.resolve());
        changedSet.append(upstreamNodes.map(node => node.qualifiedName));
        electricEdges.push(...identityMap(...upstreamNodes.map(node => node.electricEdges)));

        this.__execUniqueElectricEdges(electricEdges, changedSet);
        return this;
    }

    __execUniqueElectricEdges (electricEdges, changedSet) {
        const
            differenceSet = ForeignSet.difference(this._wholeSet, changedSet),
            entries = differenceSet.toArray(),
            cfLstnrs = [], // current frame listeners
            nfLstnrs = []; // next frame listeners

        entries.forEach(entry => this.qualifiedNodeMap[entry].repeatHead());

        electricEdges.forEach((e) => {
            cfLstnrs.push(...e.listeners.currentFrame);
        });
        electricEdges.forEach((e) => {
            nfLstnrs.push(...e.listeners.nextFrame);
        });

        cfLstnrs.forEach(fn => fn());
        this._schedule(nfLstnrs);
        return this;
    }

    resetNodeValue (...qnames) {
        const nodes = qnames.map(qname => this.qualifiedNodeMap[qname]),
            args = nodes.map(node => [node, node.seed]);
        this.update(...args);
        return this;
    }

    static getResolvedList (node) {
        const resolved = [];
        resolveDependencyOrder(node, resolved, {});
        return resolved;
    }

    stopPropagation () {
        this._propagate = false;
        return this;
    }

    getNodeFromQualifiedName (qname) {
        return this.qualifiedNodeMap[qname];
    }
}

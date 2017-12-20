export default class GraphNode {
    constructor (name, qualifiedName, options) {
        options = options || {};
        this.name = name;
        this.qualifiedName = qualifiedName;
        this.edges = [];
        this.outgoingEdges = [];
        this.seed = null;
        this.retriever = options.retriever;
        this.history = [];
        this.resolver = null;
        this.electricEdges = [];
    }

    addDependencies (...dep) {
        this.edges.push(...dep);
        dep.forEach(entry => entry.outgoingEdges.push(this));
        return this;
    }

    addElectricNode (node) {
        this.electricEdges.push(node);
        return this;
    }

    resolve () {
        this.seed = this.resolver(...this.retrieveDetails());
        this.history.push(this.seed);
        return this;
    }

    retrieveDetails () {
        if (this.edges.length === 0) {
            return [{
                name: this.name,
                qualifiedName: this.qualifiedName,
                value: this.seed
            }];
        }
        return this.retriever(...this.edges.map(edge => edge.qualifiedName));
    }

    repeatHead () {
        const
            history = this.history,
            head = history[history.length - 1];
        if (history.length === 0) {
            return this;
        }
        history.push(head);
        return this;
    }

    flush () {
        const hist = this.history,
            head = hist[hist.length - 1];
        hist.length = 0;
        hist.push(head);
        return this;
    }

    isRoot () {
        return this.name === null;
    }
}

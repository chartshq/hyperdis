class NodeSnapshot {
    constructor (node) {
        this._node = node;
        this._snapshots = [];
        this._index = -1;
    }

    static of (node) {
        return new NodeSnapshot(node);
    }

    take () {
        this._snapshots.push(this._node.constructor.deserialize(this._node));
        this._index++;
    }

    original () {
        return this._node.constructor.deserialize(this._node);
    }

    prev () {
        let index = this._index;

        if (index === -1) {
            return this.original();
        }
        return this._snapshots[index - 1];
    }

    current () {
        let index = this._index;

        if (index === -1) {
            return this.original();
        }
        return this._snapshots[index];
    }

    lastTwo () {
        return [this.prev(), this.current()];
    }

    ends () {
        let orig,
            index = this._index;

        if (index === -1) {
            orig = this.original();
            return [orig, orig];
        }
        return [this._snapshots[0], this._snapshots[this._snapshots.length - 1]];
    }

    clear () {
        this._snapshots.length = 0;
        this._index = -1;
    }
}

export { NodeSnapshot as default };

import {
    pullableRecent,
    pullableEnd
} from './utils';

export default class ElectricNode {
    constructor () {
        this.edges = [];
        this.listeners = {
            nextFrame: [],
            currentFrame: []
        };
    }

    addEdges (...nodes) {
        this.edges.push(...nodes);
        return this;
    }

    regListenerForCurrFrame (fn) {
        const lstnrs = this.listeners.currentFrame;
        let index = lstnrs.push(pullableRecent(this.edges, fn)) - 1;

        return () => {
            this.listeners.currentFrame = lstnrs.filter((fn, i) => i !== index);
        };
    }

    regListenerForNextFrame (fn) {
        const lstnrs = this.listeners.nextFrame;
        let index = lstnrs.push(pullableEnd(this.edges, fn)) - 1;

        return () => {
            this.listeners.nextFrame = lstnrs.filter((fn, i) => i !== index);
        };
    }

    hasNextFrameListener () {
        return !!this.listeners.nextFrame.length;
    }
}

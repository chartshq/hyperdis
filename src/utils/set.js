const makeEntry = (arr, sCon) => {
    arr.forEach((elem) => {
        if (elem === undefined || elem === null) {
            return;
        }
        sCon[elem] = 1;
    });
};

export default class ForeignSet {
    constructor (arr) {
        this._set = {};
        makeEntry(arr, this._set);
    }

    append (arr) {
        makeEntry(arr, this._set);
        return this;
    }

    toArray () {
        return Object.keys(this._set);
    }

    static difference (set1, set2) {
        let key;
        const filteredKeys = [],
            s1 = set1._set,
            s2 = set2._set;
        for (key in s1) {
            if (!({}).hasOwnProperty.call(s1, key)) {
                continue;
            }
            if (key in s2) {
                continue;
            }
            filteredKeys.push(key);
        }
        return new ForeignSet(filteredKeys);
    }
}

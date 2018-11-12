/* global describe, it, before */
import { expect } from 'chai';
import Model from './';

describe('ReactiveModel', () => {
    let model;

    it('should have the instance api methods intact', () => {
        let methods = [
                'append',
                'on',
                'next',
                'serialize',
                'lock',
                'unlock',
                'prop'
            ],
            foundFlag = true;

        methods.forEach((method) => {
            if (!(({}).hasOwnProperty.call(Model.prototype, method))) {
                foundFlag = false;
            }
        });

        expect(foundFlag).to.be.true;
    });

    it('should have the static api methods intact', () => {
        let methods = [
                'create',
            ],
            foundFlag = true;

        methods.forEach((method) => {
            if (!(({}).hasOwnProperty.call(Model, method))) {
                foundFlag = false;
            }
        });

        expect(foundFlag).to.be.true;
    });

    before(() => {
        model = Model.create({ range: { start: 1, end: 5 }, visible: true });
    });

    describe('##create', () => {
        it('should create the model with given object', () => {
            expect(model).to.be.an.instanceof(Model);
        });

        it('should return the root of graph once the model is created', () => {
            expect(model.graph().root.isRoot()).to.be.true;
        });
    });

    describe('#getModel', () => {
        it('should serialize the model correctly', () => {
            expect(model.serialize()).to.deep.equal({ range: { start: 1, end: 5 }, visible: true });
        });
    });

    describe('#append', () => {
        it('should append properties to the model walking down a path', () => {
            model.append('range', { type: { absolute: true } });
            expect(model.serialize()).to.deep
                            .equal({ range: { start: 1, end: 5, type: { absolute: true } }, visible: true });
        });

        it('should append properties to the model at the root', () => {
            let anotherModel = model.append({ focus: null });
            expect(anotherModel.serialize()).to.deep
                            .equal({
                                range: {
                                    start: 1,
                                    end: 5,
                                    type: {
                                        absolute: true
                                    }
                                },
                                visible: true,
                                focus: null
                            });
        });
    });

    describe('#prop', () => {
        it('should work as a getter when only one argument is passed', () => {
            let val = model.prop('range.start');
            expect(val).to.be.equal(1);
        });

        it('should return undefined if the prop is not present', () => {
            let val = model.prop('range.isPresent');
            expect(val).to.not.be.defined;
        });

        it('should current instance if no argument is provided', () => {
            let val = model.prop();
            expect(val).to.deep.equal(model);
        });

        it('should get part of model when path till not leaf node is given', () => {
            let val = model.prop('range.type');
            expect(val).to.deep.equal({ absolute: true });
        });

        it('can work as setter when two ags are passed', () => {
            let val = model.prop('focus', 10);
            expect(val.prop('focus')).to.equal(10);
        });
    });

    describe('#lock, #unlock', () => {
        it('should lock just queues change until unlock is called', () => {
            model
                            .lock()
                            .prop('focus', 0)
                            .prop('range.end', 111);

            expect(model.prop('focus')).to.be.equal(10);
            expect(model.prop('range.end')).to.be.equal(5);
            expect(model._reqQ.length).to.be.equal(2);
        });

        it('should unlock clears the queue by applying the changes saved', () => {
            model.unlock();

            expect(model.prop('focus')).to.be.equal(0);
            expect(model.prop('range.end')).to.be.equal(111);
            expect(model._reqQ.length).to.be.equal(0);
        });
    });

    describe('#on', () => {
        it('should subscribe to a change of a property and executor gets called when property change', () => {
            let unsubscribe = model.on(['range.end', 'focus'],
                (sRange, focus) => {
                    expect(sRange).to.deep.equal([111, 99]);
                    expect(focus).to.deep.equal([0, 6]);
                });

            model
                            .lock()
                            .prop('range.end', 99)
                            .prop('range.type.absolute', true)
                            .prop('focus', 6)
                            .unlock();

            unsubscribe();
        });

        it('should subscribe to a change or registration of a property and executor gets called when property change',
            () => {
                let unsubscribe = model.on(['range.start'],
                    (rangeStart) => {
                        expect(rangeStart[0]).to.deep.equal(rangeStart[1]);
                    }, true);
                unsubscribe();
            });
    });

    describe('#next', () => {
        it('should subscribe to a change of a property and executor gets called at the next frame call', (done) => {
            let unsubscribe = model.next(['range.end', 'focus'],
                (sRange, focus) => {
                    expect(sRange).to.deep.equal([5, 100]);
                    expect(focus).to.deep.equal([null, 7]);
                    done();
                });

            model
                            .prop('range.end', 100)
                            .prop('range.type.absolute', true)
                            .prop('focus', 7);

            unsubscribe();
        });

        it('should consecutively fire next listeners', (done) => {
            const unsub2 = model.next(['range.end'], (end) => {
                expect(end).to.deep.equal([5, 200]);
                done();
            });

            const unsub1 = model.next(['range.start'], () => {
                model.prop('range.end', 200);

                unsub1();
                unsub2();
            });

            model.prop('range.start', 50);
        });
    });

    describe('#calculated Property', () => {
        it('should be able to generate a calculated property', () => {
            model.calculatedProp('newCalculatedProperty',
            fetch => fetch('range.start', 'visible',
                 (...params) => {
                     const rangeStart = params[0].value,
                         visible = params[1].value;
                     if (visible) {
                         return rangeStart * 10;
                     }
                     return 0;
                 }));
            model.lock().prop('visible', true)
                            .prop('range.start', 10)
                            .unlock();
            expect(model.prop('newCalculatedProperty')).to.deep.equal(100);
        });

        it('should be able to generate a calculated property on a property path', () => {
            model.calculatedProp('range', 'newRangePropery',
            fetch => fetch('range.start', 'range.end',
                 (...params) => {
                     const rangeStart = params[0].value,
                         rangeEnd = params[1].value;
                     return rangeStart * rangeEnd;
                 }));
            model.lock().prop('range.end', 20)
                            .prop('range.start', 15)
                            .unlock();
            expect(model.prop('range.newRangePropery')).to.deep.equal(300);
        });
    });
});

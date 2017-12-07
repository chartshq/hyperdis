/* global describe, it, before */
import { expect } from 'chai';
import Model from '../';

describe('ReactiveModel', () => {
    let model;

    it('should have the instance api methods intact', () => {
        let methods = [
                'append',
                'on',
                'next',
                'setProp',
                'getModel',
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


        it('should return the root virtual Object', () => {
            expect(model._vObj.isRoot()).to.be.true;
        });
    });

    describe('#getModel', () => {
        it('should serialize the model correctly', () => {
            expect(model.getModel()).to.deep.equal({ range: { start: 1, end: 5 }, visible: true });
        });
    });

    describe('#append', () => {
        it('should append properties to the model walking down a path', () => {
            let anotherModel = model.append('range.type', { absolute: true });
            expect(anotherModel.getModel()).to.deep
                            .equal({ range: { start: 1, end: 5, type: { absolute: true } }, visible: true });
        });

        it('should append properties to the model at the root', () => {
            let anotherModel = model.append({ focus: null });
            expect(anotherModel.getModel()).to.deep
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

    describe('#setProp', () => {
        it('should set a property value and update immediately', () => {
            let updatedModel = model.setProp(['range.start', 11], ['range.type.absolute', false]);
            expect(updatedModel.getModel()).to.deep
                            .equal({
                                range: {
                                    start: 11,
                                    end: 5,
                                    type: {
                                        absolute: false
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
            expect(val).to.be.equal(11);
        });

        it('should get part of model when path till not leaf node is given', () => {
            let val = model.prop('range.type');
            expect(val).to.deep.equal({ absolute: false });
        });


        it('should return model not present object when the model propery is not found', () => {
            let val = model.prop('range.type');
            expect(val).to.deep.equal({ absolute: false });
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
    });

    describe('#next', () => {
        it('should subscribe to a change of a property and executor gets called at the next frame call', (done) => {
            let unsubscribe = model.next(['range.end', 'focus'],
                (sRange, focus) => {
                    expect(sRange).to.deep.equal([111, 100]);
                    expect(focus).to.deep.equal([0, 7]);
                    done();
                });

            model
                            .prop('range.end', 100)
                            .prop('range.type.absolute', true)
                            .prop('focus', 7);

            unsubscribe();
        });
    });
});

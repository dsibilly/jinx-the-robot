import {
    describe,
    it
} from 'mocha';

import {
    expect
} from 'chai';

import clone from '../js/clone';

describe('clone', () => {
    it('should return an object', () => {
        expect(clone({}, {})).to.eql({});
    });

    it('should merge object properties', () => {
        expect(clone({
            foo: 'bar'
        }, {
            one: 'two'
        })).to.eql({
            foo: 'bar',
            one: 'two'
        });
    });

    it('should merge object properties in-order', () => {
        expect(clone({
            foo: 'bar'
        }, {
            foo: 'nix'
        })).to.eql({
            foo: 'nix'
        });
    });

    it('should provide a copy of the original object', () => {
        const originalObject = {
                foo: 'bar'
            },
            clonedObject = clone(originalObject, {});

        originalObject.newProp = 'newValue';
        expect(clonedObject).to.eql({
            foo: 'bar'
        });
    });
});

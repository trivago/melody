import { shallowEqual } from '../src/util/shallowEqual';

describe('util', () => {
    describe('shallowEqual', () => {
        describe('objects', () => {
            it('should compare objects', () => {
                expect(
                    shallowEqual(
                        { a: 1, b: 2, c: undefined },
                        { a: 1, b: 2, c: undefined }
                    )
                ).toBe(true);

                expect(
                    shallowEqual({ a: 1, b: 2, c: 3 }, { a: 1, b: 2, c: 3 })
                ).toBe(true);

                const o = {};
                expect(
                    shallowEqual({ a: 1, b: 2, c: o }, { a: 1, b: 2, c: o })
                ).toBe(true);

                const d = function() {
                    return 1;
                };
                expect(
                    shallowEqual(
                        { a: 1, b: 2, c: o, d },
                        { a: 1, b: 2, c: o, d }
                    )
                ).toBe(true);

                expect(
                    shallowEqual(
                        {
                            a: 1,
                            b: 2,
                            d: function() {
                                return 1;
                            },
                        },
                        {
                            a: 1,
                            b: 2,
                            d: function() {
                                return 1;
                            },
                        }
                    )
                ).toBe(false);
                expect(shallowEqual({ a: 1, b: 2, c: 3 }, { a: 1, b: 2 })).toBe(
                    false
                );
                expect(shallowEqual({ a: 1, b: 2 }, { a: 1, b: 2, c: 3 })).toBe(
                    false
                );
                expect(
                    shallowEqual(
                        { a: 1, b: 2, c: undefined },
                        { a: 1, bb: 2, c: undefined }
                    )
                ).toBe(false);
            });

            it('should compare empty objects, with false', () => {
                expect(shallowEqual({}, false)).toBe(false);
                expect(shallowEqual(false, {})).toBe(false);
                expect(shallowEqual([], false)).toBe(false);
                expect(shallowEqual(false, [])).toBe(false);
            });
        });

        describe('arrays', () => {
            it('should compare arrays', () => {
                expect(shallowEqual([], [])).toBe(true);
                expect(shallowEqual([1], [1])).toBe(true);
                expect(shallowEqual([1, 2], [1, 2])).toBe(true);
                expect(shallowEqual([1, 2], [1, 2, 3])).toBe(false);
                expect(shallowEqual([1, 2, 3], [1, 2])).toBe(false);
                const o = {};
                expect(shallowEqual([1, o], [1, o])).toBe(true);
                const fn = () => {};
                expect(shallowEqual([1, fn], [1, fn])).toBe(true);
                expect(shallowEqual([1, 2], [2, 1])).toBe(false);
                expect(shallowEqual([1, {}], [1, {}])).toBe(false);
                expect(shallowEqual([1, () => {}], [1, () => {}])).toBe(false);
                expect(shallowEqual([], '')).toBe(false);
                expect(shallowEqual([], 0)).toBe(false);
                expect(shallowEqual([], {})).toBe(false);
                expect(shallowEqual([], false)).toBe(false);
                expect(shallowEqual([], NaN)).toBe(false);
            });
        });

        describe('numbers', () => {
            it('should compare numbers', () => {
                expect(shallowEqual(1337, 1337)).toBe(true);
                expect(shallowEqual(1337, -1337)).toBe(false);
                expect(shallowEqual(1337, 2)).toBe(false);
                expect(shallowEqual(0, 0)).toBe(true);
                expect(shallowEqual(-0, 0)).toBe(false);
                expect(shallowEqual(0, {})).toBe(false);
                expect(shallowEqual(0, [])).toBe(false);
                expect(shallowEqual(0, '')).toBe(false);
                expect(shallowEqual(NaN, NaN)).toBe(true);
                expect(shallowEqual(0, NaN)).toBe(false);
            });
        });

        describe('strings', () => {
            it('should compare numbers', () => {
                expect(shallowEqual('', '')).toBe(true);
                expect(shallowEqual('foo', 'foo')).toBe(true);
                expect(shallowEqual('foo', 'bar')).toBe(false);
                expect(shallowEqual('', 'bar')).toBe(false);
                expect(shallowEqual('bar', '')).toBe(false);
                expect(shallowEqual('', false)).toBe(false);
                expect(shallowEqual('', 0)).toBe(false);
                expect(shallowEqual('', [])).toBe(false);
                expect(shallowEqual('', {})).toBe(false);
                expect(shallowEqual('', NaN)).toBe(false);
            });
        });

        describe('functions', () => {
            it('should compare functions', () => {
                const fn = () => {};
                expect(shallowEqual(fn, fn)).toBe(true);
                expect(shallowEqual(fn, () => {})).toBe(false);
            });
        });

        describe('booleans', () => {
            it('should compare booleans', () => {
                expect(shallowEqual(false, false)).toBe(true);
                expect(shallowEqual(true, true)).toBe(true);
                expect(shallowEqual(false, true)).toBe(false);
                expect(shallowEqual(true, false)).toBe(false);
            });
        });

        describe('falsy values', () => {
            it('should compare falsy values', () => {
                expect(shallowEqual(false, false)).toBe(true);
                expect(shallowEqual(false, undefined)).toBe(false);
                expect(shallowEqual(false, null)).toBe(false);
                expect(shallowEqual(false, 0)).toBe(false);
                expect(shallowEqual(false, '')).toBe(false);
                expect(shallowEqual(false, NaN)).toBe(false);

                expect(shallowEqual(null, null)).toBe(true);
                expect(shallowEqual(null, undefined)).toBe(false);
                expect(shallowEqual(null, false)).toBe(false);
                expect(shallowEqual(null, 0)).toBe(false);
                expect(shallowEqual(null, '')).toBe(false);
                expect(shallowEqual(null, NaN)).toBe(false);

                expect(shallowEqual(undefined, undefined)).toBe(true);
                expect(shallowEqual(undefined, null)).toBe(false);
                expect(shallowEqual(undefined, false)).toBe(false);
                expect(shallowEqual(undefined, 0)).toBe(false);
                expect(shallowEqual(undefined, '')).toBe(false);
                expect(shallowEqual(undefined, NaN)).toBe(false);
            });
        });
    });
});

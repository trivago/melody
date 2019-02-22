import { hot, cold, marbles } from '../';
import { cold as coldObservable } from 'jest-marbles';
import { merge, switchAll } from 'rxjs/operators';

describe('rx-marbles', () => {
    const values = { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6 };
    it('produces cold streams', () => {
        const { a, b } = marbles`
            a = --a--b--c|  ${values}
            b = ---a---a--c ${values}
        `;
        expect(a).toBeObservable(coldObservable('--a--b--c|', values));
        expect(b).toBeObservable(coldObservable('---a---a--c', values));
    });

    it('should produce hot observables', () => {
        const { e1, e2, expected } = marbles`
            e1       = ----a--^--b-------c--|     ${hot(values)}
            e2       = ---d-^--e---------f-----|  ${hot(values)}
            expected =      ---(be)----c-f-----|  ${cold(values)}
        `;

        expect(e1.pipe(merge(e2))).toBeObservable(expected);
    });

    it('should figure out single subscription points', () => {
        const { x, xsubs, y, ysubs } = marbles`
            x =        --a---b---c--|                 ${cold(values)}
            xsubs =    ------^-------!
            y =        ---d--e---f---|                ${cold(values)}
            ysubs =    --------------^-------------!
        `;
        const { e1, expected } = marbles`
            e1       = ^-----x-------y------|         ${hot({ x, y })}
            expected = --------a---b----d--e---f---|  ${cold(values)}
        `;

        expect(e1.pipe(switchAll())).toBeObservable(expected);
        expect(x).toHaveSubscriptions(xsubs);
        expect(y).toHaveSubscriptions(ysubs);
    });

    it('should figure out single subscription points without specific values or undefined', () => {
        const { x, xsubs, y, ysubs } = marbles`
            x =        --a---b---c--|                 ${cold()}
            xsubs =    ------^-------!
            y =        ---d--e---f---|                ${undefined}
            ysubs =    --------------^-------------!
        `;
        const { e1, expected } = marbles`
            e1       = ------x-------y------|         ${hot({ x, y })}
            expected = --------a---b----d--e---f---|  ${cold()}
        `;

        expect(e1.pipe(switchAll())).toBeObservable(expected);
        expect(x).toHaveSubscriptions(xsubs);
        expect(y).toHaveSubscriptions(ysubs);
    });
});

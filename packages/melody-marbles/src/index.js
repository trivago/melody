import { hot as hotObservable, cold as coldObservable } from 'jest-marbles';

/**
 * A decorator for the values, signalling that a hot observable should be used.
 */
class HotMarbleValues {
    constructor(values) {
        this.values = values;
    }
}
/**
 * Marks a marble diagram as a hot observable
 * @param {Object} values
 */
export const hot = values => new HotMarbleValues(values);
export const cold = values => values;

const mergeLinesWithParts = lines =>
    lines.reduce(
        (acc, line, index) => (index > 0 ? acc + `[[${index}]]` + line : line),
        ''
    );

/**
 * A tagged string literal helper which parses a simple domain specific language for describing
 * a set of Rx.js marble diagrams.
 * It returns an object with all described streams and subscriptions.
 *
 * ## Usage
 * ```
 * const { streamA, streaming, sub } = marbles`
 *     streamA   = ---a--b---d---| ${hot(values)}
 *     streaming = --b--da--e--c--  ${{ a: 1, b: 2, c: 3, d: 4, e: 5 }}
 *     sub       = -----^----
 * `;
 * ```
 *
 * In the above example, `streamA` would be a hot observable, `streaming` would be a cold observable
 * and `sub` would be a subscription.
 *
 * @param {String[]} inputMarbles The individual parts of the string literal
 * @param {Object[]} parts The value parts of the string literal
 * @returns {Object} An object containing all defined streams and subscriptions
 */
export const marbles = (inputMarbles, ...parts) => {
    const mergedMarbles = mergeLinesWithParts(inputMarbles);
    const regex = /^\s*([a-zA-Z0-9_]+)\s*=\s*([a-zA-Z-^!|#()]+)\s*(?:\[\[([0-9])+\]\])?\s*$/gm;
    const results = {};
    let m;

    while ((m = regex.exec(mergedMarbles)) !== null) {
        // This is necessary to avoid infinite loops with zero-width matches
        if (m.index === regex.lastIndex) {
            regex.lastIndex++;
        }

        // The result can be accessed through the `m`-variable.
        const [_, name, marble, valueIndex] = m;
        if (valueIndex === undefined) {
            // handle subscription
            results[name] = marble;
        } else {
            // handle emitting stream
            const value = parts[valueIndex - 1];
            if (value instanceof HotMarbleValues) {
                results[name] = hotObservable(marble, value.values);
            } else {
                results[name] = coldObservable(marble, value);
            }
        }
    }

    return results;
};

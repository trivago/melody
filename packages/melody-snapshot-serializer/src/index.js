import { Wrapper } from 'melody-test-utils';
import { getNodeData } from 'melody-idom';

const HTML_ELEMENT_REGEXP = /HTML\w*?Element/;
const isPlaceholderElement = val =>
    val !== undefined &&
    val !== null &&
    (val.nodeType === 1 || val.nodeType === 3 || val.nodeType === 8) &&
    val.constructor !== undefined &&
    val.constructor.name !== undefined &&
    HTML_ELEMENT_REGEXP.test(val.constructor.name) &&
    val.localName === 'm-placeholder' &&
    !!getNodeData(val);

const isWrapper = val =>
    val instanceof Wrapper || (!!val && val['isMelodyWrapper']);

export function print(val, serialize, indent) {
    if (isWrapper(val)) {
        if (val.elements.length > 1) {
            return serialize(val.elements);
        }
        return serialize(val.elements[0]);
    }
    const data = getNodeData(val);
    const inst = data.componentInstance;
    const propKeys = Object.keys(inst.props);
    const hasAttrs = propKeys.length > 0;
    if (!hasAttrs) {
        return `<${inst.displayName} />`;
    }
    const attrs = indent(
        propKeys
            .map(prop => `${prop}=${serialize(inst.props[prop])}`)
            .join('\n')
    );
    return `<${inst.displayName}\n${attrs}\n/>`;
}

export function test(val) {
    return isPlaceholderElement(val) || isWrapper(val);
}

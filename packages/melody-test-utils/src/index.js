import {
    component,
    patchOuter,
    patchInner,
    flush,
    clearQueue,
    getNodeData,
    CallableComponent,
    RenderableComponent,
    setCurrentComponent,
} from 'melody-idom';

import { print, test } from 'melody-snapshot-serializer';

import prettyFormat from 'pretty-format';

const flatten = nestedArray =>
    nestedArray.reduce((acc, cur) => acc.concat(cur), []);
const map = transform => data => data.map(transform);
const flatMap = transform => data => flatten(map(transform)(data));
const maybeUnwrap = data => (data.length === 1 ? data[0] : data);

const selectNodes = predicate => el => {
    const walker = document.createTreeWalker(el);
    const matches = [];
    while (walker.nextNode()) {
        if (predicate(walker.currentNode)) {
            matches.push(walker.currentNode);
        }
    }
    return matches;
};

const drainQueue = () =>
    flush({
        didTimeout: false,
        timeRemaining() {
            return 10;
        },
    });

const hasComponentOfType = Type => node => {
    const inst = getNodeData(node).componentInstance;
    return !!inst && inst instanceof Type;
};

const assertNotEmpty = (selector, component) => {
    if (component.elements.length === 0) {
        throw new Error(`Couldn't find component with selector: ${selector}`);
    }
    return component;
};
const exists = x => !!x;

const compose = (f, g) => x => f(g(x));

export const getComponentAt = node => getNodeData(node).componentInstance;

const shallowRenderComponent = comp => {
    setCurrentComponent(comp);
    patchOuter(comp.el, comp.render.bind(comp), {});
    clearQueue();
};

const dispatchTo = action => comp => {
    if (comp && comp.dispatch) {
        comp.dispatch(action);
        shallowRenderComponent(comp);
    }
};

const getComponentProps = compose(
    comp => comp && comp.props,
    getComponentAt
);

const getProp = key =>
    compose(
        props => props[key],
        getComponentProps
    );

const getComponentState = compose(
    comp => comp && comp.getState && comp.getState(),
    getComponentAt
);

export class Wrapper {
    constructor(rootElement) {
        this.elements = [].concat(rootElement);
    }

    get isMelodyWrapper() {
        return true;
    }

    get length() {
        return this.elements.length;
    }

    empty() {
        return this.elements.length === 0;
    }

    tap(callback) {
        callback(this);
        return this;
    }

    map(transform) {
        return this.lift(this.elements.map(transform));
    }

    reduce<R>(reducer, initial) {
        return this.elements.reduce(reducer, initial);
    }

    forEach(callback) {
        this.elements.forEach(callback);
        return this;
    }

    filter(selector) {
        return this.filterWhere(x => x.is(selector));
    }

    filterWhere(predicate) {
        return this.lift(
            this.elements
                .map(this.lift)
                .filter(predicate)
                .reduce((acc, wrapper) => acc.concat(wrapper), this.lift([]))
        );
    }

    concat(other) {
        return this.lift(this.elements.concat(other.elements));
    }

    chain(transform) {
        return this.lift(flatMap(transform)(this.elements));
    }

    props() {
        return maybeUnwrap(this.elements.map(getComponentProps).filter(exists));
    }

    prop(key) {
        return maybeUnwrap(this.elements.map(getProp(key)).filter(exists));
    }

    state() {
        return maybeUnwrap(this.elements.map(getComponentState).filter(exists));
    }

    first() {
        return this.at(0);
    }

    last() {
        return this.at(this.length - 1);
    }

    at(index) {
        return this.lift(this.elements[index]);
    }

    get(index) {
        return this.elements[index];
    }

    dispatch(action) {
        this.elements.forEach(
            compose(
                dispatchTo(action),
                getComponentAt
            )
        );
        return this;
    }

    shallow() {
        const forceRender = comp => {
            if (comp) {
                shallowRenderComponent(comp);
            }
        };
        this.elements.forEach(
            compose(
                forceRender,
                getComponentAt
            )
        );
        return this;
    }

    render() {
        const forceRender = comp => {
            if (comp) {
                setCurrentComponent(comp);
                patchOuter(comp.el, comp.render.bind(comp), {});
            }
        };
        this.elements.forEach(
            compose(
                forceRender,
                getComponentAt
            )
        );
        drainQueue();
        return this;
    }

    setProps(props) {
        const setProps = comp => {
            if (comp && comp.apply) {
                comp.apply(props);
                shallowRenderComponent(comp);
            }
        };
        this.elements.forEach(
            compose(
                setProps,
                getComponentAt
            )
        );
        return this;
    }

    find(selector) {
        if (typeof selector === 'string') {
            return assertNotEmpty(
                selector,
                this.chain(el => Array.from(el.querySelectorAll(selector)))
            );
        } else if (typeof selector === 'function') {
            return assertNotEmpty(
                selector.prototype.displayName,
                this.chain(selectNodes(hasComponentOfType(selector)))
            );
        } else {
            throw new Error(
                `Your selector is invalid: ${selector} \n Make sure you give CSS selector or Component as selector`
            );
        }
    }

    findWhere(predicate) {
        return this.chain(
            selectNodes(
                compose(
                    predicate,
                    this.lift
                )
            )
        );
    }

    is(selector) {
        const test =
            typeof selector === 'string'
                ? el => el.matches(selector)
                : hasComponentOfType(selector);
        return this.length === 0
            ? false
            : this.reduce((acc, el) => acc && test(el), true);
    }

    hasClass(className) {
        return this.length === 0
            ? false
            : this.reduce(
                  (acc, el) => acc && el.classList.contains(className),
                  true
              );
    }

    html() {
        return this.reduce((acc, el) => acc + el.outerHTML, '');
    }

    text() {
        return this.reduce((acc, el) => acc + el.textContent, '');
    }

    simulate(type, options = { bubbles: true }) {
        const event = new Event(type, options);
        this.forEach(el => el.dispatchEvent(event));
        drainQueue();
        return this;
    }

    debug() {
        return prettyFormat(this, {
            escapeRegex: true,
            plugins: [{ test, print }, prettyFormat.plugins.DOMElement],
            printFunctionName: false,
        });
    }

    // abstract lift(elements): Wrapper;
}

export class FullWrapper extends Wrapper {
    constructor(rootElement) {
        super(rootElement);
    }

    setProps(props) {
        const setProps = comp => {
            if (comp && comp.apply) {
                comp.apply(props);
                patchOuter(comp.el, comp.render.bind(comp), {});
            }
        };
        this.elements.forEach(
            compose(
                setProps,
                getComponentAt
            )
        );
        drainQueue();
        return this;
    }

    lift(rootElement) {
        return new FullWrapper(rootElement);
    }

    static empty() {
        return new FullWrapper([]);
    }
}

export class ShallowWrapper extends Wrapper {
    constructor(rootElement) {
        super(rootElement);
    }

    setProps(props) {
        const setProps = comp => {
            if (comp && comp.apply) {
                comp.apply(props);
                shallowRenderComponent(comp);
            }
        };
        this.elements.forEach(
            compose(
                setProps,
                getComponentAt
            )
        );
        return this;
    }

    lift(rootElement) {
        return new ShallowWrapper(rootElement);
    }

    static empty() {
        return new ShallowWrapper([]);
    }
}

export function render(Component, props = {}) {
    const el = document.createElement('div');
    patchInner(el, () => component(Component, 'key', props), {});
    drainQueue();
    return new FullWrapper(el.firstChild);
}

export function shallow(Component, props = {}) {
    const el = document.createElement('div');
    getNodeData(el).key = Symbol();
    patchInner(el, () => component(Component, 'key', props), {});
    const comp = getComponentAt(el.firstElementChild);
    shallowRenderComponent(comp);

    comp.el = el.firstElementChild;
    getNodeData(comp.el).componentInstance = comp;

    return new ShallowWrapper(comp.el);
}

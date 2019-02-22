import { toArray } from 'rxjs/operators';
import { Subject } from 'rxjs';

const withValues = (actions, values) => {
    [].concat(actions).forEach((action, i) => {
        const v = Array.isArray(values[i]) ? values[i] : values;
        v.forEach(action);
    });
};

const withArguments = (actions = [], args = []) => {
    [].concat(actions).forEach((action, i) => {
        args.forEach(arg => action(...arg));
    });
};

const test = iterator => async (obs, actions = [], args = []) => {
    const result = toArray()(obs).toPromise();
    iterator(actions, args);
    obs.complete && obs.complete();
    expect(JSON.stringify(await result)).toMatchSnapshot();
};

export const testWith = test(withValues);
export const testWithArguments = test(withArguments);

export const bindTo = action => (...subjs) =>
    subjs.map(subj => subj[action].bind(subj));

export const next = bindTo('next');

export const call = method => obj => obj[method] && obj[method]();
export const times = f => times => Array.from({ length: times }).map(f);
export const complete = (...streams) => streams.forEach(call('complete'));
export const createSubjects = times(() => new Subject());

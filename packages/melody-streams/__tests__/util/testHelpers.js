import { toArray } from 'rxjs/operators';
import { Subject } from 'rxjs';

const applyGradualy = (actions, values) => {
    [].concat(actions).forEach((action, i) => {
        const v = Array.isArray(values[i]) ? values[i] : values;
        v.forEach(action);
    });
};

const applyAsGroup = (actions = [], args = []) => {
    [].concat(actions).forEach((action, i) => {
        args.forEach(arg => action(...arg));
    });
};

const test = iterator => async (obs, actions = [], args = []) => {
    const result = toArray()(obs).toPromise();
    iterator(actions, args);
    obs.complete && obs.complete();
    return result;
};

export const applyGradualyAndComplete = test(applyGradualy);
export const applyAsGroupAndComplete = test(applyAsGroup);

export const bindTo = action => (...subjs) =>
    subjs.map(subj => subj[action].bind(subj));

export const next = bindTo('next');

export const call = method => obj => obj[method] && obj[method]();
export const times = f => times => Array.from({ length: times }).map(f);
export const complete = (...streams) => streams.forEach(call('complete'));
export const createSubjects = times(() => new Subject());

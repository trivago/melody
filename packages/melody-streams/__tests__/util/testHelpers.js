import { toArray } from 'rxjs/operators';
import { Subject } from 'rxjs';

export const testWith = async (obs, actions = [], values) => {
    const result = toArray()(obs).toPromise();
    [].concat(actions).forEach((action, i) => {
        const v = Array.isArray(values[i]) ? values[i] : values;
        v.forEach(action);
    });
    obs.complete && obs.complete();
    expect(JSON.stringify(await result)).toMatchSnapshot();
};

export const bindTo = action => (...subjs) =>
    subjs.map(subj => subj[action].bind(subj));

export const next = bindTo('next');

export const call = method => obj => obj[method] && obj[method]();
export const times = f => times => Array.from({ length: times }).map(f);
export const complete = (...streams) => streams.forEach(call('complete'));
export const createSubjects = times(() => new Subject());

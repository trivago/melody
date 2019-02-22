import { toArray } from 'rxjs/operators';

export const testWith = async (obs, actions = [], values) => {
    const result = toArray()(obs).toPromise();
    [].concat(actions).forEach(action => {
        values.forEach(action);
    });
    obs.complete();
    expect(JSON.stringify(await result)).toMatchSnapshot();
};

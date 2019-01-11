import { useRef } from './useRef';
import { useState } from './useState';
import { useCallback } from './useCallback';

export const useAtom = initialState => {
    // create an state hook for storing the current value
    const [value, setValue] = useState(initialState);
    // useRef is a generic tool for storing mutable state that does not
    // cause an update to happen upon change
    const s = useRef(null);
    // the accessor function can be memoized and will always return the
    // the value from the ref
    const getValue = useCallback(() => s.current, []);
    // link the value stored within the ref to the current value in
    // the state hook to ensure its always the latest
    s.current = value;
    // return the tuple
    return [getValue, setValue, value];
};

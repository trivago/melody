import { flush as _flush } from 'melody-idom';
export const flush = () =>
    _flush({
        didTimeout: false,
        timeRemaining() {
            return 10;
        },
    });

export const createMouseEvent = eventName => {
    const ev = new MouseEvent(eventName);
    ev.toJSON = () => ({
        type: `${eventName}`,
    });
    return el => () => el.dispatchEvent(ev);
};

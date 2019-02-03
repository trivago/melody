const canUsePerformanceAPI =
    performance &&
    typeof performance.mark === 'function' &&
    typeof performance.measure === 'function' &&
    typeof performance.clearMarks === 'function' &&
    typeof performance.clearMeasures === 'function';

const melodyEmoji = '🎹';

const getComponentKey = component => {
    if (component && component.el && component.el.__incrementalDOMData) {
        return component.el.__incrementalDOMData.key;
    }
};

const getComponentName = component => {
    let name = component.displayName;
    const key = getComponentKey(component);
    if (key !== undefined && key !== null) {
        name = `${name} (${key})`;
    }
    return name;
};

const getMarkName = (component, name) =>
    `${getComponentName(component)}:${name}`;

const getMarkLabel = (component, name) =>
    `${melodyEmoji} ${getComponentName(component)} ${name}`;

export const markStart = (component, name) => {
    if (!canUsePerformanceAPI) return;
    const markName = getMarkName(component, name);
    performance.mark(markName);
};

export const markEnd = (component, name) => {
    if (!canUsePerformanceAPI) return;
    const markName = getMarkName(component, name);
    const markLabel = getMarkLabel(component, name);
    try {
        performance.measure(markLabel, markName);
    } catch (err) {
        // swallow
    }
    performance.clearMarks(markName);
    performance.clearMeasures(markLabel);
};

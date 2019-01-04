import { enqueueComponent, link } from 'melody-idom';

export default class AsyncComponent {
    constructor() {
        this.promisedComponent = null;
        this._el = null;
        this.refs = Object.create(null);
        this.props = null;
        this.resolvedComponent = null;
        this.alreadyUnmounted = false;
        this.isLoading = false;
        this.loadingError = null;
    }

    set el(el) {
        if (this.resolvedComponent) {
            this.resolvedComponent.el = el;
        }
        this._el = el;
        return el;
    }

    get el() {
        return this.resolvedComponent ? this.resolvedComponent.el : this._el;
    }

    apply(props) {
        this.props = props;
        const { promisedComponent } = props;
        // if we already have resolved the component, just pass the data forward
        if (this.resolvedComponent) {
            this.resolvedComponent.apply(this.props.data);
        }
        // otherwise
        if (!this.isLoading) {
            this.isLoading = true;
            promisedComponent()
                .then(
                    ({ default: Component }) => {
                        if (this.alreadyUnmounted) {
                            return;
                        }
                        this.resolvedComponent = new Component();
                        link(this, this.resolvedComponent);
                        this.resolvedComponent.el = this._el;
                        this.resolvedComponent.apply(this.props.data);
                    },
                    err => {
                        // fail early
                        this.loadingError = err;
                        enqueueComponent(this);
                    }
                )
                .catch(err => {
                    // just in case something went wrong while initialising the component
                    this.loadingError = err;
                    enqueueComponent(this);
                });
            if (this.props.delayLoadingAnimation) {
                setTimeout(
                    () => enqueueComponent(this),
                    this.props.delayLoadingAnimation
                );
            } else {
                enqueueComponent(this);
            }
        }
    }

    notify() {}

    componentWillUnmount() {
        this.alreadyUnmounted = true;
    }

    render() {
        if (!this.resolvedComponent) {
            if (this.loadingError && this.props.onError) {
                this.props.onError(this.loadingError);
            } else {
                this.props.whileLoading();
            }
        }
    }
}

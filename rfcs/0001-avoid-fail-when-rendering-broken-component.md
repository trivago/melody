- Start Date: 2016-10-13
- RFC PR: 0001
- Issue: XTECH-29

# Summary

Instead of failing the entire rendering process when an error occurs during
rendering a component, we should warn the user and continue the rendering.

# Motivation

During development, it is inconvenient if the entire rendering process breaks
just because a single component causes an error.

This feature is supposed to improve the developer experience by clearly showing
which component failed during rendering and if possible, why it failed.

# Detailed design

Given that we're building Melody for `process.env.NODE_ENV !== 'production'`,
we would add `try-catch` blocks around the creation and rendering of
Melody Component. For consistency, we should do the same when calling their
`componentDidMount` and `componentWillUnmount` lifecycle hooks.

## Instance creation

If an error occurs while creating an instance of a Component, we will render an
error message instead of the Component.

The error should also be logged to `console.error`.

## Component rendering

If an error occurs while rendering a Component, we will render an error message
instead of the Component.

The error should also be logged to `console.error`.

**Caution:** We may need to rollback the rendering process to its state before
the rendering started. To do this, we need to copy the current state and reset
to it on error.

Once the state has been reset, we'd continue by replacing the Components element
with the error message.

Crashing the layout (i.e. by rendering a block element where an inline element
was expected) is not an issue.

We should display the component name, if available, and the error message. Easy
access to the stack of the error is not stricly needed.

## Errors during lifecycle hook execution

Since the component did render correctly, the best thing we can do for this is
probably to log the caught error to `console.error`.

# How We Teach This

This feature should be designed to be self-documenting and should not require
learning effort from our users. Instead, it should help them to understand why
their code failed.

# Drawbacks

There is a huge performance penalty involved in using a `try-catch` block as part
of the rendering process, especially in the specified method. Thus, this feature
can not be used as part of a `production` build.

# Alternatives

Instead of also showing an inline HTML fragment that contains details about the
error, we could just use the developer console to report the error.
This could, however, lead to confusion and frustration when a developer does not
look at the console and instead just wonders why the component does not show up.

# Unresolved questions

None.
# [**Melody**](https://melody.js.org/)

![Melody Logo](https://melody.js.org/melody-logo-banner.jpg 'Melody Logo')

Melody is a UI library for building JavaScript applications.

It helps you to write solid, high performance applications following best practices, while maintaining a clear separation of concerns. The view layer is cleanly delegated to templates which are compiled to highly efficient JavaScript instructions that adaptively render to the DOM.

This approach allows you to keep unchanged DOM nodes, reduces the memory usage of your application and improves the rendering performance of both, your application and the browser rendering it.

Its performance is comparable to other fast UI libraries like Inferno and has been battle tested by _millions_ of trivago users!

The Component API provided by Melody follows many of the principles of [Redux](http://redux.js.org), which is the preferred data layer for Melody applications.

Melody currently uses Twig templates as view layer and provides a higher level API that emits efficient DOM patching instructions. At the core Melody provides an API (or set of functions) enhancing those views in order to be more efficient and to help you to create better structure for your applications. This approach inherently creates a clear separation of concerns and leverages functional programming. In the next sections we will see how Melody gradually enhances those views and we will examine building blocks of Melody apps.

## **Getting Started**

The easiest way to get started with Melody is to use [Create Melody App](http://github.com/trivago/create-melody-app). It sets up your development environment so that you can use the latest JavaScript features, provides a nice developer experience, and optimizes your app for production.

```bash
yarn create melody-app my-app
```

```bash
cd my-app
yarn
yarn start
```

## **Example**

Simple example of rendering a melody component:

`hello.twig`

```twig
<div id="app">
    <h1>Hello {{ name }}</h1>
</div>
```

`index.js`

```js
import { createComponent, render } from 'melody-component';
import template from './hello.twig';

const documentRoot = document.getElementById('root');

const component = createComponent(template);

render(documentRoot, component, { name: 'Melody' });
```

It receives a `name` property with the string "Melody", then renders a header saying "Hello Melody" on the page.

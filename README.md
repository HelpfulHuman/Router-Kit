# Router Kit

Router Kit is meant to be a toolkit for building custom routing solutions for front-end, single page web applications.  It provides a simple, middleware-based architecture for handling `window.location` changes.  Router Kit does not include any particular implementation for tracking location changes, so you'll likely want to use a library like [history](https://www.npmjs.com/package/history) for that.

## Getting Started

Install via `npm`:

```
npm install --save @helpfulhuman/router-kit
```

## The `Router` Class

This library provides you with a `Router` object for attaching [middleware](#what-is-middleware) and route handlers for your application.

```js
import { Router } from "@helpfulhuman/redux-router";

// create a router instance
var router = new Router();

// ...add middleware here

// export the router to add it to your store
export default router;
```

### Adding Middleware

There are 2 methods available to you for adding middleware to your application.  While both are similar, they offer very different implementations of a similar concept.

The first method is `.use()`, which is often used for general middleware that should be invoked before proceeding.  You can optionally provide a partial "path" as the first argument in order to require that the current URI begins with the given path.

The second method, `.exact()`, is for when you want a middleware or handler to fire _only_ when the given path matches in full.  Unlike `.use()`, the `.exact()` method requires that a path string be provided.  This is typically going to be used for the _final_ step of a route.


```js
// add middleware that will be applied to all routes
router.use(function logger (ctx, next) {
  console.log("router -> " + ctx.location.href);
  next();
});

// add middleware that applies to a partial route name and redirects
// the user if the "token" value isn't set
router.use("/account", function isLoggedIn (ctx, next) {
  if ( ! localStorage.getItem("authToken")) {
    next(null, "/login");
  } else {
    next();
  }
});

// load up the home page
router.exact("/", handleHome);

// add a handler that dispatches actions based on route parameters
router.exact("/account/:page", function (ctx, next) {
  var page = ctx.params.page;
  // do something with the page name
});
```

## What is Middleware?

If you have experience working with [Connect](https://npmjs.com/package/connect) or [Express](https://npmjs.com/package/express), then the middleware system in this library should feel pretty familiar.  Middleware are functions that accept a `context` object (often shortened to `ctx`) that contains details about the current route and a callback function referred to as `next`.

Middleware is executed in the order that it is added to the router.  When a middleware finishes execution, it should invoke the given `next()` method to call the next middleware function in the stack.

```js
function middleware (ctx, next) {
  // when done, call next() to invoke the next middleware
  // in the current router's stack
  next();
}
```

### Router Depth & Error Handling

Middleware "stacks" have depth, meaning, the `next()` call can only invoke sibling (or nested middleware) in its stack.  When any non-falsey arguments are passed to `next()`, the sibling stack call is skipped and any parent `next()` callback is invoked with the given arguments instead.

**What this means:** If middleware has a problem and wants to quit execution of further middleware, then an `Error` should be thrown or passed as the first argument to `next()`.  The "hoisting" function will then be handed the `Error` object and can handle it.

```js
function errorMiddleware (ctx, next) {
  // did we have an error? tell `next()` about it
  next(new Error("something went wrong"));
}
```

### Redirects using `connectHistory()`

When using the `connectHistory()` function in conjunction with a `Router`, you can optionally pass a URI as a second parameter to `next()` to invoke a redirect, provided that the first "error" argument is `null`.

```js
function redirectMiddleware (ctx, next) {
  // perform a redirect by passing the desired URI as the second argument
  next(null, "/example");
}
```

### The `context` Object

Field | Type | Description
------|------|------------
**location** | `Object` | The `location` object provided by [history](https://npmjs.com/package/history) when routing is initialized.
**params** | `Object` | The parsed URI tokens for the route when a `path` with tokens has been provided for the middleware or route handler.  Example: if you had a handler bound to `/greet/:name` and the route was `/greet/world`, then this value would be `{ name: "world" }`.
**query** | `Object` | A parsed version of the query string for the route.  An example would be `?foo=bar` being converted to `{ foo: "bar" }`.
**uri** | `String` | The URI or `location.pathname` for the request.

## Support for `history`

This library does not include its own tooling for handling location or history changes.  Instead, we recommend you use the [history](https://npmjs.com/package/history) library on NPM, which has become an industry standard.  To make integration with this library (or libraries with a similar contract) easier, we provide the `connectHistory()` method.

This function subscribes your router to history changes and also kicks off the initial routing call on load.  Additionally, this is the step where error handling and creation of `context` object occurs.

```js
import createHistory from "history/createBrowserHistory";
import { connectHistory } from "@helpfulhuman/router-kit";
import router from "./router";

const history = createHistory();

connectHistory(router, history);
```

### Custom Context and Error Handling

An optional third argument can be provided to `connectHistory()` in the event that you need more control of the context object and error handling.

> **Note:** This removes the default error handling support for redirects, so make sure you handle that as needed.

```js
connectHistory(router, history, function (context, runMiddleware) {
  runMiddleware(context, function (err, redirect) {
    // handle this in a custom manner
  });
});
```

## Aliases

Aliases allow you to work with a semantic route name as an abstraction over the actual route's URI.  By not littering URIs throughout your code, you can reduce the risk of forming bad URIs or reduce the hastle often associating with having to refactor URIs.

> **Note:** You can use tokens in the path that you're aliasing.

```js
// add a named alias for routing to a specific task
router.alias("viewTask", "/tasks/:taskId");

// route to the aliased URI -> /tasks/1000
router.buildUri("viewTask", { taskId: "1000" });
```
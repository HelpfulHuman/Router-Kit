import pathToRegex from "path-to-regexp";
import flatten from "arr-flatten";

/**
 * No operation function.
 */
function noop () {}

/**
 * Throws an error if the given value does not match the given type(s).
 *
 * @param  {String} name
 * @param  {String[]} type
 * @param  {*} val
 */
export function assertType (name, type, val) {
  var types = [].concat(type);
  var valType = (Array.isArray(val) ? "array" : typeof val);
  if (types.indexOf(valType) === -1) {
    var typeStr = (types.length > 1 ? types.join("\" or \"") : types[0]);
    throw new Error(`Bad argument: "${name}" must be of type "${typeStr}", but "${valType}" was given instead.`);
  }
}

/**
 * Throws an error if any of the values in the given array don't match
 * the given type(s).
 *
 * @param  {String} name
 * @param  {String[]} type
 * @param  {Array<any>} val
 */
export function assertEach (name, type, val) {
  val.forEach(function (v) {
    assertType(name, type, v);
  });
}

/**
 * Create a new route context using a location object.
 *
 * @param  {Object} location
 * @return {Object}
 */
export function createContext (location) {
  return {
    uri: location.pathname,
    query: parseQuery(location.search),
    params: {},
    location: location,
  };
}

/**
 * Returns a function that runs through a list of middleware using a
 * given context object.
 *
 * @param  {Function[]} middleware
 * @param  {Object} context
 * @param  {Function} done
 */
export function runMiddleware (middleware, context, done) {
  // Copy the middleware to our own array we can safely .shift()
  var mw = middleware.slice(0);

  const callNext = function (err) {
    // Find the next middleware to call in the stack (if any)
    var next = mw.shift();
    // Attempt to invoke the next middleware
    if (arguments.length === 0 && next) {
      try {
        return next(context, callNext);
      } catch (_err) {
        err = _err;
      }
    }
    // If we've reached this point, then we can quit
    done.apply(null, arguments);
  }
  callNext();
}

/**
 * Compose multiple middleware into a single middleware method.
 *
 * @param  {Function[]} middleware
 * @return {Function}
 */
export function compose (...middleware) {
  // Flatten all given middleware into a single array
  middleware = flatten(middleware);
  // Assert that all given values are functions
  assertEach("middleware", "function", middleware);
  // If only one middleware is provided, just return it
  if (middleware.length === 1) return middleware[0];
  // Return a new function for running our composed middleware
  return function (context, next) {
    runMiddleware(middleware, context, next);
  }
}

/**
 * Returns a params object containing the parsed tokens from the path if the
 * URI matches the path's pattern.  Otherwise, null is returned.
 *
 * @param  {String} path
 * @param  {String} uri
 * @param  {Bool} exact
 * @return {Object}
 */
export function parseParams (path, uri, exact) {
  var arg, key, keys = [], params = {};
  var args = pathToRegex(path, keys, { end: exact }).exec(uri);
  if (args) {
    args = args.slice(1);
    for (var i = 0; i < args.length; i++) {
      key = keys[i].name;
      arg = args[i];
      params[key] = (arg ? decodeURIComponent(arg) : null);
    }
    return params;
  }
  return null;
}

/**
 * Parses a query string into an object.
 *
 * @param  {String} query
 * @return {Object}
 */
export function parseQuery (query) {
  var output = {};
  if (query) {
    var pieces = (query[0] === '?' ? query.substr(1) : query).split('&');
    for (var i = 0; i < pieces.length; i++) {
      var kv = pieces[i].split('=');
      output[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || '');
    }
  }
  return output;
}

/**
 * Returns a new route handler that only invokes the given handler when the
 * path matches.
 *
 * @param  {String} path
 * @param  {Function} handler
 * @param  {Bool} exact
 * @return {Function}
 */
export function onPathMatch (path, handler, exact) {
  assertType("path", "string", path);
  assertType("handler", "function", handler);
  return function (context, next) {
    // Attempt to match and parse the parameters based on the path
    var params = parseParams(path, context.uri);
    // Skip the handler if the params are null
    if (params !== null) {
      // Update the context object with the params
      context = Object.assign({}, context, { params });
      // Run the given handler with the updated context
      handler(context, next);
    } else {
      next();
    }
  };
}
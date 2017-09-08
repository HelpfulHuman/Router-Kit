import pathToRegex from "path-to-regexp";

/**
 * No operation function.
 */
function noop () {}

/**
 * Throws an error if the given value does not match the given type.
 *
 * @param  {String} name
 * @param  {String} type
 * @param  {*} val
 */
function isType (name, type, val) {
  var valType = (Array.isArray(val) ? "array" : typeof val);
  if (valType !== type) {
    throw new Error(`Bad argument: "${name}" must be of type "${type}", but "${valType}" was given instead.`);
  }
}

/**
 * Throws an error if object shape is not that of a history object.
 *
 * @param  {Object} history
 */
function isHistory (history) {
  isType("history", "object", history);
  isType("history.listen", "function", history.listen);
}

/**
 * Create a new route context using a location object and any state that the
 * user would like to pass along.
 *
 * @param  {Object} history
 * @param  {Object} location
 * @param  {Object} state
 * @return {Object}
 */
export function createContext (history, location, state) {
  return Object.assign({}, location, {
    uri: location.pathname,
    query: parseQuery(location.search),
    params: {},
    state: state,
    // location: location,
    history: history,
  });
}

/**
 * Returns a function that runs through a list of middleware using a
 * given context object.
 *
 * @param  {Function[]} middleware
 * @return {Function}
 */
export function runMiddleware (middleware) {
  return function (ctx) {
    var mw = middleware.slice(0);
    const callNext = function () {
      var next = mw.shift();
      if (!next) return;
      try {
        return Promise.resolve(next(context, callNext));
      } catch (err) {
        return Promise.reject(err);
      }
    }
    callNext();
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
  var args = pathToRegex(path, { end: !exact }, keys).exec(uri);
  if (args) {
    args = args.slice(1);
    for (var i = 0; i < args.length; i++) {
      key = keys[i].name;
      arg = args[i];
      params[key] = (arg ? decodeURIComponent(arg) : arg);
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
  isType("path", "string", path);
  isType("handler", "function", handler);
  return function (ctx, dispatch) {
    // Attempt to match and parse the parameters based on the path
    var params = parseParams(path, ctx.uri);
    // Skip the handler if the params are null
    if (params !== null) {
      // Update the context object with the params
      ctx = Object.assign(ctx, { params });
      // Run the given handler with the updated context
      handler(ctx, dispatch);
    }
  };
}
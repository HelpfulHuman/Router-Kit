import flatten from "arr-flatten";
import pathToRegex from "path-to-regexp";
import { compose, onPathMatch, assertType, runMiddleware, defaultErrorHandler } from "./utils";

export default class Router {

  /**
   * Set up our router instance that will act as a factory for creating
   * and managing routing middleware.
   */
  constructor () {
    this.middleware   = [];
    this.aliases      = {};
    this.errorHandler = defaultErrorHandler;
  }

  /**
   * Creates an alias for a specific path.
   *
   * @param  {String} name
   * @param  {String} path
   * @return {Router}
   */
  alias (name, path) {
    this.aliases[name] = pathToRegex.compile(path);
    return this;
  }

  /**
   * Creates the URI for a set alias or returns null if the alias isn't set.
   *
   * @param  {String} path
   * @param  {Object} params
   * @return {String}
   */
  buildUri (path, params) {
    var alias = aliases[path];
    return (!!alias ? alias(params) : null);
  }

  /**
   * Add a new middleware or "partial" handler to the router.
   *
   * @param  {String|Function} path
   * @param  {Function[]} ...middlewares
   * @return {Router}
   */
  use (path, ...middlewares) {
    if (typeof path === "function") {
      this.middleware = flatten([this.middleware, path, middlewares]);
    } else {
      this.middleware.push(onPathMatch(path, compose(middlewares), false));
    }
    return this;
  }

  /**
   * Add a new "exact match" handler to the router.
   *
   * @param  {String} path
   * @param  {Function[]} ...middlewares
   * @return {Router}
   */
  exact (path, ...middlewares) {
    if (middlewares.length === 0) {
      throw new Error("Bad argument: At least one middleware must be given to router.exact()");
    }
    this.middleware.push(onPathMatch(path, compose(middlewares), true));
    return this;
  }

  /**
   * Replace the default error handler with a custom one.
   *
   * @param  {Function} handler
   * @return {Router}
   */
  catch (handler) {
    assertType("handler", "function", handler);
    this.errorHandler = handler;
    return this;
  }

  /**
   * Returns a new middleware function that will run through the middleware
   * stack of this router.
   *
   * @param  {Object} context
   * @param  {Function} done
   */
  middleware (context, done) {
    return runMiddleware.bind(null, this.middleware);
  }

}
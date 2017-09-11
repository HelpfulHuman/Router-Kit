import Router from "./router";
import { assertType, createContext } from "./utils";

/**
 * Throws an error if object shape is not that of a history object.
 *
 * @param  {History} history
 */
function assertHistoryType (history) {
  assertType("history", "object", history);
  assertType("history.listen", "function", history.listen);
  assertType("history.push", "function", history.push);
  assertType("history.replace", "function", history.replace);
  assertType("history.goBack", "function", history.goBack);
}

/**
 * Create a default handler for connecting a router to a history object.
 *
 * @param  {History} history
 * @return {Function}
 */
function createDefaultHandler (history) {
  return function (context, runMiddleware) {
    runMiddleware(context, function (err, redirect) {
      if (err) {
        console.error(`${context.uri} -> ${err.message}`, err);
      } else if (redirect) {
        history.replace(redirect);
      }
    });
  }
}

/**
 * Create the bindings for handling location changes either on window
 * load or from the history object.
 *
 * @param  {Router} router
 * @param  {History} history
 * @param  {Function} handler
 */
export default function connectHistory (router, history, handler) {
  // ensure that the given history object is a history object
  assertHistoryType(history);

  // make sure that a valid router instance is provided
  if (router instanceof Router) {
    throw new Error("Bad argument: The router argument must be an instance of Router");
  }

  // create the default handler if none was provided
  if (typeof handler !== "function") {
    handler = createDefaultHandler(history);
  }

  // compose the middleware for the router into a single function
  const runMiddleware = router.middleware();

  // bind the handler to the context creation and middleware functions
  const processChange = function (location) {
    handler(createContext(location), runMiddleware);
  }

  // start listening to changes on history
  history.listen(processChange);

  // kick off the router using the current location
  processChange(window.location);
}
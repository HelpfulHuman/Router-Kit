const assert = require("chai").assert;
const sinon  = require("sinon");
const { Router } = require("../");

function noop () {}

describe("Router.use", function () {

  var router;
  beforeEach(function () {
    router = new Router();
  });

  it("adds middleware to the top level array when no path is provided", function () {
    router.use(noop, noop, [noop, noop], noop);
    assert.lengthOf(router.stack, 5);
  });

  it("adds a single new middleware as a composed group of nested middleware when a path is provided", function () {
    router.use("/", noop, noop);
    assert.lengthOf(router.stack, 1);
  });

});
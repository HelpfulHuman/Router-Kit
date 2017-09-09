const assert = require("chai").assert;
const sinon = require("sinon");
const { parseParams } = require("../");

describe("parseParams", function () {

  it("returns null if it can't partially match the given URI and path when `exact` is false", function () {
    var params = parseParams("/foo", "/bar", false);
    assert.isNull(params);
  });

  it("returns null if it can't exactly match the given URI and path when `exact` is true", function () {
    var params = parseParams("/foo/bar", "/foo", true);
    assert.isNull(params);
    var params2 = parseParams("/foo/:bar", "/foo/bar/baz", true);
    assert.isNull(params2);
  });

  it("returns an empty object when the match is successful but no tokens were specified", function () {
    var params = parseParams("/foo", "/foo", false);
    assert.isNotNull(params);
    assert.isObject(params);
  });

  it("returns an object of parsed parameters for a partial comparison if `exact` is false", function () {
    var params = parseParams("/foo/:bar", "/foo/bar/baz/bah", false);
    assert.isNotNull(params);
    assert.isObject(params);
    assert.isTrue(params.bar === "bar");
  });

  it("returns an object of parsed parameters only for an exact comparison if `exact` is true", function () {
    var params = parseParams("/foo/:bar/:baz", "/foo/bar/baz", true);
    assert.isNotNull(params);
    assert.isObject(params);
    assert.isTrue(params.bar === "bar");
    assert.isTrue(params.baz === "baz");
  });

});
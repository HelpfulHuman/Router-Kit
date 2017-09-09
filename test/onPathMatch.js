const assert = require("chai").assert;
const sinon = require("sinon");
const { onPathMatch } = require("../");

function c (uri) {
  return { uri };
}

describe("onPathMatch", function () {

  it("doesn't invoke the handler if the path doesn't match", function (done) {
    var handler = sinon.spy(function (ctx, next) {
      next();
    });
    onPathMatch("/foo/bar", handler, true)(c("/foo"), function (err) {
      assert.isUndefined(err);
      assert.isTrue(handler.callCount === 0);
      done();
    });
  });

  it("invokes the handler when the route matches", function (done) {
    var handler = sinon.spy(function (ctx, next) {
      next();
    });
    onPathMatch("/foo", handler, true)(c("/foo"), function (err) {
      assert.isUndefined(err);
      assert.isTrue(handler.calledOnce);
      done();
    });
  });

  it("passes path token values via the params object when a matching route is invoked", function (done) {
    var handler = sinon.spy(function (ctx, next) {
      assert.deepEqual(ctx.params, {
        bar: "bar",
        baz: "baz",
      });
      next();
    });
    onPathMatch("/foo/:bar/:baz", handler, true)(c("/foo/bar/baz"), function (err) {
      assert.isUndefined(err);
      done();
    });
  });

});
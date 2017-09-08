const assert = require("chai").assert;
const sinon = require("sinon");
const { runMiddleware } = require("../");

describe("runMiddleware", function () {

  it("runs the first middleware with the given context object only once", function (done) {
    var mw = sinon.spy(function (context, next) {
      assert.isObject(context);
      next();
    });
    runMiddleware([mw], {}, function (err) {
      assert.isUndefined(err);
      assert.isTrue(mw.calledOnce);
      done();
    });
  });

  it("runs each middleware with the given context object when the previous middleware invokes the callback", function (done) {
    var mw = sinon.spy(function (context, next) {
      assert.isObject(context);
      next();
    });
    runMiddleware([mw, mw, mw], {}, function (err) {
      assert.isUndefined(err);
      assert.isTrue(mw.callCount === 3);
      done();
    });
  });

  it("handles implicit errors and immediately quits", function (done) {
    var err = new Error("Example error");
    var mw = sinon.spy(function () {
      throw err;
    });
    runMiddleware([mw, mw], {}, function (_err) {
      assert.isTrue(_err === err);
      assert.isTrue(mw.calledOnce);
      done();
    });
  });

  it("handles errors passed to the given callback and immediately quits", function (done) {
    var err = new Error("Example error");
    var mw = sinon.spy(function (_, next) {
      next(err);
    });
    runMiddleware([mw, mw], {}, function (_err) {
      assert.isTrue(_err === err);
      assert.isTrue(mw.calledOnce);
      done();
    });
  });

});
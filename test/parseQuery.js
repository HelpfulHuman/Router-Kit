const assert = require("chai").assert;
const sinon = require("sinon");
const { parseQuery } = require("../");

describe("parseQuery", function () {

  it("returns an object containing the key/value pairs found in the given query string", function () {
    var query = parseQuery("?foo=bar&baz=bah&bak=do,ray,me");
    assert.deepEqual(query, {
      foo: "bar",
      baz: "bah",
      bak: "do,ray,me",
    });
  });

});
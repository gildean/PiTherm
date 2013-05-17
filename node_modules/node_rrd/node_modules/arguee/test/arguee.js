var 
  isa = require('../arguee.js').isa
, conformed = require('../arguee.js').conformed
, Strict = require('../arguee.js').Strict
, assert = require('assert');

describe('isa', function () {
  
  it('should work with String', function () {
    assert(isa(String, new String));
    assert(isa(String, "hello world"));
    assert(!isa(String, 1));
    assert(!isa(String, {}));
    assert(!isa(String, []));
  });

  it('should work with Array', function () {
    assert(isa(Array, new Array));
    assert(isa(Array, [1, 2, 3]));
    assert(!isa(Array, 1));
    assert(!isa(Array, {}));
  });
  
  it('should work with Object', function () {
    assert(isa(Object, new Object));
    assert(isa(Object, {}));
    assert(isa(Object, new Array));
    assert(isa(Object, new String));
    assert(isa(Object, new Number));
    assert(!isa(Object, 1));
    assert(!isa(Object, "hello world"));
    assert(!isa(Object, function(){}));
  });
  
  it('should allow strict checking of Object', function () {
    
    assert(!isa(Strict(Object), []));
    assert(!isa(Strict(Object), new Array()));
    assert(isa(Strict(Object), {}));
  });
  
  it('should work with Number', function () {
    assert(isa(Number, 1));
    assert(isa(Number, new Number));
    assert(!isa(Number, "1"));
  });
  
  it('should work with Function', function () {
    assert(isa(Function, function(){}));
    assert(isa(Function, new Function()));
    assert(!isa(Function, {}));
  });
  
  if ('should work with null', function () {
    assert(isa(null, null));
    assert(!isa(null, "null"));
    assert(!isa(null, 0));
  });

  if ('should work with undefined', function () {
    assert(isa(undefined, a));
    assert(!isa(undefined, 0));
    assert(!isa(undefined, ""));
  });
  
  it('should work with custom class', function () {
    function Foo () {};
    var foo = new Foo();
    
    assert(isa(Foo, foo));
    assert(isa(Object, foo));
    
    function Bar () {}
    Bar.prototype = new Foo;
    Bar.prototype.constructor = Bar;
    
    var bar = new Bar();
    
    assert(isa(Bar, bar));
    assert(isa(Foo, bar));
    assert(isa(Object, bar));
  });
  
  it('should work with custom subclass class of internal objects', function () {
    function MyString() {};
    MyString.prototype = new String;
    MyString.prototype.constructor = MyString;
    
    var str = new MyString();
    assert(isa(String, str));
    assert(isa(Object, str));
    assert(!isa(Array, str));
    assert(!isa(Function, str));
    assert(!isa(Number, str));
  });
  
});

describe('conformed', function () {
  
  it ('should be true', function() {
    assert(conformed([String, String], ["one", "two"]));
    assert(!conformed([String, String], ["one", 1]));
  });
  
  it ('should work with null', function() {
    assert(conformed([null], [null]));
  })
  
  it ('allows options as last argument', function () {
    assert(conformed([String], ["One"], {verbose: false}));
  });
  
  it ('allows default values for arguments', function () {
    // Null arg == missing
    assert(!conformed([String, Number], ["One", null]));
    // Default value for null arg
    assert(conformed([String, Number], ["One", null], { defaults: { 1: 9 } }));
  });
  
  it ('allows shallow arguments', function () {
    assert(conformed([String, Number, Function], ["One", function(){}], { shallow: true, defaults: { 1: 9 }}));
    
    // Missing default argument value
    assert(!conformed([String, Number, Number, Function], ["One", function(){}], { shallow: true, defaults: { 1: 9 }}));
    assert(conformed([String, Number, Number, Function], ["One", function(){}], { shallow: true, defaults: { 1: 9, 2: 10 }}));
    
    // Fill all missing arguments
    assert(conformed([String, Number, Function], [], { shallow: true, defaults: { 0: "Hello", 1: 9, 2: function(){} }}));
    assert(conformed([String, Number, Function], [function test1(){}], { shallow: true, defaults: { 0: "Hello", 1: 9}}));
    
    // Check returned shallow expensions
    var args = null;
    assert(args = conformed([String, Number, Number, Function], [12, function test2(){}], { shallow: true, defaults: { 0: "Hello", 1: 9, 2: 10, 3: function(){} }}));
    assert(JSON.stringify(args) === JSON.stringify(["Hello", 12, 10, function test2(){}]));
    
    // No shallow expension when all arguments are provided
    assert(args = conformed([String, Number, Number, Function], ["Foo", 12, 13, function(){}], { shallow: true, defaults: { /* should not be used */}, verbose: true }));
    assert(JSON.stringify(args) === JSON.stringify(["Foo", 12, 13, function(){}]));
    
  });
  
  it ('allows strict checking of some arguments', function () {
    assert(conformed([Object, Array], [[], []]));
    assert(!conformed([Strict(Object), Array], [[], []]));
    assert(conformed([Object, Array], [{}, []]));
    assert(conformed([Strict(Object), Array], [{}, []]));
  });
  
});
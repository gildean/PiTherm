/*
    Copyright (c), 2012 Thierry Passeron

    The MIT License

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to
    deal in the Software without restriction, including without limitation the
    rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
    sell copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in
    all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
    FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
    IN THE SOFTWARE.
*/

/*
    Arguee lets you check types and function arguments

    Usage:

    var conformed = require('arguee').conformed;

    // Let's check how the user called the foo() function:
    function foo() {        
        if (conformed([String, String], arguments)) {
          // we were called foo(String, String) arguments
        }
    }
    
    var isa = require('arguee).isa;
    var obj = new String;
    isa(String, obj) #=> true
    isa(String, "") #=> true
    
    function MyString() {};
    MyString.prototype = new String;
    MyString.prototype.constructor = MyString;
    
    var str = new MyString();
    isa(String, str) #=> true;
    
    var objectOf = require('arguee').objectOf;
    objectOf(Number, 1) #=> false
    objectOf(Number, new Number) #=> true

*/

var _checks = {
      'String'   : function (v) { return (typeof v === 'string') || objectOf(String, v) }
    , 'Number'   : function (v) { return (typeof v === 'number') || objectOf(Number, v) }
    , 'Function' : function (v) { return (typeof v === 'function') }
    , 'Array'    : function (v) { return objectOf(Array, v) }
    , 'Object'   : function (v, strict) { return strict ? objectOf(Object, v) && (v.constructor === Object) : objectOf(Object, v) }
};

function Strict(o) { 
  if (!o.name || !_checks[o.name]) throw new Error("arguee: Strict can only check base objects");
  var _o = eval("(function Strict"+ o.name +" (){})"); 
  _o.__strict = o.name; 
  return _o;
}

function objectOf(o, v) { return (typeof v === 'object') && (v instanceof o) }

function isa(obj, arg, strict) { 
  if ((obj === null) || (obj === undefined)) return obj === arg; 
  if (obj.__strict) return _checks[obj.__strict](arg, true);
  return _checks[obj.name] ? _checks[obj.name](arg) : arg instanceof obj 
}

function conform() {
  var args = Array.prototype.slice.apply(arguments);
  var options = args.pop();
  
  if (options.shallow) { // Shallow arguments check
    
    if (!options.defaults) {
      throw new Error('arguee: shallow arguments requires default values');
    }
    
    var shallow_index = -1, shallow_indexes = [];
    
    for (var index = 0; index < args.length; index++) {

      if (shallow_index >= this.length - 1) break;
      shallow_index++;
      
      while(!isa(this[shallow_index], args[index], options.strict)) { 
        shallow_indexes.push(shallow_index); 
        
        if (shallow_index >= this.length - 1) break;
        shallow_index++;
      }
      
    }

    if (args.length === 0) { /* All arguments are shallow arguments */
      for (var index = 0; index < this.length; index++) {
        shallow_indexes.push(index); 
      }
      shallow_index = this.length - 1;
    } 
    
    if ((shallow_index < this.length - 1)) {
      shallow_index++;
      if (options.verbose) console.log("Shallow arguments remain at index", shallow_index, "shallow indexes", shallow_indexes);
      for (var index = shallow_index; index < this.length; index++) {
        shallow_indexes.push(index); 
      }
    }
    
    
    /* insert default values for shallow indexes */
    var should_return = false;
    shallow_indexes.forEach(function (index) {
      if (!options.defaults[index]) {
        if (options.verbose) console.log('arguee: shallow argument at index ' + index + ' but no default value provided');
        // throw new Error('arguee: shallow argument at index ' + index + ' but no default value provided');
        should_return = true;
        return false; // stop the forEach
      }
      args.splice(index, 0, options.defaults[index]);
    });
    
    if (should_return) return null;
    
    if (options.verbose) console.log("arguee: shallow arguments expension:", args, shallow_indexes, shallow_index);
  }
  
  if (args.length < this.length) {
    if (options.verbose) {
      console.log("arguee: wrong number of required arguments: needed", this.length, ", given", args.length);
      
      // Print stack trace (borrowed from https://gist.github.com/1158940)
      var e = new Error('dummy');
      var stack = e.stack.replace(/^[^\(]+?[\n$]/gm, '')
          .replace(/^\s+at\s+/gm, '')
          .replace(/^Object.<anonymous>\s*\(/gm, '{anonymous}()@')
          .split('\n');
        console.log("Stack trace:\n", stack);
    }
    return null;
  }
  
  var ok = true;
    
  for (var index = 0; index < this.length; index++) {
    
    // Defaults
    if (!args[index] && options.defaults && options.defaults[index]) { // default values
      args[index] = options.defaults[index];
      if (options.verbose) console.log("default argument at index", index);
    }
    
    if (!isa(this[index], args[index])) { 
      
      if (options.verbose) {
        console.log("arguee: argument at index", index, "of type", typeof args[index], ", does not conform to required type (", this[index], ") arguments:", args);

        // Print stack trace (borrowed from https://gist.github.com/1158940)
        var e = new Error('dummy');
        var stack = e.stack.replace(/^[^\(]+?[\n$]/gm, '')
            .replace(/^\s+at\s+/gm, '')
            .replace(/^Object.<anonymous>\s*\(/gm, '{anonymous}()@')
            .split('\n');
          console.log("Stack trace:\n", stack);
      }
      
      if (!options.fullscan) return null;
      else ok = false;
      
    }
  }
  
  if (options.verbose) console.log("arguee: arguments", ok ? "conformed" : "did not conform", "to the required format!");
  
  return ok ? args : null;
}

function conformed(formats, args, options) {
  options = options || { 
    verbose: false, 
    fullscan: false 

    /* Defaults handling for undefined | null parameters:
    
    defaults: {
      2: new Date // default value for argument at index 2 is the current Date
      3: "Hello"  // default value for argument at index 3 is the string "Hello"
    } 
    
    */
  };
  
  return conform.apply(formats /* Array */, Array.prototype.slice.apply(args).concat(options) /* arguments object */);
}

module.exports.conformed = conformed;
module.exports.isa = isa;
module.exports.objectOf = objectOf;
module.exports.Strict = Strict;

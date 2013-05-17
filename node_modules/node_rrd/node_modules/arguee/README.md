# Description

Arguee lets you check types and function arguments

## Usage

Check function arguments:

```js
var conformed = require('arguee').conformed;

/* 
  foo function
  
  Usage:
    foo(name, callback) (1)
    foo(name)           (2)
    foo(name, number)   (3)
*/
function foo() {
  if (conformed([String, Function], arguments)) {
    /* 1 */
  } else 
  if (conformed([String], arguments)) {
    /* 2 */
  } else 
  if (conformed([String, Number], arguments)) {
    /* 3 */
  } else {
    /* sorry */
  }
}
```

You may check any type (Array, Object, String, Number, Function, Custom objects etc...). 
Example:

```js
var isa = require('arguee').isa;

var name;
var address;

/* ... */

if (isa(String, name)) { /* ... */ }
if (isa(Array, address)) { /* ... */ }

```

Since an Array is also an Object, you may wish to distinguish them by using the Strict() method:
```js

var Strict = require('arguee').Strict;

isa(Object, []); //=> true
isa(Strict(Object), []); //=> false

isa(Object, {}); //=> true
isa(Strict(Object), {}); //=> true

```

Same applies to conformed:
```js

var Strict = require('arguee').Strict;

conformed([String, Object, Number], ["Hello", [1, 2, 3], 1234]); //=> true
conformed([String, Strict(Object), Number], ["Hello", [1, 2, 3], 1234]); //=> false

conformed([String, Object, Number], ["Hello", {world: true}, 1234]); //=> true
conformed([String, Strict(Object), Number], ["Hello", {world: true}, 1234]); //=> true
```

### Default values

You may pass an extra Object argument to //conformed// to define default values of undefined or null arguments:

```js
{ defaults: { <arg-index>: <value>, ... }}
```

Example:
```js

conformed([String, Number, Function], ["Foo", 1234], { defaults: { 2: function missing() {} } });
//=> ["Foo", 1234, [Function missing]]

```

### Shallow arguments

You may use the shallow arguments feature to provide a flexible arguments handling. This requires you to set the shallow option property to true and also provide the defaults property to use for the shallow arguments

```js
{ shallow: true, defaults: { <arg-index>: <value>, ... }}
```

Example:
```js

var options = { shallow: true, defaults: { 0: "Bar", 1: 123456789, 2: function missing() {} } };

conformed([String, Number, Function], ["Foo", 1234], options);
//=> ["Foo", 1234, [Function missing]]

conformed([String, Number, Function], [1234], options);
//=> ["Bar", 1234, [Function missing]]

conformed([String, Number, Function], [], options);
//=> ["Bar", 123456789, [Function missing]]

```

### Verbosity

Sometimes to debug the arguments checking it is useful to set conformed in verbose mode by setting the verbose option to something trueful:

```js
conformed(format, args, { verbose: true })
```

## License terms

Copyright (c), 2012 Thierry Passeron

The MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
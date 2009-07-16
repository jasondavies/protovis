/**
 * @namespace The Protovis namespace, <tt>pv</tt>. All public methods and fields
 * should be registered on this object. Note that core Protovis source is
 * surrounded by an anonymous function, so any other declared globals will not
 * be visible outside of core methods. This also allows multiple versions of
 * Protovis to coexist, since each version will see their own <tt>pv</tt>
 * namespace.
 */
var pv = {};

/**
 * Returns a prototype object suitable for extending the given class. Rather
 * than constructing a new instance of <tt>f</tt> to serve as the prototype
 * (which unnecessarily runs the constructor on the created prototype object,
 * potentially polluting it), an anonymous function is generated internally that
 * shares the same prototype:
 *
 * <pre>function g() {}
 * g.prototype = f.prototype;
 * return new g();</pre>
 *
 * For more details, see Douglas Crockford's essay on prototypal inheritance.
 *
 * @param f a constructor.
 * @return a suitable prototype object.
 * @see http://javascript.crockford.com/prototypal.html
 */
pv.extend = function(f) {
  function g() {}
  g.prototype = f.prototype;
  return new g();
};

/**
 * Parses a Protovis specification, which may use JavaScript 1.8 function
 * expresses, replacing those function expressions with proper functions, such
 * that the code can be run by a JavaScript 1.6 interpreter. This hack only
 * supports function expressions (using clumsy regular expressions, no less),
 * and not other JavaScript 1.8 features such as let expressions.
 *
 * @param s a Protovis specification (i.e., a string of JavaScript 1.8 source code).
 * @return conformant JavaScript 1.6 source code.
 */
try {
  eval("pv.parse = function(x) x;"); // native support
} catch (e) {
  pv.parse = function(js) { // hacky regex support
    var re = new RegExp("function(\\s+\\w+)?\\([^)]*\\)\\s*", "mg"), m, i = 0;
    var s = "";
    while (m = re.exec(js)) {
      var j = m.index + m[0].length;
      if (js[j--] != '{') {
        s += js.substring(i, j) + "{return ";
        i = j;
        for (var p = 0; p >= 0 && j < js.length; j++) {
          switch (js[j]) {
            case '"': case '\'': {
              var c = js[j];
              while (++j < js.length && (js[j] != c)) {
                if (js[j] == '\\') j++;
              }
              break;
            }
            case '[': case '(': p++; break;
            case ']': case ')': p--; break;
            case ';':
            case ',': if (p == 0) p--; break;
          }
        }
        s += pv.parse(js.substring(i, --j)) + ";}";
        i = j;
      }
      re.lastIndex = j;
    }
    s += js.substring(i);
    return s;
  };
}

/**
 * Returns the passed-in argument, <tt>x</tt>; the identity function. This method
 * is provided for convenience since it is used as the default behavior for a
 * number of property functions.
 *
 * @param x a value.
 * @return the value <tt>x</tt>.
 */
pv.identity = function(x) { return x; };

/**
 * Returns an array of numbers, starting at <tt>start</tt>, incrementing by
 * <tt>step</tt>, until <tt>stop</tt> is reached. The stop value is exclusive. If
 * only a single argument is specified, this value is interpeted as the
 * <i>stop</i> value, with the <i>start</i> value as zero. If only two arguments
 * are specified, the step value is implied to be one.
 *
 * <p>The method is modeled after the built-in <tt>range</tt> method from
 * Python. See the Python documentation for more details.
 *
 * @see http://docs.python.org/library/functions.html#range
 */
pv.range = function(start, stop, step) {
  if (arguments.length == 1) {
    stop = start;
    start = 0;
  }
  if (step == undefined) step = 1;
  else if (!step) throw new Error("step must be non-zero");
  var array = [], i = 0, j;
  if (step < 0) {
    while ((j = start + step * i++) > stop) {
      array.push(j);
    }
  } else {
    while ((j = start + step * i++) < stop) {
      array.push(j);
    }
  }
  return array;
};

/**
 * Given two arrays <tt>a</tt> and <tt>b</tt>, returns an array of all possible
 * pairs of elements a_i-b_j. The outer loop is on array <i>a</i>, while the
 * inner loop is on <i>b</i>, such that the order of returned elements is
 * a_0-b_0, a_0-b_1, ... a_0-b_m, a_1-b_0, a_1-b_1, ... a_1-b_m, ... a_n-b_m.
 * If either array is empty, an empty array is returned.
 *
 * @param a an array.
 * @param b an array.
 * @return an array of pairs of elements in <tt>a</tt> and <tt>b</tt>.
 */
pv.cross = function(a, b) {
  var array = [];
  for (var i = 0, n = a.length, m = b.length; i < n; i++) {
    for (var j = 0, x = a[i]; j < m; j++) {
      array.push([x, b[j]]);
    }
  }
  return array;
};

/**
 * Given the specified array of <tt>arrays</tt>, concatenates the arrays into a
 * single array. If the individual arrays are explicitly known, an alternative
 * to blend is to use JavaScript's <tt>concat</tt> method directly, e.g.:
 *
 * <pre>[1, 2, 3].concat(["a", "b", "c"])</pre>
 *
 * returns [1, 2, 3, "a", "b", "c"].
 *
 * @param arrays an array of arrays.
 * @return an array containing all the elements of each array in <tt>arrays</tt>.
 */
pv.blend = function(arrays) {
  return Array.prototype.concat.apply([], arrays);
};

/**
 * Returns all of the property names (keys) of the specified object (a map). The
 * order of the returned array is not defined.
 *
 * @param map an object.
 * @return an array of strings corresponding to the keys.
 */
pv.keys = function(map) {
  var array = [];
  for (var key in map) {
    array.push(key);
  }
  return array;
};

/**
 * Returns all of the entries (key-value pairs) of the specified object (a
 * map). The order of the returned array is not defined. Each key-value pair is
 * represented as an object with <tt>key</tt> and <tt>value</tt> attributes.
 *
 * @param map an object.
 * @return an array of key-value pairs corresponding to the keys.
 */
pv.entries = function(map) {
  var array = [];
  for (var key in map) {
    array.push({ key: key, value: map[key] });
  }
  return array;
};

/**
 * Returns all of the values (attribute values) of the specified object (a
 * map). The order of the returned array is not defined.
 *
 * @param map an object.
 * @return an array of objects corresponding to the values.
 */
pv.values = function(map) {
  var array = [];
  for (var key in map) {
    array.push(map[key]);
  }
  return array;
};

/**
 * Returns a normalized copy of the specified array, such that the sum of the
 * returned elements sum to one. If the specified array is not an array of
 * numbers, the specified accessor function <tt>f</tt> can be specified to map
 * the elements to numbers. For example, if <tt>array</tt> is an array of
 * objects, and each object has a numeric property "foo", the function
 *
 * <pre>function(d) d.foo</pre>
 *
 * can be used to normalize the array on the "foo" property. If an accessor
 * function is not specified, the identity function is used.
 *
 * @param array an array of objects, or numbers.
 * @param f an optional accessor function.
 * @return an array of numbers that sums to one.
 */
pv.normalize = function(array, f) {
  if (!f) f = pv.identity;
  var sum = pv.sum(array, f);
  return array.map(function(d) { return f(d) / sum; });
};

/**
 * Returns the sum of the specified array. If the specified array is not an
 * array of numbers, the specified accessor function <tt>f</tt> can be specified
 * to map the elements to numbers. See {@link #normalize} for an example.
 *
 * @param array an array of objects, or numbers.
 * @param f an optional accessor function.
 * @return the sum of the specified array.
 */
pv.sum = function(array, f) {
  if (!f) f = pv.identity;
  return pv.reduce(array, function(p, d) { return p + f(d); }, 0);
};

/**
 * Returns the maximum value of the specified array. If the specified array is
 * not an array of numbers, the specified accessor function <tt>f</tt> can be
 * specified to map the elements to numbers. See {@link #normalize} for an
 * example.
 *
 * @param array an array of objects, or numbers.
 * @param f an optional accessor function.
 * @return the maximum value of the specified array.
 */
pv.max = function(array, f) {
  if (!f) f = pv.identity;
  return pv.reduce(array, function(p, d) { return Math.max(p, f(d)); }, -Infinity);
};

/**
 * Returns the index of the maximum value of the specified array. If the
 * specified array is not an array of numbers, the specified accessor function
 * <tt>f</tt> can be specified to map the elements to numbers. See
 * {@link #normalize} for an example.
 *
 * @param array an array of objects, or numbers.
 * @param f an optional accessor function.
 * @return the index of the maximum value of the specified array.
 */
pv.max.index = function(array, f) {
  if (!f) f = pv.identity;
  var maxi = -1, maxx = -Infinity;
  for (var i = 0; i < array.length; i++) {
    var x = f(array[i]);
    if (x > maxx) {
      maxx = x;
      maxi = i;
    }
  }
  return maxi;
}

/**
 * Returns the minimum value of the specified array of numbers. If the specified
 * array is not an array of numbers, the specified accessor function <tt>f</tt>
 * can be specified to map the elements to numbers. See {@link #normalize} for
 * an example.
 *
 * @param array an array of objects, or numbers.
 * @param f an optional accessor function.
 * @return the minimum value of the specified array.
 */
pv.min = function(array, f) {
  if (!f) f = pv.identity;
  return pv.reduce(array, function(p, d) { return Math.min(p, f(d)); }, Infinity);
};

/**
 * Returns the index of the minimum value of the specified array. If the
 * specified array is not an array of numbers, the specified accessor function
 * <tt>f</tt> can be specified to map the elements to numbers. See
 * {@link #normalize} for an example.
 *
 * @param array an array of objects, or numbers.
 * @param f an optional accessor function.
 * @return the index of the minimum value of the specified array.
 */
pv.min.index = function(array, f) {
  if (!f) f = pv.identity;
  var mini = -1, minx = Infinity;
  for (var i = 0; i < array.length; i++) {
    var x = f(array[i]);
    if (x < minx) {
      minx = x;
      mini = i;
    }
  }
  return mini;
}

/**
 * Returns the arithmetic mean, or average, of the specified array. If the
 * specified array is not an array of numbers, the specified accessor function
 * <tt>f</tt> can be specified to map the elements to numbers. See
 * {@link #normalize} for an example.
 *
 * @param array an array of objects, or numbers.
 * @param f an optional accessor function.
 * @return the mean of the specified array.
 */
pv.mean = function(array, f) {
  return pv.sum(array, f) / array.length;
};

/**
 * Returns the median of the specified array. If the specified array is not an
 * array of numbers, the specified accessor function <tt>f</tt> can be specified
 * to map the elements to numbers. See {@link #normalize} for an example.
 *
 * @param array an array of objects, or numbers.
 * @param f an optional accessor function.
 * @return the median of the specified array.
 */
pv.median = function(array, f) {
  if (!f) f = pv.identity;
  array = array.map(f).sort(function(a, b) { return a - b; });
  if (array.length % 2) return array[Math.floor(array.length / 2)];
  var i = array.length / 2;
  return (array[i - 1] + array[i]) / 2;
};

/**
 * Applies the specified function <tt>f</tt> against an accumulator and each
 * value of the specified array (from left-ot-right) so as to reduce it to a
 * single value.
 *
 * <p>Array reduce was added in JavaScript 1.8. This implementation uses the native
 * method if provided; otherwise we use our own implementation derived from the
 * JavaScript documentation. Note that we don't want to add it to the Array
 * prototype directly because this breaks certain (bad) for loop idioms.
 *
 * @see http://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/reduce
 * @param array an array.
 * @param f a callback function to execute on each value in the array.
 * @param v the object to use as the first argument to the first callback.
 * @return the reduced value.
 */
if (/\[native code\]/.test(Array.prototype.reduce)) {
  pv.reduce = function(array, f, v) {
    var p = Array.prototype;
    return p.reduce.apply(array, p.slice.call(arguments, 1));
  };
} else {
  pv.reduce = function(array, f, v) {
    var len = array.length;
    if (!len && (arguments.length == 2)) {
      throw new Error();
    }

    var i = 0;
    if (arguments.length < 3) {
      while (true) {
        if (i in array) {
          v = array[i++];
          break;
        }
        if (++i >= len) {
          throw new Error();
        }
      }
    }

    for (; i < len; i++) {
      if (i in array) {
        v = f.call(null, v, array[i], i, array);
      }
    }
    return v;
  };
};

/**
 * Returns a map constructed from the specified <tt>keys</tt>, using the function
 * <tt>f</tt> to compute the value for each key. The arguments to the value
 * function are the same as those used in the built-in array <tt>map</tt>
 * function: the key, the index, and the array itself. The callback is invoked
 * only for indexes of the array which have assigned values; it is not invoked
 * for indexes which have been deleted or which have never been assigned values.
 *
 * <p>The following example creates a map from strings to string length:
 *
 * <pre>pv.dict(["one", "three", "seventeen"], function(s) s.length)</pre>
 *
 * The returned value is <tt>{one: 3, three: 5, seventeen: 9}</tt>.
 *
 * @see http://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Global_Objects/Array/map
 * @param keys an array.
 * @param f a value function.
 * @return a map from keys to values.
 */
pv.dict = function(keys, f) {
  var m = {};
  for (var i = 0; i < keys.length; i++) {
    if (i in keys) {
      var k = keys[i];
      m[k] = f.call(null, k, i, keys);
    }
  }
  return m;
};

/**
 * Returns a permutation of the specified array, using the specified array of
 * indexes. The returned array contains the corresponding element in
 * <tt>array</tt> for each index in <tt>indexes</tt>, in order. For example,
 *
 * <pre>pv.permute(["a", "b", "c"], [1, 2, 0])</pre>
 *
 * returns <tt>["b", "c", "a"]</tt>. It is acceptable for the array of indexes
 * to be a different length from the array of elements, and for indexes to be
 * duplicated or omitted. The optional accessor function <tt>f</tt> can be used
 * to perform a simultaneous mapping of the array elements.
 *
 * @param array an array.
 * @param indexes an array of indexes into <tt>array</tt>.
 * @param f an optional accessor function.
 * @return an array of elements from <tt>array</tt>; a permutation.
 */
pv.permute = function(array, indexes, f) {
  if (!f) f = pv.identity;
  var p = new Array(indexes.length);
  indexes.forEach(function(j, i) { p[i] = f(array[j]); });
  return p;
};

/**
 * Returns a map from key to index for the specified <tt>keys</tt> array. For
 * example,
 *
 * <pre>pv.numerate(["a", "b", "c"])</pre>
 *
 * returns <tt>{a: 0, b: 1, c: 2}</tt>. Note that since JavaScript maps only
 * support string keys, <tt>keys</tt> must contain strings, or other values that
 * naturally map to distinct string values. Alternatively, an optional accessor
 * function <tt>f</tt> can be specified to compute the string key for the given
 * element.
 *
 * @param keys an array, usually of string keys.
 * @param f an optional key function.
 * @return a map from key to index.
 */
pv.numerate = function(keys, f) {
  if (!f) f = pv.identity;
  var map = {};
  keys.forEach(function(x, i) { map[f(x)] = i; });
  return map;
};

/**
 * The compare function for natural order. This can be used in conjunction with
 * the built-in array <tt>sort</tt> method to sort elements by their natural
 * order, ascending. Note that if no compare function is specified to the
 * built-in <tt>sort</tt> method, the default order is lexicographic <i>not</i>
 * natural!
 *
 * @see http://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Global_Objects/Array/sort
 * @param a an element to compare.
 * @param b an element to compare.
 * @return negative if a &lt; b; positive if a &gt; b; otherwise 0.
 */
pv.naturalOrder = function(a, b) {
  return (a < b) ? -1 : ((a > b) ? 1 : 0);
};

/**
 * The compare function for reverse natural order. This can be used in
 * conjunction with the built-in array <tt>sort</tt> method to sort elements by
 * their natural order, descending. Note that if no compare function is
 * specified to the built-in <tt>sort</tt> method, the default order is
 * lexicographic <i>not</i> natural!
 *
 * @see #naturalOrder
 * @param a an element to compare.
 * @param b an element to compare.
 * @return negative if a &lt; b; positive if a &gt; b; otherwise 0.
 */
pv.reverseOrder = function(b, a) {
  return (a < b) ? -1 : ((a > b) ? 1 : 0);
};

/** @namespace Namespace constants for SVG, XMLNS, and XLINK. */
pv.ns = {
 /** SVG namespace, "http://www.w3.org/2000/svg". */
 svg: "http://www.w3.org/2000/svg",
 /** XMLNS namespace, "http://www.w3.org/2000/xmlns". */
 xmlns: "http://www.w3.org/2000/xmlns",
 /** XLINK namespace, "http://www.w3.org/1999/xlink". */
 xlink: "http://www.w3.org/1999/xlink",
};

/** @namespace Protovis major and minor version numbers. */
pv.version = {
  /** Major version number. */
  major: 2,
  /** Minor version number. */
  minor: 6
};

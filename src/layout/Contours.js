/**
 * Constructs a new, empty contour layout. Layouts are not typically constructed
 * directly; instead, they are added to an existing panel via
 * {@link pv.Mark#add}.
 *
 * @class Implements a contour layout with regularly-sized rows and columns.
 * The number of rows and columns are determined from their respective
 * properties. For example, the 2&times;3 array:
 *
 * <pre>1 2 3
 * 4 5 6</pre>
 *
 * can be represented using the <tt>rows</tt> property as:
 *
 * <pre>[[1, 2, 3], [4, 5, 6]]</pre>
 *
 * If your data is in column-major order, you can equivalently use the
 * <tt>columns</tt> property. If the <tt>rows</tt> property is an array, it
 * takes priority over the <tt>columns</tt> property. The data is implicitly
 * transposed, as if the {@link pv.transpose} operator were applied.
 *
 * <p>This layout exports a single <tt>contour</tt> mark prototype, which is
 * intended to be used with a line or subclass thereof. The data property of
 * the contour prototype is defined as the contours generated from the array.
 * For example, if the array is a two-dimensional array of values in the range
 * [0,1], a simple heatmap can be generated as:
 *
 * <pre>vis.add(pv.Layout.Contours)
 *     .rows(arrays)
 *   .cell.add(pv.Line)
 *     .fillStyle(pv.ramp("white", "black"))</pre>
 *
 * The grid subdivides the full width and height of the parent panel into equal
 * rectangles.
 *
 * @extends pv.Layout
 */
pv.Layout.Contours = function() {
  pv.Layout.call(this);
  var that = this,
      buildImplied = that.buildImplied,
      x;

  /** @private Cache layout state to optimize properties. */
  this.buildImplied = function(s) {
    buildImplied.call(this, x = s);
  };

  (this.contour = new pv.Dot())
      .data(function() { return x.lines; })
      .parent = that;
};

pv.Layout.Contours.prototype = pv.extend(pv.Layout)
    .property("grid")
    .property("levels");

pv.Layout.Contours.prototype.defaults = new pv.Layout.Contours()
    .extend(pv.Layout.prototype.defaults)
    .grid([])
    .levels([]);

/** @private */
  var EPSILON = 1e-20;

  var pointsEqual = function(a, b) {
    var x = a.x - b.x, y = a.y - b.y;
    return x * x + y * y < EPSILON;
  }

  var reverseList = function(list) {
    var pp = list.head;

    while (pp) {
      // swap prev/next pointers
      var temp = pp.next;
      pp.next = pp.prev;
      pp.prev = temp;

      // continue through the list
      pp = temp;
    }

    // swap head/tail pointers
    var temp = list.head;
    list.head = list.tail;
    list.tail = temp;
  }
var ContourBuilder = function(level) {
  this.level = level;
  this.s = null;
  this.count = 0;
}
ContourBuilder.prototype.remove_seq = function(list) {
  // if list is the first item, static ptr s is updated
  if (list.prev) {
    list.prev.next = list.next;
  } else {
    this.s = list.next;
  }

  if (list.next) {
    list.next.prev = list.prev;
  }
  --this.count;
}
ContourBuilder.prototype.addSegment = function(a, b) {
  var ss = this.s;
  var ma = null;
  var mb = null;
  var prependA = false;
  var prependB = false;

  while (ss) {
    if (ma == null) {
      // no match for a yet
      if (pointsEqual(a, ss.head.p)) {
        ma = ss;
        prependA = true;
      } else if (pointsEqual(a, ss.tail.p)) {
        ma = ss;
      }
    }
    if (mb == null) {
      // no match for b yet
      if (pointsEqual(b, ss.head.p)) {
        mb = ss;
        prependB = true;
      } else if (pointsEqual(b, ss.tail.p)) {
        mb = ss;
      }
    }
    // if we matched both no need to continue searching
    if (mb != null && ma != null) {
      break;
    } else {
      ss = ss.next;
    }
  }

  // c is the case selector based on which of ma and/or mb are set
  var c = ((ma != null) ? 1 : 0) | ((mb != null) ? 2 : 0);

  switch(c) {
    case 0:   // both unmatched, add as new sequence
      var aa = {p: a, prev: null};
      var bb = {p: b, next: null};
      aa.next = bb;
      bb.prev = aa;

      // create sequence element and push onto head of main list. The order
      // of items in this list is unimportant
      ma = {head: aa, tail: bb, next: this.s, prev: null, closed: false};
      if (this.s) {
        this.s.prev = ma;
      }
      this.s = ma;

      ++this.count;    // not essential - tracks number of unmerged sequences
    break;

    case 1:   // a matched, b did not - thus b extends sequence ma
      var pp = {p: b};

      if (prependA) {
        pp.next = ma.head;
        pp.prev = null;
        ma.head.prev = pp;
        ma.head = pp;
      } else {
        pp.next = null;
        pp.prev = ma.tail;
        ma.tail.next = pp;
        ma.tail = pp;
      }
    break;

    case 2:   // b matched, a did not - thus a extends sequence mb
      var pp = {p: a};

      if (prependB) {
        pp.next = mb.head;
        pp.prev = null;
        mb.head.prev = pp;
        mb.head = pp;
      } else {
        pp.next = null;
        pp.prev = mb.tail;
        mb.tail.next = pp;
        mb.tail = pp;
      }
    break;

    case 3:   // both matched, can merge sequences
      // if the sequences are the same, do nothing, as we are simply closing
      // this path
      if (ma === mb) {
        var pp = {p: ma.tail.p, next: ma.head, prev: null};
        ma.head.prev = pp;
        ma.head = pp;
        ma.closed = true;
        break;
      }

      // there are 4 ways the sequence pair can be joined. The current setting of prependA and
      // prependB will tell us which type of join is needed. For head/head and tail/tail joins
      // one sequence needs to be reversed
      switch((prependA ? 1 : 0) | (prependB ? 2 : 0)) {
        case 0:   // tail-tail
          // reverse ma and append to mb
          reverseList(ma);
          // fall through to head/tail case
        case 1:   // head-tail
          // ma is appended to mb and ma discarded
          mb.tail.next = ma.head;
          ma.head.prev = mb.tail;
          mb.tail = ma.tail;

          //discard ma sequence record
          this.remove_seq(ma);
        break;

        case 3:   // head-head
          // reverse ma and append mb to it
          reverseList(ma);
          // fall through to tail/head case
        case 2:   // tail-head
          // mb is appended to ma and mb is discarded
          ma.tail.next = mb.head;
          mb.head.prev = ma.tail;
          ma.tail = mb.tail;

          //discard mb sequence record
          this.remove_seq(mb);
      break;
    }
  }
}

pv.Layout.Contours.prototype.buildImplied = function(s) {
  pv.Layout.prototype.buildImplied.call(this, s);
  s.triangles = Triangulate(s.grid).filter(function(x) { return x });
  var thatS = s;
  var lines = [];
  var contours = {};
  // Naive implementation, steps through all triangles for each level
  for (var i=0; i<s.levels.length; i++) {
    var l = s.levels[i];
    var cb = contours[i];
    if (!cb) {
      cb = contours[i] = new ContourBuilder(l);
    }
    for (var j=0; j<s.triangles.length; j++) {
      var t = s.triangles[j];
      var points = t.intersectAt(l);
      if (points && points.length && points[0] && points[1]) {
        // Assume slope is increasing from left to right
        cb.addSegment(
          {x: points[0][0], y: points[0][1]},
          {x: points[1][0], y: points[1][1]}
        );
      }
    }
  }
  var intersect = function(p, e0, e1) {
    var m = (e1.y - e0.y) / (e1.x - e0.x);
    var c = e1.y - m * e1.x;
    var y = m * p.x + c;
    return ((y - p.y) * (y - p.y) < EPSILON);
  }
  var minx = pv.min(thatS.grid, function(p) { return p.x }),
      maxx = pv.max(thatS.grid, function(p) { return p.x }),
      miny = pv.min(thatS.grid, function(p) { return p.y }),
      maxy = pv.max(thatS.grid, function(p) { return p.y });
  console.log('maxx='+maxx);
  var contourList = function() {
    var l = [];
    var a = contours;
    for (var k in a) {
      //if (k!='25')continue;
      var s = a[k].s;
      var level = a[k].level;
      var unclosed = [];
      while (s) {
        var h = s.head;
        var l2 = [];
        l2.level = level;
        l2.k = k;
        while (h && h.p) {
          l2.push(h.p);
          h = h.next;
        }
        if (s.closed === false) {
          unclosed.push(l2);
        } else {
          l.push(l2);
        }
        s = s.next;
      }
      // Close any unclosed loops
      var closeEnough = function(a0, b0) {
        var ab = a0 - b0;
        return ab * ab < EPSILON;
      }
      var code = function(points, chooseLast) {
        var p = points[chooseLast ? points.length-1 : 0];
        return closeEnough(p.x, minx) ? [0, p.y] :
          closeEnough(p.y, maxy) ? [1, p.x] :
          closeEnough(p.x, maxx) ? [2, -p.y] :
          closeEnough(p.y, miny) ? [3, -p.x] :
          [0, 0];
      };
      var compare = function(a, b) {
        var a0 = code(a), b0 = code(b);
        if (a0[0] == b0[0]) {
          return a0[1] - b0[1];
        }
        return a0[0] - b0[0];
      }
      unclosed.sort(compare);
      var fullEdge = null;
      for (var i=0; i<unclosed.length; i++) {
        var edge = unclosed[i];
        var c = code(edge, true), c0;
        fullEdge = unclosed[i+1];
        if (fullEdge) {
          c0 = code(fullEdge, false);
        } else {
          fullEdge = edge;
          edge = [fullEdge[fullEdge.length-1]];
          c = code(edge, true);
          c0 = code(fullEdge, false);
        }
        if (c0[0] < c[0]) c0[0] += 4;
        while (c0[0] > c[0]) {
          var m = c0[0] % 4;
          console.log(m);
          fullEdge.unshift({
            x: m == 0 || m == 1 ? minx : maxx,
            y: m == 3 || m == 0 ? miny : maxy,
            k: k});
          c0[0]--;
        }
        fullEdge.unshift.apply(fullEdge, edge);
      }
      if (fullEdge) {
        l.push(fullEdge);
      }
    }
    l.sort(function(a, b) { return a.k - b.k });
    return l;
  }
  s.lines = contourList();
};

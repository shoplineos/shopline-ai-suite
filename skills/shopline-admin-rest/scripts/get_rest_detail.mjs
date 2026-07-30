#!/usr/bin/env node
import path from 'node:path';
import { promisify, parseArgs } from 'node:util';
import { readFile } from 'node:fs/promises';
import { gunzip } from 'node:zlib';
import { fileURLToPath, pathToFileURL } from 'node:url';

var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __require = /* @__PURE__ */ ((x3) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x3, {
  get: (a2, b3) => (typeof require !== "undefined" ? require : a2)[b3]
}) : x3)(function(x3) {
  if (typeof require !== "undefined")
    return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x3 + '" is not supported');
});

// ../../node_modules/.pnpm/fuzzball@2.2.6/node_modules/fuzzball/dist/esm/fuzzball.esm.min.js
var e;
var t = "undefined" != typeof globalThis ? globalThis : "undefined" != typeof window ? window : "undefined" != typeof global ? global : "undefined" != typeof self ? self : {};
var r = { exports: {} };
var n = Math.floor;
var o = Math.max;
var a = Math.min;
var _calculateRatio = /* @__PURE__ */ __name(function(e2, t2) {
  return t2 ? 2 * e2 / t2 : 1;
}, "_calculateRatio");
var _arrayCmp = /* @__PURE__ */ __name(function(e2, t2) {
  var r2, n2, o2, i2, s2, c2;
  for (s2 = [e2.length, t2.length], r2 = i2 = 0, c2 = a(n2 = s2[0], o2 = s2[1]); 0 <= c2 ? i2 < c2 : i2 > c2; r2 = 0 <= c2 ? ++i2 : --i2) {
    if (e2[r2] < t2[r2])
      return -1;
    if (e2[r2] > t2[r2])
      return 1;
  }
  return n2 - o2;
}, "_arrayCmp");
var _has = /* @__PURE__ */ __name(function(e2, t2) {
  return Object.prototype.hasOwnProperty.call(e2, t2);
}, "_has");
var i = function() {
  function SequenceMatcher(e2, t2, r2, n2) {
    this.isjunk = e2, null == t2 && (t2 = ""), null == r2 && (r2 = ""), this.autojunk = null == n2 || n2, this.a = this.b = null, this.setSeqs(t2, r2);
  }
  __name(SequenceMatcher, "SequenceMatcher");
  return SequenceMatcher.prototype.setSeqs = function(e2, t2) {
    return this.setSeq1(e2), this.setSeq2(t2);
  }, SequenceMatcher.prototype.setSeq1 = function(e2) {
    if (e2 !== this.a)
      return this.a = e2, this.matchingBlocks = this.opcodes = null;
  }, SequenceMatcher.prototype.setSeq2 = function(e2) {
    if (e2 !== this.b)
      return this.b = e2, this.matchingBlocks = this.opcodes = null, this.fullbcount = null, this._chainB();
  }, SequenceMatcher.prototype._chainB = function() {
    var e2, t2, r2, o2, a2, i2, s2, c2, u2, l2, f2, p2, h2, v2;
    for (e2 = this.b, this.b2j = t2 = {}, o2 = l2 = 0, p2 = e2.length; l2 < p2; o2 = ++l2)
      r2 = e2[o2], (_has(t2, r2) ? t2[r2] : t2[r2] = []).push(o2);
    if (i2 = {}, a2 = this.isjunk)
      for (f2 = 0, h2 = (v2 = Object.keys(t2)).length; f2 < h2; f2++)
        a2(r2 = v2[f2]) && (i2[r2] = true, delete t2[r2]);
    if (u2 = {}, s2 = e2.length, this.autojunk && s2 >= 200)
      for (r2 in c2 = n(s2 / 100) + 1, t2)
        t2[r2].length > c2 && (u2[r2] = true, delete t2[r2]);
    return this.isbjunk = function(e3) {
      return _has(i2, e3);
    }, this.isbpopular = function(e3) {
      return _has(u2, e3);
    };
  }, SequenceMatcher.prototype.findLongestMatch = function(e2, t2, r2, n2) {
    var o2, a2, i2, s2, c2, u2, l2, f2, p2, h2, v2, _3, d2, y3, g3, m2, b3, k2, j3, $2, w4;
    for (o2 = (m2 = [this.a, this.b, this.b2j, this.isbjunk])[0], a2 = m2[1], i2 = m2[2], f2 = m2[3], s2 = (b3 = [e2, r2, 0])[0], c2 = b3[1], u2 = b3[2], h2 = {}, l2 = d2 = e2; e2 <= t2 ? d2 < t2 : d2 > t2; l2 = e2 <= t2 ? ++d2 : --d2) {
      for (_3 = {}, y3 = 0, g3 = (k2 = _has(i2, o2[l2]) ? i2[o2[l2]] : []).length; y3 < g3; y3++)
        if (!((p2 = k2[y3]) < r2)) {
          if (p2 >= n2)
            break;
          (v2 = _3[p2] = (h2[p2 - 1] || 0) + 1) > u2 && (s2 = (j3 = [l2 - v2 + 1, p2 - v2 + 1, v2])[0], c2 = j3[1], u2 = j3[2]);
        }
      h2 = _3;
    }
    for (; s2 > e2 && c2 > r2 && !f2(a2[c2 - 1]) && o2[s2 - 1] === a2[c2 - 1]; )
      s2 = ($2 = [s2 - 1, c2 - 1, u2 + 1])[0], c2 = $2[1], u2 = $2[2];
    for (; s2 + u2 < t2 && c2 + u2 < n2 && !f2(a2[c2 + u2]) && o2[s2 + u2] === a2[c2 + u2]; )
      u2++;
    for (; s2 > e2 && c2 > r2 && f2(a2[c2 - 1]) && o2[s2 - 1] === a2[c2 - 1]; )
      s2 = (w4 = [s2 - 1, c2 - 1, u2 + 1])[0], c2 = w4[1], u2 = w4[2];
    for (; s2 + u2 < t2 && c2 + u2 < n2 && f2(a2[c2 + u2]) && o2[s2 + u2] === a2[c2 + u2]; )
      u2++;
    return [s2, c2, u2];
  }, SequenceMatcher.prototype.getMatchingBlocks = function() {
    var e2, t2, r2, n2, o2, a2, i2, s2, c2, u2, l2, f2, p2, h2, v2, _3, d2, y3, g3, m2, b3, k2, j3, $2, w4, O2;
    if (this.matchingBlocks)
      return this.matchingBlocks;
    for (y3 = [[0, h2 = (k2 = [this.a.length, this.b.length])[0], 0, v2 = k2[1]]], _3 = []; y3.length; )
      t2 = (j3 = y3.pop())[0], e2 = j3[1], n2 = j3[2], r2 = j3[3], o2 = ($2 = g3 = this.findLongestMatch(t2, e2, n2, r2))[0], s2 = $2[1], (l2 = $2[2]) && (_3.push(g3), t2 < o2 && n2 < s2 && y3.push([t2, o2, n2, s2]), o2 + l2 < e2 && s2 + l2 < r2 && y3.push([o2 + l2, e2, s2 + l2, r2]));
    for (_3.sort(_arrayCmp), a2 = c2 = f2 = 0, d2 = [], m2 = 0, b3 = _3.length; m2 < b3; m2++)
      i2 = (w4 = _3[m2])[0], u2 = w4[1], p2 = w4[2], a2 + f2 === i2 && c2 + f2 === u2 ? f2 += p2 : (f2 && d2.push([a2, c2, f2]), a2 = (O2 = [i2, u2, p2])[0], c2 = O2[1], f2 = O2[2]);
    return f2 && d2.push([a2, c2, f2]), d2.push([h2, v2, 0]), this.matchingBlocks = d2;
  }, SequenceMatcher.prototype.getOpcodes = function() {
    var e2, t2, r2, n2, o2, a2, i2, s2, c2, u2, l2, f2;
    if (this.opcodes)
      return this.opcodes;
    for (n2 = o2 = 0, this.opcodes = t2 = [], s2 = 0, c2 = (u2 = this.getMatchingBlocks()).length; s2 < c2; s2++)
      e2 = (l2 = u2[s2])[0], r2 = l2[1], a2 = l2[2], i2 = "", n2 < e2 && o2 < r2 ? i2 = "replace" : n2 < e2 ? i2 = "delete" : o2 < r2 && (i2 = "insert"), i2 && t2.push([i2, n2, e2, o2, r2]), n2 = (f2 = [e2 + a2, r2 + a2])[0], o2 = f2[1], a2 && t2.push(["equal", e2, n2, r2, o2]);
    return t2;
  }, SequenceMatcher.prototype.getGroupedOpcodes = function(e2) {
    var t2, r2, n2, i2, s2, c2, u2, l2, f2, p2, h2, v2, _3, d2, y3;
    for (null == e2 && (e2 = 3), (t2 = this.getOpcodes()).length || (t2 = [["equal", 0, 1, 0, 1]]), "equal" === t2[0][0] && (f2 = (v2 = t2[0])[0], i2 = v2[1], s2 = v2[2], c2 = v2[3], u2 = v2[4], t2[0] = [f2, o(i2, s2 - e2), s2, o(c2, u2 - e2), u2]), "equal" === t2[t2.length - 1][0] && (f2 = (_3 = t2[t2.length - 1])[0], i2 = _3[1], s2 = _3[2], c2 = _3[3], u2 = _3[4], t2[t2.length - 1] = [f2, i2, a(s2, i2 + e2), c2, a(u2, c2 + e2)]), l2 = e2 + e2, n2 = [], r2 = [], p2 = 0, h2 = t2.length; p2 < h2; p2++)
      f2 = (d2 = t2[p2])[0], i2 = d2[1], s2 = d2[2], c2 = d2[3], u2 = d2[4], "equal" === f2 && s2 - i2 > l2 && (r2.push([f2, i2, a(s2, i2 + e2), c2, a(u2, c2 + e2)]), n2.push(r2), r2 = [], i2 = (y3 = [o(i2, s2 - e2), o(c2, u2 - e2)])[0], c2 = y3[1]), r2.push([f2, i2, s2, c2, u2]);
    return !r2.length || 1 === r2.length && "equal" === r2[0][0] || n2.push(r2), n2;
  }, SequenceMatcher.prototype.ratio = function() {
    var e2, t2, r2, n2;
    for (e2 = 0, t2 = 0, r2 = (n2 = this.getMatchingBlocks()).length; t2 < r2; t2++)
      e2 += n2[t2][2];
    return _calculateRatio(e2, this.a.length + this.b.length);
  }, SequenceMatcher.prototype.quickRatio = function() {
    var e2, t2, r2, n2, o2, a2, i2, s2, c2, u2, l2;
    if (!this.fullbcount)
      for (this.fullbcount = r2 = {}, a2 = 0, s2 = (u2 = this.b).length; a2 < s2; a2++)
        r2[t2 = u2[a2]] = (r2[t2] || 0) + 1;
    for (r2 = this.fullbcount, e2 = {}, n2 = 0, i2 = 0, c2 = (l2 = this.a).length; i2 < c2; i2++)
      t2 = l2[i2], o2 = _has(e2, t2) ? e2[t2] : r2[t2] || 0, e2[t2] = o2 - 1, o2 > 0 && n2++;
    return _calculateRatio(n2, this.a.length + this.b.length);
  }, SequenceMatcher.prototype.realQuickRatio = function() {
    var e2, t2, r2;
    return r2 = [this.a.length, this.b.length], _calculateRatio(a(e2 = r2[0], t2 = r2[1]), e2 + t2);
  }, SequenceMatcher;
}();
var s = { exports: {} };
e = s, function() {
  var t2, r2, n2, o2, a2, i2, s2, c2, u2, l2, f2, p2, h2, v2, _3;
  n2 = Math.floor, l2 = Math.min, r2 = /* @__PURE__ */ __name(function(e2, t3) {
    return e2 < t3 ? -1 : e2 > t3 ? 1 : 0;
  }, "r"), u2 = /* @__PURE__ */ __name(function(e2, t3, o3, a3, i3) {
    var s3;
    if (null == o3 && (o3 = 0), null == i3 && (i3 = r2), o3 < 0)
      throw new Error("lo must be non-negative");
    for (null == a3 && (a3 = e2.length); o3 < a3; )
      i3(t3, e2[s3 = n2((o3 + a3) / 2)]) < 0 ? a3 = s3 : o3 = s3 + 1;
    return [].splice.apply(e2, [o3, o3 - o3].concat(t3)), t3;
  }, "u"), i2 = /* @__PURE__ */ __name(function(e2, t3, n3) {
    return null == n3 && (n3 = r2), e2.push(t3), v2(e2, 0, e2.length - 1, n3);
  }, "i"), a2 = /* @__PURE__ */ __name(function(e2, t3) {
    var n3, o3;
    return null == t3 && (t3 = r2), n3 = e2.pop(), e2.length ? (o3 = e2[0], e2[0] = n3, _3(e2, 0, t3)) : o3 = n3, o3;
  }, "a"), c2 = /* @__PURE__ */ __name(function(e2, t3, n3) {
    var o3;
    return null == n3 && (n3 = r2), o3 = e2[0], e2[0] = t3, _3(e2, 0, n3), o3;
  }, "c"), s2 = /* @__PURE__ */ __name(function(e2, t3, n3) {
    var o3;
    return null == n3 && (n3 = r2), e2.length && n3(e2[0], t3) < 0 && (t3 = (o3 = [e2[0], t3])[0], e2[0] = o3[1], _3(e2, 0, n3)), t3;
  }, "s"), o2 = /* @__PURE__ */ __name(function(e2, t3) {
    var o3, a3, i3, s3, c3, u3;
    for (null == t3 && (t3 = r2), c3 = [], a3 = 0, i3 = (s3 = function() {
      u3 = [];
      for (var t4 = 0, r3 = n2(e2.length / 2); 0 <= r3 ? t4 < r3 : t4 > r3; 0 <= r3 ? t4++ : t4--)
        u3.push(t4);
      return u3;
    }.apply(this).reverse()).length; a3 < i3; a3++)
      o3 = s3[a3], c3.push(_3(e2, o3, t3));
    return c3;
  }, "o"), h2 = /* @__PURE__ */ __name(function(e2, t3, n3) {
    var o3;
    if (null == n3 && (n3 = r2), -1 !== (o3 = e2.indexOf(t3)))
      return v2(e2, 0, o3, n3), _3(e2, o3, n3);
  }, "h"), f2 = /* @__PURE__ */ __name(function(e2, t3, n3) {
    var a3, i3, c3, u3, l3;
    if (null == n3 && (n3 = r2), !(i3 = e2.slice(0, t3)).length)
      return i3;
    for (o2(i3, n3), c3 = 0, u3 = (l3 = e2.slice(t3)).length; c3 < u3; c3++)
      a3 = l3[c3], s2(i3, a3, n3);
    return i3.sort(n3).reverse();
  }, "f"), p2 = /* @__PURE__ */ __name(function(e2, t3, n3) {
    var i3, s3, c3, f3, p3, h3, v3, _4, d2;
    if (null == n3 && (n3 = r2), 10 * t3 <= e2.length) {
      if (!(c3 = e2.slice(0, t3).sort(n3)).length)
        return c3;
      for (s3 = c3[c3.length - 1], f3 = 0, h3 = (v3 = e2.slice(t3)).length; f3 < h3; f3++)
        n3(i3 = v3[f3], s3) < 0 && (u2(c3, i3, 0, null, n3), c3.pop(), s3 = c3[c3.length - 1]);
      return c3;
    }
    for (o2(e2, n3), d2 = [], p3 = 0, _4 = l2(t3, e2.length); 0 <= _4 ? p3 < _4 : p3 > _4; 0 <= _4 ? ++p3 : --p3)
      d2.push(a2(e2, n3));
    return d2;
  }, "p"), v2 = /* @__PURE__ */ __name(function(e2, t3, n3, o3) {
    var a3, i3, s3;
    for (null == o3 && (o3 = r2), a3 = e2[n3]; n3 > t3 && o3(a3, i3 = e2[s3 = n3 - 1 >> 1]) < 0; )
      e2[n3] = i3, n3 = s3;
    return e2[n3] = a3;
  }, "v"), _3 = /* @__PURE__ */ __name(function(e2, t3, n3) {
    var o3, a3, i3, s3, c3;
    for (null == n3 && (n3 = r2), a3 = e2.length, c3 = t3, i3 = e2[t3], o3 = 2 * t3 + 1; o3 < a3; )
      (s3 = o3 + 1) < a3 && !(n3(e2[o3], e2[s3]) < 0) && (o3 = s3), e2[t3] = e2[o3], o3 = 2 * (t3 = o3) + 1;
    return e2[t3] = i3, v2(e2, c3, t3, n3);
  }, "_"), t2 = function() {
    function Heap(e2) {
      this.cmp = null != e2 ? e2 : r2, this.nodes = [];
    }
    __name(Heap, "Heap");
    return Heap.push = i2, Heap.pop = a2, Heap.replace = c2, Heap.pushpop = s2, Heap.heapify = o2, Heap.updateItem = h2, Heap.nlargest = f2, Heap.nsmallest = p2, Heap.prototype.push = function(e2) {
      return i2(this.nodes, e2, this.cmp);
    }, Heap.prototype.pop = function() {
      return a2(this.nodes, this.cmp);
    }, Heap.prototype.peek = function() {
      return this.nodes[0];
    }, Heap.prototype.contains = function(e2) {
      return -1 !== this.nodes.indexOf(e2);
    }, Heap.prototype.replace = function(e2) {
      return c2(this.nodes, e2, this.cmp);
    }, Heap.prototype.pushpop = function(e2) {
      return s2(this.nodes, e2, this.cmp);
    }, Heap.prototype.heapify = function() {
      return o2(this.nodes, this.cmp);
    }, Heap.prototype.updateItem = function(e2) {
      return h2(this.nodes, e2, this.cmp);
    }, Heap.prototype.clear = function() {
      return this.nodes = [];
    }, Heap.prototype.empty = function() {
      return 0 === this.nodes.length;
    }, Heap.prototype.size = function() {
      return this.nodes.length;
    }, Heap.prototype.clone = function() {
      var e2;
      return (e2 = new Heap()).nodes = this.nodes.slice(0), e2;
    }, Heap.prototype.toArray = function() {
      return this.nodes.slice(0);
    }, Heap.prototype.insert = Heap.prototype.push, Heap.prototype.top = Heap.prototype.peek, Heap.prototype.front = Heap.prototype.peek, Heap.prototype.has = Heap.prototype.contains, Heap.prototype.copy = Heap.prototype.clone, Heap;
  }(), e.exports = t2;
}.call(t);
var c = s.exports;
var u = /* @__PURE__ */ __name(function arrayMap$2(e2, t2) {
  for (var r2 = -1, n2 = null == e2 ? 0 : e2.length, o2 = Array(n2); ++r2 < n2; )
    o2[r2] = t2(e2[r2], r2, e2);
  return o2;
}, "arrayMap$2");
var l = Array.isArray;
var f = "object" == typeof t && t && t.Object === Object && t;
var p = f;
var h = "object" == typeof self && self && self.Object === Object && self;
var v = p || h || Function("return this")();
var _ = v.Symbol;
var d = _;
var y = Object.prototype;
var g = y.hasOwnProperty;
var m = y.toString;
var b = d ? d.toStringTag : void 0;
var k = /* @__PURE__ */ __name(function getRawTag$1(e2) {
  var t2 = g.call(e2, b), r2 = e2[b];
  try {
    e2[b] = void 0;
    var n2 = true;
  } catch (e3) {
  }
  var o2 = m.call(e2);
  return n2 && (t2 ? e2[b] = r2 : delete e2[b]), o2;
}, "getRawTag$1");
var j = Object.prototype.toString;
var $ = k;
var w = /* @__PURE__ */ __name(function objectToString$1(e2) {
  return j.call(e2);
}, "objectToString$1");
var O = _ ? _.toStringTag : void 0;
var S = /* @__PURE__ */ __name(function baseGetTag$5(e2) {
  return null == e2 ? void 0 === e2 ? "[object Undefined]" : "[object Null]" : O && O in Object(e2) ? $(e2) : w(e2);
}, "baseGetTag$5");
var C = /* @__PURE__ */ __name(function isObjectLike$5(e2) {
  return null != e2 && "object" == typeof e2;
}, "isObjectLike$5");
var z = S;
var A = C;
var x = /* @__PURE__ */ __name(function isSymbol$4(e2) {
  return "symbol" == typeof e2 || A(e2) && "[object Symbol]" == z(e2);
}, "isSymbol$4");
var M = l;
var I = x;
var E = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/;
var P = /^\w*$/;
var q = /* @__PURE__ */ __name(function isKey$3(e2, t2) {
  if (M(e2))
    return false;
  var r2 = typeof e2;
  return !("number" != r2 && "symbol" != r2 && "boolean" != r2 && null != e2 && !I(e2)) || (P.test(e2) || !E.test(e2) || null != t2 && e2 in Object(t2));
}, "isKey$3");
var H = /* @__PURE__ */ __name(function isObject$3(e2) {
  var t2 = typeof e2;
  return null != e2 && ("object" == t2 || "function" == t2);
}, "isObject$3");
var L = S;
var R = H;
var T;
var B = /* @__PURE__ */ __name(function isFunction$2(e2) {
  if (!R(e2))
    return false;
  var t2 = L(e2);
  return "[object Function]" == t2 || "[object GeneratorFunction]" == t2 || "[object AsyncFunction]" == t2 || "[object Proxy]" == t2;
}, "isFunction$2");
var W = v["__core-js_shared__"];
var F = (T = /[^.]+$/.exec(W && W.keys && W.keys.IE_PROTO || "")) ? "Symbol(src)_1." + T : "";
var D = /* @__PURE__ */ __name(function isMasked$1(e2) {
  return !!F && F in e2;
}, "isMasked$1");
var N = Function.prototype.toString;
var U = /* @__PURE__ */ __name(function toSource$2(e2) {
  if (null != e2) {
    try {
      return N.call(e2);
    } catch (e3) {
    }
    try {
      return e2 + "";
    } catch (e3) {
    }
  }
  return "";
}, "toSource$2");
var G = B;
var K = D;
var Q = H;
var V = U;
var Z = /^\[object .+?Constructor\]$/;
var J = Function.prototype;
var X = Object.prototype;
var Y = J.toString;
var ee = X.hasOwnProperty;
var te = RegExp("^" + Y.call(ee).replace(/[\\^$.*+?()[\]{}|]/g, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$");
var re = /* @__PURE__ */ __name(function baseIsNative$1(e2) {
  return !(!Q(e2) || K(e2)) && (G(e2) ? te : Z).test(V(e2));
}, "baseIsNative$1");
var ne = /* @__PURE__ */ __name(function getValue$1(e2, t2) {
  return null == e2 ? void 0 : e2[t2];
}, "getValue$1");
var oe = /* @__PURE__ */ __name(function getNative$6(e2, t2) {
  var r2 = ne(e2, t2);
  return re(r2) ? r2 : void 0;
}, "getNative$6");
var ae = oe(Object, "create");
var ie = ae;
var se = /* @__PURE__ */ __name(function hashClear$1() {
  this.__data__ = ie ? ie(null) : {}, this.size = 0;
}, "hashClear$1");
var ce = /* @__PURE__ */ __name(function hashDelete$1(e2) {
  var t2 = this.has(e2) && delete this.__data__[e2];
  return this.size -= t2 ? 1 : 0, t2;
}, "hashDelete$1");
var ue = ae;
var le = Object.prototype.hasOwnProperty;
var fe = /* @__PURE__ */ __name(function hashGet$1(e2) {
  var t2 = this.__data__;
  if (ue) {
    var r2 = t2[e2];
    return "__lodash_hash_undefined__" === r2 ? void 0 : r2;
  }
  return le.call(t2, e2) ? t2[e2] : void 0;
}, "hashGet$1");
var pe = ae;
var he = Object.prototype.hasOwnProperty;
var ve = ae;
var _e = se;
var de = ce;
var ye = fe;
var ge = /* @__PURE__ */ __name(function hashHas$1(e2) {
  var t2 = this.__data__;
  return pe ? void 0 !== t2[e2] : he.call(t2, e2);
}, "hashHas$1");
var me = /* @__PURE__ */ __name(function hashSet$1(e2, t2) {
  var r2 = this.__data__;
  return this.size += this.has(e2) ? 0 : 1, r2[e2] = ve && void 0 === t2 ? "__lodash_hash_undefined__" : t2, this;
}, "hashSet$1");
function Hash$1(e2) {
  var t2 = -1, r2 = null == e2 ? 0 : e2.length;
  for (this.clear(); ++t2 < r2; ) {
    var n2 = e2[t2];
    this.set(n2[0], n2[1]);
  }
}
__name(Hash$1, "Hash$1");
Hash$1.prototype.clear = _e, Hash$1.prototype.delete = de, Hash$1.prototype.get = ye, Hash$1.prototype.has = ge, Hash$1.prototype.set = me;
var be = Hash$1;
var ke = /* @__PURE__ */ __name(function listCacheClear$1() {
  this.__data__ = [], this.size = 0;
}, "listCacheClear$1");
var je = /* @__PURE__ */ __name(function eq$2(e2, t2) {
  return e2 === t2 || e2 != e2 && t2 != t2;
}, "eq$2");
var $e = je;
var we = /* @__PURE__ */ __name(function assocIndexOf$4(e2, t2) {
  for (var r2 = e2.length; r2--; )
    if ($e(e2[r2][0], t2))
      return r2;
  return -1;
}, "assocIndexOf$4");
var Oe = we;
var Se = Array.prototype.splice;
var Ce = we;
var ze = we;
var Ae = we;
var xe = ke;
var Me = /* @__PURE__ */ __name(function listCacheDelete$1(e2) {
  var t2 = this.__data__, r2 = Oe(t2, e2);
  return !(r2 < 0) && (r2 == t2.length - 1 ? t2.pop() : Se.call(t2, r2, 1), --this.size, true);
}, "listCacheDelete$1");
var Ie = /* @__PURE__ */ __name(function listCacheGet$1(e2) {
  var t2 = this.__data__, r2 = Ce(t2, e2);
  return r2 < 0 ? void 0 : t2[r2][1];
}, "listCacheGet$1");
var Ee = /* @__PURE__ */ __name(function listCacheHas$1(e2) {
  return ze(this.__data__, e2) > -1;
}, "listCacheHas$1");
var Pe = /* @__PURE__ */ __name(function listCacheSet$1(e2, t2) {
  var r2 = this.__data__, n2 = Ae(r2, e2);
  return n2 < 0 ? (++this.size, r2.push([e2, t2])) : r2[n2][1] = t2, this;
}, "listCacheSet$1");
function ListCache$4(e2) {
  var t2 = -1, r2 = null == e2 ? 0 : e2.length;
  for (this.clear(); ++t2 < r2; ) {
    var n2 = e2[t2];
    this.set(n2[0], n2[1]);
  }
}
__name(ListCache$4, "ListCache$4");
ListCache$4.prototype.clear = xe, ListCache$4.prototype.delete = Me, ListCache$4.prototype.get = Ie, ListCache$4.prototype.has = Ee, ListCache$4.prototype.set = Pe;
var qe = ListCache$4;
var He = oe(v, "Map");
var Le = be;
var Re = qe;
var Te = He;
var Be = /* @__PURE__ */ __name(function isKeyable$1(e2) {
  var t2 = typeof e2;
  return "string" == t2 || "number" == t2 || "symbol" == t2 || "boolean" == t2 ? "__proto__" !== e2 : null === e2;
}, "isKeyable$1");
var We = /* @__PURE__ */ __name(function getMapData$4(e2, t2) {
  var r2 = e2.__data__;
  return Be(t2) ? r2["string" == typeof t2 ? "string" : "hash"] : r2.map;
}, "getMapData$4");
var Fe = We;
var De = We;
var Ne = We;
var Ue = We;
var Ge = /* @__PURE__ */ __name(function mapCacheClear$1() {
  this.size = 0, this.__data__ = { hash: new Le(), map: new (Te || Re)(), string: new Le() };
}, "mapCacheClear$1");
var Ke = /* @__PURE__ */ __name(function mapCacheDelete$1(e2) {
  var t2 = Fe(this, e2).delete(e2);
  return this.size -= t2 ? 1 : 0, t2;
}, "mapCacheDelete$1");
var Qe = /* @__PURE__ */ __name(function mapCacheGet$1(e2) {
  return De(this, e2).get(e2);
}, "mapCacheGet$1");
var Ve = /* @__PURE__ */ __name(function mapCacheHas$1(e2) {
  return Ne(this, e2).has(e2);
}, "mapCacheHas$1");
var Ze = /* @__PURE__ */ __name(function mapCacheSet$1(e2, t2) {
  var r2 = Ue(this, e2), n2 = r2.size;
  return r2.set(e2, t2), this.size += r2.size == n2 ? 0 : 1, this;
}, "mapCacheSet$1");
function MapCache$3(e2) {
  var t2 = -1, r2 = null == e2 ? 0 : e2.length;
  for (this.clear(); ++t2 < r2; ) {
    var n2 = e2[t2];
    this.set(n2[0], n2[1]);
  }
}
__name(MapCache$3, "MapCache$3");
MapCache$3.prototype.clear = Ge, MapCache$3.prototype.delete = Ke, MapCache$3.prototype.get = Qe, MapCache$3.prototype.has = Ve, MapCache$3.prototype.set = Ze;
var Je = MapCache$3;
var Xe = Je;
function memoize$1(e2, t2) {
  if ("function" != typeof e2 || null != t2 && "function" != typeof t2)
    throw new TypeError("Expected a function");
  var memoized = /* @__PURE__ */ __name(function() {
    var r2 = arguments, n2 = t2 ? t2.apply(this, r2) : r2[0], o2 = memoized.cache;
    if (o2.has(n2))
      return o2.get(n2);
    var a2 = e2.apply(this, r2);
    return memoized.cache = o2.set(n2, a2) || o2, a2;
  }, "memoized");
  return memoized.cache = new (memoize$1.Cache || Xe)(), memoized;
}
__name(memoize$1, "memoize$1");
memoize$1.Cache = Xe;
var Ye = memoize$1;
var et = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;
var tt = /\\(\\)?/g;
var rt = (/* @__PURE__ */ __name(function memoizeCapped$1(e2) {
  var t2 = Ye(e2, function(e3) {
    return 500 === r2.size && r2.clear(), e3;
  }), r2 = t2.cache;
  return t2;
}, "memoizeCapped$1"))(function(e2) {
  var t2 = [];
  return 46 === e2.charCodeAt(0) && t2.push(""), e2.replace(et, function(e3, r2, n2, o2) {
    t2.push(n2 ? o2.replace(tt, "$1") : r2 || e3);
  }), t2;
});
var nt = u;
var ot = l;
var at = x;
var it = _ ? _.prototype : void 0;
var st = it ? it.toString : void 0;
var ct = /* @__PURE__ */ __name(function baseToString$1(e2) {
  if ("string" == typeof e2)
    return e2;
  if (ot(e2))
    return nt(e2, baseToString$1) + "";
  if (at(e2))
    return st ? st.call(e2) : "";
  var t2 = e2 + "";
  return "0" == t2 && 1 / e2 == -Infinity ? "-0" : t2;
}, "baseToString$1");
var ut = ct;
var lt = l;
var ft = q;
var pt = rt;
var ht = /* @__PURE__ */ __name(function toString$1(e2) {
  return null == e2 ? "" : ut(e2);
}, "toString$1");
var vt = /* @__PURE__ */ __name(function castPath$2(e2, t2) {
  return lt(e2) ? e2 : ft(e2, t2) ? [e2] : pt(ht(e2));
}, "castPath$2");
var _t = x;
var dt = /* @__PURE__ */ __name(function toKey$4(e2) {
  if ("string" == typeof e2 || _t(e2))
    return e2;
  var t2 = e2 + "";
  return "0" == t2 && 1 / e2 == -Infinity ? "-0" : t2;
}, "toKey$4");
var yt = vt;
var gt = dt;
var mt = /* @__PURE__ */ __name(function baseGet$3(e2, t2) {
  for (var r2 = 0, n2 = (t2 = yt(t2, e2)).length; null != e2 && r2 < n2; )
    e2 = e2[gt(t2[r2++])];
  return r2 && r2 == n2 ? e2 : void 0;
}, "baseGet$3");
var bt = qe;
var kt = qe;
var jt = He;
var $t = Je;
var wt = qe;
var Ot = /* @__PURE__ */ __name(function stackClear$1() {
  this.__data__ = new bt(), this.size = 0;
}, "stackClear$1");
var St = /* @__PURE__ */ __name(function stackDelete$1(e2) {
  var t2 = this.__data__, r2 = t2.delete(e2);
  return this.size = t2.size, r2;
}, "stackDelete$1");
var Ct = /* @__PURE__ */ __name(function stackGet$1(e2) {
  return this.__data__.get(e2);
}, "stackGet$1");
var zt = /* @__PURE__ */ __name(function stackHas$1(e2) {
  return this.__data__.has(e2);
}, "stackHas$1");
var At = /* @__PURE__ */ __name(function stackSet$1(e2, t2) {
  var r2 = this.__data__;
  if (r2 instanceof kt) {
    var n2 = r2.__data__;
    if (!jt || n2.length < 199)
      return n2.push([e2, t2]), this.size = ++r2.size, this;
    r2 = this.__data__ = new $t(n2);
  }
  return r2.set(e2, t2), this.size = r2.size, this;
}, "stackSet$1");
function Stack$2(e2) {
  var t2 = this.__data__ = new wt(e2);
  this.size = t2.size;
}
__name(Stack$2, "Stack$2");
Stack$2.prototype.clear = Ot, Stack$2.prototype.delete = St, Stack$2.prototype.get = Ct, Stack$2.prototype.has = zt, Stack$2.prototype.set = At;
var xt = Stack$2;
var Mt = Je;
var It = /* @__PURE__ */ __name(function setCacheAdd$1(e2) {
  return this.__data__.set(e2, "__lodash_hash_undefined__"), this;
}, "setCacheAdd$1");
var Et = /* @__PURE__ */ __name(function setCacheHas$1(e2) {
  return this.__data__.has(e2);
}, "setCacheHas$1");
function SetCache$1(e2) {
  var t2 = -1, r2 = null == e2 ? 0 : e2.length;
  for (this.__data__ = new Mt(); ++t2 < r2; )
    this.add(e2[t2]);
}
__name(SetCache$1, "SetCache$1");
SetCache$1.prototype.add = SetCache$1.prototype.push = It, SetCache$1.prototype.has = Et;
var Pt = SetCache$1;
var qt = /* @__PURE__ */ __name(function arraySome$1(e2, t2) {
  for (var r2 = -1, n2 = null == e2 ? 0 : e2.length; ++r2 < n2; )
    if (t2(e2[r2], r2, e2))
      return true;
  return false;
}, "arraySome$1");
var Ht = /* @__PURE__ */ __name(function cacheHas$1(e2, t2) {
  return e2.has(t2);
}, "cacheHas$1");
var Lt = /* @__PURE__ */ __name(function equalArrays$2(e2, t2, r2, n2, o2, a2) {
  var i2 = 1 & r2, s2 = e2.length, c2 = t2.length;
  if (s2 != c2 && !(i2 && c2 > s2))
    return false;
  var u2 = a2.get(e2), l2 = a2.get(t2);
  if (u2 && l2)
    return u2 == t2 && l2 == e2;
  var f2 = -1, p2 = true, h2 = 2 & r2 ? new Pt() : void 0;
  for (a2.set(e2, t2), a2.set(t2, e2); ++f2 < s2; ) {
    var v2 = e2[f2], _3 = t2[f2];
    if (n2)
      var d2 = i2 ? n2(_3, v2, f2, t2, e2, a2) : n2(v2, _3, f2, e2, t2, a2);
    if (void 0 !== d2) {
      if (d2)
        continue;
      p2 = false;
      break;
    }
    if (h2) {
      if (!qt(t2, function(e3, t3) {
        if (!Ht(h2, t3) && (v2 === e3 || o2(v2, e3, r2, n2, a2)))
          return h2.push(t3);
      })) {
        p2 = false;
        break;
      }
    } else if (v2 !== _3 && !o2(v2, _3, r2, n2, a2)) {
      p2 = false;
      break;
    }
  }
  return a2.delete(e2), a2.delete(t2), p2;
}, "equalArrays$2");
var Rt = v.Uint8Array;
var Tt = je;
var Bt = Lt;
var Wt = /* @__PURE__ */ __name(function mapToArray$1(e2) {
  var t2 = -1, r2 = Array(e2.size);
  return e2.forEach(function(e3, n2) {
    r2[++t2] = [n2, e3];
  }), r2;
}, "mapToArray$1");
var Ft = /* @__PURE__ */ __name(function setToArray$1(e2) {
  var t2 = -1, r2 = Array(e2.size);
  return e2.forEach(function(e3) {
    r2[++t2] = e3;
  }), r2;
}, "setToArray$1");
var Dt = _ ? _.prototype : void 0;
var Nt = Dt ? Dt.valueOf : void 0;
var Ut = /* @__PURE__ */ __name(function equalByTag$1(e2, t2, r2, n2, o2, a2, i2) {
  switch (r2) {
    case "[object DataView]":
      if (e2.byteLength != t2.byteLength || e2.byteOffset != t2.byteOffset)
        return false;
      e2 = e2.buffer, t2 = t2.buffer;
    case "[object ArrayBuffer]":
      return !(e2.byteLength != t2.byteLength || !a2(new Rt(e2), new Rt(t2)));
    case "[object Boolean]":
    case "[object Date]":
    case "[object Number]":
      return Tt(+e2, +t2);
    case "[object Error]":
      return e2.name == t2.name && e2.message == t2.message;
    case "[object RegExp]":
    case "[object String]":
      return e2 == t2 + "";
    case "[object Map]":
      var s2 = Wt;
    case "[object Set]":
      var c2 = 1 & n2;
      if (s2 || (s2 = Ft), e2.size != t2.size && !c2)
        return false;
      var u2 = i2.get(e2);
      if (u2)
        return u2 == t2;
      n2 |= 2, i2.set(e2, t2);
      var l2 = Bt(s2(e2), s2(t2), n2, o2, a2, i2);
      return i2.delete(e2), l2;
    case "[object Symbol]":
      if (Nt)
        return Nt.call(e2) == Nt.call(t2);
  }
  return false;
}, "equalByTag$1");
var Gt = /* @__PURE__ */ __name(function arrayPush$1(e2, t2) {
  for (var r2 = -1, n2 = t2.length, o2 = e2.length; ++r2 < n2; )
    e2[o2 + r2] = t2[r2];
  return e2;
}, "arrayPush$1");
var Kt = l;
var Qt = /* @__PURE__ */ __name(function baseGetAllKeys$1(e2, t2, r2) {
  var n2 = t2(e2);
  return Kt(e2) ? n2 : Gt(n2, r2(e2));
}, "baseGetAllKeys$1");
var Vt = /* @__PURE__ */ __name(function arrayFilter$1(e2, t2) {
  for (var r2 = -1, n2 = null == e2 ? 0 : e2.length, o2 = 0, a2 = []; ++r2 < n2; ) {
    var i2 = e2[r2];
    t2(i2, r2, e2) && (a2[o2++] = i2);
  }
  return a2;
}, "arrayFilter$1");
var Zt = /* @__PURE__ */ __name(function stubArray$1() {
  return [];
}, "stubArray$1");
var Jt = Object.prototype.propertyIsEnumerable;
var Xt = Object.getOwnPropertySymbols;
var Yt = Xt ? function(e2) {
  return null == e2 ? [] : (e2 = Object(e2), Vt(Xt(e2), function(t2) {
    return Jt.call(e2, t2);
  }));
} : Zt;
var er = /* @__PURE__ */ __name(function baseTimes$1(e2, t2) {
  for (var r2 = -1, n2 = Array(e2); ++r2 < e2; )
    n2[r2] = t2(r2);
  return n2;
}, "baseTimes$1");
var tr = S;
var rr = C;
var nr = /* @__PURE__ */ __name(function baseIsArguments$1(e2) {
  return rr(e2) && "[object Arguments]" == tr(e2);
}, "baseIsArguments$1");
var or = C;
var ar = Object.prototype;
var ir = ar.hasOwnProperty;
var sr = ar.propertyIsEnumerable;
var cr = nr(function() {
  return arguments;
}()) ? nr : function(e2) {
  return or(e2) && ir.call(e2, "callee") && !sr.call(e2, "callee");
};
var ur = { exports: {} };
var lr = /* @__PURE__ */ __name(function stubFalse() {
  return false;
}, "stubFalse");
!function(e2, t2) {
  var r2 = v, n2 = lr, o2 = t2 && !t2.nodeType && t2, a2 = o2 && e2 && !e2.nodeType && e2, i2 = a2 && a2.exports === o2 ? r2.Buffer : void 0, s2 = (i2 ? i2.isBuffer : void 0) || n2;
  e2.exports = s2;
}(ur, ur.exports);
var fr = /^(?:0|[1-9]\d*)$/;
var pr = /* @__PURE__ */ __name(function isIndex$2(e2, t2) {
  var r2 = typeof e2;
  return !!(t2 = null == t2 ? 9007199254740991 : t2) && ("number" == r2 || "symbol" != r2 && fr.test(e2)) && e2 > -1 && e2 % 1 == 0 && e2 < t2;
}, "isIndex$2");
var hr = /* @__PURE__ */ __name(function isLength$3(e2) {
  return "number" == typeof e2 && e2 > -1 && e2 % 1 == 0 && e2 <= 9007199254740991;
}, "isLength$3");
var vr = S;
var _r = hr;
var dr = C;
var yr = {};
yr["[object Float32Array]"] = yr["[object Float64Array]"] = yr["[object Int8Array]"] = yr["[object Int16Array]"] = yr["[object Int32Array]"] = yr["[object Uint8Array]"] = yr["[object Uint8ClampedArray]"] = yr["[object Uint16Array]"] = yr["[object Uint32Array]"] = true, yr["[object Arguments]"] = yr["[object Array]"] = yr["[object ArrayBuffer]"] = yr["[object Boolean]"] = yr["[object DataView]"] = yr["[object Date]"] = yr["[object Error]"] = yr["[object Function]"] = yr["[object Map]"] = yr["[object Number]"] = yr["[object Object]"] = yr["[object RegExp]"] = yr["[object Set]"] = yr["[object String]"] = yr["[object WeakMap]"] = false;
var gr = /* @__PURE__ */ __name(function baseIsTypedArray$1(e2) {
  return dr(e2) && _r(e2.length) && !!yr[vr(e2)];
}, "baseIsTypedArray$1");
var mr = /* @__PURE__ */ __name(function baseUnary$2(e2) {
  return function(t2) {
    return e2(t2);
  };
}, "baseUnary$2");
var br = { exports: {} };
!function(e2, t2) {
  var r2 = f, n2 = t2 && !t2.nodeType && t2, o2 = n2 && e2 && !e2.nodeType && e2, a2 = o2 && o2.exports === n2 && r2.process, i2 = function() {
    try {
      var e3 = o2 && o2.require && o2.require("util").types;
      return e3 || a2 && a2.binding && a2.binding("util");
    } catch (e4) {
    }
  }();
  e2.exports = i2;
}(br, br.exports);
var kr = gr;
var jr = mr;
var $r = br.exports;
var wr = $r && $r.isTypedArray;
var Or = wr ? jr(wr) : kr;
var Sr = er;
var Cr = cr;
var zr = l;
var Ar = ur.exports;
var xr = pr;
var Mr = Or;
var Ir = Object.prototype.hasOwnProperty;
var Er = /* @__PURE__ */ __name(function arrayLikeKeys$1(e2, t2) {
  var r2 = zr(e2), n2 = !r2 && Cr(e2), o2 = !r2 && !n2 && Ar(e2), a2 = !r2 && !n2 && !o2 && Mr(e2), i2 = r2 || n2 || o2 || a2, s2 = i2 ? Sr(e2.length, String) : [], c2 = s2.length;
  for (var u2 in e2)
    !t2 && !Ir.call(e2, u2) || i2 && ("length" == u2 || o2 && ("offset" == u2 || "parent" == u2) || a2 && ("buffer" == u2 || "byteLength" == u2 || "byteOffset" == u2) || xr(u2, c2)) || s2.push(u2);
  return s2;
}, "arrayLikeKeys$1");
var Pr = Object.prototype;
var qr = /* @__PURE__ */ __name(function isPrototype$1(e2) {
  var t2 = e2 && e2.constructor;
  return e2 === ("function" == typeof t2 && t2.prototype || Pr);
}, "isPrototype$1");
var Hr = (/* @__PURE__ */ __name(function overArg$1(e2, t2) {
  return function(r2) {
    return e2(t2(r2));
  };
}, "overArg$1"))(Object.keys, Object);
var Lr = qr;
var Rr = Hr;
var Tr = Object.prototype.hasOwnProperty;
var Br = B;
var Wr = hr;
var Fr = /* @__PURE__ */ __name(function isArrayLike$3(e2) {
  return null != e2 && Wr(e2.length) && !Br(e2);
}, "isArrayLike$3");
var Dr = Er;
var Nr = /* @__PURE__ */ __name(function baseKeys$1(e2) {
  if (!Lr(e2))
    return Rr(e2);
  var t2 = [];
  for (var r2 in Object(e2))
    Tr.call(e2, r2) && "constructor" != r2 && t2.push(r2);
  return t2;
}, "baseKeys$1");
var Ur = Fr;
var Gr = /* @__PURE__ */ __name(function keys$3(e2) {
  return Ur(e2) ? Dr(e2) : Nr(e2);
}, "keys$3");
var Kr = Qt;
var Qr = Yt;
var Vr = Gr;
var Zr = /* @__PURE__ */ __name(function getAllKeys$1(e2) {
  return Kr(e2, Vr, Qr);
}, "getAllKeys$1");
var Jr = Object.prototype.hasOwnProperty;
var Xr = /* @__PURE__ */ __name(function equalObjects$1(e2, t2, r2, n2, o2, a2) {
  var i2 = 1 & r2, s2 = Zr(e2), c2 = s2.length;
  if (c2 != Zr(t2).length && !i2)
    return false;
  for (var u2 = c2; u2--; ) {
    var l2 = s2[u2];
    if (!(i2 ? l2 in t2 : Jr.call(t2, l2)))
      return false;
  }
  var f2 = a2.get(e2), p2 = a2.get(t2);
  if (f2 && p2)
    return f2 == t2 && p2 == e2;
  var h2 = true;
  a2.set(e2, t2), a2.set(t2, e2);
  for (var v2 = i2; ++u2 < c2; ) {
    var _3 = e2[l2 = s2[u2]], d2 = t2[l2];
    if (n2)
      var y3 = i2 ? n2(d2, _3, l2, t2, e2, a2) : n2(_3, d2, l2, e2, t2, a2);
    if (!(void 0 === y3 ? _3 === d2 || o2(_3, d2, r2, n2, a2) : y3)) {
      h2 = false;
      break;
    }
    v2 || (v2 = "constructor" == l2);
  }
  if (h2 && !v2) {
    var g3 = e2.constructor, m2 = t2.constructor;
    g3 == m2 || !("constructor" in e2) || !("constructor" in t2) || "function" == typeof g3 && g3 instanceof g3 && "function" == typeof m2 && m2 instanceof m2 || (h2 = false);
  }
  return a2.delete(e2), a2.delete(t2), h2;
}, "equalObjects$1");
var Yr = oe(v, "DataView");
var en = He;
var tn = oe(v, "Promise");
var rn = oe(v, "Set");
var nn = oe(v, "WeakMap");
var on = S;
var an = U;
var sn = an(Yr);
var cn = an(en);
var un = an(tn);
var ln = an(rn);
var fn = an(nn);
var pn = on;
(Yr && "[object DataView]" != pn(new Yr(new ArrayBuffer(1))) || en && "[object Map]" != pn(new en()) || tn && "[object Promise]" != pn(tn.resolve()) || rn && "[object Set]" != pn(new rn()) || nn && "[object WeakMap]" != pn(new nn())) && (pn = /* @__PURE__ */ __name(function(e2) {
  var t2 = on(e2), r2 = "[object Object]" == t2 ? e2.constructor : void 0, n2 = r2 ? an(r2) : "";
  if (n2)
    switch (n2) {
      case sn:
        return "[object DataView]";
      case cn:
        return "[object Map]";
      case un:
        return "[object Promise]";
      case ln:
        return "[object Set]";
      case fn:
        return "[object WeakMap]";
    }
  return t2;
}, "pn"));
var hn = xt;
var vn = Lt;
var _n = Ut;
var dn = Xr;
var yn = pn;
var gn = l;
var mn = ur.exports;
var bn = Or;
var kn = "[object Object]";
var jn = Object.prototype.hasOwnProperty;
var $n = /* @__PURE__ */ __name(function baseIsEqualDeep$1(e2, t2, r2, n2, o2, a2) {
  var i2 = gn(e2), s2 = gn(t2), c2 = i2 ? "[object Array]" : yn(e2), u2 = s2 ? "[object Array]" : yn(t2), l2 = (c2 = "[object Arguments]" == c2 ? kn : c2) == kn, f2 = (u2 = "[object Arguments]" == u2 ? kn : u2) == kn, p2 = c2 == u2;
  if (p2 && mn(e2)) {
    if (!mn(t2))
      return false;
    i2 = true, l2 = false;
  }
  if (p2 && !l2)
    return a2 || (a2 = new hn()), i2 || bn(e2) ? vn(e2, t2, r2, n2, o2, a2) : _n(e2, t2, c2, r2, n2, o2, a2);
  if (!(1 & r2)) {
    var h2 = l2 && jn.call(e2, "__wrapped__"), v2 = f2 && jn.call(t2, "__wrapped__");
    if (h2 || v2) {
      var _3 = h2 ? e2.value() : e2, d2 = v2 ? t2.value() : t2;
      return a2 || (a2 = new hn()), o2(_3, d2, r2, n2, a2);
    }
  }
  return !!p2 && (a2 || (a2 = new hn()), dn(e2, t2, r2, n2, o2, a2));
}, "baseIsEqualDeep$1");
var wn = C;
var On = /* @__PURE__ */ __name(function baseIsEqual$2(e2, t2, r2, n2, o2) {
  return e2 === t2 || (null == e2 || null == t2 || !wn(e2) && !wn(t2) ? e2 != e2 && t2 != t2 : $n(e2, t2, r2, n2, baseIsEqual$2, o2));
}, "baseIsEqual$2");
var Sn = xt;
var Cn = On;
var zn = H;
var An = /* @__PURE__ */ __name(function isStrictComparable$2(e2) {
  return e2 == e2 && !zn(e2);
}, "isStrictComparable$2");
var xn = An;
var Mn = Gr;
var In = /* @__PURE__ */ __name(function matchesStrictComparable$2(e2, t2) {
  return function(r2) {
    return null != r2 && (r2[e2] === t2 && (void 0 !== t2 || e2 in Object(r2)));
  };
}, "matchesStrictComparable$2");
var En = /* @__PURE__ */ __name(function baseIsMatch$1(e2, t2, r2, n2) {
  var o2 = r2.length, a2 = o2, i2 = !n2;
  if (null == e2)
    return !a2;
  for (e2 = Object(e2); o2--; ) {
    var s2 = r2[o2];
    if (i2 && s2[2] ? s2[1] !== e2[s2[0]] : !(s2[0] in e2))
      return false;
  }
  for (; ++o2 < a2; ) {
    var c2 = (s2 = r2[o2])[0], u2 = e2[c2], l2 = s2[1];
    if (i2 && s2[2]) {
      if (void 0 === u2 && !(c2 in e2))
        return false;
    } else {
      var f2 = new Sn();
      if (n2)
        var p2 = n2(u2, l2, c2, e2, t2, f2);
      if (!(void 0 === p2 ? Cn(l2, u2, 3, n2, f2) : p2))
        return false;
    }
  }
  return true;
}, "baseIsMatch$1");
var Pn = /* @__PURE__ */ __name(function getMatchData$1(e2) {
  for (var t2 = Mn(e2), r2 = t2.length; r2--; ) {
    var n2 = t2[r2], o2 = e2[n2];
    t2[r2] = [n2, o2, xn(o2)];
  }
  return t2;
}, "getMatchData$1");
var qn = In;
var Hn = mt;
var Ln = vt;
var Rn = cr;
var Tn = l;
var Bn = pr;
var Wn = hr;
var Fn = dt;
var Dn = /* @__PURE__ */ __name(function baseHasIn$1(e2, t2) {
  return null != e2 && t2 in Object(e2);
}, "baseHasIn$1");
var Nn = /* @__PURE__ */ __name(function hasPath$1(e2, t2, r2) {
  for (var n2 = -1, o2 = (t2 = Ln(t2, e2)).length, a2 = false; ++n2 < o2; ) {
    var i2 = Fn(t2[n2]);
    if (!(a2 = null != e2 && r2(e2, i2)))
      break;
    e2 = e2[i2];
  }
  return a2 || ++n2 != o2 ? a2 : !!(o2 = null == e2 ? 0 : e2.length) && Wn(o2) && Bn(i2, o2) && (Tn(e2) || Rn(e2));
}, "hasPath$1");
var Un = On;
var Gn = /* @__PURE__ */ __name(function get$1(e2, t2, r2) {
  var n2 = null == e2 ? void 0 : Hn(e2, t2);
  return void 0 === n2 ? r2 : n2;
}, "get$1");
var Kn = /* @__PURE__ */ __name(function hasIn$1(e2, t2) {
  return null != e2 && Nn(e2, t2, Dn);
}, "hasIn$1");
var Qn = q;
var Vn = An;
var Zn = In;
var Jn = dt;
var Xn = /* @__PURE__ */ __name(function identity$2(e2) {
  return e2;
}, "identity$2");
var Yn = mt;
var eo = /* @__PURE__ */ __name(function baseProperty$1(e2) {
  return function(t2) {
    return null == t2 ? void 0 : t2[e2];
  };
}, "baseProperty$1");
var to = /* @__PURE__ */ __name(function basePropertyDeep$1(e2) {
  return function(t2) {
    return Yn(t2, e2);
  };
}, "basePropertyDeep$1");
var ro = q;
var no = dt;
var oo = /* @__PURE__ */ __name(function baseMatches$1(e2) {
  var t2 = Pn(e2);
  return 1 == t2.length && t2[0][2] ? qn(t2[0][0], t2[0][1]) : function(r2) {
    return r2 === e2 || En(r2, e2, t2);
  };
}, "baseMatches$1");
var ao = /* @__PURE__ */ __name(function baseMatchesProperty$1(e2, t2) {
  return Qn(e2) && Vn(t2) ? Zn(Jn(e2), t2) : function(r2) {
    var n2 = Gn(r2, e2);
    return void 0 === n2 && n2 === t2 ? Kn(r2, e2) : Un(t2, n2, 3);
  };
}, "baseMatchesProperty$1");
var io = Xn;
var so = l;
var co = /* @__PURE__ */ __name(function property$1(e2) {
  return ro(e2) ? eo(no(e2)) : to(e2);
}, "property$1");
var uo = /* @__PURE__ */ __name(function baseIteratee$1(e2) {
  return "function" == typeof e2 ? e2 : null == e2 ? io : "object" == typeof e2 ? so(e2) ? ao(e2[0], e2[1]) : oo(e2) : co(e2);
}, "baseIteratee$1");
var lo = (/* @__PURE__ */ __name(function createBaseFor$1(e2) {
  return function(t2, r2, n2) {
    for (var o2 = -1, a2 = Object(t2), i2 = n2(t2), s2 = i2.length; s2--; ) {
      var c2 = i2[e2 ? s2 : ++o2];
      if (false === r2(a2[c2], c2, a2))
        break;
    }
    return t2;
  };
}, "createBaseFor$1"))();
var fo = Gr;
var po = Fr;
var ho = (/* @__PURE__ */ __name(function createBaseEach$1(e2, t2) {
  return function(r2, n2) {
    if (null == r2)
      return r2;
    if (!po(r2))
      return e2(r2, n2);
    for (var o2 = r2.length, a2 = t2 ? o2 : -1, i2 = Object(r2); (t2 ? a2-- : ++a2 < o2) && false !== n2(i2[a2], a2, i2); )
      ;
    return r2;
  };
}, "createBaseEach$1"))(/* @__PURE__ */ __name(function baseForOwn$1(e2, t2) {
  return e2 && lo(e2, t2, fo);
}, "baseForOwn$1"));
var vo = Fr;
var _o = x;
var yo = /* @__PURE__ */ __name(function compareAscending$1(e2, t2) {
  if (e2 !== t2) {
    var r2 = void 0 !== e2, n2 = null === e2, o2 = e2 == e2, a2 = _o(e2), i2 = void 0 !== t2, s2 = null === t2, c2 = t2 == t2, u2 = _o(t2);
    if (!s2 && !u2 && !a2 && e2 > t2 || a2 && i2 && c2 && !s2 && !u2 || n2 && i2 && c2 || !r2 && c2 || !o2)
      return 1;
    if (!n2 && !a2 && !u2 && e2 < t2 || u2 && r2 && o2 && !n2 && !a2 || s2 && r2 && o2 || !i2 && o2 || !c2)
      return -1;
  }
  return 0;
}, "compareAscending$1");
var go = u;
var mo = mt;
var bo = uo;
var ko = /* @__PURE__ */ __name(function baseMap$1(e2, t2) {
  var r2 = -1, n2 = vo(e2) ? Array(e2.length) : [];
  return ho(e2, function(e3, o2, a2) {
    n2[++r2] = t2(e3, o2, a2);
  }), n2;
}, "baseMap$1");
var jo = /* @__PURE__ */ __name(function baseSortBy$1(e2, t2) {
  var r2 = e2.length;
  for (e2.sort(t2); r2--; )
    e2[r2] = e2[r2].value;
  return e2;
}, "baseSortBy$1");
var $o = mr;
var wo = /* @__PURE__ */ __name(function compareMultiple$1(e2, t2, r2) {
  for (var n2 = -1, o2 = e2.criteria, a2 = t2.criteria, i2 = o2.length, s2 = r2.length; ++n2 < i2; ) {
    var c2 = yo(o2[n2], a2[n2]);
    if (c2)
      return n2 >= s2 ? c2 : c2 * ("desc" == r2[n2] ? -1 : 1);
  }
  return e2.index - t2.index;
}, "compareMultiple$1");
var Oo = Xn;
var So = l;
var Co = /* @__PURE__ */ __name(function baseOrderBy$1(e2, t2, r2) {
  t2 = t2.length ? go(t2, function(e3) {
    return So(e3) ? function(t3) {
      return mo(t3, 1 === e3.length ? e3[0] : e3);
    } : e3;
  }) : [Oo];
  var n2 = -1;
  t2 = go(t2, $o(bo));
  var o2 = ko(e2, function(e3, r3, o3) {
    return { criteria: go(t2, function(t3) {
      return t3(e3);
    }), index: ++n2, value: e3 };
  });
  return jo(o2, function(e3, t3) {
    return wo(e3, t3, r2);
  });
}, "baseOrderBy$1");
var zo = l;
var Ao = /* @__PURE__ */ __name(function orderBy(e2, t2, r2, n2) {
  return null == e2 ? [] : (zo(t2) || (t2 = null == t2 ? [] : [t2]), zo(r2 = n2 ? void 0 : r2) || (r2 = null == r2 ? [] : [r2]), Co(e2, t2, r2));
}, "orderBy");
var xo;
var Mo = { _intersect: /* @__PURE__ */ __name(function _intersect(e2, t2) {
  if (!e2 || !t2 || 0 === e2.length || 0 === t2.length)
    return [];
  if (e2.length < 100 && t2.length < 100)
    return e2.filter((e3) => t2.includes(e3));
  const r2 = new Set(t2);
  return e2.filter((e3) => r2.has(e3));
}, "_intersect"), _intersectWith: /* @__PURE__ */ __name(function _intersectWith(e2, t2, r2) {
  return e2 && t2 && 0 !== e2.length && 0 !== t2.length ? e2.filter((e3) => t2.some((t3) => r2(e3, t3))) : [];
}, "_intersectWith"), _difference: /* @__PURE__ */ __name(function _difference(e2, t2) {
  if (!e2)
    return [];
  if (!t2 || 0 === t2.length)
    return e2.slice();
  if (e2.length < 100 && t2.length < 100)
    return e2.filter((e3) => !t2.includes(e3));
  const r2 = new Set(t2);
  return e2.filter((e3) => !r2.has(e3));
}, "_difference"), _differenceWith: /* @__PURE__ */ __name(function _differenceWith(e2, t2, r2) {
  return e2 ? t2 && 0 !== t2.length ? e2.filter((e3) => !t2.some((t3) => r2(e3, t3))) : e2.slice() : [];
}, "_differenceWith"), _uniq: /* @__PURE__ */ __name(function _uniq(e2) {
  return e2 && 0 !== e2.length ? 1 === e2.length ? e2.slice() : [...new Set(e2)] : [];
}, "_uniq"), _uniqWith: /* @__PURE__ */ __name(function _uniqWith(e2, t2) {
  if (!e2 || 0 === e2.length)
    return [];
  if (1 === e2.length)
    return e2.slice();
  const r2 = [];
  e:
    for (let n2 = 0; n2 < e2.length; n2++) {
      const o2 = e2[n2];
      for (let e3 = 0; e3 < r2.length; e3++)
        if (t2(o2, r2[e3]))
          continue e;
      r2.push(o2);
    }
  return r2;
}, "_uniqWith"), _partialRight: /* @__PURE__ */ __name(function _partialRight(e2) {
  const t2 = Array.prototype.slice.call(arguments, 1);
  return function() {
    const r2 = Array.prototype.slice.call(arguments);
    return e2.apply(this, r2.concat(t2));
  };
}, "_partialRight"), _forEach: /* @__PURE__ */ __name(function _forEach(e2, t2) {
  if (e2)
    if (Array.isArray(e2))
      for (let r2 = 0; r2 < e2.length; r2++)
        t2(e2[r2], r2);
    else {
      const r2 = Object.keys(e2);
      for (let n2 = 0; n2 < r2.length; n2++)
        t2(e2[r2[n2]], r2[n2]);
    }
}, "_forEach"), _isArray: Array.isArray };
try {
  xo = "undefined" != typeof Intl && void 0 !== Intl.Collator ? Intl.Collator("generic", { sensitivity: "base" }) : null;
} catch (e2) {
  void 0 !== typeof console && console.warn("Collator could not be initialized and wouldn't be used");
}
var Io;
var Eo = /* @__PURE__ */ __name(function leven(e2, t2, r2) {
  var n2 = [], o2 = [], a2 = r2 && xo && r2.useCollator, i2 = 1;
  if (r2 && r2.subcost && "number" == typeof r2.subcost && (i2 = r2.subcost), e2 === t2)
    return 0;
  var s2, c2, u2, l2, f2 = Array.from(e2), p2 = Array.from(t2), h2 = f2.length, v2 = p2.length;
  if (0 === h2)
    return v2;
  if (0 === v2)
    return h2;
  for (var _3 = 0, d2 = 0; _3 < h2; )
    o2[_3] = f2[_3].codePointAt(0), n2[_3] = ++_3;
  if (a2)
    for (; d2 < v2; )
      for (s2 = p2[d2].codePointAt(0), u2 = d2++, c2 = d2, _3 = 0; _3 < h2; _3++)
        l2 = 0 === xo.compare(String.fromCodePoint(s2), String.fromCodePoint(o2[_3])) ? u2 : u2 + i2, u2 = n2[_3], c2 = n2[_3] = u2 > c2 ? l2 > c2 ? c2 + 1 : l2 : l2 > u2 ? u2 + 1 : l2;
  else
    for (; d2 < v2; )
      for (s2 = p2[d2].codePointAt(0), u2 = d2++, c2 = d2, _3 = 0; _3 < h2; _3++)
        l2 = s2 === o2[_3] ? u2 : u2 + i2, u2 = n2[_3], c2 = n2[_3] = u2 > c2 ? l2 > c2 ? c2 + 1 : l2 : l2 > u2 ? u2 + 1 : l2;
  return c2;
}, "leven");
try {
  Io = "undefined" != typeof Intl && void 0 !== Intl.Collator ? Intl.Collator("generic", { sensitivity: "base" }) : null;
} catch (e2) {
  void 0 !== typeof console && console.warn("Collator could not be initialized and wouldn't be used");
}
var Po;
var qo = /* @__PURE__ */ __name(function leven2(e2, t2, r2, n2) {
  var o2 = [], a2 = [], i2 = r2 && Io && r2.useCollator, s2 = 1;
  if (r2 && r2.subcost && "number" == typeof r2.subcost && (s2 = r2.subcost), e2 === t2)
    return 0;
  var c2 = e2.length, u2 = t2.length;
  if (0 === c2)
    return u2;
  if (0 === u2)
    return c2;
  if (r2 && r2.wildcards && "string" == typeof r2.wildcards && r2.wildcards.length > 0) {
    var l2, f2, p2, h2, v2, _3;
    if (false === r2.full_process && true !== r2.processed) {
      f2 = (l2 = r2.wildcards[0]).charCodeAt(0);
      var d2 = "[" + (/* @__PURE__ */ __name(function escapeRegExp(e3) {
        return e3.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      }, "escapeRegExp"))(r2.wildcards) + "]";
      if ((e2 = e2.replace(new RegExp(d2, "g"), l2)) === (t2 = t2.replace(new RegExp(d2, "g"), l2)))
        return 0;
    } else
      f2 = (l2 = r2.wildcards[0].toLowerCase()).charCodeAt(0);
    for (var y3 = 0, g3 = 0; y3 < c2; )
      a2[y3] = e2.charCodeAt(y3), o2[y3] = ++y3;
    if (i2)
      for (; g3 < u2; )
        for (p2 = t2.charCodeAt(g3), v2 = g3++, h2 = g3, y3 = 0; y3 < c2; y3++)
          _3 = 0 === Io.compare(String.fromCharCode(p2), String.fromCharCode(a2[y3])) || p2 === f2 || a2[y3] === f2 ? v2 : v2 + s2, v2 = o2[y3], h2 = o2[y3] = v2 > h2 ? _3 > h2 ? h2 + 1 : _3 : _3 > v2 ? v2 + 1 : _3;
    else
      for (; g3 < u2; )
        for (p2 = t2.charCodeAt(g3), v2 = g3++, h2 = g3, y3 = 0; y3 < c2; y3++)
          _3 = p2 === a2[y3] || p2 === f2 || a2[y3] === f2 ? v2 : v2 + s2, v2 = o2[y3], h2 = o2[y3] = v2 > h2 ? _3 > h2 ? h2 + 1 : _3 : _3 > v2 ? v2 + 1 : _3;
    return h2;
  }
  return n2(e2, t2, r2);
}, "leven");
try {
  Po = "undefined" != typeof Intl && void 0 !== Intl.Collator ? Intl.Collator("generic", { sensitivity: "base" }) : null;
} catch (e2) {
  void 0 !== typeof console && console.warn("Collator could not be initialized and wouldn't be used");
}
var Ho = /* @__PURE__ */ __name(function leven3(e2, t2, r2) {
  var n2 = [], o2 = [], a2 = r2 && Po && r2.useCollator, i2 = 1;
  if (r2 && r2.subcost && "number" == typeof r2.subcost && (i2 = r2.subcost), e2 === t2)
    return 0;
  var s2, c2, u2, l2, f2 = e2.length, p2 = t2.length;
  if (0 === f2)
    return p2;
  if (0 === p2)
    return f2;
  for (var h2 = 0, v2 = 0; h2 < f2; )
    o2[h2] = e2.charCodeAt(h2), n2[h2] = ++h2;
  if (a2)
    for (; v2 < p2; )
      for (s2 = t2.charCodeAt(v2), u2 = v2++, c2 = v2, h2 = 0; h2 < f2; h2++)
        l2 = 0 === Po.compare(String.fromCharCode(s2), String.fromCharCode(o2[h2])) ? u2 : u2 + i2, u2 = n2[h2], c2 = n2[h2] = u2 > c2 ? l2 > c2 ? c2 + 1 : l2 : l2 > u2 ? u2 + 1 : l2;
  else
    for (; v2 < p2; )
      for (s2 = t2.charCodeAt(v2), u2 = v2++, c2 = v2, h2 = 0; h2 < f2; h2++)
        l2 = s2 === o2[h2] ? u2 : u2 + i2, u2 = n2[h2], c2 = n2[h2] = u2 > c2 ? l2 > c2 ? c2 + 1 : l2 : l2 > u2 ? u2 + 1 : l2;
  return c2;
}, "leven");
!function(e2, t2) {
  if (!e2.setImmediate) {
    var r2, n2 = 1, o2 = {}, a2 = false, i2 = e2.document, s2 = Object.getPrototypeOf && Object.getPrototypeOf(e2);
    s2 = s2 && s2.setTimeout ? s2 : e2, "[object process]" === {}.toString.call(e2.process) ? (/* @__PURE__ */ __name(function installNextTickImplementation() {
      r2 = /* @__PURE__ */ __name(function(e3) {
        process.nextTick(function() {
          runIfPresent(e3);
        });
      }, "r");
    }, "installNextTickImplementation"))() : !(/* @__PURE__ */ __name(function canUsePostMessage() {
      if (e2.postMessage && !e2.importScripts) {
        var t3 = true, r3 = e2.onmessage;
        return e2.onmessage = function() {
          t3 = false;
        }, e2.postMessage("", "*"), e2.onmessage = r3, t3;
      }
    }, "canUsePostMessage"))() ? e2.MessageChannel ? (/* @__PURE__ */ __name(function installMessageChannelImplementation() {
      var e3 = new MessageChannel();
      e3.port1.onmessage = function(e4) {
        runIfPresent(e4.data);
      }, r2 = /* @__PURE__ */ __name(function(t3) {
        e3.port2.postMessage(t3);
      }, "r");
    }, "installMessageChannelImplementation"))() : i2 && "onreadystatechange" in i2.createElement("script") ? (/* @__PURE__ */ __name(function installReadyStateChangeImplementation() {
      var e3 = i2.documentElement;
      r2 = /* @__PURE__ */ __name(function(t3) {
        var r3 = i2.createElement("script");
        r3.onreadystatechange = function() {
          runIfPresent(t3), r3.onreadystatechange = null, e3.removeChild(r3), r3 = null;
        }, e3.appendChild(r3);
      }, "r");
    }, "installReadyStateChangeImplementation"))() : (/* @__PURE__ */ __name(function installSetTimeoutImplementation() {
      r2 = /* @__PURE__ */ __name(function(e3) {
        setTimeout(runIfPresent, 0, e3);
      }, "r");
    }, "installSetTimeoutImplementation"))() : (/* @__PURE__ */ __name(function installPostMessageImplementation() {
      var t3 = "setImmediate$" + Math.random() + "$", onGlobalMessage = /* @__PURE__ */ __name(function(r3) {
        r3.source === e2 && "string" == typeof r3.data && 0 === r3.data.indexOf(t3) && runIfPresent(+r3.data.slice(t3.length));
      }, "onGlobalMessage");
      e2.addEventListener ? e2.addEventListener("message", onGlobalMessage, false) : e2.attachEvent("onmessage", onGlobalMessage), r2 = /* @__PURE__ */ __name(function(r3) {
        e2.postMessage(t3 + r3, "*");
      }, "r");
    }, "installPostMessageImplementation"))(), s2.setImmediate = /* @__PURE__ */ __name(function setImmediate2(e3) {
      "function" != typeof e3 && (e3 = new Function("" + e3));
      for (var t3 = new Array(arguments.length - 1), a3 = 0; a3 < t3.length; a3++)
        t3[a3] = arguments[a3 + 1];
      var i3 = { callback: e3, args: t3 };
      return o2[n2] = i3, r2(n2), n2++;
    }, "setImmediate"), s2.clearImmediate = clearImmediate;
  }
  function clearImmediate(e3) {
    delete o2[e3];
  }
  __name(clearImmediate, "clearImmediate");
  function runIfPresent(e3) {
    if (a2)
      setTimeout(runIfPresent, 0, e3);
    else {
      var t3 = o2[e3];
      if (t3) {
        a2 = true;
        try {
          !(/* @__PURE__ */ __name(function run(e4) {
            var t4 = e4.callback, r3 = e4.args;
            switch (r3.length) {
              case 0:
                t4();
                break;
              case 1:
                t4(r3[0]);
                break;
              case 2:
                t4(r3[0], r3[1]);
                break;
              case 3:
                t4(r3[0], r3[1], r3[2]);
                break;
              default:
                t4.apply(void 0, r3);
            }
          }, "run"))(t3);
        } finally {
          clearImmediate(e3), a2 = false;
        }
      }
    }
  }
  __name(runIfPresent, "runIfPresent");
}("undefined" == typeof self ? t : self);
var Lo = { exports: {} };
!function(e2) {
  e2.exports = function(t2, r2, n2, o2) {
    return (e2 = {}).dedupe = /* @__PURE__ */ __name(function dedupe(e3, a2) {
      var i2, s2 = t2(a2);
      if (!r2(e3) && "object" != typeof e3)
        throw new Error("contains_dupes must be an array or object");
      if (0 === Object.keys(e3).length)
        return void 0 !== typeof console && console.warn("contains_dupes is empty"), [];
      s2.limit && (void 0 !== typeof console && console.warn("options.limit will be ignored in dedupe"), s2.limit = 0), s2.cutoff && "number" == typeof s2.cutoff || (void 0 !== typeof console && console.warn("Using default cutoff of 70"), s2.cutoff = 70), s2.scorer || (s2.scorer = n2, void 0 !== typeof console && console.log("Using default scorer 'ratio' for dedupe")), i2 = s2.processor && "function" == typeof s2.processor ? s2.processor : function(e4) {
        return e4;
      };
      var c2 = {};
      for (var u2 in e3) {
        var l2 = i2(e3[u2]);
        if ("string" != typeof l2 && l2 instanceof String == false)
          throw new Error("Each processed item in dedupe must be a string.");
        var f2 = o2(l2, e3, s2);
        s2.returnObjects ? (1 === f2.length || (f2 = f2.sort(function(e4, t3) {
          var r3 = i2(e4.choice), n3 = i2(t3.choice), o3 = r3.length, a3 = n3.length;
          return o3 === a3 ? r3 < n3 ? -1 : 1 : a3 - o3;
        })), s2.keepmap ? c2[i2(f2[0].choice)] = { item: f2[0].choice, key: f2[0].key, matches: f2 } : c2[i2(f2[0].choice)] = { item: f2[0].choice, key: f2[0].key }) : (1 === f2.length || (f2 = f2.sort(function(e4, t3) {
          var r3 = i2(e4[0]), n3 = i2(t3[0]), o3 = r3.length, a3 = n3.length;
          return o3 === a3 ? r3 < n3 ? -1 : 1 : a3 - o3;
        })), s2.keepmap ? c2[i2(f2[0][0])] = [f2[0][0], f2[0][2], f2] : c2[i2(f2[0][0])] = [f2[0][0], f2[0][2]]);
      }
      var p2 = [];
      for (var h2 in c2)
        p2.push(c2[h2]);
      return p2;
    }, "dedupe"), e2;
  };
}(Lo), function() {
  var e2 = i, t2 = c, n2 = Ao, o2 = Mo._intersect, a2 = Mo._intersectWith, s2 = Mo._difference, u2 = Mo._differenceWith, l2 = Mo._partialRight, f2 = Mo._forEach, p2 = Mo._isArray, h2 = Eo, v2 = qo, _3 = Ho, d2 = function(e3, t3, r2) {
    var n3 = {}, o3 = qo, a3 = Ho;
    function escapeRegExp(e4) {
      return e4.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }
    __name(escapeRegExp, "escapeRegExp");
    function validate(e4) {
      return ("string" == typeof e4 || e4 instanceof String) && e4.length > 0;
    }
    __name(validate, "validate");
    n3.validate = validate, n3.process_and_sort = /* @__PURE__ */ __name(function process_and_sort(e4) {
      return validate(e4) ? e4.match(/\S+/g).sort().join(" ").trim() : "";
    }, "process_and_sort"), n3.tokenize = /* @__PURE__ */ __name(function unique_tokens(n4, i3) {
      if (i3 && i3.wildcards && t3 && r2) {
        var s3 = r2(o3, i3, a3);
        return t3(n4.match(/\S+/g), function(e4, t4) {
          return 0 === s3(e4, t4);
        });
      }
      return e3(n4.match(/\S+/g));
    }, "unique_tokens");
    const i2 = /[^\p{L}\p{N}]/gu;
    return n3.full_process = /* @__PURE__ */ __name(function full_process(e4, t4) {
      if (!(e4 instanceof String) && "string" != typeof e4)
        return "";
      var r3;
      if (t4 && "object" == typeof t4 && t4.wildcards && "string" == typeof t4.wildcards && t4.wildcards.length > 0) {
        var n4 = t4.wildcards.toLowerCase();
        if (e4 = e4.toLowerCase(), t4.force_ascii) {
          var o4 = "[^\0-\x7F" + escapeRegExp(n4) + "]";
          e4 = e4.replace(new RegExp(o4, "g"), "");
          var a4 = "[" + escapeRegExp(n4) + "]", s3 = n4[0];
          e4 = e4.replace(new RegExp(a4, "g"), s3);
          var c2 = "[^A-Za-z0-9" + escapeRegExp(n4) + "]";
          r3 = (e4 = (e4 = e4.replace(new RegExp(c2, "g"), " ")).replace(/_/g, " ")).trim();
        } else {
          var u3 = "[^\\p{L}\\p{N}" + escapeRegExp(n4) + "]";
          e4 = e4.replace(new RegExp(u3, "gu"), " "), a4 = "[" + escapeRegExp(n4) + "]", s3 = n4[0], r3 = (e4 = e4.replace(new RegExp(a4, "g"), s3)).trim();
        }
      } else
        r3 = t4 && (t4.force_ascii || true === t4) ? (e4 = e4.replace(/[^\x00-\x7F]/g, "")).replace(/\W|_/g, " ").toLowerCase().trim() : e4.replace(i2, " ").toLowerCase().trim();
      return t4 && t4.collapseWhitespace && (r3 = r3.replace(/\s+/g, " ")), r3;
    }, "full_process"), n3.clone_and_set_option_defaults = function(e4) {
      if (e4 && e4.isAClone)
        return e4;
      var t4 = { isAClone: true };
      if (e4) {
        var r3, n4 = Object.keys(e4);
        for (r3 = 0; r3 < n4.length; r3++)
          t4[n4[r3]] = e4[n4[r3]];
      }
      return false !== t4.full_process && (t4.full_process = true), true !== t4.force_ascii && (t4.force_ascii = false), false !== t4.normalize && true === t4.astral && (t4.normalize = true), false !== t4.collapseWhitespace && (t4.collapseWhitespace = true), t4;
    }, n3.isCustomFunc = function(e4) {
      return "function" != typeof e4 || "token_set_ratio" !== e4.name && "partial_token_set_ratio" !== e4.name && "token_sort_ratio" !== e4.name && "partial_token_sort_ratio" !== e4.name && "QRatio" !== e4.name && "WRatio" !== e4.name && "distance" !== e4.name && "partial_ratio" !== e4.name;
    }, n3;
  }(Mo._uniq, Mo._uniqWith, l2), y3 = d2.validate, g3 = d2.process_and_sort, m2 = d2.tokenize, b3 = d2.full_process, k2 = d2.clone_and_set_option_defaults, j3 = d2.isCustomFunc, $2 = Lo.exports(k2, p2, QRatio, extract).dedupe;
  function QRatio(e3, t3, r2) {
    var n3 = k2(r2);
    return e3 = n3.normalize ? e3.normalize() : e3, t3 = n3.normalize ? t3.normalize() : t3, e3 = n3.full_process ? b3(e3, n3) : e3, t3 = n3.full_process ? b3(t3, n3) : t3, y3(e3) && y3(t3) ? _ratio(e3, t3, n3) : 0;
  }
  __name(QRatio, "QRatio");
  function token_set_ratio(e3, t3, r2) {
    var n3 = k2(r2);
    return e3 = n3.normalize ? e3.normalize() : e3, t3 = n3.normalize ? t3.normalize() : t3, e3 = n3.full_process ? b3(e3, n3) : e3, t3 = n3.full_process ? b3(t3, n3) : t3, y3(e3) && y3(t3) ? _token_set(e3, t3, n3) : 0;
  }
  __name(token_set_ratio, "token_set_ratio");
  function partial_token_set_ratio(e3, t3, r2) {
    var n3 = k2(r2);
    return e3 = n3.normalize ? e3.normalize() : e3, t3 = n3.normalize ? t3.normalize() : t3, e3 = n3.full_process ? b3(e3, n3) : e3, t3 = n3.full_process ? b3(t3, n3) : t3, y3(e3) && y3(t3) ? (n3.partial = true, _token_set(e3, t3, n3)) : 0;
  }
  __name(partial_token_set_ratio, "partial_token_set_ratio");
  function token_sort_ratio(e3, t3, r2) {
    var n3 = k2(r2);
    return e3 = n3.normalize ? e3.normalize() : e3, t3 = n3.normalize ? t3.normalize() : t3, e3 = n3.full_process ? b3(e3, n3) : e3, t3 = n3.full_process ? b3(t3, n3) : t3, y3(e3) && y3(t3) ? (n3.proc_sorted || (e3 = g3(e3), t3 = g3(t3)), _ratio(e3, t3, n3)) : 0;
  }
  __name(token_sort_ratio, "token_sort_ratio");
  function partial_token_sort_ratio(e3, t3, r2) {
    var n3 = k2(r2);
    return e3 = n3.normalize ? e3.normalize() : e3, t3 = n3.normalize ? t3.normalize() : t3, e3 = n3.full_process ? b3(e3, n3) : e3, t3 = n3.full_process ? b3(t3, n3) : t3, y3(e3) && y3(t3) ? (n3.partial = true, n3.proc_sorted || (e3 = g3(e3), t3 = g3(t3)), _partial_ratio(e3, t3, n3)) : 0;
  }
  __name(partial_token_sort_ratio, "partial_token_sort_ratio");
  function extract(e3, r2, n3) {
    var o3, a3 = k2(n3);
    if (p2(r2))
      o3 = r2.length;
    else {
      if (!(r2 instanceof Object))
        throw new Error("Invalid choices");
      o3 = Object.keys(r2).length;
    }
    if (!r2 || 0 === o3)
      return void 0 !== typeof console && console.warn("No choices"), [];
    if (a3.processor && "function" != typeof a3.processor)
      throw new Error("Invalid Processor");
    if (a3.processor || (a3.processor = function(e4) {
      return e4;
    }), a3.scorer && "function" != typeof a3.scorer)
      throw new Error("Invalid Scorer");
    a3.scorer || (a3.scorer = QRatio);
    var i2 = j3(a3.scorer);
    a3.cutoff && "number" == typeof a3.cutoff || (a3.cutoff = -1);
    var pre_processor = /* @__PURE__ */ __name(function(e4, t3) {
      return e4;
    }, "pre_processor");
    a3.full_process && (pre_processor = b3, i2 || (a3.processed = true));
    var s3 = false;
    i2 || (a3.astral && a3.normalize && (a3.normalize = false, String.prototype.normalize ? (s3 = true, e3 = e3.normalize()) : void 0 !== typeof console && console.warn("Normalization not supported in your environment")), e3 = pre_processor(e3, a3), a3.full_process = false, 0 === e3.length && void 0 !== typeof console && console.warn("Processed query is empty string"));
    var c2, u3, l3, h3, v3 = [], _4 = false, d3 = false, y4 = false;
    if ("token_sort_ratio" === a3.scorer.name || "partial_token_sort_ratio" === a3.scorer.name) {
      var $3 = g3(e3);
      d3 = true;
    } else if ("token_set_ratio" === a3.scorer.name || "partial_token_set_ratio" === a3.scorer.name) {
      var w5 = m2(e3, a3);
      y4 = true;
    }
    return a3.returnObjects ? (l3 = /* @__PURE__ */ __name(function(e4, t3) {
      return e4.score - t3.score;
    }, "l"), h3 = /* @__PURE__ */ __name(function(e4, t3) {
      return t3.score - e4.score;
    }, "h")) : (l3 = /* @__PURE__ */ __name(function(e4, t3) {
      return e4[1] - t3[1];
    }, "l"), h3 = /* @__PURE__ */ __name(function(e4, t3) {
      return t3[1] - e4[1];
    }, "h")), f2(r2, function(t3, r3) {
      a3.tokens = void 0, a3.proc_sorted = false, d3 ? (a3.proc_sorted = true, t3 && t3.proc_sorted ? u3 = t3.proc_sorted : (u3 = pre_processor(s3 ? a3.processor(t3).normalize() : a3.processor(t3), a3), u3 = g3(u3)), c2 = a3.scorer($3, u3, a3)) : y4 ? (u3 = "x", t3 && t3.tokens ? (a3.tokens = [w5, t3.tokens], a3.trySimple && (u3 = pre_processor(a3.processor(t3), a3))) : (u3 = pre_processor(s3 ? a3.processor(t3).normalize() : a3.processor(t3), a3), a3.tokens = [w5, m2(u3, a3)]), c2 = a3.scorer(e3, u3, a3)) : i2 ? (u3 = a3.processor(t3), c2 = a3.scorer(e3, u3, a3)) : ("string" == typeof (u3 = pre_processor(s3 ? a3.processor(t3).normalize() : a3.processor(t3), a3)) && 0 !== u3.length || (_4 = true), c2 = a3.scorer(e3, u3, a3)), c2 > a3.cutoff && (a3.returnObjects ? v3.push({ choice: t3, score: c2, key: r3 }) : v3.push([t3, c2, r3]));
    }), _4 && void 0 !== typeof console && console.log("One or more choices were empty. (post-processing if applied)"), a3.limit && "number" == typeof a3.limit && a3.limit > 0 && a3.limit < o3 && !a3.unsorted ? v3 = t2.nlargest(v3, a3.limit, l3) : a3.unsorted || (v3 = v3.sort(h3)), v3;
  }
  __name(extract, "extract");
  function extractAsync(e3, r2, n3, o3) {
    var a3, i2, s3 = k2(n3);
    "object" == typeof s3.abortController && (a3 = s3.abortController), "object" == typeof s3.cancelToken && (i2 = s3.cancelToken);
    var c2 = 256;
    "number" == typeof s3.asyncLoopOffset && (c2 = s3.asyncLoopOffset < 1 ? 1 : s3.asyncLoopOffset);
    var u3, l3 = false;
    if (r2 && r2.length && p2(r2))
      u3 = r2.length, l3 = true;
    else {
      if (!(r2 instanceof Object))
        return void o3(new Error("Invalid choices"));
      u3 = Object.keys(r2).length;
    }
    if (!r2 || 0 === u3)
      return void 0 !== typeof console && console.warn("No choices"), void o3(null, []);
    if (s3.processor && "function" != typeof s3.processor)
      o3(new Error("Invalid Processor"));
    else if (s3.processor || (s3.processor = function(e4) {
      return e4;
    }), s3.scorer && "function" != typeof s3.scorer)
      o3(new Error("Invalid Scorer"));
    else {
      s3.scorer || (s3.scorer = QRatio);
      var f3 = j3(s3.scorer);
      s3.cutoff && "number" == typeof s3.cutoff || (s3.cutoff = -1);
      var pre_processor = /* @__PURE__ */ __name(function(e4, t3) {
        return e4;
      }, "pre_processor");
      s3.full_process && (pre_processor = b3, f3 || (s3.processed = true));
      var h3 = false;
      f3 || (s3.astral && s3.normalize && (s3.normalize = false, String.prototype.normalize ? (h3 = true, e3 = e3.normalize()) : void 0 !== typeof console && console.warn("Normalization not supported in your environment")), e3 = pre_processor(e3, s3), s3.full_process = false, 0 === e3.length && void 0 !== typeof console && console.warn("Processed query is empty string"));
      var v3, _4, d3, y4, $3, w5 = [], O3 = false, S4 = false, C3 = false;
      if ("token_sort_ratio" === s3.scorer.name || "partial_token_sort_ratio" === s3.scorer.name) {
        var z3 = g3(e3);
        S4 = true;
      } else if ("token_set_ratio" === s3.scorer.name || "partial_token_set_ratio" === s3.scorer.name) {
        var A3 = m2(e3, s3);
        C3 = true;
      }
      s3.returnObjects ? (y4 = /* @__PURE__ */ __name(function(e4, t3) {
        return e4.score - t3.score;
      }, "y"), $3 = /* @__PURE__ */ __name(function(e4, t3) {
        return t3.score - e4.score;
      }, "$")) : (y4 = /* @__PURE__ */ __name(function(e4, t3) {
        return e4[1] - t3[1];
      }, "y"), $3 = /* @__PURE__ */ __name(function(e4, t3) {
        return t3[1] - e4[1];
      }, "$"));
      var x3 = Object.keys(r2);
      l3 ? searchLoop(0) : searchLoop(x3[0], 0);
    }
    function searchLoop(n4, p3) {
      (l3 || r2.hasOwnProperty(n4)) && (s3.tokens = void 0, s3.proc_sorted = false, S4 ? (s3.proc_sorted = true, r2[n4] && r2[n4].proc_sorted ? _4 = r2[n4].proc_sorted : (_4 = pre_processor(h3 ? s3.processor(r2[n4]).normalize() : s3.processor(r2[n4]), s3), _4 = g3(_4)), d3 = s3.scorer(z3, _4, s3)) : C3 ? (_4 = "x", r2[n4] && r2[n4].tokens ? (s3.tokens = [A3, r2[n4].tokens], s3.trySimple && (_4 = pre_processor(s3.processor(r2[n4]), s3))) : (_4 = pre_processor(h3 ? s3.processor(r2[n4]).normalize() : s3.processor(r2[n4]), s3), s3.tokens = [A3, m2(_4, s3)]), d3 = s3.scorer(e3, _4, s3)) : f3 ? (_4 = s3.processor(r2[n4]), d3 = s3.scorer(e3, _4, s3)) : ("string" == typeof (_4 = pre_processor(h3 ? s3.processor(r2[n4]).normalize() : s3.processor(r2[n4]), s3)) && 0 !== _4.length || (O3 = true), d3 = s3.scorer(e3, _4, s3)), v3 = l3 ? parseInt(n4) : n4, d3 > s3.cutoff && (s3.returnObjects ? w5.push({ choice: r2[n4], score: d3, key: v3 }) : w5.push([r2[n4], d3, v3]))), a3 && true === a3.signal.aborted ? o3(new Error("aborted")) : i2 && true === i2.canceled ? o3(new Error("canceled")) : l3 && n4 < r2.length - 1 ? n4 % c2 == 0 ? setImmediate(function() {
        searchLoop(n4 + 1);
      }) : searchLoop(n4 + 1) : p3 < x3.length - 1 ? p3 % c2 == 0 ? setImmediate(function() {
        searchLoop(x3[p3 + 1], p3 + 1);
      }) : searchLoop(x3[p3 + 1], p3 + 1) : (O3 && void 0 !== typeof console && console.log("One or more choices were empty. (post-processing if applied)"), s3.limit && "number" == typeof s3.limit && s3.limit > 0 && s3.limit < u3 && !s3.unsorted ? w5 = t2.nlargest(w5, s3.limit, y4) : s3.unsorted || (w5 = w5.sort($3)), o3(null, w5));
    }
    __name(searchLoop, "searchLoop");
  }
  __name(extractAsync, "extractAsync");
  var w4 = "%*SuperUniqueWildcardKey*%";
  function _getCharacterCounts(e3, t3) {
    var r2 = e3;
    if (t3.astral)
      var n3 = Array.from(r2);
    else
      n3 = r2.split("");
    var o3 = {};
    if (t3.wildcards)
      for (var a3 = 0; a3 < n3.length; a3++) {
        var i2 = n3[a3];
        t3.wildcards.indexOf(i2) > -1 ? o3[w4] ? o3[w4] += 1 : o3[w4] = 1 : o3[i2] ? o3[i2] += 1 : o3[i2] = 1;
      }
    else
      for (a3 = 0; a3 < n3.length; a3++) {
        o3[i2 = n3[a3]] ? o3[i2] += 1 : o3[i2] = 1;
      }
    return o3;
  }
  __name(_getCharacterCounts, "_getCharacterCounts");
  function _token_similarity_sort(e3, t3, r2) {
    for (var a3 = t3, i2 = e3.reduce(function(e4, t4) {
      return e4[t4] = _getCharacterCounts(t4, r2), e4;
    }, {}), s3 = a3.reduce(function(e4, t4) {
      return e4[t4] = _getCharacterCounts(t4, r2), e4;
    }, {}), c2 = [], u3 = 0; a3.length && u3 < e3.length; ) {
      var l3 = n2(a3, function(t4) {
        return r3 = i2[e3[u3]], n3 = s3[t4], a4 = Object.keys(r3), c3 = Object.keys(n3), l4 = o2(a4, c3).map(function(e4) {
          return r3[e4] * n3[e4];
        }).reduce(function(e4, t5) {
          return e4 + t5;
        }, 0), f3 = a4.map(function(e4) {
          return Math.pow(r3[e4], 2);
        }).reduce(function(e4, t5) {
          return e4 + t5;
        }, 0), p3 = c3.map(function(e4) {
          return Math.pow(n3[e4], 2);
        }).reduce(function(e4, t5) {
          return e4 + t5;
        }, 0), l4 / (Math.sqrt(f3) * Math.sqrt(p3));
        var r3, n3, a4, c3, l4, f3, p3;
      }, "desc")[0];
      c2.push(l3), u3++, a3 = a3.filter(function(e4) {
        return e4 !== l3;
      });
    }
    return c2.concat(a3);
  }
  __name(_token_similarity_sort, "_token_similarity_sort");
  function _order_token_lists(e3, t3, r2, n3) {
    var o3 = t3, a3 = n3;
    if (t3.length > n3.length)
      o3 = n3, a3 = t3;
    else if (t3.length === n3.length) {
      if (e3.length > r2.length)
        o3 = n3, a3 = t3;
      else
        [e3, r2].sort()[0] === r2 && (o3 = n3, a3 = t3);
    }
    return [o3, a3];
  }
  __name(_order_token_lists, "_order_token_lists");
  function _token_similarity_sort_ratio(e3, t3, r2) {
    if (r2.tokens)
      n3 = r2.tokens[0], o3 = r2.tokens[1];
    else
      var n3 = m2(e3, r2), o3 = m2(t3, r2);
    var a3 = _order_token_lists(e3, n3.sort(), t3, o3.sort()), i2 = a3[0];
    const s3 = _token_similarity_sort(i2, a3[1], r2);
    return r2.partial ? _partial_ratio(i2.join(" "), s3.join(" "), r2) : _ratio(i2.join(" "), s3.join(" "), r2);
  }
  __name(_token_similarity_sort_ratio, "_token_similarity_sort_ratio");
  function _token_set(e3, t3, r2) {
    if (r2.tokens)
      n3 = r2.tokens[0], i2 = r2.tokens[1];
    else
      var n3 = m2(e3, r2), i2 = m2(t3, r2);
    if (r2.wildcards)
      var c2 = l2(v2, r2, _3), wildCompare = /* @__PURE__ */ __name(function(e4, t4) {
        return 0 === c2(e4, t4);
      }, "wildCompare"), f3 = a2(n3, i2, wildCompare), p3 = u2(n3, i2, wildCompare), h3 = u2(i2, n3, wildCompare);
    else
      f3 = o2(n3, i2), p3 = s2(n3, i2), h3 = s2(i2, n3);
    var d3 = f3.sort().join(" "), y4 = p3.sort(), g4 = h3.sort();
    if (r2.sortBySimilarity)
      var b4 = _order_token_lists(e3, y4, t3, g4), k3 = b4[0], j4 = b4[1], $3 = k3.join(" "), w5 = _token_similarity_sort(k3, j4, r2).join(" ");
    else
      $3 = y4.join(" "), w5 = g4.join(" ");
    var O3 = d3 + " " + $3, S4 = d3 + " " + w5;
    d3 = d3.trim(), O3 = O3.trim(), S4 = S4.trim();
    var C3 = _ratio;
    if (r2.partial && (C3 = _partial_ratio, d3.length > 0))
      return 100;
    var z3 = [C3(d3, O3, r2), C3(d3, S4, r2), C3(O3, S4, r2)];
    return r2.trySimple && z3.push(C3(e3, t3, r2)), Math.max.apply(null, z3);
  }
  __name(_token_set, "_token_set");
  function _ratio(t3, r2, n3) {
    if (!y3(t3))
      return 0;
    if (!y3(r2))
      return 0;
    if (n3.ratio_alg && "difflib" === n3.ratio_alg) {
      var o3 = new e2(null, t3, r2, n3.autojunk).ratio();
      return Math.round(100 * o3);
    }
    var a3, i2;
    return void 0 === n3.subcost && (n3.subcost = 2), n3.astral ? (a3 = h2(t3, r2, n3), i2 = Array.from(t3).length + Array.from(r2).length) : n3.wildcards ? (a3 = v2(t3, r2, n3, _3), i2 = t3.length + r2.length) : (a3 = _3(t3, r2, n3), i2 = t3.length + r2.length), Math.round((i2 - a3) / i2 * 100);
  }
  __name(_ratio, "_ratio");
  function _partial_ratio(t3, r2, n3) {
    if (!y3(t3))
      return 0;
    if (!y3(r2))
      return 0;
    if (t3.length <= r2.length)
      var o3 = t3, a3 = r2;
    else
      o3 = r2, a3 = t3;
    for (var i2 = new e2(null, o3, a3, n3.autojunk).getMatchingBlocks(), s3 = [], c2 = 0; c2 < i2.length; c2++) {
      var u3 = i2[c2][1] - i2[c2][0] > 0 ? i2[c2][1] - i2[c2][0] : 0, l3 = u3 + o3.length, f3 = _ratio(o3, a3.substring(u3, l3), n3);
      if (f3 > 99.5)
        return 100;
      s3.push(f3);
    }
    return Math.max.apply(null, s3);
  }
  __name(_partial_ratio, "_partial_ratio");
  Object.keys || (Object.keys = function() {
    var e3 = Object.prototype.hasOwnProperty, t3 = !{ toString: null }.propertyIsEnumerable("toString"), r2 = ["toString", "toLocaleString", "valueOf", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "constructor"], n3 = r2.length;
    return function(o3) {
      if ("object" != typeof o3 && ("function" != typeof o3 || null === o3))
        throw new TypeError("Object.keys called on non-object");
      var a3, i2, s3 = [];
      for (a3 in o3)
        e3.call(o3, a3) && s3.push(a3);
      if (t3)
        for (i2 = 0; i2 < n3; i2++)
          e3.call(o3, r2[i2]) && s3.push(r2[i2]);
      return s3;
    };
  }());
  var O2 = void 0;
  "undefined" != typeof Promise && (O2 = /* @__PURE__ */ __name(function(e3, t3, r2) {
    return new Promise(function(n3, o3) {
      extractAsync(e3, t3, r2, function(e4, t4) {
        e4 ? o3(e4) : n3(t4);
      });
    });
  }, "O"));
  var S3 = { distance: /* @__PURE__ */ __name(function distance(e3, t3, r2) {
    var n3 = k2(r2);
    return e3 = n3.normalize ? e3.normalize() : e3, t3 = n3.normalize ? t3.normalize() : t3, e3 = n3.full_process ? b3(e3, n3) : e3, t3 = n3.full_process ? b3(t3, n3) : t3, void 0 === n3.subcost && (n3.subcost = 1), n3.astral ? h2(e3, t3, n3) : v2(e3, t3, n3, _3);
  }, "distance"), ratio: QRatio, partial_ratio: /* @__PURE__ */ __name(function partial_ratio(e3, t3, r2) {
    var n3 = k2(r2);
    return e3 = n3.normalize ? e3.normalize() : e3, t3 = n3.normalize ? t3.normalize() : t3, e3 = n3.full_process ? b3(e3, n3) : e3, t3 = n3.full_process ? b3(t3, n3) : t3, y3(e3) && y3(t3) ? _partial_ratio(e3, t3, n3) : 0;
  }, "partial_ratio"), token_set_ratio, token_sort_ratio, partial_token_set_ratio, partial_token_sort_ratio, token_similarity_sort_ratio: /* @__PURE__ */ __name(function token_similarity_sort_ratio(e3, t3, r2) {
    var n3 = k2(r2);
    return e3 = n3.normalize ? e3.normalize() : e3, t3 = n3.normalize ? t3.normalize() : t3, e3 = n3.full_process ? b3(e3, n3) : e3, t3 = n3.full_process ? b3(t3, n3) : t3, y3(e3) && y3(t3) ? _token_similarity_sort_ratio(e3, t3, n3) : 0;
  }, "token_similarity_sort_ratio"), partial_token_similarity_sort_ratio: /* @__PURE__ */ __name(function partial_token_similarity_sort_ratio(e3, t3, r2) {
    var n3 = k2(r2);
    return e3 = n3.normalize ? e3.normalize() : e3, t3 = n3.normalize ? t3.normalize() : t3, e3 = n3.full_process ? b3(e3, n3) : e3, t3 = n3.full_process ? b3(t3, n3) : t3, y3(e3) && y3(t3) ? (n3.partial = true, _token_similarity_sort_ratio(e3, t3, n3)) : 0;
  }, "partial_token_similarity_sort_ratio"), WRatio: /* @__PURE__ */ __name(function WRatio(e3, t3, r2) {
    var n3 = k2(r2);
    if (e3 = n3.normalize ? e3.normalize() : e3, t3 = n3.normalize ? t3.normalize() : t3, e3 = n3.full_process ? b3(e3, n3) : e3, t3 = n3.full_process ? b3(t3, n3) : t3, n3.full_process = false, !y3(e3))
      return 0;
    if (!y3(t3))
      return 0;
    var o3 = true, a3 = 0.95, i2 = 0.9, s3 = _ratio(e3, t3, n3), c2 = Math.max(e3.length, t3.length) / Math.min(e3.length, t3.length);
    if (c2 < 1.5 && (o3 = false), c2 > 8 && (i2 = 0.6), o3) {
      var u3 = _partial_ratio(e3, t3, n3) * i2, l3 = partial_token_sort_ratio(e3, t3, n3) * a3 * i2, f3 = partial_token_set_ratio(e3, t3, n3) * a3 * i2;
      return Math.round(Math.max(s3, u3, l3, f3));
    }
    var p3 = token_sort_ratio(e3, t3, n3) * a3, h3 = token_set_ratio(e3, t3, n3) * a3;
    return Math.round(Math.max(s3, p3, h3));
  }, "WRatio"), full_process: b3, extract, extractAsync, extractAsPromised: O2, process_and_sort: g3, unique_tokens: m2, dedupe: $2 };
  r.exports = S3;
}();
var Ro = r.exports;
Ro.distance;
Ro.ratio;
Ro.partial_ratio;
Ro.token_set_ratio;
var Do = Ro.token_sort_ratio;
Ro.partial_token_set_ratio;
Ro.partial_token_sort_ratio;
Ro.token_similarity_sort_ratio;
Ro.partial_token_similarity_sort_ratio;
Ro.WRatio;
Ro.full_process;
Ro.extract;
Ro.extractAsync;
Ro.extractAsPromised;
Ro.process_and_sort;
Ro.unique_tokens;
Ro.dedupe;

// ../../node_modules/.pnpm/flexsearch@0.8.212/node_modules/flexsearch/dist/flexsearch.bundle.module.min.mjs
var w2;
function H2(a2, c2, b3) {
  const e2 = typeof b3, d2 = typeof a2;
  if (e2 !== "undefined") {
    if (d2 !== "undefined") {
      if (b3) {
        if (d2 === "function" && e2 === d2)
          return function(k2) {
            return a2(b3(k2));
          };
        c2 = a2.constructor;
        if (c2 === b3.constructor) {
          if (c2 === Array)
            return b3.concat(a2);
          if (c2 === Map) {
            var f2 = new Map(b3);
            for (var g3 of a2)
              f2.set(g3[0], g3[1]);
            return f2;
          }
          if (c2 === Set) {
            g3 = new Set(b3);
            for (f2 of a2.values())
              g3.add(f2);
            return g3;
          }
        }
      }
      return a2;
    }
    return b3;
  }
  return d2 === "undefined" ? c2 : a2;
}
__name(H2, "H");
function aa(a2, c2) {
  return typeof a2 === "undefined" ? c2 : a2;
}
__name(aa, "aa");
function I2() {
  return /* @__PURE__ */ Object.create(null);
}
__name(I2, "I");
function M2(a2) {
  return typeof a2 === "string";
}
__name(M2, "M");
function ba(a2) {
  return typeof a2 === "object";
}
__name(ba, "ba");
function ca(a2, c2) {
  if (M2(c2))
    a2 = a2[c2];
  else
    for (let b3 = 0; a2 && b3 < c2.length; b3++)
      a2 = a2[c2[b3]];
  return a2;
}
__name(ca, "ca");
var ea2 = /[^\p{L}\p{N}]+/u;
var fa = /(\d{3})/g;
var ha = /(\D)(\d{3})/g;
var ia = /(\d{3})(\D)/g;
var ja = /[\u0300-\u036f]/g;
function ka(a2 = {}) {
  if (!this || this.constructor !== ka)
    return new ka(...arguments);
  if (arguments.length)
    for (a2 = 0; a2 < arguments.length; a2++)
      this.assign(arguments[a2]);
  else
    this.assign(a2);
}
__name(ka, "ka");
w2 = ka.prototype;
w2.assign = function(a2) {
  this.normalize = H2(a2.normalize, true, this.normalize);
  let c2 = a2.include, b3 = c2 || a2.exclude || a2.split, e2;
  if (b3 || b3 === "") {
    if (typeof b3 === "object" && b3.constructor !== RegExp) {
      let d2 = "";
      e2 = !c2;
      c2 || (d2 += "\\p{Z}");
      b3.letter && (d2 += "\\p{L}");
      b3.number && (d2 += "\\p{N}", e2 = !!c2);
      b3.symbol && (d2 += "\\p{S}");
      b3.punctuation && (d2 += "\\p{P}");
      b3.control && (d2 += "\\p{C}");
      if (b3 = b3.char)
        d2 += typeof b3 === "object" ? b3.join("") : b3;
      try {
        this.split = new RegExp("[" + (c2 ? "^" : "") + d2 + "]+", "u");
      } catch (f2) {
        this.split = /\s+/;
      }
    } else
      this.split = b3, e2 = b3 === false || "a1a".split(b3).length < 2;
    this.numeric = H2(a2.numeric, e2);
  } else {
    try {
      this.split = H2(this.split, ea2);
    } catch (d2) {
      this.split = /\s+/;
    }
    this.numeric = H2(a2.numeric, H2(this.numeric, true));
  }
  this.prepare = H2(a2.prepare, null, this.prepare);
  this.finalize = H2(a2.finalize, null, this.finalize);
  b3 = a2.filter;
  this.filter = typeof b3 === "function" ? b3 : H2(b3 && new Set(b3), null, this.filter);
  this.dedupe = H2(a2.dedupe, true, this.dedupe);
  this.matcher = H2((b3 = a2.matcher) && new Map(b3), null, this.matcher);
  this.mapper = H2((b3 = a2.mapper) && new Map(b3), null, this.mapper);
  this.stemmer = H2(
    (b3 = a2.stemmer) && new Map(b3),
    null,
    this.stemmer
  );
  this.replacer = H2(a2.replacer, null, this.replacer);
  this.minlength = H2(a2.minlength, 1, this.minlength);
  this.maxlength = H2(a2.maxlength, 1024, this.maxlength);
  this.rtl = H2(a2.rtl, false, this.rtl);
  if (this.cache = b3 = H2(a2.cache, true, this.cache))
    this.F = null, this.L = typeof b3 === "number" ? b3 : 2e5, this.B = /* @__PURE__ */ new Map(), this.D = /* @__PURE__ */ new Map(), this.I = this.H = 128;
  this.h = "";
  this.J = null;
  this.A = "";
  this.K = null;
  if (this.matcher)
    for (const d2 of this.matcher.keys())
      this.h += (this.h ? "|" : "") + d2;
  if (this.stemmer)
    for (const d2 of this.stemmer.keys())
      this.A += (this.A ? "|" : "") + d2;
  return this;
};
w2.addStemmer = function(a2, c2) {
  this.stemmer || (this.stemmer = /* @__PURE__ */ new Map());
  this.stemmer.set(a2, c2);
  this.A += (this.A ? "|" : "") + a2;
  this.K = null;
  this.cache && Q2(this);
  return this;
};
w2.addFilter = function(a2) {
  typeof a2 === "function" ? this.filter = a2 : (this.filter || (this.filter = /* @__PURE__ */ new Set()), this.filter.add(a2));
  this.cache && Q2(this);
  return this;
};
w2.addMapper = function(a2, c2) {
  if (typeof a2 === "object")
    return this.addReplacer(a2, c2);
  if (a2.length > 1)
    return this.addMatcher(a2, c2);
  this.mapper || (this.mapper = /* @__PURE__ */ new Map());
  this.mapper.set(a2, c2);
  this.cache && Q2(this);
  return this;
};
w2.addMatcher = function(a2, c2) {
  if (typeof a2 === "object")
    return this.addReplacer(a2, c2);
  if (a2.length < 2 && (this.dedupe || this.mapper))
    return this.addMapper(a2, c2);
  this.matcher || (this.matcher = /* @__PURE__ */ new Map());
  this.matcher.set(a2, c2);
  this.h += (this.h ? "|" : "") + a2;
  this.J = null;
  this.cache && Q2(this);
  return this;
};
w2.addReplacer = function(a2, c2) {
  if (typeof a2 === "string")
    return this.addMatcher(a2, c2);
  this.replacer || (this.replacer = []);
  this.replacer.push(a2, c2);
  this.cache && Q2(this);
  return this;
};
w2.encode = function(a2, c2) {
  if (this.cache && a2.length <= this.H)
    if (this.F) {
      if (this.B.has(a2))
        return this.B.get(a2);
    } else
      this.F = setTimeout(Q2, 50, this);
  this.normalize && (typeof this.normalize === "function" ? a2 = this.normalize(a2) : a2 = ja ? a2.normalize("NFKD").replace(ja, "").toLowerCase() : a2.toLowerCase());
  this.prepare && (a2 = this.prepare(a2));
  this.numeric && a2.length > 3 && (a2 = a2.replace(ha, "$1 $2").replace(ia, "$1 $2").replace(fa, "$1 "));
  const b3 = !(this.dedupe || this.mapper || this.filter || this.matcher || this.stemmer || this.replacer);
  let e2 = [], d2 = I2(), f2, g3, k2 = this.split || this.split === "" ? a2.split(this.split) : [a2];
  for (let l2 = 0, m2, p2; l2 < k2.length; l2++)
    if ((m2 = p2 = k2[l2]) && !(m2.length < this.minlength || m2.length > this.maxlength)) {
      if (c2) {
        if (d2[m2])
          continue;
        d2[m2] = 1;
      } else {
        if (f2 === m2)
          continue;
        f2 = m2;
      }
      if (b3)
        e2.push(m2);
      else if (!this.filter || (typeof this.filter === "function" ? this.filter(m2) : !this.filter.has(m2))) {
        if (this.cache && m2.length <= this.I)
          if (this.F) {
            var h2 = this.D.get(m2);
            if (h2 || h2 === "") {
              h2 && e2.push(h2);
              continue;
            }
          } else
            this.F = setTimeout(Q2, 50, this);
        if (this.stemmer) {
          this.K || (this.K = new RegExp("(?!^)(" + this.A + ")$"));
          let u2;
          for (; u2 !== m2 && m2.length > 2; )
            u2 = m2, m2 = m2.replace(this.K, (r2) => this.stemmer.get(r2));
        }
        if (m2 && (this.mapper || this.dedupe && m2.length > 1)) {
          h2 = "";
          for (let u2 = 0, r2 = "", t2, n2; u2 < m2.length; u2++)
            t2 = m2.charAt(u2), t2 === r2 && this.dedupe || ((n2 = this.mapper && this.mapper.get(t2)) || n2 === "" ? n2 === r2 && this.dedupe || !(r2 = n2) || (h2 += n2) : h2 += r2 = t2);
          m2 = h2;
        }
        this.matcher && m2.length > 1 && (this.J || (this.J = new RegExp("(" + this.h + ")", "g")), m2 = m2.replace(this.J, (u2) => this.matcher.get(u2)));
        if (m2 && this.replacer)
          for (h2 = 0; m2 && h2 < this.replacer.length; h2 += 2)
            m2 = m2.replace(
              this.replacer[h2],
              this.replacer[h2 + 1]
            );
        this.cache && p2.length <= this.I && (this.D.set(p2, m2), this.D.size > this.L && (this.D.clear(), this.I = this.I / 1.1 | 0));
        if (m2) {
          if (m2 !== p2)
            if (c2) {
              if (d2[m2])
                continue;
              d2[m2] = 1;
            } else {
              if (g3 === m2)
                continue;
              g3 = m2;
            }
          e2.push(m2);
        }
      }
    }
  this.finalize && (e2 = this.finalize(e2) || e2);
  this.cache && a2.length <= this.H && (this.B.set(a2, e2), this.B.size > this.L && (this.B.clear(), this.H = this.H / 1.1 | 0));
  return e2;
};
function Q2(a2) {
  a2.F = null;
  a2.B.clear();
  a2.D.clear();
}
__name(Q2, "Q");
function la(a2, c2, b3) {
  b3 || (c2 || typeof a2 !== "object" ? typeof c2 === "object" && (b3 = c2, c2 = 0) : b3 = a2);
  b3 && (a2 = b3.query || a2, c2 = b3.limit || c2);
  let e2 = "" + (c2 || 0);
  b3 && (e2 += (b3.offset || 0) + !!b3.context + !!b3.suggest + (b3.resolve !== false) + (b3.resolution || this.resolution) + (b3.boost || 0));
  a2 = ("" + a2).toLowerCase();
  this.cache || (this.cache = new ma());
  let d2 = this.cache.get(a2 + e2);
  if (!d2) {
    const f2 = b3 && b3.cache;
    f2 && (b3.cache = false);
    d2 = this.search(a2, c2, b3);
    f2 && (b3.cache = f2);
    this.cache.set(a2 + e2, d2);
  }
  return d2;
}
__name(la, "la");
function ma(a2) {
  this.limit = a2 && a2 !== true ? a2 : 1e3;
  this.cache = /* @__PURE__ */ new Map();
  this.h = "";
}
__name(ma, "ma");
ma.prototype.set = function(a2, c2) {
  this.cache.set(this.h = a2, c2);
  this.cache.size > this.limit && this.cache.delete(this.cache.keys().next().value);
};
ma.prototype.get = function(a2) {
  const c2 = this.cache.get(a2);
  c2 && this.h !== a2 && (this.cache.delete(a2), this.cache.set(this.h = a2, c2));
  return c2;
};
ma.prototype.remove = function(a2) {
  for (const c2 of this.cache) {
    const b3 = c2[0];
    c2[1].includes(a2) && this.cache.delete(b3);
  }
};
ma.prototype.clear = function() {
  this.cache.clear();
  this.h = "";
};
var na = { normalize: false, numeric: false, dedupe: false };
var oa = {};
var ra = /* @__PURE__ */ new Map([["b", "p"], ["v", "f"], ["w", "f"], ["z", "s"], ["x", "s"], ["d", "t"], ["n", "m"], ["c", "k"], ["g", "k"], ["j", "k"], ["q", "k"], ["i", "e"], ["y", "e"], ["u", "o"]]);
var sa = /* @__PURE__ */ new Map([["ae", "a"], ["oe", "o"], ["sh", "s"], ["kh", "k"], ["th", "t"], ["ph", "f"], ["pf", "f"]]);
var ta2 = [/([^aeo])h(.)/g, "$1$2", /([aeo])h([^aeo]|$)/g, "$1$2", /(.)\1+/g, "$1"];
var ua = { a: "", e: "", i: "", o: "", u: "", y: "", b: 1, f: 1, p: 1, v: 1, c: 2, g: 2, j: 2, k: 2, q: 2, s: 2, x: 2, z: 2, "\xDF": 2, d: 3, t: 3, l: 4, m: 5, n: 5, r: 6 };
var va = { Exact: na, Default: oa, Normalize: oa, LatinBalance: { mapper: ra }, LatinAdvanced: { mapper: ra, matcher: sa, replacer: ta2 }, LatinExtra: { mapper: ra, replacer: ta2.concat([/(?!^)[aeo]/g, ""]), matcher: sa }, LatinSoundex: { dedupe: false, include: { letter: true }, finalize: function(a2) {
  for (let b3 = 0; b3 < a2.length; b3++) {
    var c2 = a2[b3];
    let e2 = c2.charAt(0), d2 = ua[e2];
    for (let f2 = 1, g3; f2 < c2.length && (g3 = c2.charAt(f2), g3 === "h" || g3 === "w" || !(g3 = ua[g3]) || g3 === d2 || (e2 += g3, d2 = g3, e2.length !== 4)); f2++)
      ;
    a2[b3] = e2;
  }
} }, CJK: { split: "" }, LatinExact: na, LatinDefault: oa, LatinSimple: oa };
function wa(a2, c2, b3, e2) {
  let d2 = [];
  for (let f2 = 0, g3; f2 < a2.index.length; f2++)
    if (g3 = a2.index[f2], c2 >= g3.length)
      c2 -= g3.length;
    else {
      c2 = g3[e2 ? "splice" : "slice"](c2, b3);
      const k2 = c2.length;
      if (k2 && (d2 = d2.length ? d2.concat(c2) : c2, b3 -= k2, e2 && (a2.length -= k2), !b3))
        break;
      c2 = 0;
    }
  return d2;
}
__name(wa, "wa");
function xa(a2) {
  if (!this || this.constructor !== xa)
    return new xa(a2);
  this.index = a2 ? [a2] : [];
  this.length = a2 ? a2.length : 0;
  const c2 = this;
  return new Proxy([], { get(b3, e2) {
    if (e2 === "length")
      return c2.length;
    if (e2 === "push")
      return function(d2) {
        c2.index[c2.index.length - 1].push(d2);
        c2.length++;
      };
    if (e2 === "pop")
      return function() {
        if (c2.length)
          return c2.length--, c2.index[c2.index.length - 1].pop();
      };
    if (e2 === "indexOf")
      return function(d2) {
        let f2 = 0;
        for (let g3 = 0, k2, h2; g3 < c2.index.length; g3++) {
          k2 = c2.index[g3];
          h2 = k2.indexOf(d2);
          if (h2 >= 0)
            return f2 + h2;
          f2 += k2.length;
        }
        return -1;
      };
    if (e2 === "includes")
      return function(d2) {
        for (let f2 = 0; f2 < c2.index.length; f2++)
          if (c2.index[f2].includes(d2))
            return true;
        return false;
      };
    if (e2 === "slice")
      return function(d2, f2) {
        return wa(c2, d2 || 0, f2 || c2.length, false);
      };
    if (e2 === "splice")
      return function(d2, f2) {
        return wa(c2, d2 || 0, f2 || c2.length, true);
      };
    if (e2 === "constructor")
      return Array;
    if (typeof e2 !== "symbol")
      return (b3 = c2.index[e2 / 2 ** 31 | 0]) && b3[e2];
  }, set(b3, e2, d2) {
    b3 = e2 / 2 ** 31 | 0;
    (c2.index[b3] || (c2.index[b3] = []))[e2] = d2;
    c2.length++;
    return true;
  } });
}
__name(xa, "xa");
xa.prototype.clear = function() {
  this.index.length = 0;
};
xa.prototype.push = function() {
};
function R2(a2 = 8) {
  if (!this || this.constructor !== R2)
    return new R2(a2);
  this.index = I2();
  this.h = [];
  this.size = 0;
  a2 > 32 ? (this.B = Aa, this.A = BigInt(a2)) : (this.B = Ba, this.A = a2);
}
__name(R2, "R");
R2.prototype.get = function(a2) {
  const c2 = this.index[this.B(a2)];
  return c2 && c2.get(a2);
};
R2.prototype.set = function(a2, c2) {
  var b3 = this.B(a2);
  let e2 = this.index[b3];
  e2 ? (b3 = e2.size, e2.set(a2, c2), (b3 -= e2.size) && this.size++) : (this.index[b3] = e2 = /* @__PURE__ */ new Map([[a2, c2]]), this.h.push(e2), this.size++);
};
function S2(a2 = 8) {
  if (!this || this.constructor !== S2)
    return new S2(a2);
  this.index = I2();
  this.h = [];
  this.size = 0;
  a2 > 32 ? (this.B = Aa, this.A = BigInt(a2)) : (this.B = Ba, this.A = a2);
}
__name(S2, "S");
S2.prototype.add = function(a2) {
  var c2 = this.B(a2);
  let b3 = this.index[c2];
  b3 ? (c2 = b3.size, b3.add(a2), (c2 -= b3.size) && this.size++) : (this.index[c2] = b3 = /* @__PURE__ */ new Set([a2]), this.h.push(b3), this.size++);
};
w2 = R2.prototype;
w2.has = S2.prototype.has = function(a2) {
  const c2 = this.index[this.B(a2)];
  return c2 && c2.has(a2);
};
w2.delete = S2.prototype.delete = function(a2) {
  const c2 = this.index[this.B(a2)];
  c2 && c2.delete(a2) && this.size--;
};
w2.clear = S2.prototype.clear = function() {
  this.index = I2();
  this.h = [];
  this.size = 0;
};
w2.values = S2.prototype.values = function* () {
  for (let a2 = 0; a2 < this.h.length; a2++)
    for (let c2 of this.h[a2].values())
      yield c2;
};
w2.keys = S2.prototype.keys = function* () {
  for (let a2 = 0; a2 < this.h.length; a2++)
    for (let c2 of this.h[a2].keys())
      yield c2;
};
w2.entries = S2.prototype.entries = function* () {
  for (let a2 = 0; a2 < this.h.length; a2++)
    for (let c2 of this.h[a2].entries())
      yield c2;
};
function Ba(a2) {
  let c2 = 2 ** this.A - 1;
  if (typeof a2 == "number")
    return a2 & c2;
  let b3 = 0, e2 = this.A + 1;
  for (let d2 = 0; d2 < a2.length; d2++)
    b3 = (b3 * e2 ^ a2.charCodeAt(d2)) & c2;
  return this.A === 32 ? b3 + 2 ** 31 : b3;
}
__name(Ba, "Ba");
function Aa(a2) {
  let c2 = BigInt(2) ** this.A - BigInt(1);
  var b3 = typeof a2;
  if (b3 === "bigint")
    return a2 & c2;
  if (b3 === "number")
    return BigInt(a2) & c2;
  b3 = BigInt(0);
  let e2 = this.A + BigInt(1);
  for (let d2 = 0; d2 < a2.length; d2++)
    b3 = (b3 * e2 ^ BigInt(a2.charCodeAt(d2))) & c2;
  return b3;
}
__name(Aa, "Aa");
var Ca;
var Da;
async function Ea(a2) {
  a2 = a2.data;
  var c2 = a2.task;
  const b3 = a2.id;
  let e2 = a2.args;
  switch (c2) {
    case "init":
      Da = a2.options || {};
      (c2 = a2.factory) ? (Function("return " + c2)()(self), Ca = new self.FlexSearch.Index(Da), delete self.FlexSearch) : Ca = new T2(Da);
      postMessage({ id: b3 });
      break;
    default:
      let d2;
      c2 === "export" && (e2[1] ? (e2[0] = Da.export, e2[2] = 0, e2[3] = 1) : e2 = null);
      c2 === "import" ? e2[0] && (a2 = await Da.import.call(Ca, e2[0]), Ca.import(e2[0], a2)) : ((d2 = e2 && Ca[c2].apply(Ca, e2)) && d2.then && (d2 = await d2), d2 && d2.await && (d2 = await d2.await), c2 === "search" && d2.result && (d2 = d2.result));
      postMessage(c2 === "search" ? { id: b3, msg: d2 } : { id: b3 });
  }
}
__name(Ea, "Ea");
function Fa(a2) {
  Ga.call(a2, "add");
  Ga.call(a2, "append");
  Ga.call(a2, "search");
  Ga.call(a2, "update");
  Ga.call(a2, "remove");
  Ga.call(a2, "searchCache");
}
__name(Fa, "Fa");
var Ha;
var Ia;
var Ja;
function Ka() {
  Ha = Ja = 0;
}
__name(Ka, "Ka");
function Ga(a2) {
  this[a2 + "Async"] = function() {
    const c2 = arguments;
    var b3 = c2[c2.length - 1];
    let e2;
    typeof b3 === "function" && (e2 = b3, delete c2[c2.length - 1]);
    Ha ? Ja || (Ja = Date.now() - Ia >= this.priority * this.priority * 3) : (Ha = setTimeout(Ka, 0), Ia = Date.now());
    if (Ja) {
      const f2 = this;
      return new Promise((g3) => {
        setTimeout(function() {
          g3(f2[a2 + "Async"].apply(f2, c2));
        }, 0);
      });
    }
    const d2 = this[a2].apply(this, c2);
    b3 = d2.then ? d2 : new Promise((f2) => f2(d2));
    e2 && b3.then(e2);
    return b3;
  };
}
__name(Ga, "Ga");
var V2 = 0;
function La(a2 = {}, c2) {
  function b3(k2) {
    function h2(l2) {
      l2 = l2.data || l2;
      const m2 = l2.id, p2 = m2 && f2.h[m2];
      p2 && (p2(l2.msg), delete f2.h[m2]);
    }
    __name(h2, "h");
    this.worker = k2;
    this.h = I2();
    if (this.worker) {
      d2 ? this.worker.on("message", h2) : this.worker.onmessage = h2;
      if (a2.config)
        return new Promise(function(l2) {
          V2 > 1e9 && (V2 = 0);
          f2.h[++V2] = function() {
            l2(f2);
          };
          f2.worker.postMessage({ id: V2, task: "init", factory: e2, options: a2 });
        });
      this.priority = a2.priority || 4;
      this.encoder = c2 || null;
      this.worker.postMessage({ task: "init", factory: e2, options: a2 });
      return this;
    }
  }
  __name(b3, "b");
  if (!this || this.constructor !== La)
    return new La(a2);
  let e2 = typeof self !== "undefined" ? self._factory : typeof window !== "undefined" ? window._factory : null;
  e2 && (e2 = e2.toString());
  const d2 = typeof window === "undefined", f2 = this, g3 = Ma(e2, d2, a2.worker);
  return g3.then ? g3.then(function(k2) {
    return b3.call(f2, k2);
  }) : b3.call(this, g3);
}
__name(La, "La");
W2("add");
W2("append");
W2("search");
W2("update");
W2("remove");
W2("clear");
W2("export");
W2("import");
La.prototype.searchCache = la;
Fa(La.prototype);
function W2(a2) {
  La.prototype[a2] = function() {
    const c2 = this, b3 = [].slice.call(arguments);
    var e2 = b3[b3.length - 1];
    let d2;
    typeof e2 === "function" && (d2 = e2, b3.pop());
    e2 = new Promise(function(f2) {
      a2 === "export" && typeof b3[0] === "function" && (b3[0] = null);
      V2 > 1e9 && (V2 = 0);
      c2.h[++V2] = f2;
      c2.worker.postMessage({ task: a2, id: V2, args: b3 });
    });
    return d2 ? (e2.then(d2), this) : e2;
  };
}
__name(W2, "W");
function Ma(a2, c2, b3) {
  return c2 ? typeof module !== "undefined" ? new (__require("worker_threads"))["Worker"](__dirname + "/worker/node.js") : import('worker_threads').then(function(worker) {
    return new worker["Worker"](import.meta.dirname + "/node/node.mjs");
  }) : a2 ? new window.Worker(URL.createObjectURL(new Blob(["onmessage=" + Ea.toString()], { type: "text/javascript" }))) : new window.Worker(typeof b3 === "string" ? b3 : import.meta.url.replace("/worker.js", "/worker/worker.js").replace(
    "flexsearch.bundle.module.min.js",
    "module/worker/worker.js"
  ).replace("flexsearch.bundle.module.min.mjs", "module/worker/worker.js"), { type: "module" });
}
__name(Ma, "Ma");
Na.prototype.add = function(a2, c2, b3) {
  ba(a2) && (c2 = a2, a2 = ca(c2, this.key));
  if (c2 && (a2 || a2 === 0)) {
    if (!b3 && this.reg.has(a2))
      return this.update(a2, c2);
    for (let k2 = 0, h2; k2 < this.field.length; k2++) {
      h2 = this.B[k2];
      var e2 = this.index.get(this.field[k2]);
      if (typeof h2 === "function") {
        var d2 = h2(c2);
        d2 && e2.add(a2, d2, b3, true);
      } else if (d2 = h2.G, !d2 || d2(c2))
        h2.constructor === String ? h2 = ["" + h2] : M2(h2) && (h2 = [h2]), Qa(c2, h2, this.D, 0, e2, a2, h2[0], b3);
    }
    if (this.tag)
      for (e2 = 0; e2 < this.A.length; e2++) {
        var f2 = this.A[e2];
        d2 = this.tag.get(this.F[e2]);
        let k2 = I2();
        if (typeof f2 === "function") {
          if (f2 = f2(c2), !f2)
            continue;
        } else {
          var g3 = f2.G;
          if (g3 && !g3(c2))
            continue;
          f2.constructor === String && (f2 = "" + f2);
          f2 = ca(c2, f2);
        }
        if (d2 && f2) {
          M2(f2) && (f2 = [f2]);
          for (let h2 = 0, l2, m2; h2 < f2.length; h2++)
            if (l2 = f2[h2], !k2[l2] && (k2[l2] = 1, (g3 = d2.get(l2)) ? m2 = g3 : d2.set(l2, m2 = []), !b3 || !m2.includes(a2))) {
              if (m2.length === 2 ** 31 - 1) {
                g3 = new xa(m2);
                if (this.fastupdate)
                  for (let p2 of this.reg.values())
                    p2.includes(m2) && (p2[p2.indexOf(m2)] = g3);
                d2.set(l2, m2 = g3);
              }
              m2.push(a2);
              this.fastupdate && ((g3 = this.reg.get(a2)) ? g3.push(m2) : this.reg.set(a2, [m2]));
            }
        }
      }
    if (this.store && (!b3 || !this.store.has(a2))) {
      let k2;
      if (this.h) {
        k2 = I2();
        for (let h2 = 0, l2; h2 < this.h.length; h2++) {
          l2 = this.h[h2];
          if ((b3 = l2.G) && !b3(c2))
            continue;
          let m2;
          if (typeof l2 === "function") {
            m2 = l2(c2);
            if (!m2)
              continue;
            l2 = [l2.O];
          } else if (M2(l2) || l2.constructor === String) {
            k2[l2] = c2[l2];
            continue;
          }
          Ra(c2, k2, l2, 0, l2[0], m2);
        }
      }
      this.store.set(a2, k2 || c2);
    }
    this.worker && (this.fastupdate || this.reg.add(a2));
  }
  return this;
};
function Ra(a2, c2, b3, e2, d2, f2) {
  a2 = a2[d2];
  if (e2 === b3.length - 1)
    c2[d2] = f2 || a2;
  else if (a2)
    if (a2.constructor === Array)
      for (c2 = c2[d2] = Array(a2.length), d2 = 0; d2 < a2.length; d2++)
        Ra(a2, c2, b3, e2, d2);
    else
      c2 = c2[d2] || (c2[d2] = I2()), d2 = b3[++e2], Ra(a2, c2, b3, e2, d2);
}
__name(Ra, "Ra");
function Qa(a2, c2, b3, e2, d2, f2, g3, k2) {
  if (a2 = a2[g3])
    if (e2 === c2.length - 1) {
      if (a2.constructor === Array) {
        if (b3[e2]) {
          for (c2 = 0; c2 < a2.length; c2++)
            d2.add(f2, a2[c2], true, true);
          return;
        }
        a2 = a2.join(" ");
      }
      d2.add(f2, a2, k2, true);
    } else if (a2.constructor === Array)
      for (g3 = 0; g3 < a2.length; g3++)
        Qa(a2, c2, b3, e2, d2, f2, g3, k2);
    else
      g3 = c2[++e2], Qa(a2, c2, b3, e2, d2, f2, g3, k2);
}
__name(Qa, "Qa");
function Sa(a2, c2, b3, e2) {
  if (!a2.length)
    return a2;
  if (a2.length === 1)
    return a2 = a2[0], a2 = b3 || a2.length > c2 ? a2.slice(b3, b3 + c2) : a2, e2 ? Ta.call(this, a2) : a2;
  let d2 = [];
  for (let f2 = 0, g3, k2; f2 < a2.length; f2++)
    if ((g3 = a2[f2]) && (k2 = g3.length)) {
      if (b3) {
        if (b3 >= k2) {
          b3 -= k2;
          continue;
        }
        g3 = g3.slice(b3, b3 + c2);
        k2 = g3.length;
        b3 = 0;
      }
      k2 > c2 && (g3 = g3.slice(0, c2), k2 = c2);
      if (!d2.length && k2 >= c2)
        return e2 ? Ta.call(this, g3) : g3;
      d2.push(g3);
      c2 -= k2;
      if (!c2)
        break;
    }
  d2 = d2.length > 1 ? [].concat.apply([], d2) : d2[0];
  return e2 ? Ta.call(this, d2) : d2;
}
__name(Sa, "Sa");
function Ua(a2, c2, b3, e2) {
  var d2 = e2[0];
  if (d2[0] && d2[0].query)
    return a2[c2].apply(a2, d2);
  if (!(c2 !== "and" && c2 !== "not" || a2.result.length || a2.await || d2.suggest))
    return e2.length > 1 && (d2 = e2[e2.length - 1]), (e2 = d2.resolve) ? a2.await || a2.result : a2;
  let f2 = [], g3 = 0, k2 = 0, h2, l2, m2, p2, u2;
  for (c2 = 0; c2 < e2.length; c2++)
    if (d2 = e2[c2]) {
      var r2 = void 0;
      if (d2.constructor === X2)
        r2 = d2.await || d2.result;
      else if (d2.then || d2.constructor === Array)
        r2 = d2;
      else {
        g3 = d2.limit || 0;
        k2 = d2.offset || 0;
        m2 = d2.suggest;
        l2 = d2.resolve;
        h2 = ((p2 = d2.highlight || a2.highlight) || d2.enrich) && l2;
        r2 = d2.queue;
        let t2 = d2.async || r2, n2 = d2.index, q2 = d2.query;
        n2 ? a2.index || (a2.index = n2) : n2 = a2.index;
        if (q2 || d2.tag) {
          const x3 = d2.field || d2.pluck;
          x3 && (!q2 || a2.query && !p2 || (a2.query = q2, a2.field = x3, a2.highlight = p2), n2 = n2.index.get(x3));
          if (r2 && (u2 || a2.await)) {
            u2 = 1;
            let v2;
            const A3 = a2.C.length, D3 = new Promise(function(F2) {
              v2 = F2;
            });
            (function(F2, E3) {
              D3.h = function() {
                E3.index = null;
                E3.resolve = false;
                let B3 = t2 ? F2.searchAsync(E3) : F2.search(E3);
                if (B3.then)
                  return B3.then(function(z3) {
                    a2.C[A3] = z3 = z3.result || z3;
                    v2(z3);
                    return z3;
                  });
                B3 = B3.result || B3;
                v2(B3);
                return B3;
              };
            })(n2, Object.assign({}, d2));
            a2.C.push(D3);
            f2[c2] = D3;
            continue;
          } else
            d2.resolve = false, d2.index = null, r2 = t2 ? n2.searchAsync(d2) : n2.search(d2), d2.resolve = l2, d2.index = n2;
        } else if (d2.and)
          r2 = Va(d2, "and", n2);
        else if (d2.or)
          r2 = Va(d2, "or", n2);
        else if (d2.not)
          r2 = Va(d2, "not", n2);
        else if (d2.xor)
          r2 = Va(d2, "xor", n2);
        else
          continue;
      }
      r2.await ? (u2 = 1, r2 = r2.await) : r2.then ? (u2 = 1, r2 = r2.then(function(t2) {
        return t2.result || t2;
      })) : r2 = r2.result || r2;
      f2[c2] = r2;
    }
  u2 && !a2.await && (a2.await = new Promise(function(t2) {
    a2.return = t2;
  }));
  if (u2) {
    const t2 = Promise.all(f2).then(function(n2) {
      for (let q2 = 0; q2 < a2.C.length; q2++)
        if (a2.C[q2] === t2) {
          a2.C[q2] = function() {
            return b3.call(a2, n2, g3, k2, h2, l2, m2, p2);
          };
          break;
        }
      Wa(a2);
    });
    a2.C.push(t2);
  } else if (a2.await)
    a2.C.push(function() {
      return b3.call(a2, f2, g3, k2, h2, l2, m2, p2);
    });
  else
    return b3.call(a2, f2, g3, k2, h2, l2, m2, p2);
  return l2 ? a2.await || a2.result : a2;
}
__name(Ua, "Ua");
function Va(a2, c2, b3) {
  a2 = a2[c2];
  const e2 = a2[0] || a2;
  e2.index || (e2.index = b3);
  b3 = new X2(e2);
  a2.length > 1 && (b3 = b3[c2].apply(b3, a2.slice(1)));
  return b3;
}
__name(Va, "Va");
X2.prototype.or = function() {
  return Ua(this, "or", Xa, arguments);
};
function Xa(a2, c2, b3, e2, d2, f2, g3) {
  a2.length && (this.result.length && a2.push(this.result), a2.length < 2 ? this.result = a2[0] : (this.result = Ya(a2, c2, b3, false, this.h), b3 = 0));
  d2 && (this.await = null);
  return d2 ? this.resolve(c2, b3, e2, g3) : this;
}
__name(Xa, "Xa");
X2.prototype.and = function() {
  return Ua(this, "and", Za, arguments);
};
function Za(a2, c2, b3, e2, d2, f2, g3) {
  if (!f2 && !this.result.length)
    return d2 ? this.result : this;
  let k2;
  if (a2.length)
    if (this.result.length && a2.unshift(this.result), a2.length < 2)
      this.result = a2[0];
    else {
      let h2 = 0;
      for (let l2 = 0, m2, p2; l2 < a2.length; l2++)
        if ((m2 = a2[l2]) && (p2 = m2.length))
          h2 < p2 && (h2 = p2);
        else if (!f2) {
          h2 = 0;
          break;
        }
      h2 ? (this.result = $a(a2, h2, c2, b3, f2, this.h, d2), k2 = true) : this.result = [];
    }
  else
    f2 || (this.result = a2);
  d2 && (this.await = null);
  return d2 ? this.resolve(c2, b3, e2, g3, k2) : this;
}
__name(Za, "Za");
X2.prototype.xor = function() {
  return Ua(this, "xor", ab, arguments);
};
function ab(a2, c2, b3, e2, d2, f2, g3) {
  if (a2.length)
    if (this.result.length && a2.unshift(this.result), a2.length < 2)
      this.result = a2[0];
    else {
      a: {
        f2 = b3;
        var k2 = this.h;
        const h2 = [], l2 = I2();
        let m2 = 0;
        for (let p2 = 0, u2; p2 < a2.length; p2++)
          if (u2 = a2[p2]) {
            m2 < u2.length && (m2 = u2.length);
            for (let r2 = 0, t2; r2 < u2.length; r2++)
              if (t2 = u2[r2])
                for (let n2 = 0, q2; n2 < t2.length; n2++)
                  q2 = t2[n2], l2[q2] = l2[q2] ? 2 : 1;
          }
        for (let p2 = 0, u2, r2 = 0; p2 < m2; p2++)
          for (let t2 = 0, n2; t2 < a2.length; t2++)
            if (n2 = a2[t2]) {
              if (u2 = n2[p2]) {
                for (let q2 = 0, x3; q2 < u2.length; q2++)
                  if (x3 = u2[q2], l2[x3] === 1)
                    if (f2)
                      f2--;
                    else if (d2) {
                      if (h2.push(x3), h2.length === c2) {
                        a2 = h2;
                        break a;
                      }
                    } else {
                      const v2 = p2 + (t2 ? k2 : 0);
                      h2[v2] || (h2[v2] = []);
                      h2[v2].push(x3);
                      if (++r2 === c2) {
                        a2 = h2;
                        break a;
                      }
                    }
              }
            }
        a2 = h2;
      }
      this.result = a2;
      k2 = true;
    }
  else
    f2 || (this.result = a2);
  d2 && (this.await = null);
  return d2 ? this.resolve(c2, b3, e2, g3, k2) : this;
}
__name(ab, "ab");
X2.prototype.not = function() {
  return Ua(this, "not", bb, arguments);
};
function bb(a2, c2, b3, e2, d2, f2, g3) {
  if (!f2 && !this.result.length)
    return d2 ? this.result : this;
  if (a2.length && this.result.length) {
    a: {
      f2 = b3;
      var k2 = [];
      a2 = new Set(a2.flat().flat());
      for (let h2 = 0, l2, m2 = 0; h2 < this.result.length; h2++)
        if (l2 = this.result[h2]) {
          for (let p2 = 0, u2; p2 < l2.length; p2++)
            if (u2 = l2[p2], !a2.has(u2)) {
              if (f2)
                f2--;
              else if (d2) {
                if (k2.push(u2), k2.length === c2) {
                  a2 = k2;
                  break a;
                }
              } else if (k2[h2] || (k2[h2] = []), k2[h2].push(u2), ++m2 === c2) {
                a2 = k2;
                break a;
              }
            }
        }
      a2 = k2;
    }
    this.result = a2;
    k2 = true;
  }
  d2 && (this.await = null);
  return d2 ? this.resolve(c2, b3, e2, g3, k2) : this;
}
__name(bb, "bb");
function cb(a2, c2, b3, e2, d2) {
  let f2, g3, k2;
  typeof d2 === "string" ? (f2 = d2, d2 = "") : f2 = d2.template;
  g3 = f2.indexOf("$1");
  k2 = f2.substring(g3 + 2);
  g3 = f2.substring(0, g3);
  let h2 = d2 && d2.boundary, l2 = !d2 || d2.clip !== false, m2 = d2 && d2.merge && k2 && g3 && new RegExp(k2 + " " + g3, "g");
  d2 = d2 && d2.ellipsis;
  var p2 = 0;
  if (typeof d2 === "object") {
    var u2 = d2.template;
    p2 = u2.length - 2;
    d2 = d2.pattern;
  }
  typeof d2 !== "string" && (d2 = d2 === false ? "" : "...");
  p2 && (d2 = u2.replace("$1", d2));
  u2 = d2.length - p2;
  let r2, t2;
  typeof h2 === "object" && (r2 = h2.before, r2 === 0 && (r2 = -1), t2 = h2.after, t2 === 0 && (t2 = -1), h2 = h2.total || 9e5);
  p2 = /* @__PURE__ */ new Map();
  for (let Oa = 0, da, db, pa; Oa < c2.length; Oa++) {
    let qa;
    if (e2)
      qa = c2, pa = e2;
    else {
      var n2 = c2[Oa];
      pa = n2.field;
      if (!pa)
        continue;
      qa = n2.result;
    }
    db = b3.get(pa);
    da = db.encoder;
    n2 = p2.get(da);
    typeof n2 !== "string" && (n2 = da.encode(a2), p2.set(da, n2));
    for (let ya = 0; ya < qa.length; ya++) {
      var q2 = qa[ya].doc;
      if (!q2)
        continue;
      q2 = ca(q2, pa);
      if (!q2)
        continue;
      var x3 = q2.trim().split(/\s+/);
      if (!x3.length)
        continue;
      q2 = "";
      var v2 = [];
      let za = [];
      var A3 = -1, D3 = -1, F2 = 0;
      for (var E3 = 0; E3 < x3.length; E3++) {
        var B3 = x3[E3], z3 = da.encode(B3);
        z3 = z3.length > 1 ? z3.join(" ") : z3[0];
        let y3;
        if (z3 && B3) {
          var C3 = B3.length, J2 = (da.split ? B3.replace(da.split, "") : B3).length - z3.length, G2 = "", N2 = 0;
          for (var O2 = 0; O2 < n2.length; O2++) {
            var P3 = n2[O2];
            if (P3) {
              var L2 = P3.length;
              L2 += J2 < 0 ? 0 : J2;
              N2 && L2 <= N2 || (P3 = z3.indexOf(P3), P3 > -1 && (G2 = (P3 ? B3.substring(0, P3) : "") + g3 + B3.substring(P3, P3 + L2) + k2 + (P3 + L2 < C3 ? B3.substring(P3 + L2) : ""), N2 = L2, y3 = true));
            }
          }
          G2 && (h2 && (A3 < 0 && (A3 = q2.length + (q2 ? 1 : 0)), D3 = q2.length + (q2 ? 1 : 0) + G2.length, F2 += C3, za.push(v2.length), v2.push({ match: G2 })), q2 += (q2 ? " " : "") + G2);
        }
        if (!y3)
          B3 = x3[E3], q2 += (q2 ? " " : "") + B3, h2 && v2.push({ text: B3 });
        else if (h2 && F2 >= h2)
          break;
      }
      F2 = za.length * (f2.length - 2);
      if (r2 || t2 || h2 && q2.length - F2 > h2)
        if (F2 = h2 + F2 - u2 * 2, E3 = D3 - A3, r2 > 0 && (E3 += r2), t2 > 0 && (E3 += t2), E3 <= F2)
          x3 = r2 ? A3 - (r2 > 0 ? r2 : 0) : A3 - ((F2 - E3) / 2 | 0), v2 = t2 ? D3 + (t2 > 0 ? t2 : 0) : x3 + F2, l2 || (x3 > 0 && q2.charAt(x3) !== " " && q2.charAt(x3 - 1) !== " " && (x3 = q2.indexOf(" ", x3), x3 < 0 && (x3 = 0)), v2 < q2.length && q2.charAt(v2 - 1) !== " " && q2.charAt(v2) !== " " && (v2 = q2.lastIndexOf(" ", v2), v2 < D3 ? v2 = D3 : ++v2)), q2 = (x3 ? d2 : "") + q2.substring(x3, v2) + (v2 < q2.length ? d2 : "");
        else {
          D3 = [];
          A3 = {};
          F2 = {};
          E3 = {};
          B3 = {};
          z3 = {};
          G2 = J2 = C3 = 0;
          for (O2 = N2 = 1; ; ) {
            var U2 = void 0;
            for (let y3 = 0, K2; y3 < za.length; y3++) {
              K2 = za[y3];
              if (G2)
                if (J2 !== G2) {
                  if (E3[y3 + 1])
                    continue;
                  K2 += G2;
                  if (A3[K2]) {
                    C3 -= u2;
                    F2[y3 + 1] = 1;
                    E3[y3 + 1] = 1;
                    continue;
                  }
                  if (K2 >= v2.length - 1) {
                    if (K2 >= v2.length) {
                      E3[y3 + 1] = 1;
                      K2 >= x3.length && (F2[y3 + 1] = 1);
                      continue;
                    }
                    C3 -= u2;
                  }
                  q2 = v2[K2].text;
                  if (L2 = t2 && z3[y3])
                    if (L2 > 0) {
                      if (q2.length > L2)
                        if (E3[y3 + 1] = 1, l2)
                          q2 = q2.substring(0, L2);
                        else
                          continue;
                      (L2 -= q2.length) || (L2 = -1);
                      z3[y3] = L2;
                    } else {
                      E3[y3 + 1] = 1;
                      continue;
                    }
                  if (C3 + q2.length + 1 <= h2)
                    q2 = " " + q2, D3[y3] += q2;
                  else if (l2)
                    U2 = h2 - C3 - 1, U2 > 0 && (q2 = " " + q2.substring(0, U2), D3[y3] += q2), E3[y3 + 1] = 1;
                  else {
                    E3[y3 + 1] = 1;
                    continue;
                  }
                } else {
                  if (E3[y3])
                    continue;
                  K2 -= J2;
                  if (A3[K2]) {
                    C3 -= u2;
                    E3[y3] = 1;
                    F2[y3] = 1;
                    continue;
                  }
                  if (K2 <= 0) {
                    if (K2 < 0) {
                      E3[y3] = 1;
                      F2[y3] = 1;
                      continue;
                    }
                    C3 -= u2;
                  }
                  q2 = v2[K2].text;
                  if (L2 = r2 && B3[y3])
                    if (L2 > 0) {
                      if (q2.length > L2)
                        if (E3[y3] = 1, l2)
                          q2 = q2.substring(q2.length - L2);
                        else
                          continue;
                      (L2 -= q2.length) || (L2 = -1);
                      B3[y3] = L2;
                    } else {
                      E3[y3] = 1;
                      continue;
                    }
                  if (C3 + q2.length + 1 <= h2)
                    q2 += " ", D3[y3] = q2 + D3[y3];
                  else if (l2)
                    U2 = q2.length + 1 - (h2 - C3), U2 >= 0 && U2 < q2.length && (q2 = q2.substring(U2) + " ", D3[y3] = q2 + D3[y3]), E3[y3] = 1;
                  else {
                    E3[y3] = 1;
                    continue;
                  }
                }
              else {
                q2 = v2[K2].match;
                r2 && (B3[y3] = r2);
                t2 && (z3[y3] = t2);
                y3 && C3++;
                let Pa;
                K2 ? !y3 && u2 && (C3 += u2) : (F2[y3] = 1, E3[y3] = 1);
                K2 >= x3.length - 1 ? Pa = 1 : K2 < v2.length - 1 && v2[K2 + 1].match ? Pa = 1 : u2 && (C3 += u2);
                C3 -= f2.length - 2;
                if (!y3 || C3 + q2.length <= h2)
                  D3[y3] = q2;
                else {
                  U2 = N2 = O2 = F2[y3] = 0;
                  break;
                }
                Pa && (F2[y3 + 1] = 1, E3[y3 + 1] = 1);
              }
              C3 += q2.length;
              U2 = A3[K2] = 1;
            }
            if (U2)
              J2 === G2 ? G2++ : J2++;
            else {
              J2 === G2 ? N2 = 0 : O2 = 0;
              if (!N2 && !O2)
                break;
              N2 ? (J2++, G2 = J2) : G2++;
            }
          }
          q2 = "";
          for (let y3 = 0, K2; y3 < D3.length; y3++)
            K2 = (F2[y3] ? y3 ? " " : "" : (y3 && !d2 ? " " : "") + d2) + D3[y3], q2 += K2;
          d2 && !F2[D3.length] && (q2 += d2);
        }
      m2 && (q2 = q2.replace(m2, " "));
      qa[ya].highlight = q2;
    }
    if (e2)
      break;
  }
  return c2;
}
__name(cb, "cb");
function X2(a2, c2) {
  if (!this || this.constructor !== X2)
    return new X2(a2, c2);
  let b3 = 0, e2, d2, f2, g3, k2, h2;
  if (a2 && a2.index) {
    const l2 = a2;
    c2 = l2.index;
    b3 = l2.boost || 0;
    if (d2 = l2.query) {
      f2 = l2.field || l2.pluck;
      g3 = l2.highlight;
      const m2 = l2.resolve;
      a2 = l2.async || l2.queue;
      l2.resolve = false;
      l2.index = null;
      a2 = a2 ? c2.searchAsync(l2) : c2.search(l2);
      l2.resolve = m2;
      l2.index = c2;
      a2 = a2.result || a2;
    } else
      a2 = [];
  }
  if (a2 && a2.then) {
    const l2 = this;
    a2 = a2.then(function(m2) {
      l2.C[0] = l2.result = m2.result || m2;
      Wa(l2);
    });
    e2 = [a2];
    a2 = [];
    k2 = new Promise(function(m2) {
      h2 = m2;
    });
  }
  this.index = c2 || null;
  this.result = a2 || [];
  this.h = b3;
  this.C = e2 || [];
  this.await = k2 || null;
  this.return = h2 || null;
  this.highlight = g3 || null;
  this.query = d2 || "";
  this.field = f2 || "";
}
__name(X2, "X");
w2 = X2.prototype;
w2.limit = function(a2) {
  if (this.await) {
    const c2 = this;
    this.C.push(function() {
      return c2.limit(a2).result;
    });
  } else if (this.result.length) {
    const c2 = [];
    for (let b3 = 0, e2; b3 < this.result.length; b3++)
      if (e2 = this.result[b3])
        if (e2.length <= a2) {
          if (c2[b3] = e2, a2 -= e2.length, !a2)
            break;
        } else {
          c2[b3] = e2.slice(0, a2);
          break;
        }
    this.result = c2;
  }
  return this;
};
w2.offset = function(a2) {
  if (this.await) {
    const c2 = this;
    this.C.push(function() {
      return c2.offset(a2).result;
    });
  } else if (this.result.length) {
    const c2 = [];
    for (let b3 = 0, e2; b3 < this.result.length; b3++)
      if (e2 = this.result[b3])
        e2.length <= a2 ? a2 -= e2.length : (c2[b3] = e2.slice(a2), a2 = 0);
    this.result = c2;
  }
  return this;
};
w2.boost = function(a2) {
  if (this.await) {
    const c2 = this;
    this.C.push(function() {
      return c2.boost(a2).result;
    });
  } else
    this.h += a2;
  return this;
};
function Wa(a2, c2) {
  let b3 = a2.result;
  var e2 = a2.await;
  a2.await = null;
  for (let d2 = 0, f2; d2 < a2.C.length; d2++)
    if (f2 = a2.C[d2]) {
      if (typeof f2 === "function")
        b3 = f2(), a2.C[d2] = b3 = b3.result || b3, d2--;
      else if (f2.h)
        b3 = f2.h(), a2.C[d2] = b3 = b3.result || b3, d2--;
      else if (f2.then)
        return a2.await = e2;
    }
  e2 = a2.return;
  a2.C = [];
  a2.return = null;
  c2 || e2(b3);
  return b3;
}
__name(Wa, "Wa");
w2.resolve = function(a2, c2, b3, e2, d2) {
  let f2 = this.await ? Wa(this, true) : this.result;
  if (f2.then) {
    const g3 = this;
    return f2.then(function() {
      return g3.resolve(a2, c2, b3, e2, d2);
    });
  }
  f2.length && (typeof a2 === "object" ? (e2 = a2.highlight || this.highlight, b3 = !!e2 || a2.enrich, c2 = a2.offset, a2 = a2.limit) : (e2 = e2 || this.highlight, b3 = !!e2 || b3), f2 = d2 ? b3 ? Ta.call(this.index, f2) : f2 : Sa.call(this.index, f2, a2 || 100, c2, b3));
  return this.finalize(f2, e2);
};
w2.finalize = function(a2, c2) {
  if (a2.then) {
    const e2 = this;
    return a2.then(function(d2) {
      return e2.finalize(d2, c2);
    });
  }
  c2 && a2.length && this.query && (a2 = cb(this.query, a2, this.index.index, this.field, c2));
  const b3 = this.return;
  this.highlight = this.index = this.result = this.C = this.await = this.return = null;
  this.query = this.field = "";
  b3 && b3(a2);
  return a2;
};
function $a(a2, c2, b3, e2, d2, f2, g3) {
  const k2 = a2.length;
  let h2 = [], l2, m2;
  l2 = I2();
  for (let p2 = 0, u2, r2, t2, n2; p2 < c2; p2++)
    for (let q2 = 0; q2 < k2; q2++)
      if (t2 = a2[q2], p2 < t2.length && (u2 = t2[p2]))
        for (let x3 = 0; x3 < u2.length; x3++) {
          r2 = u2[x3];
          (m2 = l2[r2]) ? l2[r2]++ : (m2 = 0, l2[r2] = 1);
          n2 = h2[m2] || (h2[m2] = []);
          if (!g3) {
            let v2 = p2 + (q2 || !d2 ? 0 : f2 || 0);
            n2 = n2[v2] || (n2[v2] = []);
          }
          n2.push(r2);
          if (g3 && b3 && m2 === k2 - 1 && n2.length - e2 === b3)
            return e2 ? n2.slice(e2) : n2;
        }
  if (a2 = h2.length)
    if (d2)
      h2 = h2.length > 1 ? Ya(h2, b3, e2, g3, f2) : (h2 = h2[0]) && b3 && h2.length > b3 || e2 ? h2.slice(e2, b3 + e2) : h2;
    else {
      if (a2 < k2)
        return [];
      h2 = h2[a2 - 1];
      if (b3 || e2)
        if (g3) {
          if (h2.length > b3 || e2)
            h2 = h2.slice(e2, b3 + e2);
        } else {
          d2 = [];
          for (let p2 = 0, u2; p2 < h2.length; p2++)
            if (u2 = h2[p2])
              if (e2 && u2.length > e2)
                e2 -= u2.length;
              else {
                if (b3 && u2.length > b3 || e2)
                  u2 = u2.slice(e2, b3 + e2), b3 -= u2.length, e2 && (e2 -= u2.length);
                d2.push(u2);
                if (!b3)
                  break;
              }
          h2 = d2;
        }
    }
  return h2;
}
__name($a, "$a");
function Ya(a2, c2, b3, e2, d2) {
  const f2 = [], g3 = I2();
  let k2;
  var h2 = a2.length;
  let l2;
  if (e2)
    for (d2 = h2 - 1; d2 >= 0; d2--) {
      if (l2 = (e2 = a2[d2]) && e2.length) {
        for (h2 = 0; h2 < l2; h2++)
          if (k2 = e2[h2], !g3[k2]) {
            if (g3[k2] = 1, b3)
              b3--;
            else if (f2.push(k2), f2.length === c2)
              return f2;
          }
      }
    }
  else
    for (let m2 = h2 - 1, p2, u2 = 0; m2 >= 0; m2--) {
      p2 = a2[m2];
      for (let r2 = 0; r2 < p2.length; r2++)
        if (l2 = (e2 = p2[r2]) && e2.length) {
          for (let t2 = 0; t2 < l2; t2++)
            if (k2 = e2[t2], !g3[k2])
              if (g3[k2] = 1, b3)
                b3--;
              else {
                let n2 = (r2 + (m2 < h2 - 1 ? d2 || 0 : 0)) / (m2 + 1) | 0;
                (f2[n2] || (f2[n2] = [])).push(k2);
                if (++u2 === c2)
                  return f2;
              }
        }
    }
  return f2;
}
__name(Ya, "Ya");
function eb(a2, c2, b3, e2, d2) {
  const f2 = I2(), g3 = [];
  for (let k2 = 0, h2; k2 < c2.length; k2++) {
    h2 = c2[k2];
    for (let l2 = 0; l2 < h2.length; l2++)
      f2[h2[l2]] = 1;
  }
  if (d2)
    for (let k2 = 0, h2; k2 < a2.length; k2++) {
      if (h2 = a2[k2], f2[h2]) {
        if (e2)
          e2--;
        else if (g3.push(h2), f2[h2] = 0, b3 && --b3 === 0)
          break;
      }
    }
  else
    for (let k2 = 0, h2, l2; k2 < a2.result.length; k2++)
      for (h2 = a2.result[k2], c2 = 0; c2 < h2.length; c2++)
        l2 = h2[c2], f2[l2] && ((g3[k2] || (g3[k2] = [])).push(l2), f2[l2] = 0);
  return g3;
}
__name(eb, "eb");
Na.prototype.search = function(a2, c2, b3, e2) {
  b3 || (!c2 && ba(a2) ? (b3 = a2, a2 = "") : ba(c2) && (b3 = c2, c2 = 0));
  let d2 = [];
  var f2 = [];
  let g3;
  let k2, h2, l2, m2, p2;
  let u2 = 0, r2 = true, t2;
  if (b3) {
    b3.constructor === Array && (b3 = { index: b3 });
    a2 = b3.query || a2;
    g3 = b3.pluck;
    k2 = b3.merge;
    l2 = b3.boost;
    p2 = g3 || b3.field || (p2 = b3.index) && (p2.index ? null : p2);
    var n2 = this.tag && b3.tag;
    h2 = b3.suggest;
    r2 = b3.resolve !== false;
    m2 = b3.cache;
    t2 = r2 && this.store && b3.highlight;
    var q2 = !!t2 || r2 && this.store && b3.enrich;
    c2 = b3.limit || c2;
    var x3 = b3.offset || 0;
    c2 || (c2 = r2 ? 100 : 0);
    if (n2 && (!this.db || !e2)) {
      n2.constructor !== Array && (n2 = [n2]);
      var v2 = [];
      for (let B3 = 0, z3; B3 < n2.length; B3++)
        if (z3 = n2[B3], z3.field && z3.tag) {
          var A3 = z3.tag;
          if (A3.constructor === Array)
            for (var D3 = 0; D3 < A3.length; D3++)
              v2.push(z3.field, A3[D3]);
          else
            v2.push(z3.field, A3);
        } else {
          A3 = Object.keys(z3);
          for (let C3 = 0, J2, G2; C3 < A3.length; C3++)
            if (J2 = A3[C3], G2 = z3[J2], G2.constructor === Array)
              for (D3 = 0; D3 < G2.length; D3++)
                v2.push(J2, G2[D3]);
            else
              v2.push(J2, G2);
        }
      n2 = v2;
      if (!a2) {
        f2 = [];
        if (v2.length)
          for (n2 = 0; n2 < v2.length; n2 += 2) {
            if (this.db) {
              e2 = this.index.get(v2[n2]);
              if (!e2)
                continue;
              f2.push(e2 = e2.db.tag(v2[n2 + 1], c2, x3, q2));
            } else
              e2 = fb.call(this, v2[n2], v2[n2 + 1], c2, x3, q2);
            d2.push(r2 ? { field: v2[n2], tag: v2[n2 + 1], result: e2 } : [e2]);
          }
        if (f2.length) {
          const B3 = this;
          return Promise.all(f2).then(function(z3) {
            for (let C3 = 0; C3 < z3.length; C3++)
              r2 ? d2[C3].result = z3[C3] : d2[C3] = z3[C3];
            return r2 ? d2 : new X2(d2.length > 1 ? $a(d2, 1, 0, 0, h2, l2) : d2[0], B3);
          });
        }
        return r2 ? d2 : new X2(d2.length > 1 ? $a(d2, 1, 0, 0, h2, l2) : d2[0], this);
      }
    }
    r2 || g3 || !(p2 = p2 || this.field) || (M2(p2) ? g3 = p2 : (p2.constructor === Array && p2.length === 1 && (p2 = p2[0]), g3 = p2.field || p2.index));
    p2 && p2.constructor !== Array && (p2 = [p2]);
  }
  p2 || (p2 = this.field);
  let F2;
  v2 = (this.worker || this.db) && !e2 && [];
  for (let B3 = 0, z3, C3, J2; B3 < p2.length; B3++) {
    C3 = p2[B3];
    if (this.db && this.tag && !this.B[B3])
      continue;
    let G2;
    M2(C3) || (G2 = C3, C3 = G2.field, a2 = G2.query || a2, c2 = aa(G2.limit, c2), x3 = aa(G2.offset, x3), h2 = aa(G2.suggest, h2), t2 = r2 && this.store && aa(G2.highlight, t2), q2 = !!t2 || r2 && this.store && aa(G2.enrich, q2), m2 = aa(G2.cache, m2));
    if (e2)
      z3 = e2[B3];
    else {
      A3 = G2 || b3 || {};
      D3 = A3.enrich;
      var E3 = this.index.get(C3);
      n2 && (this.db && (A3.tag = n2, A3.field = p2, F2 = E3.db.support_tag_search), !F2 && D3 && (A3.enrich = false), F2 || (A3.limit = 0, A3.offset = 0));
      z3 = m2 ? E3.searchCache(a2, n2 && !F2 ? 0 : c2, A3) : E3.search(a2, n2 && !F2 ? 0 : c2, A3);
      n2 && !F2 && (A3.limit = c2, A3.offset = x3);
      D3 && (A3.enrich = D3);
      if (v2) {
        v2[B3] = z3;
        continue;
      }
    }
    J2 = (z3 = z3.result || z3) && z3.length;
    if (n2 && J2) {
      A3 = [];
      D3 = 0;
      if (this.db && e2) {
        if (!F2)
          for (E3 = p2.length; E3 < e2.length; E3++) {
            let N2 = e2[E3];
            if (N2 && N2.length)
              D3++, A3.push(N2);
            else if (!h2)
              return r2 ? d2 : new X2(d2, this);
          }
      } else
        for (let N2 = 0, O2, P3; N2 < n2.length; N2 += 2) {
          O2 = this.tag.get(n2[N2]);
          if (!O2)
            if (h2)
              continue;
            else
              return r2 ? d2 : new X2(d2, this);
          if (P3 = (O2 = O2 && O2.get(n2[N2 + 1])) && O2.length)
            D3++, A3.push(O2);
          else if (!h2)
            return r2 ? d2 : new X2(d2, this);
        }
      if (D3) {
        z3 = eb(z3, A3, c2, x3, r2);
        J2 = z3.length;
        if (!J2 && !h2)
          return r2 ? z3 : new X2(z3, this);
        D3--;
      }
    }
    if (J2)
      f2[u2] = C3, d2.push(z3), u2++;
    else if (p2.length === 1)
      return r2 ? d2 : new X2(
        d2,
        this
      );
  }
  if (v2) {
    if (this.db && n2 && n2.length && !F2)
      for (q2 = 0; q2 < n2.length; q2 += 2) {
        f2 = this.index.get(n2[q2]);
        if (!f2)
          if (h2)
            continue;
          else
            return r2 ? d2 : new X2(d2, this);
        v2.push(f2.db.tag(n2[q2 + 1], c2, x3, false));
      }
    const B3 = this;
    return Promise.all(v2).then(function(z3) {
      b3 && (b3.resolve = r2);
      z3.length && (z3 = B3.search(a2, c2, b3, z3));
      return z3;
    });
  }
  if (!u2)
    return r2 ? d2 : new X2(d2, this);
  if (g3 && (!q2 || !this.store))
    return d2 = d2[0], r2 ? d2 : new X2(d2, this);
  v2 = [];
  for (x3 = 0; x3 < f2.length; x3++) {
    n2 = d2[x3];
    q2 && n2.length && typeof n2[0].doc === "undefined" && (this.db ? v2.push(n2 = this.index.get(this.field[0]).db.enrich(n2)) : n2 = Ta.call(this, n2));
    if (g3)
      return r2 ? t2 ? cb(a2, n2, this.index, g3, t2) : n2 : new X2(n2, this);
    d2[x3] = { field: f2[x3], result: n2 };
  }
  if (q2 && this.db && v2.length) {
    const B3 = this;
    return Promise.all(v2).then(function(z3) {
      for (let C3 = 0; C3 < z3.length; C3++)
        d2[C3].result = z3[C3];
      t2 && (d2 = cb(a2, d2, B3.index, g3, t2));
      return k2 ? gb(d2) : d2;
    });
  }
  t2 && (d2 = cb(a2, d2, this.index, g3, t2));
  return k2 ? gb(d2) : d2;
};
function gb(a2) {
  const c2 = [], b3 = I2(), e2 = I2();
  for (let d2 = 0, f2, g3, k2, h2, l2, m2, p2; d2 < a2.length; d2++) {
    f2 = a2[d2];
    g3 = f2.field;
    k2 = f2.result;
    for (let u2 = 0; u2 < k2.length; u2++)
      if (l2 = k2[u2], typeof l2 !== "object" ? l2 = { id: h2 = l2 } : h2 = l2.id, (m2 = b3[h2]) ? m2.push(g3) : (l2.field = b3[h2] = [g3], c2.push(l2)), p2 = l2.highlight)
        m2 = e2[h2], m2 || (e2[h2] = m2 = {}, l2.highlight = m2), m2[g3] = p2;
  }
  return c2;
}
__name(gb, "gb");
function fb(a2, c2, b3, e2, d2) {
  a2 = this.tag.get(a2);
  if (!a2)
    return [];
  a2 = a2.get(c2);
  if (!a2)
    return [];
  c2 = a2.length - e2;
  if (c2 > 0) {
    if (b3 && c2 > b3 || e2)
      a2 = a2.slice(e2, e2 + b3);
    d2 && (a2 = Ta.call(this, a2));
  }
  return a2;
}
__name(fb, "fb");
function Ta(a2) {
  if (!this || !this.store)
    return a2;
  if (this.db)
    return this.index.get(this.field[0]).db.enrich(a2);
  const c2 = Array(a2.length);
  for (let b3 = 0, e2; b3 < a2.length; b3++)
    e2 = a2[b3], c2[b3] = { id: e2, doc: this.store.get(e2) };
  return c2;
}
__name(Ta, "Ta");
function Na(a2) {
  if (!this || this.constructor !== Na)
    return new Na(a2);
  const c2 = a2.document || a2.doc || a2;
  let b3, e2;
  this.B = [];
  this.field = [];
  this.D = [];
  this.key = (b3 = c2.key || c2.id) && hb(b3, this.D) || "id";
  (e2 = a2.keystore || 0) && (this.keystore = e2);
  this.fastupdate = !!a2.fastupdate;
  this.reg = !this.fastupdate || a2.worker || a2.db ? e2 ? new S2(e2) : /* @__PURE__ */ new Set() : e2 ? new R2(e2) : /* @__PURE__ */ new Map();
  this.h = (b3 = c2.store || null) && b3 && b3 !== true && [];
  this.store = b3 ? e2 ? new R2(e2) : /* @__PURE__ */ new Map() : null;
  this.cache = (b3 = a2.cache || null) && new ma(b3);
  a2.cache = false;
  this.worker = a2.worker || false;
  this.priority = a2.priority || 4;
  this.index = ib.call(this, a2, c2);
  this.tag = null;
  if (b3 = c2.tag) {
    if (typeof b3 === "string" && (b3 = [b3]), b3.length) {
      this.tag = /* @__PURE__ */ new Map();
      this.A = [];
      this.F = [];
      for (let d2 = 0, f2, g3; d2 < b3.length; d2++) {
        f2 = b3[d2];
        g3 = f2.field || f2;
        if (!g3)
          throw Error("The tag field from the document descriptor is undefined.");
        f2.custom ? this.A[d2] = f2.custom : (this.A[d2] = hb(g3, this.D), f2.filter && (typeof this.A[d2] === "string" && (this.A[d2] = new String(this.A[d2])), this.A[d2].G = f2.filter));
        this.F[d2] = g3;
        this.tag.set(g3, /* @__PURE__ */ new Map());
      }
    }
  }
  if (this.worker) {
    this.fastupdate = false;
    a2 = [];
    for (const d2 of this.index.values())
      d2.then && a2.push(d2);
    if (a2.length) {
      const d2 = this;
      return Promise.all(a2).then(function(f2) {
        let g3 = 0;
        for (const k2 of d2.index.entries()) {
          const h2 = k2[0];
          let l2 = k2[1];
          l2.then && (l2 = f2[g3], d2.index.set(h2, l2), g3++);
        }
        return d2;
      });
    }
  } else
    a2.db && (this.fastupdate = false, this.mount(a2.db));
}
__name(Na, "Na");
w2 = Na.prototype;
w2.mount = function(a2) {
  let c2 = this.field;
  if (this.tag)
    for (let f2 = 0, g3; f2 < this.F.length; f2++) {
      g3 = this.F[f2];
      var b3 = void 0;
      this.index.set(g3, b3 = new T2({}, this.reg));
      c2 === this.field && (c2 = c2.slice(0));
      c2.push(g3);
      b3.tag = this.tag.get(g3);
    }
  b3 = [];
  const e2 = { db: a2.db, type: a2.type, fastupdate: a2.fastupdate };
  for (let f2 = 0, g3, k2; f2 < c2.length; f2++) {
    e2.field = k2 = c2[f2];
    g3 = this.index.get(k2);
    const h2 = new a2.constructor(a2.id, e2);
    h2.id = a2.id;
    b3[f2] = h2.mount(g3);
    g3.document = true;
    f2 ? g3.bypass = true : g3.store = this.store;
  }
  const d2 = this;
  return this.db = Promise.all(b3).then(function() {
    d2.db = true;
  });
};
w2.commit = async function() {
  const a2 = [];
  for (const c2 of this.index.values())
    a2.push(c2.commit());
  await Promise.all(a2);
  this.reg.clear();
};
w2.destroy = function() {
  const a2 = [];
  for (const c2 of this.index.values())
    a2.push(c2.destroy());
  return Promise.all(a2);
};
function ib(a2, c2) {
  const b3 = /* @__PURE__ */ new Map();
  let e2 = c2.index || c2.field || c2;
  M2(e2) && (e2 = [e2]);
  for (let f2 = 0, g3, k2; f2 < e2.length; f2++) {
    g3 = e2[f2];
    M2(g3) || (k2 = g3, g3 = g3.field);
    k2 = ba(k2) ? Object.assign({}, a2, k2) : a2;
    if (this.worker) {
      var d2 = void 0;
      d2 = (d2 = k2.encoder) && d2.encode ? d2 : new ka(typeof d2 === "string" ? va[d2] : d2 || {});
      d2 = new La(k2, d2);
      b3.set(g3, d2);
    }
    this.worker || b3.set(g3, new T2(k2, this.reg));
    k2.custom ? this.B[f2] = k2.custom : (this.B[f2] = hb(g3, this.D), k2.filter && (typeof this.B[f2] === "string" && (this.B[f2] = new String(this.B[f2])), this.B[f2].G = k2.filter));
    this.field[f2] = g3;
  }
  if (this.h) {
    a2 = c2.store;
    M2(a2) && (a2 = [a2]);
    for (let f2 = 0, g3, k2; f2 < a2.length; f2++)
      g3 = a2[f2], k2 = g3.field || g3, g3.custom ? (this.h[f2] = g3.custom, g3.custom.O = k2) : (this.h[f2] = hb(k2, this.D), g3.filter && (typeof this.h[f2] === "string" && (this.h[f2] = new String(this.h[f2])), this.h[f2].G = g3.filter));
  }
  return b3;
}
__name(ib, "ib");
function hb(a2, c2) {
  const b3 = a2.split(":");
  let e2 = 0;
  for (let d2 = 0; d2 < b3.length; d2++)
    a2 = b3[d2], a2[a2.length - 1] === "]" && (a2 = a2.substring(0, a2.length - 2)) && (c2[e2] = true), a2 && (b3[e2++] = a2);
  e2 < b3.length && (b3.length = e2);
  return e2 > 1 ? b3 : b3[0];
}
__name(hb, "hb");
w2.append = function(a2, c2) {
  return this.add(a2, c2, true);
};
w2.update = function(a2, c2) {
  return this.remove(a2).add(a2, c2);
};
w2.remove = function(a2) {
  ba(a2) && (a2 = ca(a2, this.key));
  for (var c2 of this.index.values())
    c2.remove(a2, true);
  if (this.reg.has(a2)) {
    if (this.tag && !this.fastupdate)
      for (let b3 of this.tag.values())
        for (let e2 of b3) {
          c2 = e2[0];
          const d2 = e2[1], f2 = d2.indexOf(a2);
          f2 > -1 && (d2.length > 1 ? d2.splice(f2, 1) : b3.delete(c2));
        }
    this.store && this.store.delete(a2);
    this.reg.delete(a2);
  }
  this.cache && this.cache.remove(a2);
  return this;
};
w2.clear = function() {
  const a2 = [];
  for (const c2 of this.index.values()) {
    const b3 = c2.clear();
    b3.then && a2.push(b3);
  }
  if (this.tag)
    for (const c2 of this.tag.values())
      c2.clear();
  this.store && this.store.clear();
  this.cache && this.cache.clear();
  return a2.length ? Promise.all(a2) : this;
};
w2.contain = function(a2) {
  return this.db ? this.index.get(this.field[0]).db.has(a2) : this.reg.has(a2);
};
w2.cleanup = function() {
  for (const a2 of this.index.values())
    a2.cleanup();
  return this;
};
w2.get = function(a2) {
  return this.db ? this.index.get(this.field[0]).db.enrich(a2).then(function(c2) {
    return c2[0] && c2[0].doc || null;
  }) : this.store.get(a2) || null;
};
w2.set = function(a2, c2) {
  typeof a2 === "object" && (c2 = a2, a2 = ca(c2, this.key));
  this.store.set(a2, c2);
  return this;
};
w2.searchCache = la;
w2.export = jb;
w2.import = kb;
Fa(Na.prototype);
function lb(a2, c2 = 0) {
  let b3 = [], e2 = [];
  c2 && (c2 = 25e4 / c2 * 5e3 | 0);
  for (const d2 of a2.entries())
    e2.push(d2), e2.length === c2 && (b3.push(e2), e2 = []);
  e2.length && b3.push(e2);
  return b3;
}
__name(lb, "lb");
function mb(a2, c2) {
  c2 || (c2 = /* @__PURE__ */ new Map());
  for (let b3 = 0, e2; b3 < a2.length; b3++)
    e2 = a2[b3], c2.set(e2[0], e2[1]);
  return c2;
}
__name(mb, "mb");
function nb(a2, c2 = 0) {
  let b3 = [], e2 = [];
  c2 && (c2 = 25e4 / c2 * 1e3 | 0);
  for (const d2 of a2.entries())
    e2.push([d2[0], lb(d2[1])[0] || []]), e2.length === c2 && (b3.push(e2), e2 = []);
  e2.length && b3.push(e2);
  return b3;
}
__name(nb, "nb");
function ob(a2, c2) {
  c2 || (c2 = /* @__PURE__ */ new Map());
  for (let b3 = 0, e2, d2; b3 < a2.length; b3++)
    e2 = a2[b3], d2 = c2.get(e2[0]), c2.set(e2[0], mb(e2[1], d2));
  return c2;
}
__name(ob, "ob");
function pb(a2) {
  let c2 = [], b3 = [];
  for (const e2 of a2.keys())
    b3.push(e2), b3.length === 25e4 && (c2.push(b3), b3 = []);
  b3.length && c2.push(b3);
  return c2;
}
__name(pb, "pb");
function qb(a2, c2) {
  c2 || (c2 = /* @__PURE__ */ new Set());
  for (let b3 = 0; b3 < a2.length; b3++)
    c2.add(a2[b3]);
  return c2;
}
__name(qb, "qb");
function rb(a2, c2, b3, e2, d2, f2, g3 = 0) {
  const k2 = e2 && e2.constructor === Array;
  var h2 = k2 ? e2.shift() : e2;
  if (!h2)
    return this.export(a2, c2, d2, f2 + 1);
  if ((h2 = a2((c2 ? c2 + "." : "") + (g3 + 1) + "." + b3, JSON.stringify(h2))) && h2.then) {
    const l2 = this;
    return h2.then(function() {
      return rb.call(l2, a2, c2, b3, k2 ? e2 : null, d2, f2, g3 + 1);
    });
  }
  return rb.call(this, a2, c2, b3, k2 ? e2 : null, d2, f2, g3 + 1);
}
__name(rb, "rb");
function jb(a2, c2, b3 = 0, e2 = 0) {
  if (b3 < this.field.length) {
    const g3 = this.field[b3];
    if ((c2 = this.index.get(g3).export(a2, g3, b3, e2 = 1)) && c2.then) {
      const k2 = this;
      return c2.then(function() {
        return k2.export(a2, g3, b3 + 1);
      });
    }
    return this.export(a2, g3, b3 + 1);
  }
  let d2, f2;
  switch (e2) {
    case 0:
      d2 = "reg";
      f2 = pb(this.reg);
      c2 = null;
      break;
    case 1:
      d2 = "tag";
      f2 = this.tag && nb(this.tag, this.reg.size);
      c2 = null;
      break;
    case 2:
      d2 = "doc";
      f2 = this.store && lb(this.store);
      c2 = null;
      break;
    default:
      return;
  }
  return rb.call(this, a2, c2, d2, f2 || null, b3, e2);
}
__name(jb, "jb");
function kb(a2, c2) {
  var b3 = a2.split(".");
  b3[b3.length - 1] === "json" && b3.pop();
  const e2 = b3.length > 2 ? b3[0] : "";
  b3 = b3.length > 2 ? b3[2] : b3[1];
  if (this.worker && e2)
    return this.index.get(e2).import(a2);
  if (c2) {
    typeof c2 === "string" && (c2 = JSON.parse(c2));
    if (e2)
      return this.index.get(e2).import(b3, c2);
    switch (b3) {
      case "reg":
        this.fastupdate = false;
        this.reg = qb(c2, this.reg);
        for (let d2 = 0, f2; d2 < this.field.length; d2++)
          f2 = this.index.get(this.field[d2]), f2.fastupdate = false, f2.reg = this.reg;
        if (this.worker) {
          c2 = [];
          for (const d2 of this.index.values())
            c2.push(d2.import(a2));
          return Promise.all(c2);
        }
        break;
      case "tag":
        this.tag = ob(c2, this.tag);
        break;
      case "doc":
        this.store = mb(c2, this.store);
    }
  }
}
__name(kb, "kb");
function sb(a2, c2) {
  let b3 = "";
  for (const e2 of a2.entries()) {
    a2 = e2[0];
    const d2 = e2[1];
    let f2 = "";
    for (let g3 = 0, k2; g3 < d2.length; g3++) {
      k2 = d2[g3] || [""];
      let h2 = "";
      for (let l2 = 0; l2 < k2.length; l2++)
        h2 += (h2 ? "," : "") + (c2 === "string" ? '"' + k2[l2] + '"' : k2[l2]);
      h2 = "[" + h2 + "]";
      f2 += (f2 ? "," : "") + h2;
    }
    f2 = '["' + a2 + '",[' + f2 + "]]";
    b3 += (b3 ? "," : "") + f2;
  }
  return b3;
}
__name(sb, "sb");
T2.prototype.remove = function(a2, c2) {
  const b3 = this.reg.size && (this.fastupdate ? this.reg.get(a2) : this.reg.has(a2));
  if (b3) {
    if (this.fastupdate)
      for (let e2 = 0, d2, f2; e2 < b3.length; e2++) {
        if ((d2 = b3[e2]) && (f2 = d2.length))
          if (d2[f2 - 1] === a2)
            d2.pop();
          else {
            const g3 = d2.indexOf(a2);
            g3 >= 0 && d2.splice(g3, 1);
          }
      }
    else
      tb(this.map, a2), this.depth && tb(this.ctx, a2);
    c2 || this.reg.delete(a2);
  }
  this.db && (this.commit_task.push({ del: a2 }), this.M && ub(this));
  this.cache && this.cache.remove(a2);
  return this;
};
function tb(a2, c2) {
  let b3 = 0;
  var e2 = typeof c2 === "undefined";
  if (a2.constructor === Array)
    for (let d2 = 0, f2, g3, k2; d2 < a2.length; d2++) {
      if ((f2 = a2[d2]) && f2.length) {
        if (e2)
          return 1;
        g3 = f2.indexOf(c2);
        if (g3 >= 0) {
          if (f2.length > 1)
            return f2.splice(g3, 1), 1;
          delete a2[d2];
          if (b3)
            return 1;
          k2 = 1;
        } else {
          if (k2)
            return 1;
          b3++;
        }
      }
    }
  else
    for (let d2 of a2.entries())
      e2 = d2[0], tb(d2[1], c2) ? b3++ : a2.delete(e2);
  return b3;
}
__name(tb, "tb");
var vb = { memory: { resolution: 1 }, performance: { resolution: 3, fastupdate: true, context: { depth: 1, resolution: 1 } }, match: { tokenize: "forward" }, score: { resolution: 9, context: { depth: 2, resolution: 3 } } };
T2.prototype.add = function(a2, c2, b3, e2) {
  if (c2 && (a2 || a2 === 0)) {
    if (!e2 && !b3 && this.reg.has(a2))
      return this.update(a2, c2);
    e2 = this.depth;
    c2 = this.encoder.encode(c2, !e2);
    const l2 = c2.length;
    if (l2) {
      const m2 = I2(), p2 = I2(), u2 = this.resolution;
      for (let r2 = 0; r2 < l2; r2++) {
        let t2 = c2[this.rtl ? l2 - 1 - r2 : r2];
        var d2 = t2.length;
        if (d2 && (e2 || !p2[t2])) {
          var f2 = this.score ? this.score(c2, t2, r2, null, 0) : wb(u2, l2, r2), g3 = "";
          switch (this.tokenize) {
            case "tolerant":
              Y2(this, p2, t2, f2, a2, b3);
              if (d2 > 2) {
                for (let n2 = 1, q2, x3, v2, A3; n2 < d2 - 1; n2++)
                  q2 = t2.charAt(n2), x3 = t2.charAt(n2 + 1), v2 = t2.substring(0, n2) + x3, A3 = t2.substring(n2 + 2), g3 = v2 + q2 + A3, Y2(this, p2, g3, f2, a2, b3), g3 = v2 + A3, Y2(this, p2, g3, f2, a2, b3);
                Y2(this, p2, t2.substring(0, t2.length - 1), f2, a2, b3);
              }
              break;
            case "full":
              if (d2 > 2) {
                for (let n2 = 0, q2; n2 < d2; n2++)
                  for (f2 = d2; f2 > n2; f2--) {
                    g3 = t2.substring(n2, f2);
                    q2 = this.rtl ? d2 - 1 - n2 : n2;
                    var k2 = this.score ? this.score(c2, t2, r2, g3, q2) : wb(u2, l2, r2, d2, q2);
                    Y2(this, p2, g3, k2, a2, b3);
                  }
                break;
              }
            case "bidirectional":
            case "reverse":
              if (d2 > 1) {
                for (k2 = d2 - 1; k2 > 0; k2--) {
                  g3 = t2[this.rtl ? d2 - 1 - k2 : k2] + g3;
                  var h2 = this.score ? this.score(c2, t2, r2, g3, k2) : wb(u2, l2, r2, d2, k2);
                  Y2(this, p2, g3, h2, a2, b3);
                }
                g3 = "";
              }
            case "forward":
              if (d2 > 1) {
                for (k2 = 0; k2 < d2; k2++)
                  g3 += t2[this.rtl ? d2 - 1 - k2 : k2], Y2(
                    this,
                    p2,
                    g3,
                    f2,
                    a2,
                    b3
                  );
                break;
              }
            default:
              if (Y2(this, p2, t2, f2, a2, b3), e2 && l2 > 1 && r2 < l2 - 1)
                for (d2 = this.N, g3 = t2, f2 = Math.min(e2 + 1, this.rtl ? r2 + 1 : l2 - r2), k2 = 1; k2 < f2; k2++) {
                  t2 = c2[this.rtl ? l2 - 1 - r2 - k2 : r2 + k2];
                  h2 = this.bidirectional && t2 > g3;
                  const n2 = this.score ? this.score(c2, g3, r2, t2, k2 - 1) : wb(d2 + (l2 / 2 > d2 ? 0 : 1), l2, r2, f2 - 1, k2 - 1);
                  Y2(this, m2, h2 ? g3 : t2, n2, a2, b3, h2 ? t2 : g3);
                }
          }
        }
      }
      this.fastupdate || this.reg.add(a2);
    }
  }
  this.db && (this.commit_task.push(b3 ? { ins: a2 } : { del: a2 }), this.M && ub(this));
  return this;
};
function Y2(a2, c2, b3, e2, d2, f2, g3) {
  let k2, h2;
  if (!(k2 = c2[b3]) || g3 && !k2[g3]) {
    g3 ? (c2 = k2 || (c2[b3] = I2()), c2[g3] = 1, h2 = a2.ctx, (k2 = h2.get(g3)) ? h2 = k2 : h2.set(g3, h2 = a2.keystore ? new R2(a2.keystore) : /* @__PURE__ */ new Map())) : (h2 = a2.map, c2[b3] = 1);
    (k2 = h2.get(b3)) ? h2 = k2 : h2.set(b3, h2 = k2 = []);
    if (f2) {
      for (let l2 = 0, m2; l2 < k2.length; l2++)
        if ((m2 = k2[l2]) && m2.includes(d2)) {
          if (l2 <= e2)
            return;
          m2.splice(m2.indexOf(d2), 1);
          a2.fastupdate && (c2 = a2.reg.get(d2)) && c2.splice(c2.indexOf(m2), 1);
          break;
        }
    }
    h2 = h2[e2] || (h2[e2] = []);
    h2.push(d2);
    if (h2.length === 2 ** 31 - 1) {
      c2 = new xa(h2);
      if (a2.fastupdate)
        for (let l2 of a2.reg.values())
          l2.includes(h2) && (l2[l2.indexOf(h2)] = c2);
      k2[e2] = h2 = c2;
    }
    a2.fastupdate && ((e2 = a2.reg.get(d2)) ? e2.push(h2) : a2.reg.set(d2, [h2]));
  }
}
__name(Y2, "Y");
function wb(a2, c2, b3, e2, d2) {
  return b3 && a2 > 1 ? c2 + (e2 || 0) <= a2 ? b3 + (d2 || 0) : (a2 - 1) / (c2 + (e2 || 0)) * (b3 + (d2 || 0)) + 1 | 0 : 0;
}
__name(wb, "wb");
T2.prototype.search = function(a2, c2, b3) {
  b3 || (c2 || typeof a2 !== "object" ? typeof c2 === "object" && (b3 = c2, c2 = 0) : (b3 = a2, a2 = ""));
  if (b3 && b3.cache)
    return b3.cache = false, a2 = this.searchCache(a2, c2, b3), b3.cache = true, a2;
  let e2 = [], d2, f2, g3, k2 = 0, h2, l2, m2, p2, u2;
  b3 && (a2 = b3.query || a2, c2 = b3.limit || c2, k2 = b3.offset || 0, f2 = b3.context, g3 = b3.suggest, u2 = (h2 = b3.resolve) && b3.enrich, m2 = b3.boost, p2 = b3.resolution, l2 = this.db && b3.tag);
  typeof h2 === "undefined" && (h2 = this.resolve);
  f2 = this.depth && f2 !== false;
  let r2 = this.encoder.encode(a2, !f2);
  d2 = r2.length;
  c2 = c2 || (h2 ? 100 : 0);
  if (d2 === 1)
    return xb.call(
      this,
      r2[0],
      "",
      c2,
      k2,
      h2,
      u2,
      l2
    );
  if (d2 === 2 && f2 && !g3)
    return xb.call(this, r2[1], r2[0], c2, k2, h2, u2, l2);
  let t2 = I2(), n2 = 0, q2;
  f2 && (q2 = r2[0], n2 = 1);
  p2 || p2 === 0 || (p2 = q2 ? this.N : this.resolution);
  if (this.db) {
    if (this.db.search && (b3 = this.db.search(this, r2, c2, k2, g3, h2, u2, l2), b3 !== false))
      return b3;
    const x3 = this;
    return async function() {
      for (let v2, A3; n2 < d2; n2++) {
        if ((A3 = r2[n2]) && !t2[A3]) {
          t2[A3] = 1;
          v2 = await yb(x3, A3, q2, 0, 0, false, false);
          if (v2 = zb(v2, e2, g3, p2)) {
            e2 = v2;
            break;
          }
          q2 && (g3 && v2 && e2.length || (q2 = A3));
        }
        g3 && q2 && n2 === d2 - 1 && !e2.length && (p2 = x3.resolution, q2 = "", n2 = -1, t2 = I2());
      }
      return Ab(e2, p2, c2, k2, g3, m2, h2);
    }();
  }
  for (let x3, v2; n2 < d2; n2++) {
    if ((v2 = r2[n2]) && !t2[v2]) {
      t2[v2] = 1;
      x3 = yb(this, v2, q2, 0, 0, false, false);
      if (x3 = zb(x3, e2, g3, p2)) {
        e2 = x3;
        break;
      }
      q2 && (g3 && x3 && e2.length || (q2 = v2));
    }
    g3 && q2 && n2 === d2 - 1 && !e2.length && (p2 = this.resolution, q2 = "", n2 = -1, t2 = I2());
  }
  return Ab(e2, p2, c2, k2, g3, m2, h2);
};
function Ab(a2, c2, b3, e2, d2, f2, g3) {
  let k2 = a2.length, h2 = a2;
  if (k2 > 1)
    h2 = $a(a2, c2, b3, e2, d2, f2, g3);
  else if (k2 === 1)
    return g3 ? Sa.call(null, a2[0], b3, e2) : new X2(a2[0], this);
  return g3 ? h2 : new X2(h2, this);
}
__name(Ab, "Ab");
function xb(a2, c2, b3, e2, d2, f2, g3) {
  a2 = yb(this, a2, c2, b3, e2, d2, f2, g3);
  return this.db ? a2.then(function(k2) {
    return d2 ? k2 || [] : new X2(k2, this);
  }) : a2 && a2.length ? d2 ? Sa.call(this, a2, b3, e2) : new X2(a2, this) : d2 ? [] : new X2([], this);
}
__name(xb, "xb");
function zb(a2, c2, b3, e2) {
  let d2 = [];
  if (a2 && a2.length) {
    if (a2.length <= e2) {
      c2.push(a2);
      return;
    }
    for (let f2 = 0, g3; f2 < e2; f2++)
      if (g3 = a2[f2])
        d2[f2] = g3;
    if (d2.length) {
      c2.push(d2);
      return;
    }
  }
  if (!b3)
    return d2;
}
__name(zb, "zb");
function yb(a2, c2, b3, e2, d2, f2, g3, k2) {
  let h2;
  b3 && (h2 = a2.bidirectional && c2 > b3) && (h2 = b3, b3 = c2, c2 = h2);
  if (a2.db)
    return a2.db.get(c2, b3, e2, d2, f2, g3, k2);
  a2 = b3 ? (a2 = a2.ctx.get(b3)) && a2.get(c2) : a2.map.get(c2);
  return a2;
}
__name(yb, "yb");
function T2(a2, c2) {
  if (!this || this.constructor !== T2)
    return new T2(a2);
  if (a2) {
    var b3 = M2(a2) ? a2 : a2.preset;
    b3 && (a2 = Object.assign({}, vb[b3], a2));
  } else
    a2 = {};
  b3 = a2.context;
  const e2 = b3 === true ? { depth: 1 } : b3 || {}, d2 = M2(a2.encoder) ? va[a2.encoder] : a2.encode || a2.encoder || {};
  this.encoder = d2.encode ? d2 : typeof d2 === "object" ? new ka(d2) : { encode: d2 };
  this.resolution = a2.resolution || 9;
  this.tokenize = b3 = (b3 = a2.tokenize) && b3 !== "default" && b3 !== "exact" && b3 || "strict";
  this.depth = b3 === "strict" && e2.depth || 0;
  this.bidirectional = e2.bidirectional !== false;
  this.fastupdate = !!a2.fastupdate;
  this.score = a2.score || null;
  (b3 = a2.keystore || 0) && (this.keystore = b3);
  this.map = b3 ? new R2(b3) : /* @__PURE__ */ new Map();
  this.ctx = b3 ? new R2(b3) : /* @__PURE__ */ new Map();
  this.reg = c2 || (this.fastupdate ? b3 ? new R2(b3) : /* @__PURE__ */ new Map() : b3 ? new S2(b3) : /* @__PURE__ */ new Set());
  this.N = e2.resolution || 3;
  this.rtl = d2.rtl || a2.rtl || false;
  this.cache = (b3 = a2.cache || null) && new ma(b3);
  this.resolve = a2.resolve !== false;
  if (b3 = a2.db)
    this.db = this.mount(b3);
  this.M = a2.commit !== false;
  this.commit_task = [];
  this.commit_timer = null;
  this.priority = a2.priority || 4;
}
__name(T2, "T");
w2 = T2.prototype;
w2.mount = function(a2) {
  this.commit_timer && (clearTimeout(this.commit_timer), this.commit_timer = null);
  return a2.mount(this);
};
w2.commit = function() {
  this.commit_timer && (clearTimeout(this.commit_timer), this.commit_timer = null);
  return this.db.commit(this);
};
w2.destroy = function() {
  this.commit_timer && (clearTimeout(this.commit_timer), this.commit_timer = null);
  return this.db.destroy();
};
function ub(a2) {
  a2.commit_timer || (a2.commit_timer = setTimeout(function() {
    a2.commit_timer = null;
    a2.db.commit(a2);
  }, 1));
}
__name(ub, "ub");
w2.clear = function() {
  this.map.clear();
  this.ctx.clear();
  this.reg.clear();
  this.cache && this.cache.clear();
  return this.db ? (this.commit_timer && clearTimeout(this.commit_timer), this.commit_timer = null, this.commit_task = [], this.db.clear()) : this;
};
w2.append = function(a2, c2) {
  return this.add(a2, c2, true);
};
w2.contain = function(a2) {
  return this.db ? this.db.has(a2) : this.reg.has(a2);
};
w2.update = function(a2, c2) {
  const b3 = this, e2 = this.remove(a2);
  return e2 && e2.then ? e2.then(() => b3.add(a2, c2)) : this.add(a2, c2);
};
w2.cleanup = function() {
  if (!this.fastupdate)
    return this;
  tb(this.map);
  this.depth && tb(this.ctx);
  return this;
};
w2.searchCache = la;
w2.export = function(a2, c2, b3 = 0, e2 = 0) {
  let d2, f2;
  switch (e2) {
    case 0:
      d2 = "reg";
      f2 = pb(this.reg);
      break;
    case 1:
      d2 = "cfg";
      f2 = null;
      break;
    case 2:
      d2 = "map";
      f2 = lb(this.map, this.reg.size);
      break;
    case 3:
      d2 = "ctx";
      f2 = nb(this.ctx, this.reg.size);
      break;
    default:
      return;
  }
  return rb.call(this, a2, c2, d2, f2, b3, e2);
};
w2.import = function(a2, c2) {
  if (c2)
    switch (typeof c2 === "string" && (c2 = JSON.parse(c2)), a2 = a2.split("."), a2[a2.length - 1] === "json" && a2.pop(), a2.length === 3 && a2.shift(), a2 = a2.length > 1 ? a2[1] : a2[0], a2) {
      case "reg":
        this.fastupdate = false;
        this.reg = qb(c2, this.reg);
        break;
      case "map":
        this.map = mb(c2, this.map);
        break;
      case "ctx":
        this.ctx = ob(c2, this.ctx);
    }
};
w2.serialize = function(a2 = true) {
  let c2 = "", b3 = "", e2 = "";
  if (this.reg.size) {
    let f2;
    for (var d2 of this.reg.keys())
      f2 || (f2 = typeof d2), c2 += (c2 ? "," : "") + (f2 === "string" ? '"' + d2 + '"' : d2);
    c2 = "index.reg=new Set([" + c2 + "]);";
    b3 = sb(this.map, f2);
    b3 = "index.map=new Map([" + b3 + "]);";
    for (const g3 of this.ctx.entries()) {
      d2 = g3[0];
      let k2 = sb(g3[1], f2);
      k2 = "new Map([" + k2 + "])";
      k2 = '["' + d2 + '",' + k2 + "]";
      e2 += (e2 ? "," : "") + k2;
    }
    e2 = "index.ctx=new Map([" + e2 + "]);";
  }
  return a2 ? "function inject(index){" + c2 + b3 + e2 + "}" : c2 + b3 + e2;
};
Fa(T2.prototype);
var Bb = typeof window !== "undefined" && (window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB);
var Cb = ["map", "ctx", "tag", "reg", "cfg"];
var Db = I2();
function Eb(a2, c2 = {}) {
  if (!this || this.constructor !== Eb)
    return new Eb(a2, c2);
  typeof a2 === "object" && (c2 = a2, a2 = a2.name);
  a2 || console.info("Default storage space was used, because a name was not passed.");
  this.id = "flexsearch" + (a2 ? ":" + a2.toLowerCase().replace(/[^a-z0-9_\-]/g, "") : "");
  this.field = c2.field ? c2.field.toLowerCase().replace(/[^a-z0-9_\-]/g, "") : "";
  this.type = c2.type;
  this.fastupdate = this.support_tag_search = false;
  this.db = null;
  this.h = {};
}
__name(Eb, "Eb");
w2 = Eb.prototype;
w2.mount = function(a2) {
  if (a2.index)
    return a2.mount(this);
  a2.db = this;
  return this.open();
};
w2.open = function() {
  if (this.db)
    return this.db;
  let a2 = this;
  navigator.storage && navigator.storage.persist && navigator.storage.persist();
  Db[a2.id] || (Db[a2.id] = []);
  Db[a2.id].push(a2.field);
  const c2 = Bb.open(a2.id, 1);
  c2.onupgradeneeded = function() {
    const b3 = a2.db = this.result;
    for (let e2 = 0, d2; e2 < Cb.length; e2++) {
      d2 = Cb[e2];
      for (let f2 = 0, g3; f2 < Db[a2.id].length; f2++)
        g3 = Db[a2.id][f2], b3.objectStoreNames.contains(d2 + (d2 !== "reg" ? g3 ? ":" + g3 : "" : "")) || b3.createObjectStore(d2 + (d2 !== "reg" ? g3 ? ":" + g3 : "" : ""));
    }
  };
  return a2.db = Z2(c2, function(b3) {
    a2.db = b3;
    a2.db.onversionchange = function() {
      a2.close();
    };
  });
};
w2.close = function() {
  this.db && this.db.close();
  this.db = null;
};
w2.destroy = function() {
  const a2 = Bb.deleteDatabase(this.id);
  return Z2(a2);
};
w2.clear = function() {
  const a2 = [];
  for (let b3 = 0, e2; b3 < Cb.length; b3++) {
    e2 = Cb[b3];
    for (let d2 = 0, f2; d2 < Db[this.id].length; d2++)
      f2 = Db[this.id][d2], a2.push(e2 + (e2 !== "reg" ? f2 ? ":" + f2 : "" : ""));
  }
  const c2 = this.db.transaction(a2, "readwrite");
  for (let b3 = 0; b3 < a2.length; b3++)
    c2.objectStore(a2[b3]).clear();
  return Z2(c2);
};
w2.get = function(a2, c2, b3 = 0, e2 = 0, d2 = true, f2 = false) {
  a2 = this.db.transaction((c2 ? "ctx" : "map") + (this.field ? ":" + this.field : ""), "readonly").objectStore((c2 ? "ctx" : "map") + (this.field ? ":" + this.field : "")).get(c2 ? c2 + ":" + a2 : a2);
  const g3 = this;
  return Z2(a2).then(function(k2) {
    let h2 = [];
    if (!k2 || !k2.length)
      return h2;
    if (d2) {
      if (!b3 && !e2 && k2.length === 1)
        return k2[0];
      for (let l2 = 0, m2; l2 < k2.length; l2++)
        if ((m2 = k2[l2]) && m2.length) {
          if (e2 >= m2.length) {
            e2 -= m2.length;
            continue;
          }
          const p2 = b3 ? e2 + Math.min(m2.length - e2, b3) : m2.length;
          for (let u2 = e2; u2 < p2; u2++)
            h2.push(m2[u2]);
          e2 = 0;
          if (h2.length === b3)
            break;
        }
      return f2 ? g3.enrich(h2) : h2;
    }
    return k2;
  });
};
w2.tag = function(a2, c2 = 0, b3 = 0, e2 = false) {
  a2 = this.db.transaction("tag" + (this.field ? ":" + this.field : ""), "readonly").objectStore("tag" + (this.field ? ":" + this.field : "")).get(a2);
  const d2 = this;
  return Z2(a2).then(function(f2) {
    if (!f2 || !f2.length || b3 >= f2.length)
      return [];
    if (!c2 && !b3)
      return f2;
    f2 = f2.slice(b3, b3 + c2);
    return e2 ? d2.enrich(f2) : f2;
  });
};
w2.enrich = function(a2) {
  typeof a2 !== "object" && (a2 = [a2]);
  const c2 = this.db.transaction("reg", "readonly").objectStore("reg"), b3 = [];
  for (let e2 = 0; e2 < a2.length; e2++)
    b3[e2] = Z2(c2.get(a2[e2]));
  return Promise.all(b3).then(function(e2) {
    for (let d2 = 0; d2 < e2.length; d2++)
      e2[d2] = { id: a2[d2], doc: e2[d2] ? JSON.parse(e2[d2]) : null };
    return e2;
  });
};
w2.has = function(a2) {
  a2 = this.db.transaction("reg", "readonly").objectStore("reg").getKey(a2);
  return Z2(a2).then(function(c2) {
    return !!c2;
  });
};
w2.search = null;
w2.info = function() {
};
w2.transaction = function(a2, c2, b3) {
  a2 += a2 !== "reg" ? this.field ? ":" + this.field : "" : "";
  let e2 = this.h[a2 + ":" + c2];
  if (e2)
    return b3.call(this, e2);
  let d2 = this.db.transaction(a2, c2);
  this.h[a2 + ":" + c2] = e2 = d2.objectStore(a2);
  const f2 = b3.call(this, e2);
  this.h[a2 + ":" + c2] = null;
  return Z2(d2).finally(function() {
    return f2;
  });
};
w2.commit = async function(a2) {
  let c2 = a2.commit_task, b3 = [];
  a2.commit_task = [];
  for (let e2 = 0, d2; e2 < c2.length; e2++)
    d2 = c2[e2], d2.del && b3.push(d2.del);
  b3.length && await this.remove(b3);
  a2.reg.size && (await this.transaction("map", "readwrite", function(e2) {
    for (const d2 of a2.map) {
      const f2 = d2[0], g3 = d2[1];
      g3.length && (e2.get(f2).onsuccess = function() {
        let k2 = this.result;
        var h2;
        if (k2 && k2.length) {
          const l2 = Math.max(k2.length, g3.length);
          for (let m2 = 0, p2, u2; m2 < l2; m2++)
            if ((u2 = g3[m2]) && u2.length) {
              if ((p2 = k2[m2]) && p2.length)
                for (h2 = 0; h2 < u2.length; h2++)
                  p2.push(u2[h2]);
              else
                k2[m2] = u2;
              h2 = 1;
            }
        } else
          k2 = g3, h2 = 1;
        h2 && e2.put(k2, f2);
      });
    }
  }), await this.transaction("ctx", "readwrite", function(e2) {
    for (const d2 of a2.ctx) {
      const f2 = d2[0], g3 = d2[1];
      for (const k2 of g3) {
        const h2 = k2[0], l2 = k2[1];
        l2.length && (e2.get(f2 + ":" + h2).onsuccess = function() {
          let m2 = this.result;
          var p2;
          if (m2 && m2.length) {
            const u2 = Math.max(m2.length, l2.length);
            for (let r2 = 0, t2, n2; r2 < u2; r2++)
              if ((n2 = l2[r2]) && n2.length) {
                if ((t2 = m2[r2]) && t2.length)
                  for (p2 = 0; p2 < n2.length; p2++)
                    t2.push(n2[p2]);
                else
                  m2[r2] = n2;
                p2 = 1;
              }
          } else
            m2 = l2, p2 = 1;
          p2 && e2.put(m2, f2 + ":" + h2);
        });
      }
    }
  }), a2.store ? await this.transaction(
    "reg",
    "readwrite",
    function(e2) {
      for (const d2 of a2.store) {
        const f2 = d2[0], g3 = d2[1];
        e2.put(typeof g3 === "object" ? JSON.stringify(g3) : 1, f2);
      }
    }
  ) : a2.bypass || await this.transaction("reg", "readwrite", function(e2) {
    for (const d2 of a2.reg.keys())
      e2.put(1, d2);
  }), a2.tag && await this.transaction("tag", "readwrite", function(e2) {
    for (const d2 of a2.tag) {
      const f2 = d2[0], g3 = d2[1];
      g3.length && (e2.get(f2).onsuccess = function() {
        let k2 = this.result;
        k2 = k2 && k2.length ? k2.concat(g3) : g3;
        e2.put(k2, f2);
      });
    }
  }), a2.map.clear(), a2.ctx.clear(), a2.tag && a2.tag.clear(), a2.store && a2.store.clear(), a2.document || a2.reg.clear());
};
function Fb(a2, c2, b3) {
  const e2 = a2.value;
  let d2, f2 = 0;
  for (let g3 = 0, k2; g3 < e2.length; g3++) {
    if (k2 = b3 ? e2 : e2[g3]) {
      for (let h2 = 0, l2, m2; h2 < c2.length; h2++)
        if (m2 = c2[h2], l2 = k2.indexOf(m2), l2 >= 0)
          if (d2 = 1, k2.length > 1)
            k2.splice(l2, 1);
          else {
            e2[g3] = [];
            break;
          }
      f2 += k2.length;
    }
    if (b3)
      break;
  }
  f2 ? d2 && a2.update(e2) : a2.delete();
  a2.continue();
}
__name(Fb, "Fb");
w2.remove = function(a2) {
  typeof a2 !== "object" && (a2 = [a2]);
  return Promise.all([this.transaction("map", "readwrite", function(c2) {
    c2.openCursor().onsuccess = function() {
      const b3 = this.result;
      b3 && Fb(b3, a2);
    };
  }), this.transaction("ctx", "readwrite", function(c2) {
    c2.openCursor().onsuccess = function() {
      const b3 = this.result;
      b3 && Fb(b3, a2);
    };
  }), this.transaction("tag", "readwrite", function(c2) {
    c2.openCursor().onsuccess = function() {
      const b3 = this.result;
      b3 && Fb(b3, a2, true);
    };
  }), this.transaction("reg", "readwrite", function(c2) {
    for (let b3 = 0; b3 < a2.length; b3++)
      c2.delete(a2[b3]);
  })]);
};
function Z2(a2, c2) {
  return new Promise((b3, e2) => {
    a2.onsuccess = a2.oncomplete = function() {
      c2 && c2(this.result);
      c2 = null;
      b3(this.result);
    };
    a2.onerror = a2.onblocked = e2;
    a2 = null;
  });
}
__name(Z2, "Z");
var Document = Na;

// ../shopline-developer-core/dist/openapi.js
var M3 = Object.defineProperty;
var j2 = Object.defineProperties;
var T3 = Object.getOwnPropertyDescriptors;
var b2 = Object.getOwnPropertySymbols;
var B2 = Object.prototype.hasOwnProperty;
var _2 = Object.prototype.propertyIsEnumerable;
var I3 = /* @__PURE__ */ __name((p2, e2, t2) => e2 in p2 ? M3(p2, e2, { enumerable: true, configurable: true, writable: true, value: t2 }) : p2[e2] = t2, "I");
var y2 = /* @__PURE__ */ __name((p2, e2) => {
  for (var t2 in e2 || (e2 = {}))
    B2.call(e2, t2) && I3(p2, t2, e2[t2]);
  if (b2)
    for (var t2 of b2(e2))
      _2.call(e2, t2) && I3(p2, t2, e2[t2]);
  return p2;
}, "y");
var x2 = /* @__PURE__ */ __name((p2, e2) => j2(p2, T3(e2)), "x");
var R3 = { MAX_DEPTH: 50, MAX_ITERATIONS: 1e3 };
var C2 = { MIN_SCORE: 0.3, MIN_RELEVANCE: 0.6 };
var g2 = /* @__PURE__ */ __name((p2, e2 = 150) => p2 ? p2.length <= e2 ? p2 : p2.slice(0, e2) : "", "g");
var D2 = /* @__PURE__ */ __name((p2, e2) => Do(p2 || "", e2 || "") / 100, "D");
var w3 = { minScore: 0.1, fuzzyMatch: true, caseSensitive: false };
var E2 = class {
  static {
    __name(this, "E");
  }
  constructor(e2) {
    this.config = y2({}, e2), this.items = /* @__PURE__ */ new Map(), this.itemIdCounter = 0;
  }
  tokenize(e2) {
    return e2 ? e2.split(/[^a-zA-Z0-9]+/).flatMap((t2) => t2.replace(/([a-z])([A-Z])/g, "$1 $2").split(/\s+/)).filter((t2) => t2.length > 0).map((t2) => t2.toLowerCase()).filter((t2, i2, s2) => s2.indexOf(t2) === i2).filter((t2) => !["a", "an", "the", "in", "on", "at", "to", "for", "of", "by"].includes(t2)) : [];
  }
  calculatePositionScore(e2, t2) {
    return D2(e2, t2 == null ? void 0 : t2.join(" "));
  }
};
var H3 = { weights: { summary: 10, path: 8, method: 2, description: 3 }, limits: { path: 0.6 } };
var A2 = class extends E2 {
  static {
    __name(this, "A");
  }
  constructor(e2) {
    super(e2), this.index = new Document({ encode: (t2) => t2.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean), document: { id: "id", index: [{ field: "path", tokenize: "forward", resolution: 9, preset: "score" }, { field: "method", tokenize: "forward", resolution: 3, preset: "score" }, { field: "summary", tokenize: "forward", resolution: 9, preset: "score" }, { field: "description", tokenize: "forward", resolution: 3, preset: "score" }] }, tokenize: "forward", context: { resolution: this.config.fuzzyMatch ? 3 : 0, depth: this.config.fuzzyMatch ? 2 : 0, bidirectional: true }, cache: true });
  }
  indexItems(e2) {
    this.items.clear(), this.itemIdCounter = 0;
    for (let t2 of e2) {
      let i2 = String(this.itemIdCounter++);
      this.items.set(i2, t2);
      let s2 = { id: i2, path: t2.path, method: t2.method, summary: t2.summary || "", description: t2.description || "" };
      this.index.add(s2);
    }
  }
  search(e2, t2, i2 = {}) {
    if (this.indexItems(e2), !t2 && !i2.methods)
      return e2.map((n2) => ({ item: n2, score: 1, matches: [] }));
    let s2 = /* @__PURE__ */ new Map();
    if (t2) {
      let n2 = Object.keys(this.config.weights || {}), d2 = this.tokenize(t2);
      for (let o2 of n2) {
        let a2 = this.index.search(t2, { index: o2, limit: 1e3, suggest: this.config.fuzzyMatch });
        if (Array.isArray(a2) && a2.length > 0) {
          for (let c2 of a2)
            if (c2 && typeof c2 == "object" && "result" in c2) {
              let l2 = c2.result;
              for (let u2 of l2) {
                let f2 = this.items.get(u2);
                if (!f2)
                  continue;
                let m2 = String(f2[o2] || ""), h2 = this.calculatePositionScore(m2, d2);
                s2.has(u2) || s2.set(u2, { item: f2, fieldScores: /* @__PURE__ */ new Map() }), s2.get(u2).fieldScores.set(o2, h2);
              }
            }
        }
      }
    } else
      e2.forEach((n2, d2) => {
        let o2 = String(d2);
        s2.set(o2, { item: n2, fieldScores: /* @__PURE__ */ new Map() });
      });
    let r2 = Array.from(s2.entries()).map(([n2, { item: d2, fieldScores: o2 }]) => {
      let a2 = 0, c2 = [], l2 = this.tokenize(t2 || "");
      if (t2) {
        let u2 = 0;
        for (let [m2, h2] of o2.entries()) {
          if (h2 < C2.MIN_SCORE || this.config.limits[m2] && h2 < this.config.limits[m2])
            continue;
          let S3 = this.config.weights[m2];
          u2 += h2 * S3;
          let O2 = String(d2[m2] || "").toLowerCase(), k2 = l2.filter((v2) => O2.includes(v2));
          c2.push({ field: m2, matchedKeywords: k2, score: h2, weight: S3 });
        }
        let f2 = Object.values(this.config.weights).reduce((m2, h2) => m2 + h2, 0);
        a2 = u2 / f2;
      } else
        a2 = 1;
      return { item: d2, score: a2, matches: c2 };
    });
    return r2 = r2.filter((n2) => {
      let d2 = true;
      return i2.methods && i2.methods.length > 0 && (d2 = d2 && i2.methods.includes(n2.item.method.toUpperCase())), d2 && n2.score >= this.config.minScore;
    }), r2.sort((n2, d2) => d2.score - n2.score), i2.limit && i2.limit > 0 ? r2.slice(0, i2.limit) : r2;
  }
};
function z2(p2) {
  let e2 = y2(y2(y2({}, w3), H3), p2);
  return new A2(e2);
}
__name(z2, "z");
var P2 = class {
  static {
    __name(this, "P");
  }
  constructor() {
    this.handleSchemaDescription = (e2, t2 = 0, i2 = /* @__PURE__ */ new WeakSet()) => {
      if (e2 === void 0)
        return;
      if (e2 === null || typeof e2 != "object" || t2 > R3.MAX_DEPTH || i2.has(e2))
        return e2;
      i2.add(e2);
      let s2 = {};
      for (let [r2, n2] of Object.entries(e2)) {
        if (r2 === "description" && typeof n2 == "string") {
          s2[r2] = g2(n2);
          continue;
        }
        if (!(r2 === "name" || r2 === "example")) {
          if (r2 === "properties" && n2 && typeof n2 == "object" && !Array.isArray(n2)) {
            s2.properties = {};
            for (let [d2, o2] of Object.entries(n2))
              s2.properties[d2] = this.handleSchemaDescription(o2);
            continue;
          }
          if (Array.isArray(n2)) {
            s2[r2] = n2.map((d2) => this.handleSchemaDescription(d2));
            continue;
          }
          if (n2 && typeof n2 == "object") {
            s2[r2] = this.handleSchemaDescription(n2, t2 + 1, i2);
            continue;
          }
          s2[r2] = n2;
        }
      }
      return s2;
    };
    this.searchEngine = z2({ minScore: 0.1, fuzzyMatch: true, caseSensitive: false });
  }
  getIndexDataByOas(e2) {
    var r2, n2, d2, o2, a2;
    let t2 = [];
    for (let [c2, l2] of Object.entries(e2.paths || {}))
      for (let [u2, f2] of Object.entries(l2))
        if (typeof f2 == "object" && f2 !== null && u2 !== "parameters") {
          let m2 = f2, h2 = { path: c2, method: u2.toUpperCase(), description: g2(m2.description), summary: m2.summary, tags: m2.tags || [], components: e2.components };
          m2.parameters && Array.isArray(m2.parameters) && (h2.parameters = m2.parameters.map((S3) => {
            var O2;
            return { name: S3.name, in: S3.in, required: S3.required || false, type: ((O2 = S3.schema) == null ? void 0 : O2.type) || S3.type, description: g2(S3.description), schema: S3.schema };
          })), m2.requestBody && (h2.requestBody = m2.requestBody), m2.responses && (h2.responses = m2.responses), t2.push(h2);
        }
    let i2 = JSON.stringify(e2).length, s2 = { endpoints: t2, components: e2.components, info: { title: ((r2 = e2.info) == null ? void 0 : r2.title) || "Unknown API", version: ((n2 = e2.info) == null ? void 0 : n2.version) || "1.0.0", description: g2((d2 = e2.info) == null ? void 0 : d2.description), baseUrl: (a2 = (o2 = e2.servers) == null ? void 0 : o2[0]) == null ? void 0 : a2.url }, tags: e2.tags || [], lastUpdated: Date.now(), totalSize: i2, compressedSize: 0 };
    return s2.compressedSize = JSON.stringify(s2).length, s2;
  }
  getAdminRestOverview(e2) {
    return this.getIndexDataByOas(e2);
  }
  searchEndpoints(e2, t2, i2) {
    let { methods: s2, limit: r2 } = i2, n2 = this.searchEngine.search(e2.endpoints, t2 || "", { methods: s2, limit: r2 });
    return n2 = n2.map((o2) => x2(y2({}, o2), { item: { path: o2.item.path, method: o2.item.method, description: g2(o2.item.description), summary: g2(o2.item.summary), score: o2.score, matches: o2.matches } })), { results: n2.map((o2) => o2.item) };
  }
  searchAdminRestEndpoints(e2, t2, i2, s2) {
    let r2 = this.getIndexDataByOas(e2), n2 = { methods: i2, limit: s2 || 50 };
    return this.searchEndpoints(r2, t2, n2).results;
  }
  getAdminRestEndpointDetail(e2, t2, i2, s2, r2) {
    let n2 = i2.startsWith("/") ? i2 : `/${i2}`, d2 = s2.toLowerCase(), o2 = e2.paths[n2];
    if (!o2)
      return { error: "Endpoint path not found", version: t2, path: n2, method: s2.toUpperCase(), availablePaths: Object.keys(e2.paths).slice(0, 10) };
    let a2 = o2[d2];
    if (!a2)
      return { error: "HTTP method not found for this path", version: t2, path: n2, method: s2.toUpperCase(), availableMethods: Object.keys(o2).filter((l2) => l2 !== "parameters") };
    let c2 = { version: t2, path: n2, method: s2.toUpperCase(), summary: a2.summary, description: g2(a2.description), tags: a2.tags || [], components: e2.components, info: e2.info, parameters: this.extractParameters(a2.parameters), requestBody: this.extractRequestBody(a2.requestBody), responses: this.extractResponses(a2.responses, ["responseBody", "responseHeaders"]), servers: e2.servers || a2.servers || [], metadata: { hasParameters: a2.parameters && a2.parameters.length > 0, hasRequestBody: !!a2.requestBody, responseCount: Object.keys(a2.responses || {}).length } };
    if (r2 && r2.length > 0) {
      let l2 = { version: c2.version, path: c2.path, method: c2.method, summary: c2.summary, description: g2(c2.description), tags: c2.tags, components: c2.components, info: c2.info, servers: a2.servers || e2.servers || [] }, u2 = c2.parameters || [], f2 = [];
      r2.includes("pathParameters") && f2.push(...u2.filter((h2) => h2.in === "path")), r2.includes("queryParameters") && f2.push(...u2.filter((h2) => h2.in === "query")), r2.includes("headerParameters") && f2.push(...u2.filter((h2) => h2.in === "header")), l2.parameters = this.extractParameters(f2), r2.includes("requestBody") && (l2.requestBody = c2.requestBody);
      let m2 = [];
      return r2.includes("responseBody") && m2.push("responseBody"), r2.includes("responseHeaders") && m2.push("responseBody"), m2.length > 0 && (l2.responses = this.extractResponses(a2.responses, m2)), l2.metadata = c2.metadata, l2;
    }
    return c2;
  }
  extractParameters(e2 = []) {
    return e2.map((t2) => ({ name: t2.name, in: t2.in, description: g2(t2.description), required: t2.required || t2.in === "path", schema: t2.schema }));
  }
  extractRequestBody(e2) {
    var s2;
    if (!e2)
      return;
    let t2 = (s2 = e2.content["application/json"]) == null ? void 0 : s2.schema;
    return t2 ? { schema: this.handleSchemaDescription(t2) } : void 0;
  }
  extractResponses(e2, t2) {
    if (!e2)
      return {};
    let i2 = {};
    for (let [s2, r2] of Object.entries(e2)) {
      if (s2 !== "200")
        continue;
      let n2 = r2, d2 = Object.keys(n2.content || {}), o2 = {};
      for (let a2 of d2) {
        if (!n2.content)
          continue;
        let c2 = n2.content[a2];
        o2[a2] = { schema: this.handleSchemaDescription(c2.schema), examples: c2.examples || (c2.example ? { default: { value: c2.example } } : void 0) };
      }
      i2[s2] = { description: g2(n2.description), headers: n2.headers, content: t2 != null && t2.includes("responseBody") ? o2 : void 0 };
    }
    return i2;
  }
};
var CliUsageError = class extends Error {
  static {
    __name(this, "CliUsageError");
  }
  constructor(message) {
    super(message);
    this.name = "CliUsageError";
  }
};
var parseCliArgs = /* @__PURE__ */ __name((argv, options) => {
  try {
    const parsed = parseArgs({
      args: argv,
      options,
      allowPositionals: true,
      strict: true
    });
    return {
      values: parsed.values,
      positionals: parsed.positionals
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new CliUsageError(message);
  }
}, "parseCliArgs");
var getStringOption = /* @__PURE__ */ __name((values, name) => {
  const value = values[name];
  return typeof value === "string" ? value : void 0;
}, "getStringOption");
var getBooleanOption = /* @__PURE__ */ __name((values, name) => {
  return values[name] === true;
}, "getBooleanOption");
var parseCommaList = /* @__PURE__ */ __name((value) => {
  if (!value)
    return [];
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}, "parseCommaList");

// src/shared/output.ts
var defaultStreams = /* @__PURE__ */ __name(() => ({
  stdout: process.stdout,
  stderr: process.stderr
}), "defaultStreams");
var writeLine = /* @__PURE__ */ __name((stream, line = "") => {
  stream.write(`${line}
`);
}, "writeLine");
var writeJson = /* @__PURE__ */ __name((stream, value) => {
  writeLine(stream, JSON.stringify(value, null, 2));
}, "writeJson");
var errorMessage = /* @__PURE__ */ __name((error) => {
  return error instanceof Error ? error.message : String(error);
}, "errorMessage");

// src/shared/domain.ts
var DEFAULT_DOMAIN = "https://dev-mcp.myshopline.com";
var normalizeDomain = /* @__PURE__ */ __name((domain) => domain.replace(/\/+$/, ""), "normalizeDomain");
var resolveDomain = /* @__PURE__ */ __name(({ domain, env = process.env } = {}) => {
  return normalizeDomain(domain || env.ENVIRONMENT_DOMAIN || DEFAULT_DOMAIN);
}, "resolveDomain");
var gunzipAsync = promisify(gunzip);
var isGzipBuffer = /* @__PURE__ */ __name((buffer) => {
  return buffer.length >= 2 && buffer[0] === 31 && buffer[1] === 139;
}, "isGzipBuffer");
var decodeJsonBuffer = /* @__PURE__ */ __name(async (buffer, source = "") => {
  const payload = source.endsWith(".gz") || isGzipBuffer(buffer) ? await gunzipAsync(buffer) : buffer;
  try {
    return JSON.parse(payload.toString("utf8"));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse JSON from ${source || "input"}: ${message}`);
  }
}, "decodeJsonBuffer");
var readJsonFile = /* @__PURE__ */ __name(async (filePath) => {
  const buffer = await readFile(filePath);
  return decodeJsonBuffer(buffer, filePath);
}, "readJsonFile");
var fetchBuffer = /* @__PURE__ */ __name(async (url, fetcher = fetch) => {
  const response = await fetcher(url);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`.trim());
  }
  return Buffer.from(await response.arrayBuffer());
}, "fetchBuffer");
var fetchJson = /* @__PURE__ */ __name(async (url, fetcher = fetch) => {
  return decodeJsonBuffer(await fetchBuffer(url, fetcher), url);
}, "fetchJson");

// src/shared/resources.ts
var DEFAULT_AGENT_NAME = "@shoplineos/shopline-developer-skill";
var resolvePackagedVersionFile = /* @__PURE__ */ __name(({
  defaultFile,
  defaultVersion,
  version,
  label
}) => {
  const selectedVersion = version || defaultVersion || "local";
  if (!version || !defaultVersion || version === defaultVersion) {
    return { filePath: defaultFile, version: selectedVersion };
  }
  const filename = path.basename(defaultFile);
  if (!filename.includes(defaultVersion)) {
    throw new Error(
      `${label} asset path cannot be resolved because ${filename} does not include ${defaultVersion}.`
    );
  }
  return {
    filePath: path.join(path.dirname(defaultFile), filename.replace(defaultVersion, version)),
    version: selectedVersion
  };
}, "resolvePackagedVersionFile");
var readPackagedJsonFile = /* @__PURE__ */ __name(async (filePath, label, version) => {
  try {
    return await readJsonFile(filePath);
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") {
      throw new Error(`${label} asset not found for version ${version}.`);
    }
    throw error;
  }
}, "readPackagedJsonFile");
var getResources = /* @__PURE__ */ __name(async ({
  domain,
  env,
  fetcher,
  agentName = DEFAULT_AGENT_NAME
} = {}) => {
  const url = `${resolveDomain({ domain, env })}/dev/resources.json?agent=${encodeURIComponent(agentName)}`;
  return fetchJson(url, fetcher);
}, "getResources");
var selectResourceUrl = /* @__PURE__ */ __name((resource, version, label) => {
  if (!resource?.url) {
    throw new Error(`${label} resource is missing.`);
  }
  const selectedVersion = version || resource.latest || Object.keys(resource.url)[0];
  if (!selectedVersion) {
    throw new Error(`${label} version is missing.`);
  }
  const url = resource.url[selectedVersion];
  if (!url) {
    throw new Error(`${label} URL not found for version ${selectedVersion}.`);
  }
  return { version: selectedVersion, url };
}, "selectResourceUrl");
var loadOasDocument = /* @__PURE__ */ __name(async ({
  oasFile,
  version,
  domain,
  env,
  fetcher,
  defaultOasFile,
  defaultOasVersion
}) => {
  if (oasFile) {
    return {
      version: version || "local",
      data: await readJsonFile(oasFile)
    };
  }
  if (defaultOasFile) {
    const packagedFile = resolvePackagedVersionFile({
      defaultFile: defaultOasFile,
      defaultVersion: defaultOasVersion,
      version,
      label: "OAS"
    });
    return {
      version: packagedFile.version,
      data: await readPackagedJsonFile(
        packagedFile.filePath,
        "OAS",
        packagedFile.version
      )
    };
  }
  const resources = await getResources({ domain, env, fetcher });
  const selected = selectResourceUrl(resources.openapi, version, "OAS");
  return {
    version: selected.version,
    data: await fetchJson(selected.url, fetcher)
  };
}, "loadOasDocument");
var isDirectRun = /* @__PURE__ */ __name((metaUrl) => {
  return Boolean(process.argv[1] && metaUrl === pathToFileURL(process.argv[1]).href);
}, "isDirectRun");
var runCli = /* @__PURE__ */ __name((metaUrl, run) => {
  if (!isDirectRun(metaUrl))
    return;
  run().then((code) => {
    process.exitCode = code;
  }).catch((error) => {
    process.stderr.write(`${errorMessage(error)}
`);
    process.exitCode = 1;
  });
}, "runCli");

// src/skills/shopline-admin-rest/scripts/get_rest_detail.ts
var defaultAdminRestOasVersion = "v20260601";
var defaultAdminRestOasFile = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "assets",
  `openapi-${defaultAdminRestOasVersion}.json.gz`
);
var allowedSections = [
  "pathParameters",
  "queryParameters",
  "headerParameters",
  "requestBody",
  "responseBody",
  "responseHeaders"
];
var usage = /* @__PURE__ */ __name(() => {
  return [
    "Usage: get_rest_detail.mjs --path <path> --method <method> [--sections <list>] [--version <version>] [--domain <url>] [--oas-file <path>] [--json]",
    "",
    "Options:",
    "  --path <path>        REST endpoint path",
    "  --method <method>    HTTP method",
    "  --sections <list>    Comma-separated detail sections",
    "  --version <version>  OAS version to load from packaged assets",
    "  --domain <url>       Override platform domain",
    "  --oas-file <path>    Read OAS from local JSON or gzip file",
    "  --json               Print JSON result"
  ].join("\n");
}, "usage");
var parseSections = /* @__PURE__ */ __name((value) => {
  const sections = parseCommaList(value);
  if (sections.length === 0)
    return void 0;
  for (const section of sections) {
    if (!allowedSections.includes(section)) {
      throw new Error(
        `Unknown section: ${section}. Allowed sections: ${allowedSections.join(", ")}`
      );
    }
  }
  return sections;
}, "parseSections");
var formatDetail = /* @__PURE__ */ __name((detail) => {
  const lines = [`${detail.method} ${detail.path}`];
  if (detail.summary)
    lines.push(`Summary: ${detail.summary}`);
  if (detail.description)
    lines.push(`Description: ${detail.description}`);
  if (detail.tags.length > 0)
    lines.push(`Tags: ${detail.tags.join(", ")}`);
  if (detail.parameters.length > 0) {
    lines.push("Parameters:");
    detail.parameters.forEach((parameter) => {
      lines.push(`- ${parameter.name} (${parameter.in}${parameter.required ? ", required" : ""})`);
    });
  }
  if (detail.requestBody) {
    lines.push("Request body:");
    lines.push(JSON.stringify(detail.requestBody.schema || detail.requestBody, null, 2));
  }
  if (detail.responses) {
    lines.push("Responses:");
    Object.entries(detail.responses).forEach(([status, response]) => {
      lines.push(`- ${status}: ${response.description || "No description"}`);
    });
  }
  return lines;
}, "formatDetail");
var runGetRestDetailCli = /* @__PURE__ */ __name(async ({
  argv = process.argv.slice(2),
  env = process.env,
  streams = defaultStreams(),
  fetcher = fetch
} = {}) => {
  try {
    const { values } = parseCliArgs(argv, {
      path: { type: "string" },
      method: { type: "string" },
      sections: { type: "string" },
      version: { type: "string" },
      domain: { type: "string" },
      "oas-file": { type: "string" },
      json: { type: "boolean" },
      help: { type: "boolean", short: "h" }
    });
    if (getBooleanOption(values, "help")) {
      writeLine(streams.stdout, usage());
      return 0;
    }
    const endpointPath = getStringOption(values, "path");
    const method = getStringOption(values, "method");
    if (!endpointPath)
      throw new Error("--path is required.");
    if (!method)
      throw new Error("--method is required.");
    const loadedOas = await loadOasDocument({
      oasFile: getStringOption(values, "oas-file"),
      version: getStringOption(values, "version"),
      defaultOasFile: defaultAdminRestOasFile,
      defaultOasVersion: defaultAdminRestOasVersion,
      domain: getStringOption(values, "domain"),
      env,
      fetcher
    });
    const detail = new P2().getAdminRestEndpointDetail(
      loadedOas.data,
      loadedOas.version,
      endpointPath,
      method,
      parseSections(getStringOption(values, "sections"))
    );
    if (getBooleanOption(values, "json")) {
      writeJson(streams.stdout, detail);
    } else if ("error" in detail) {
      writeLine(
        streams.stdout,
        `${detail.error}: ${detail.method || method} ${detail.path || endpointPath}`
      );
    } else {
      formatDetail(detail).forEach((line) => writeLine(streams.stdout, line));
    }
    return "error" in detail ? 1 : 0;
  } catch (error) {
    writeLine(streams.stderr, errorMessage(error));
    writeLine(streams.stderr, usage());
    return 1;
  }
}, "runGetRestDetailCli");
runCli(import.meta.url, () => runGetRestDetailCli());

export { runGetRestDetailCli };

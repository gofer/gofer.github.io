function toString(x) {
  if (typeof x === 'string') {
    return '"' + x + '"';
  } else if (x instanceof Array) {
    return '[' + x.map(toString).join(', ') + ']';
  } else if (x instanceof Set) {
    return '{' + Array.from(x).map(toString).join(', ') + '}';
  } else if (x instanceof Map) {
    var string_array = [];
    x.forEach((v, k) => string_array.push( toString(k) + ': ' + toString(v) ));
    return '{' + string_array.join(', ') + '}';
  } else {
    return x.toString();
  }
}

let _InitialCompare = (x, y) => x === y;

function arrayEquals(lhs, rhs, compare=_InitialCompare) {
  if (!(lhs instanceof Array))   { return false; }
  if (!(rhs instanceof Array))   { return false; }
  if (lhs.length !== rhs.length) { return false; }
  
  for (var index = 0; index < this.length; ++index) {
    if (!compare(lhs[index], rhs[index])) { return false; }
  }
  return true;
}

Array.prototype.equals = 
  function(rhs, compare=_InitialCompare) { 
    return arrayEquals(Array.from(this), rhs, compare);
  }

function setEquals(lhs, rhs) {
  if (!(lhs instanceof Set)) { return false; }
  if (!(rhs instanceof Set)) { return false; }
  if (lhs.size !== rhs.size) { return false; }
  
  for (var val of lhs.values()) {
    if (!rhs.has(val)) { return false; }
  }
  return true;
}

Set.prototype.equals = 
  function(rhs, compare=_InitialCompare) { 
    return setEquals(new Set(this), rhs, compare);
  }

function mapEquals(lhs, rhs) {
  if (!(lhs instanceof Map)) { return false; }
  if (!(rhs instanceof Map)) { return false; }
  if (lhs.size !== rhs.size) { return false; }
  
  for (var key of lhs.keys()) {
    let _lhs = lhs.get(key), _rhs = rhs.get(key);
    
    if ((_lhs instanceof Set) && (_rhs instanceof Set)) {
      if (!_lhs.equals(_rhs)) { return false; }
    } else if ((_lhs instanceof Map) && (_rhs instanceof Map)) {
      if (!mapEquals(_lhs, _rhs)) { return false; }
    } else {
      if (_lhs !== _rhs) { return false; }
    }
  }
  return true;
}

function setUnion(lhs, rhs) {
  var set = new Set(lhs.size >= rhs.size ? lhs : rhs);
  for (var val of (lhs.size >= rhs.size ? rhs : lhs).values()) {
    set.add(val);
  }
  return set;
}

Array.prototype.take = function(pred) {
  var array = new Array();
  for (let i = 0; i < this.length; ++i) {
    if (!pred(this[i])) { break; }
    array.push(this[i]);
  }
  return array;
};

Array.prototype.skip = function(pred) {
  var array = Array.from(this);
  for (let i = 0; i < this.length; ++i) {
    if (!pred(this[i])) { break; }
    array.shift();
  }
  return array;
};

Array.prototype.zipWith = function(array) {
  if (array.length != this.length) {
    throw new Error('Array length mismatch.');
  }
  
  var _array = Array.from(this);
  var _result = [];
  for (var i = 0; i < this.length; ++i) {
    _result[i] = [_array[i], array[i]];
  }
  return _result;
}
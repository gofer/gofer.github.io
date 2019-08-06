function array_split2(array, min_length = 1) {
  var _array = new Array();
  for (var i = min_length; i <= array.length - min_length; ++i) {
    _array.push(
      Array.from([array.slice(0, i), array.slice(i, array.length)])
    );
  }
  return _array;
}

function array_split3(array, min_length = 1) {
  var _array = new Array();
  for (var i = min_length; i <= array.length - min_length; ++i) {
    for (var j = i + min_length; j <= array.length - min_length; ++j) {
      _array.push(
        Array.from([
          array.slice(0, i), 
          array.slice(i, j), 
          array.slice(j, array.length)
        ])
      );
    }
  }
  return _array;
}

let isUpper = (c) => c !== c.toLowerCase() && c === c.toUpperCase();
let isLower = (c) => c === c.toLowerCase() && c !== c.toUpperCase();

let isTerminal = (s) => !isUpper(s[0]);

let ruleToString = ([x, xs]) => x + ' → ' + (xs.length == 0 ? 'ε' : xs.join(' '));

let is_nullable = (nullable, ts) => ts.map((t) => nullable.get(t)).reduce((p, q) => p && q, true);

let get_first = function(nullable, first, ts) {
  var ts1 = ts.take((t) => nullable.get(t));
  var ts2 = ts.skip((t) => nullable.get(t));
  
  var first_set = ts1.map((t) => first.get(t)).reduce(setUnion, new Set())
  if (ts2.length > 0) {
    first_set = setUnion(first_set, first.get(ts2[0]));
  }
  
  return first_set;
}

function calc_nullable(rules, non_terminal_symbols, terminal_symbols) {
  let nullable = new Map();
  non_terminal_symbols.forEach((s) => nullable.set(s, false));
      terminal_symbols.forEach((s) => nullable.set(s, false));
  
  function do_calc_nullable(nullable) {
    let _nullable = new Map(nullable);
    
    let nullable_pred = ([s, ts]) => 
      (ts.length == 0) 
      ||
      (ts.length === 1 && ts[0] === 'ε')
      ||
      (ts.filter((t) => !(nullable.get(t) === true)).length === 0);
    
    rules.filter(nullable_pred).forEach(([s, ts]) => _nullable.set(s, true));
    
    return _nullable;
  }
  
  var _nullable = do_calc_nullable(nullable);
  while (true)  {
    if (mapEquals(_nullable, nullable)) { break; }
    
    nullable = _nullable;
    
    _nullable = do_calc_nullable(nullable);
  }
  return nullable;
}

function calc_first(rules, non_terminal_symbols, terminal_symbols, nullable) {
  let first = new Map();
  non_terminal_symbols.forEach((s) => first.set(s, new Set()));
      terminal_symbols.forEach((s) => first.set(s, new Set([s])));
  
  function do_calc_first(first) {
    let _first = new Map(first);
    
    rules
      .map(([s, ts]) => 
        [
          s, 
          [
            ts.take((t) => nullable.get(t)),
            ts.skip((t) => nullable.get(t))
          ]
        ] )
      .map(([s, [ts1, ts2]]) => 
        [
          s,
          setUnion(
            ts1.map((t) => first.get(t)).reduce(setUnion, new Set()),
            ts2.length > 0 ? first.get(ts2[0]) : new Set()
          )
        ] )
      .forEach(([s, set]) => 
        _first.set(s, setUnion(_first.get(s), set))
      );
    
    return _first;
  }
  
  var _first = do_calc_first(first);
  while (true)  {
    if (mapEquals(_first, first)) { break; }
    
    first = _first;
    
    _first = do_calc_first(first);
  }
  return first;
}

function calc_follow(rules, non_terminal_symbols, terminal_symbols, nullable, first) {
  let follow = new Map();
  non_terminal_symbols.forEach((s) => follow.set(s, new Set()));
      terminal_symbols.forEach((s) => follow.set(s, new Set()));
  
  function do_calc_follow(follow) {
    let _follow = new Map(follow);

    rules
      .map( ([s, ts]) => 
        array_split2(ts, 0)
          .filter((tss) => tss.length === 2)
          .map((tss) => [s, tss])
        )
      .flat(1)
      .filter(([s, [ts1, ts2]]) => (ts1.length > 0))
      .filter(([s, [ts1, ts2]]) => is_nullable(nullable, ts2))
      .map( ([s, [ts1, ts2]]) => 
        [
          ts1[ts1.length - 1], 
          setUnion(
            follow.get(s), 
            follow.get(ts1[ts1.length - 1])
          )
        ] )
      .forEach( ([s, set]) => 
        _follow.set(
          s, 
          setUnion(_follow.get(s), set)
        )
      );
    
    rules
      .map( ([s, ts]) => 
        array_split3(ts, 0)
          .filter((ts) => ts.length === 3)
      )
      .flat(1)
      .filter( ([ts1, ts2, ts3]) => (ts1.length > 0) && (ts3.length > 0) )
      .filter( ([ts1, ts2, ts3]) => 
        (ts2.length == 0) 
        || 
        (ts2.map((t) => nullable.get(t)).reduce((p, q) => p && q, true))
      )
      .map( ([ts1, ts2, ts3]) => 
        [ts1[ts1.length - 1], ts3[0]]
      )
      .map( ([t1, t2]) => 
        [t1, t2, _follow.get(t1), first.get(t2)]
      )
      .map( ([t1, t2, s1, s2]) => 
        [t1, setUnion(s1, s2)]
      )
      .forEach( ([s, set]) => 
        _follow.set(
          s, 
          setUnion(_follow.get(s), set)
        )
      );
    
    return _follow;
  }
  
  var _follow = do_calc_follow(follow);
  while (true)  {
    if (mapEquals(_follow, follow)) { break; }
    
    follow = _follow;
    
    _follow = do_calc_follow(follow);
  }
  return follow;
}

function build_parsing_table(rules, non_terminal_symbols, terminal_symbols, nullable, first, follow) {
  var table = new Map();
  
  for (var p of non_terminal_symbols) {
    table.set(p, new Map)
    for (var q of terminal_symbols) {
      table.get(p).set(q, new Set());
    }
  }
  
  rules
    .map( ([s, ts]) => 
        [[s, ts], get_first(nullable, first, ts)]
      )
    .forEach( ([[s, ts], first_set]) =>
        Array.from(first_set).forEach(
          (t) => table.get(s).get(t).add( ruleToString([s, ts]) )
        )
      )
  
  rules
    .filter( ([s, ts]) => is_nullable(nullable, ts) )
    .forEach( ([s, ts]) => 
        Array.from(follow.get(s))
          .forEach( (t) => 
              table.get(s).get(t).add( ruleToString([s, ts]) )
            )
      )
  
  return table;
}

function parsing_table_to_html(non_terminal_symbols, terminal_symbols, table) {
  let html_table = '<table>';
  html_table += '<thead><tr><th>\\</th>';
  for (var q of terminal_symbols) {
    html_table += '<th><pre><code>' + q + '</code></pre></th>';
  }
  html_table += '</tr></thead><tbody>';
  for (var p of non_terminal_symbols) {
    html_table += '<tr><td><pre><code>' + p + '</code></pre></td>';
    for (var q of terminal_symbols) {
      html_table += '<td><pre><code>' + Array.from(table.get(p).get(q)).join("\n") + '</code></pre></td>';
    }
    html_table += '</tr>';
  }
  html_table += '</tbody></table>';
  return html_table;
}

function do_parse() {
  let rules = document.getElementById('grammer').value.split("\n")
    .filter((line) => !line.startsWith(';'))
    .filter((line) => line.trim().length > 0)
    .map((line) => line.split('->').map((str) => str.trim()))
    .filter((ls) => ls.length >= 2)
    .map((ls) => [ls.shift(), ls.join(' -> ')])
    .map(([s, ts]) => [s, ts.split('|').map((t) => t.trim())])
    .map(([s, tss]) => tss.map((ts) => [s, ts])).flat(1)
    .map(([s, ts]) => [s, ts.trim().split(' ')])
    .map(([s, ts]) => [s, ts.filter((t) => t !== 'ε' && t !== '')]);
  
  let     terminal_symbols = new Set(),
      non_terminal_symbols = new Set();
  rules.flat(3).filter((s) => s.length > 0).forEach(
    (s) => isTerminal(s) 
      ?     terminal_symbols.add(s) 
      : non_terminal_symbols.add(s)
  );
  
  let nullable = calc_nullable(rules, non_terminal_symbols, terminal_symbols);
  
  let first = calc_first(rules, non_terminal_symbols, terminal_symbols, nullable);
  
  let follow = calc_follow(rules, non_terminal_symbols, terminal_symbols, nullable, first);
  
  let table = build_parsing_table(rules, non_terminal_symbols, terminal_symbols, nullable, first, follow);
  
  document.getElementById('parsing_table').innerHTML = parsing_table_to_html(non_terminal_symbols, terminal_symbols, table);
  
  document.getElementById('result').value = 
    [
      'Rules = ',
      'Terminal Symbols = ',
      'Non Terminal Symbols = ',
      'Nullable = ',
      'First = ',
      'Follow = ',
      'Parsing Table = '
    ].zipWith(
      [
        rules.map(ruleToString), 
        terminal_symbols, 
        non_terminal_symbols,
        nullable,
        first,
        follow,
        table
      ].map(toString)
    )
    .map(([s, t]) => s + t)
    .join("\n");
}
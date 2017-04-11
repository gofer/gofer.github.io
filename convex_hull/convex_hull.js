function getRandomInt(min, max)
{
  var width = max - min;
  return Math.floor(Math.random() * (width + 1)) + min;
}

function generatePoints(num_of_points)
{
  var points = [];
  
  for (var i = 0; i < num_of_points; ++i) {
    points.push({
      x: getRandomInt(20, 780), 
      y: getRandomInt(20, 580)
    });
  }

  points = points.sort(function(p, q){
    return (q.y == p.y) ? (q.x - p.x) : (q.y - p.y);
  });
  
  return points;
}

function drawCircle(context, x, y, radius, fill)
{
  context.beginPath();
  context.arc(x, y, radius, 0, 360);
  if (fill) context.fill();
  context.stroke();
}

function drawPoint(context, x, y)
{
  context.fillStyle = 'white';
  drawCircle(context, x, y, 4, true);
}

function drawCurrentPoint(context, x, y)
{
  context.fillStyle = 'red';
  drawCircle(context, x, y, 4, true);
}

function drawLine(context, sx, sy, dx, dy)
{
  context.beginPath();
  context.moveTo(sx, sy);
  context.lineTo(dx, dy);
  context.stroke();
}

function drawLine(context, s, d)
{
  context.beginPath();
  context.moveTo(s.x, s.y);
  context.lineTo(d.x, d.y);
  context.stroke();
}

function draw(canvas, context, points, L)
{
  context.fillStyle = 'white';
  context.fillRect(0, 0, canvas.width, canvas.height);

  for (var i = 0; i < L.length - 1; ++i) {
    drawLine(context, L[i], L[i + 1]);
  }
  drawLine(context, L[L.length - 1], L[0]);

  for (var i = 0; i < points.length; ++i) {
    drawPoint(context, points[i].x, points[i].y);
  }

  drawCurrentPoint(context, points[0].x, points[0].y);
}

function outer_product(v1, v2)
{
  return v1.x * v2.y - v1.y * v2.x;
}

function distance_pow2(v)
{
  return v.x * v.x + v.y * v.y;
}

function subtract_point(p, q)
{
  return {x: p.x - q.x, y: p.y - q.y};
}

function equal_point(p, q)
{
  return p.x == q.x && p.y == q.y;
}

function algorithm(context, points)
{
  var A = points[0];
  var L = [];

  do {
    L.push(A);
    var B = points[0];

    for (var i = 0; i < points.length; ++i) {
      var C = points[i];

      if (equal_point(B, A)) {
        B = C;
      } else {
        var AB = subtract_point(B, A);
        var AC = subtract_point(C, A);
        var dAB = distance_pow2(AB);
        var dAC = distance_pow2(AC);
        var v = outer_product(AB, AC);

        if (v > 0 || (v == 0 && dAC > dAB)) {
          B = C;
        }
      }
    }

    A = B;
  } while(!equal_point(A, points[0]));

  return L;
}

function main()
{
  var canvas = document.getElementById('canvas');
  if (!canvas) return false;

  canvas.width  = width;
  canvas.height = height;

  var context = canvas.getContext('2d');
  if (!context) return false;

  var num_of_points = document.getElementById('number').value;
  var points = generatePoints(num_of_points);

  var L = algorithm(context, points);

  draw(canvas, context, points, L);

  return true;
}

const CanvasWidth  = 800;
const CanvasHeight = 600;
const CanvasMargin = 20;
const PointRadius = 5;
const AnimationWaitForNextPoint = 50;
const AnimationWaitForNextLine  = 100;

var points = [];
var lines  = [];
var finish = false;

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
      x: getRandomInt(CanvasMargin, CanvasWidth  - CanvasMargin), 
      y: getRandomInt(CanvasMargin, CanvasHeight - CanvasMargin)
    });
  }
  
  points = points.sort(function(p, q){
    return (q.y == p.y) ? (q.x - p.x) : (q.y - p.y);
  });
  
  return points;
}

function drawPoint(context, x, y, radius, bg_color = 'white', fg_color = 'black')
{
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2, false);
  context.fillStyle = bg_color;
  context.fill();
  
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2, false);
  context.strokeStyle = fg_color;
  context.stroke();
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

function draw(points, lines)
{
  var canvas = document.getElementById('canvas');
  if (!canvas) return false;
  
  canvas.width  = CanvasWidth;
  canvas.height = CanvasHeight;
  
  var context = canvas.getContext('2d');
  if (!context) return false;
  
  context.fillStyle = 'white';
  context.fillRect(0, 0, canvas.width, canvas.height);
  
  if (lines.length > 1) {
    for (var i = 0; i < lines.length - 1; ++i) {
      drawLine(context, lines[i], lines[i + 1]);
    }
    if (finish) {
      drawLine(context, lines[lines.length - 1], lines[0]);
    }
  }
  
  for (var i = 0; i < points.length; ++i) {
    drawPoint(context, points[i].x, points[i].y, PointRadius);
  }
  
  if (lines.length > 1) {
    for (var i = 0; i < lines.length; ++i) {
      drawPoint(context, lines[i].x, lines[i].y, PointRadius, 'blue');
    }
  }
  
  drawPoint(context, points[0].x, points[0].y, PointRadius, 'red');
}

function doInitialize()
{
  var num_of_points = document.getElementById('number').value;
  
  points = generatePoints(num_of_points);
  lines  = [points[0]];
  finish = false;
  
  draw(points, lines);
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

function satisfyNextLineTo(A, B, C)
{
  var AB = subtract_point(B, A);
  var AC = subtract_point(C, A);
  var dAB = distance_pow2(AB);
  var dAC = distance_pow2(AC);
  var v = outer_product(AB, AC);
  
  return (v > 0 || (v == 0 && dAC > dAB));
}

var animation_object = {
  index: 0,
  A: null,
  B: null,
  full_animation: false
};

function getNextLineToStep()
{
  var drawed_lines = lines.slice();
  drawed_lines.push(points[animation_object.index]);
  //drawed_lines.push(animation_object.B);
  draw(points, drawed_lines);
  
  if (satisfyNextLineTo(animation_object.A, animation_object.B, points[animation_object.index])) {
    animation_object.B = points[animation_object.index];
  }
  
  animation_object.index++;
  if (animation_object.index < points.length) {
    setTimeout(getNextLineToStep, AnimationWaitForNextPoint);
  } else {
    lines.push(animation_object.B);
    
    draw(points, lines);
    
    if (equal_point(animation_object.B, points[0])) {
      finish = true;
      enableController(true);
    } else if(animation_object.full_animation) {
      setTimeout(do1StepWithAnimation, AnimationWaitForNextLine);
    } else {
      enableController(true);
    }
  }
}

function enableController(flag)
{
  [
    'number', 
    'one-step-button',
    'all-step-button',
    'initialize-button',
    'draw-search-line-checkbox'
  ].forEach((id) => {
    document.getElementById(id).disabled = flag ? '' : 'disabled';
  });
}

function do1StepWithAnimation()
{
  enableController(false);
  
  if (finish) { return lines; }
  
  animation_object.index = 0;
  animation_object.A = lines[lines.length - 1];
  animation_object.B = points[0];
  
  setTimeout(getNextLineToStep, AnimationWaitForNextPoint);
}

function doAllStepWithAnimation()
{
  animation_object.full_animation = true;
  setTimeout(do1StepWithAnimation, AnimationWaitForNextLine);
}

function getNextLineTo(points, lines)
{
  if (finish) { return lines; }
  
  var A = lines[lines.length - 1];
  var B = points[0];
  
  for (var i = 0; i < points.length; ++i) {
    if (satisfyNextLineTo(A, B, points[i])) {
      B = points[i];
    }
  }
  
  lines.push(B);
  
  if (equal_point(B, points[0])) {
    finish = true;
  }
  
  return lines;
}

function do1StepStatic()
{
  lines = getNextLineTo(points, lines);
  draw(points, lines);
}

function do1Step()
{
  if (document.getElementById('draw-search-line-checkbox').checked) {
    do1StepWithAnimation();
  } else {
    do1StepStatic();
  }
}

function doAllStepStatic()
{
  enableController(false);
  
  do1Step();
  
  if(!finish) {
    setTimeout(doAllStep, AnimationWaitForNextLine);
  } else {
    enableController(true);
  }
}

function doAllStep()
{
  if (document.getElementById('draw-search-line-checkbox').checked) {
    doAllStepWithAnimation();
  } else {
    doAllStepStatic();
  }
}
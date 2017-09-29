const CanvasWidth  = 800;
const CanvasHeight = 600;
const PointRadius = 5;
const AnimationWait = 100;
const InitialNumberOfSamples  = 40;
const InitialNumberOfClusters = 4;
const ColorOfClusters = [
  '#D7000F', '#F3E100', '#009140', '#0062AC',
  '#E48E00', '#00958D', '#1B1C80', '#D60077', 
  '#86B81B', '#0097DB', '#8A017C', '#D7004A'
];

var samples = null;
var means = null;

function getRandomInt(min, max) {
  return Math.floor( Math.random() * (max - min + 1) ) + min;
}

function getRandomPosition() {
  return {
    x: getRandomInt(PointRadius, CanvasWidth  - PointRadius),
    y: getRandomInt(PointRadius, CanvasHeight - PointRadius)
  };
}

function generateSamples(number_of_samples, number_of_clusters) {
  var samples = new Array(number_of_samples);
  for (let i = 0; i < number_of_samples; ++i) {
    let position = getRandomPosition();
    samples[i] = {
      position: position, 
      cluster: i % number_of_clusters
    };
  }
  return samples;
}

function drawPoint(context, position, bg_color='white', fg_color='black') {
  context.beginPath();
  context.fillStyle = bg_color;
  context.arc(position.x, position.y, PointRadius - 1, 0, Math.PI * 2, false);
  context.fill();
  
  context.beginPath();
  context.strokeStyle = fg_color;
  context.arc(position.x, position.y, PointRadius, 0, Math.PI * 2, false);
  context.stroke();
}

function drawLine(context, sample_position, mean_position, fg_color='black')
{
  context.beginPath();
  context.strokeStyle = fg_color;
  context.moveTo(sample_position.x, sample_position.y);
  context.lineTo(mean_position.x, mean_position.y);
  context.stroke();
}

function draw(samples, number_of_samples, number_of_clusters, means = null) {
  var canvas = document.getElementById('canvas');
  if (!canvas || !canvas.getContext) { 
    alert('このブラウザはcanvasをサポートしていません。');
    return false;
  }
  
  canvas.width  = CanvasWidth;
  canvas.height = CanvasHeight;
  
  var context = canvas.getContext('2d');
  
  context.beginPath();
  context.fillStyle = 'white';
  context.fillRect(0, 0, CanvasWidth, CanvasHeight);
  
  var draw_line_flag = document.getElementById('drwa-line-checkbox').checked;
  if (means && draw_line_flag) {
    samples.forEach(
      (sample, index) => {
        drawLine(
          context, 
          sample.position, means[sample.cluster], 
          ColorOfClusters[sample.cluster]
        )
      }
    );
  }
  
  samples.forEach(
    (sample, index) => {
      drawPoint(
        context, sample.position, 
        ColorOfClusters[sample.cluster]
      );
    }
  );
  
  if (means) {
    for (let i = 0; i < number_of_clusters; ++i) {
      drawPoint(
        context, means[i], 
        'white', ColorOfClusters[i]
      );
    }
  }
}

function doInitialize() {
  var number_of_samples  = document.getElementById('number-of-samples').value;
  var number_of_clusters = document.getElementById('number-of-clusters').value;
  samples = generateSamples(number_of_samples, number_of_clusters);
  draw(samples, number_of_samples, number_of_clusters);
  return false;
}

function calculateMeansOfCluster(samples, index) {
  let samples_in_cluster = samples.filter((sample) => { return sample.cluster == index; });
  
  var sum_of_position = samples_in_cluster.reduce(
    (total, sample) => { 
      return {
        x: total.x + sample.position.x,
        y: total.y + sample.position.y
      };
    }, 
    {x: 0, y: 0}
  );
  
  return {
    x: sum_of_position.x / samples_in_cluster.length,
    y: sum_of_position.y / samples_in_cluster.length
  };
}

function distance(x1, y1, x2, y2) {
  return (x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2);
}

function nearestCluster(sample, means) {
  return means.map((mean, index) => {
    return {
      distance: distance(sample.position.x, sample.position.y, mean.x, mean.y),
      index: index
    };
  }).sort((lhs, rhs) => {
    return lhs.distance - rhs.distance;
  })[0].index;
}

function reselectNearestCluster(samples, means) {
  var flag = false;
  var new_samples = samples.map((sample) => {
    let new_cluster = nearestCluster(sample, means);
    if (sample.cluster != new_cluster) { flag = true; }
    return {position: sample.position, cluster: new_cluster};
  });
  return {flag: flag, samples: new_samples};
}

function doCalculate() {
  var number_of_samples  = document.getElementById('number-of-samples').value;
  var number_of_clusters = document.getElementById('number-of-clusters').value;
  
  means = [];
  for (let index = 0; index < number_of_clusters; ++index) {
    means[index] = calculateMeansOfCluster(samples, index);
  }
  
  var result = reselectNearestCluster(samples, means);
  samples = result.samples;
  
  draw(samples, number_of_samples, number_of_clusters, means);
  
  return result.flag;
}

function enableController(flag) {
  [
    'number-of-samples', 
    'number-of-clusters', 
    'initialize-button', 
    'calculate-1step-button', 
    'calculate-animate-button'
  ].forEach((id) => {
    document.getElementById(id).disabled = flag ? '' : 'disabled';
  });
}

function doAnimate() {
  enableController(false);
  
  var result = doCalculate();
  if (result) {
    setTimeout(doAnimate, AnimationWait);
  } else {
    enableController(true);
  }
}

function doRedraw() {
  var number_of_samples  = document.getElementById('number-of-samples').value;
  var number_of_clusters = document.getElementById('number-of-clusters').value;
  
  draw(samples, number_of_samples, number_of_clusters, means);
}
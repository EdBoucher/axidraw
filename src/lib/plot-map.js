import getProjection from './get-projection';
import {optimizeOrder} from './optimize-lines';
import loadLines from './load-lines';
import mergeLines from './merge-lines';
import simplifyLines from './simplify-lines';
import cropLines from './crop-lines-by-circle';
import getCircle from './get-circle';
import {move, scale, scaleAndMove} from './scale-move';
import {logoCoords} from '../assets/ubilabs-logo'
import convertTextToCoords from './convert-text-to-coords';
import Plotter from './plot-coords';

const PAPER_SIZE = {
  width: 496,
  height: 700
};

const paperBounds = [
  [0, 0],
  [PAPER_SIZE.width, 0],
  [PAPER_SIZE.width, PAPER_SIZE.height],
  [0, PAPER_SIZE.height],
  [0, 0]
];

const CIRCLE_OFFSET = {
  x: 100 / 2,
  y: 30
};

let plotter = null;

export default async function plotLines(options) {

  const coords = [];

  const project = getProjection(options);
  const circle = {
    center: [options.width / 2, options.height /  2],
    radius: options.height / 2 - 4
  };

  const scaledLogo = scaleAndMove(logoCoords, {scale: 0.25, x: 200, y: 640})

  const text = options.label || 'UBILABS';
  const textCoords = await convertTextToCoords(text, {
    x: PAPER_SIZE.width / 2,
    y: 500,
    fontSize: 40,
    anchor: 'center middle'
  });

  const circles = [
    getCircle(circle.radius, 180, circle.center[0], circle.center[1]),
    getCircle(circle.radius + 5, 180, circle.center[0], circle.center[1]),
    getCircle(circle.radius + 5.5, 180, circle.center[0], circle.center[1]),
    getCircle(circle.radius + 6, 180, circle.center[0], circle.center[1])
  ];

  const movedCircles = move(circles, CIRCLE_OFFSET);

  if (!plotter) {
    plotter = new Plotter();
  }

  plotter.coords = [
    ...textCoords,
    ...scaledLogo,
    ...movedCircles
  ];

  const mapPaths = await loadLines(options);
  const projectedPaths = mapPaths.map(line => line.map(project));
  const croppedPaths = cropLines(projectedPaths, circle.center, circle.radius);
  const sortedMapPaths = optimizeOrder(croppedPaths);
  const mergedMapPaths = mergeLines(sortedMapPaths);
  const simplifiedPaths = simplifyLines(mergedMapPaths);

  const centeredMap = move(simplifiedPaths, CIRCLE_OFFSET)

  coords.push(
    ...movedCircles,
    ...textCoords,
    ...centeredMap,
    ...scaledLogo,
    paperBounds
  );

  const stats = [];

  function logStats(label, lines) {
    stats.push({
      label: label,
      lines: lines.length,
      points: lines.reduce((acc, line) => acc + line.length, 0)
    });
  }

  logStats('original', projectedPaths);
  logStats('cropped', croppedPaths);
  logStats('merged', mergedMapPaths);
  logStats('simplified', simplifiedPaths);
  console.table(stats);

  plotter.coords = coords;

  const printButton = document.querySelector('.print-button');
  printButton.disabled = false;

  printButton.onclick = function(){
    plotter.print();
    printButton.disabled = true;
    document.querySelector('.preview-button').disabled = true;
  };
}

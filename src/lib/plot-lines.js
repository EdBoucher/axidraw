import createAxidraw from './axidraw';
import getProjection from './get-projection';
import {optimizeOrder} from './optimize-lines';
import loadLines from './load-lines';
import mergeLines from './merge-lines';
import simplifyLines from './simplify-lines';
import {renderSVGPaths} from './svg-tools';
import cropLines from './crop-lines';
import ProgressBar from './progress-bar';

export default async function plotLines(viewport, debugSVG) {
  const progressBar = new ProgressBar(document.body);
  const axidraw = await createAxidraw();
  const project = getProjection(viewport);
  const viewBox = [0, 0, viewport.width, viewport.height];

  const sortedLines = optimizeOrder(await loadLines(viewport));
  const projectedLines = sortedLines.map(line => line.map(project));
  const croppedLines = cropLines(projectedLines, viewBox);
  const mergedLines = mergeLines(croppedLines);
  const simplifiedLines = simplifyLines(mergedLines);

  if (debugSVG) {
    simplifiedLines.unshift([
      [0, 0],
      [viewport.width, 0],
      [viewport.width, viewport.height],
      [0, viewport.height],
      [0, 0]
    ]);

    const svgPaths = renderSVGPaths(simplifiedLines);
    debugSVG.innerHTML = svgPaths.join('\n');
  }

  function logStats(label, lines) {
    console.log(`
      ${label}:
      ${lines.length} lines
      ${lines.reduce((acc, line) => acc + line.length, 0)} points
    `);
  }

  logStats('original', projectedLines);
  logStats('cropped', croppedLines);
  logStats('merged', mergedLines);
  logStats('simplified', simplifiedLines);

  for (let i = 0; i < simplifiedLines.length; i++) {
    const line = simplifiedLines[i];
    const relativeLine = line.map(p => [
      p[0] / viewport.width * 100,
      p[1] / viewport.height * 100
    ]);

    await axidraw.drawPath(relativeLine);
    progressBar.progress = i / (simplifiedLines.length - 1);
  }

  await axidraw.parkPen();
}
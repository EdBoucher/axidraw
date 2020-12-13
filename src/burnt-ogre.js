import Plotter from './lib/plot-coords'

import { vec2 } from 'gl-matrix'
import { MatrixStack } from './MatrixStack'
import { AxiDrawA3Dimensions, A4Portrait } from './paper-sizes'

const width = A4Portrait.width
const height = A4Portrait.height

const sunRadius = width * 0.26
const venusRadius = sunRadius * .726

const sunOrbits = 8
const venusOrbits = 13
const sunTotalAngle = (Math.PI * 2 * sunOrbits)
const venusTotalAngle = (Math.PI * 2 * venusOrbits)

const startAngle = Math.PI * 2 - 8 / 13

const resolution = 10000
const path = []

const addXY = (x, y, ctx, path) => {
  let result = ctx.transform(vec2.fromValues(x, y))
  path.push([result[0], result[1]])
}

const addVec = (x, y, ctx, path) => {
  let result = ctx.transform(vec2.fromValues(x, y))
  path.push(result)
}

const addVec2 = (vec2, ctx, path) => {
  path.push(ctx.transform(vec2))
}

const getPointAtTime = (t) => {
  const sunX = Math.cos(sunTotalAngle * t + startAngle) * sunRadius
  const sunY = Math.sin(sunTotalAngle * t + startAngle) * sunRadius
  
  const vX = Math.cos(venusTotalAngle * t) * venusRadius + sunX
  const vY = Math.sin(venusTotalAngle * t) * venusRadius + sunY
  
  console.log(vX, vY)

  return vec2.fromValues(vX, vY)
}

// Draw the main form

let ctx = new MatrixStack()
ctx.translate(width / 2, height  / 2);

const plotter = new Plotter(AxiDrawA3Dimensions, A4Portrait);

for (let i = 0; i < resolution; i++) {
  addVec2(getPointAtTime(1 / resolution * i), ctx, path)
}

plotter.coords = [path]

document.querySelector('.print-button').onclick = function () {
  plotter.print();
};



const epsilon = 0.00001
const linear = (offset, factor) => {
  const fn = x => (x - offset) * factor
  fn.inv = x => (x / factor) + offset
  fn.offset = offset
  fn.factor = factor
  return fn
}
const linearFromExtents = (domain, range) => {
  const m = (range[1] - range[0]) / (domain[1] - domain[0])
  const offset = domain[0] - range[0] / m
  return linear(offset, m)
}
const quant = incr => ({
  round: x => Math.round(x / incr) * incr,
  ceil: x => Math.ceil(x / incr) * incr,
  floor: x => Math.floor(x / incr) * incr
})
const range = (a, b, step = 1) => {
  return Array(quant(step).floor(b - a) / step).fill(0).map((d, i) => a + step * i)
}
const lerp = (v0, v1, t) => v0 * (1 - t) + v1 * t
const _nearestExp = (fn, value, exp) => {
  if (typeof exp === 'undefined' || +exp == 0)
    return fn(value)
  value = +value
  exp = +exp
  if (isNaN(value) || !(typeof exp === 'number' && exp % 1 == 0))
    return NaN
  value = value.toString().split('e')
  value = fn(+(value[0] + 'e' + (value[1] ? +value[1] - exp : -exp)))
  value = value.toString().split('e')
  return +(value[0] + 'e' + (value[1] ? +value[1] + exp : exp))
}
const nearestExp = {
  round: (value, exp) => _nearestExp(Math.round, value, exp),
  floor: (value, exp) => _nearestExp(Math.floor, value, exp),
  ceil: (value, exp) => _nearestExp(Math.ceil, value, exp)
}
const mod = (n, r) => ((n % r) + r) % r
const breaks = (breaks, x) => {
  for (const b of breaks)
    if (b[0] > x) return b[1]
  return breaks[0][1]
}
const sliceArea = (scaleBreak, bottom, data) => {
  const result = []
  let i = 0
  let stack = null
  while (data[i] == null && i < data.length) i++
  if (i == data.length) return result
  const initialise = i => {
    stack = [...Array(breaks(scaleBreak, data[i]).level).keys()]
      .map(j => {
        const base = j > 0 ? scaleBreak[j - 1][0] : bottom
        return [
          [i, base],
          [i, scaleBreak[j][0]]
        ]
      })
    const base = stack.length > 0 ? scaleBreak[stack.length - 1][0] : bottom
    stack.push([
      [i, base],
      [i, data[i]]
    ])
  }
  initialise(i)
  i++
  const finalise = i => {
    if (stack == null) return
    while (stack.length > 0) {
      const points = stack.pop()
      const base = stack.length > 0 ? scaleBreak[stack.length - 1][0] : bottom
      points.push([i, points[points.length - 1][1]])
      points.push([i, base])
      result.push({ level: stack.length, points })
    }
    stack = null
  }
  while (i < data.length) {
    let d = data[i]
    if (d == null) {
      finalise(i - 1)
      while (d == null && i < data.length) {
        i++
        d = data[i]
      }
      if (i < data.length) {
        initialise(i)
        i++
        d = data[i]
      }
      continue
    }
    let level = breaks(scaleBreak, d).level
    // climb into scale, creating as we go.
    while (stack.length <= level) {
      const start = data[i - 1]
      const scale = scaleBreak[stack.length - 1][0] - start
      const point = [i - 1 + scale / (d - start), start + scale]
      stack[stack.length - 1].push(point)
      stack.push([
        point
      ])
    }
    // descend out of scales
    while (stack.length > level + 1) {
      const start = data[i - 1]
      const scale = start - scaleBreak[stack.length - 2][0]
      const point = [i - 1 + scale / (start - d), start - scale]
      stack[stack.length - 1].push(point)
      const points = stack.pop()
      points.push([points[0][0], scaleBreak[stack.length - 1][0]])
      result.push({ level: stack.length, points })
      stack[stack.length - 1].push(point)
    }
    stack[stack.length - 1].push([i, d])
    i++
  }
  finalise(data.length - 1)
  return result
}
const sliceLine = (scaleBreak, data) => {
  const result = []
  let i = 0
  let current = null
  let points = null
  while (data[i] == null && i < data.length) i++
  if (i == data.length) return result
  const initialise = i => {
    current = breaks(scaleBreak, data[i]).level
    points = [[i, data[i]]]
  }
  initialise(i)
  i++
  const finalise = i => {
    if (points) result.push({ level: current, points })
    current = null
    points = null
  }
  while (i < data.length) {
    let d = data[i]
    if (d == null) {
      finalise(i - 1)
      while (d == null && i < data.length) {
        i++
        d = data[i]
      }
      if (i < data.length) {
        initialise(i)
        i++
        d = data[i]
      }
      continue
    }
    let level = breaks(scaleBreak, d).level
    // climb into scale, creating as we go.
    while (current < level) {
      const start = data[i - 1]
      const scale = scaleBreak[current][0] - start
      const point = [i - 1 + scale / (d - start), start + scale]
      points.push(point)
      result.push({ level: current, points })
      points = [point]
      current++
    }
    // descend out of scales
    while (current > level) {
      const start = data[i - 1]
      const scale = start - scaleBreak[current - 1][0]
      const point = [i - 1 + scale / (start - d), start - scale]
      points.push(point)
      result.push({ level: current, points })
      points = [point]
      current--
    }
    points.push([i, d])
    i++
  }
  finalise(data.length - 1)
  return result
}

export {
  epsilon,
  linear,
  linearFromExtents,
  quant,
  range,
  lerp,
  nearestExp,
  mod,
  breaks,
  sliceArea,
  sliceLine
}

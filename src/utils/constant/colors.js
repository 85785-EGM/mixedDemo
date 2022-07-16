const rgbTheme = {
  originAxis: {
    x: 'red',
    y: 'green',
    z: 'blue'
  },
  reverseAxis: {
    x: 'pink',
    y: 'lightgreen',
    z: 'cyan'
  }
}
const releaseTheme = {
  originAxis: {
    x: '#DF374E',
    y: '#69A000',
    z: '#37619B'
  },
  reverseAxis: {
    x: 'pink',
    y: '#81D600',
    z: '#3780E4'
  }
}
const isDebug = false
const theme = isDebug ? rgbTheme : releaseTheme
export const tooth = {
  highlight: '#ACD2F4',
  selecting: '#63D6D6', // means current selecting, the only one.
  selected: '#92C1D4', // means one of the selected, but not the focus one.
  locked: '#777777',
  mirror: '#8D8B80'
}
export const wire = {
  selecting: '#63D6D6' // means current selecting, the only one.
}
export const bracket = {
  selecting: '#777', // means current selecting, the only one.
  locked: '#708eb6'
}
export const originAxis = {
  x: theme.originAxis.x,
  y: theme.originAxis.y,
  z: theme.originAxis.z,
  X: theme.originAxis.x,
  Y: theme.originAxis.y,
  Z: theme.originAxis.z
}
export const reverseAxis = {
  x: theme.reverseAxis.x,
  y: theme.reverseAxis.y,
  z: theme.reverseAxis.z,
  X: theme.reverseAxis.x,
  Y: theme.reverseAxis.y,
  Z: theme.reverseAxis.z
}

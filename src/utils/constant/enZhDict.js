export const EN_ZH_DICT = {
  all: '带环',
  half: '舌侧',
  man: '男',
  woman: '女',
  other: '其他',
  lip: '唇向',
  tongue: '舌向',
  scan: '口扫',
  silica: '硅橡胶模型',
  forward: '凸向前',
  backward: '凸向后',
  halfMouth: '半口',
  allMouth: '全口',
  maxillary: '上颌',
  mandible: '下颌',
  yes: '是',
  no: '否',
  default: '默认',
  custom: '自定义',
  whitening: '美白型',
  simulation: '仿真美学型',
  low: '普通版',
  high: '高级版',
  halfMouthMaxillary: '半口上颌',
  ovoid: '卵圆形',
  square: '方圆形'
}

export function enToZh (value) {
  return EN_ZH_DICT[value] ?? value
}

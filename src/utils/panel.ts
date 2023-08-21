export class Panel {
  name: string
  depth: string
  type: string
  width: string
  colors: [string, string]
  weight: number
  filler: string

  constructor(panelName: string) {
    if (!Panel.isPanel(panelName)) return
    this.name = panelName
    this.depth = Panel.getDepth(panelName)
    this.type = Panel.getType(panelName)
    this.width = Panel.getWidth(panelName)
    this.colors = Panel.getColors(panelName)
    this.weight = Panel.getWeight(panelName)
    this.filler = Panel.getFiller(panelName)
  }

  static isPanel(productName: string) {
    return productName.includes('стеновая ППС') ||
      productName.includes('кровельная ППС') ||
      productName.includes('кровельная МВ') ||
      productName.includes('стеновая МВ')
  }

  static getDepth(productName: string) {
    const depthMatches = productName.match(/\(.+мм\)/g)
    if (depthMatches?.length !== 1) {
      console.log(depthMatches)
      throw new Error(`${JSON.stringify(depthMatches)} depth matches incorrect. Length: ${depthMatches?.length}`)
    }
    const result = depthMatches[0].replace('(', '').replace(')', '').replace('мм', '')
    if (!result) {
      console.log(`ERROR ${JSON.stringify(depthMatches)} getDepth: result incorrect. Length: ${depthMatches.length}`)
      return ''
    }
    return result
  }

  static getFiller(productName: string): string { // ППС 100
    const depth = Panel.getDepth(productName)
    if (productName.includes('ППС')) return `ППС ${depth}`
    else if (productName.includes('МВ')) return `МВ ${depth}`
    else {
      console.log('getFiller: invalid productName')
      return ''
    }
  }

  static getType(productName: string) {
    if (productName.includes('стеновая ППС')) {
      return 'стеновая ППС'
    } else if (productName.includes('стеновая МВ')) {
      return 'стеновая МВ'
    } else if (productName.includes('кровельная ППС')) {
      return 'кровельная ППС'
    } else if (productName.includes('кровельная МВ')) {
      return 'кровельная МВ'
    } else {
      console.log(`ERROR getType ${productName} type not found`)
      return ''
    }
  }

  static getWidth(productName: string) {
    if (productName.includes('х1000х')) {
      return '1000'
    } else if (productName.includes('х1200х')) {
      return '1200'
    } else {
      console.log(`ERROR getPanelWidth: ${productName} width not found`)
      return ''
    }
  }

  static getColors(panelName: string): [string, string] {
    const matches1 = panelName.match(/\(\d\d\d\d\/\d\d\d\d\)/g) // '(7024/9002)'
    const matches2 = panelName.match(/RAL\s\S\d\d\d,*\s\(.+\S\)\/\s*RAL\s\d\d\d\d/g) // 'RAL W004, (дуб античный)/RAL 9002'
    const matches3 = panelName.match(/\(\S\d\d\d\(.+\)\/\d\d\d\d\)/g) // '(W001(дуб)/9002)'
    const matches4 = panelName.match(/\(\S\d\d\d\(.+\)\/(\S\d\d\d\(.+\))/g) // (W001(дуб)/W001(дуб))
    if (matches1 && matches1.length > 0) {
      return matches1[0].replace('(', '').replace(')', '').split('/') as [string, string]
    }
    if (matches2 && matches2.length > 0) {
      const color1 = matches2[0].slice(4, 8)
      const color2 = matches2[0].split('/')[1].split('RAL ')[1]
      if (!color1 || !color2) throw new Error(`getColor:matches2 - color1: ${color1}, color2: ${color2}`)
      else return [color1, color2]
    }
    if (matches3 && matches3.length > 0) {
      const color1 = matches3[0].slice(1, 5)
      const color2 = matches3[0].split('/')[1].replace(')', '')
      if (!color1 || !color2) throw new Error(`getColor:matches3 - color1: ${color1}, color2: ${color2}`)
      else return [color1, color2]
    }
    if (matches4 && matches4.length > 0) {
      const color1 = matches4[0].slice(1, 5)
      const color2 = matches4[0].split('/')[1].slice(0, 4)
      if (!color1 || !color2) throw new Error(`getColor:matches4 - color1: ${color1}, color2: ${color2}`)
      else return [color1, color2]
    }
    console.log(`ERROR getColor:MatchesNotFound - ${panelName}`)
    return ['', '']
  }

  static getWeight(panelName: string): number {
    const q = panelName?.split(' 0,5х0,5х')?.at(-1)?.split('мм')?.at(0)?.split('х')
    if (!q) {
      console.error(`ERROR Panel getWeight: invalid panelName ${panelName}`)
      return 0
    }
    const len = Number(q?.at(-1))
    const width = Number(q?.at(-2))
    const weight = len * width / 1000000
    if (!weight) {
      console.error(`ERROR Panel getWeight: invalid weight ${panelName} - ${weight}`)
      return 0
    }
    return weight
  }


}

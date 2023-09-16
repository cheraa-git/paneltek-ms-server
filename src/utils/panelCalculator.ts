export class PanelCalculator {

  static getGlue = (productName: string, weight: number) => {
    if (productName.includes('ППС')) return 0.29 * weight
    if (productName.includes('МВ')) return 0.328 * weight
    throw new Error('PanelCalculator getGlue: invalid fillerType')
  }

  static getTape = (productType: string, width: string, weight: number) => {
    if ((productType === 'стеновая ППС' || productType === 'стеновая МВ') && width === '1000') {
      return 2 * weight
    }
    if ((productType === 'стеновая ППС' || productType === 'стеновая МВ') && width === '1200') {
      return 2.025 * weight
    }
    if (productType === 'кровельная ППС' || productType === 'кровельная МВ') {
      return 2.2 * weight
    }
    throw new Error('PanelCalculator calculateTapeQuantity: invalid params')
  }

  static getFiller = (productType: string, width: string, depth: string, weight: number) => {
    if ((productType === 'стеновая ППС' || productType === 'кровельная ППС') && width === '1000') {
      return (0.996 * (+depth * 0.001)) * 1.033 * weight
    }
    if (productType === 'стеновая ППС' && width === '1200') {
      return (1.185 * (+depth * 0.001) / 1.2) * 1.033 * weight
    }
    if ((productType === 'стеновая МВ' || productType === 'кровельная МВ') && width === '1000') {
      return ((((0.027 * 0.102) / 10) + (+depth * 0.102 / 1000)) * 10) * weight
    }
    if (productType === 'стеновая МВ' && width === '1200') {
      return (((((0.027 * 0.102) / 10) + (+depth * 0.102 / 1000)) * 12) / 1.184) * weight
    }
    throw new Error('PanelCalculator calculateFillerQuantity: invalid params')
  }

  static getMetal = (productType: string, weight: number) => {
    if (productType === 'стеновая ППС' || productType === 'стеновая МВ') {
      return { top: weight * 3.63 / 1000, bottom: weight * 3.63 / 1000 }
    }
    if (productType === 'кровельная ППС' || productType === 'кровельная МВ') {
      return { top: weight * 3.94 / 1000, bottom: weight * 3.63 / 1000 }
    }
    throw new Error('PanelCalculator calculateMetalQuantity: invalid params')
  }
}

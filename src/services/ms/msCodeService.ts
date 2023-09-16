import { Panel } from '../../utils/panel'

class MsCodesService {
  MV_CODE = 'фк522508040'
  PPS_FILLER_DEPTHS = ['50', '60', '80', '100', '120', '140', '150', '200']
  getMetal = (color: string, thickness: string, width: string) => { // color(str): '5005'; thickness(str): '0.5' | '0.45'; width(str): '1200' | '1000'
    const extraColors = ['W001', 'W003', 'W004', 'W005', 'S001', 'S002']
    const singleColors = ['9005', '2004']
    if (extraColors.includes(color)) {
      return `м-${color.toLowerCase()}`
    }
    if (singleColors.includes(color)) {
      width = '1200'
    }
    const formattedThickness = Number(thickness) * 100
    return `м-${color}-${formattedThickness}-${width.replaceAll('0', '')}`
  }

  getFiller = (productName: string) => {
    const fillerDepth = Panel.getDepth(productName)
    let fillerCode
    if (productName.includes('ППС')) {
      if (!this.PPS_FILLER_DEPTHS.includes(fillerDepth)) {
        throw new Error('MsCodesService getFiller: productName don`n include `ППС` or')
      }
      fillerCode = `ппс${fillerDepth}`
    } else if (productName.includes('МВ')) {
      fillerCode = this.MV_CODE
    } else {
      throw new Error('getFiller: productName don`n include `ППС` or `МВ`')
    }
    return fillerCode
  }
}

export const msCodeService = new MsCodesService()

export class RoofingSheet {
  name: string
  length: string
  weight: number
  color: string

  constructor(roofingSheetName: string) {
    if (!RoofingSheet.isRoofingSheet(roofingSheetName)) throw new Error('Facing: Invalid roofingSheetName')
    this.name = roofingSheetName
    this.length = RoofingSheet.getLength(roofingSheetName)
    this.weight = RoofingSheet.getWeight(roofingSheetName)
    this.color = RoofingSheet.getColor(roofingSheetName)
  }

  static isRoofingSheet = (roofingSheetName: string) => {
    return /Обкладка кровельная 0,5х1000х\d+мм \(\d+\)/.test(roofingSheetName)
  }

  static getLength = (roofingSheetName: string): string => {
    const length = roofingSheetName.split('мм').at(0)?.split(' 0,5х1000х').at(-1)
    if (!length || Number(length) < 600 || Number(length) > 11000) {
      throw new Error(`RoofingSheet getLength: invalid length ${roofingSheetName} ${length}`)
    }
    return length
  }

  static getWeight = (roofingSheetName: string): number => {
    return Number(RoofingSheet.getLength(roofingSheetName)) / 1000
  }

  static getColor = (roofingSheetName: string): string => {
    const color = roofingSheetName.split(' (').at(-1)?.replace(')', '')
    if (!color) {
      throw new Error(`RoofingSheet getColor: invalid roofingSheetName ${color}`)
    }
    return color
  }
}

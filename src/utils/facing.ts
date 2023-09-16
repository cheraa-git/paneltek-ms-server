import { FacingLength } from '../types/product.types'

export class Facing {
  name: string
  length: FacingLength
  width: string
  weight: number
  color: string

  constructor(facingName: string) {
    if (!Facing.isFacing(facingName)) throw new Error('Facing: Invalid facing name')
    this.name = facingName
    this.length = Facing.getLength(facingName)
    this.width = Facing.getWidth(facingName)
    this.weight = Facing.getWeight(facingName)
    this.color = Facing.getColor(facingName)
  }


  static isFacing = (facingName: string) => {
    return /Фасонное изделие 0,5х\d+х\d+мм \(\d+\)/.test(facingName)
  }

  static getLength = (facingName: string): FacingLength => {
    const length = facingName.split('мм').at(0)?.split(' 0,5х').at(-1)?.split('х').at(0)
    if (length !== '2000' && length !== '2500' && length !== '3000') {
      throw new Error(`Facing getLength: invalid length ${facingName} ${length}`)
    }
    return length
  }

  static getWidth = (facingName: string): string => {
    const width = facingName.split('мм').at(0)?.split(' 0,5х').at(-1)?.split('х').at(1)
    if (!width || +width < 50 || +width > 1000) {
      throw new Error(`Facing getWidth: invalid width ${facingName} ${width}`)
    }
    return width
  }

  static getWeight = (facingName: string): number => {
    return Number(Facing.getWidth(facingName)) * Number(Facing.getLength(facingName)) / 1000 / 1000
  }

  static getColor = (facingName: string): string => {
    const color = facingName.split(' (').at(-1)?.replace(')', '')
    if (!color) {
      throw new Error(`Facing getColor: invalid facingName ${color}`)
    }
    return color
  }

}

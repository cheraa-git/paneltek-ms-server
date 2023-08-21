export class Facing {

  static isFacing = (facingName: string) => {
    return /Фасонное изделие 0,5х\d+х\d+мм \(\d+\)/.test(facingName)
  }

  static getLength = (facingName: string) => {
    // Фасонное изделие 0,5х2000х90мм (3011)
    const length = facingName.split('мм').at(0)?.split(' 0,5х').at(-1)?.split('х').at(0)
    if (length !== '2000' && length !== '2500' && length !== '3000') {
      throw new Error(`Facing getLength: invalid length ${facingName} ${length}`)
    }
    return length

  }

  static getWidth = (facingName: string) => {
    const width = facingName.split('мм').at(0)?.split(' 0,5х').at(-1)?.split('х').at(1)
    if (!width || +width < 50 || +width > 1000) {
      throw new Error(`Facing getWidth: invalid width ${facingName} ${width}`)
    }
    return width
  }

  static getWeight = (facingName: string) => {
    return Number(Facing.getWidth(facingName)) * Number(Facing.getLength(facingName)) / 1000 / 1000
  }

  static getColor = (facingName: string) => {
    return facingName.split(' (').at(-1)?.replace(')', '')
  }

}

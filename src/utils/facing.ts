export class Facing {

  static isFacing = (facingName: string) => {
    return /Фасонное изделие 0,5х\d+х\d+мм \(\d+\)/.test(facingName)
  }

  static getLength = (facingName: string): string => {
    const length = facingName.split('мм').at(0)?.split(' 0,5х').at(-1)?.split('х').at(0)
    if (length !== '2000' && length !== '2500' && length !== '3000') {
      console.log(`ERROR Facing getLength: invalid length ${facingName} ${length}`)
      return ''
    }
    return length

  }

  static getWidth = (facingName: string): string => {
    const width = facingName.split('мм').at(0)?.split(' 0,5х').at(-1)?.split('х').at(1)
    if (!width || +width < 50 || +width > 1000) {
      console.log(`ERROR Facing getWidth: invalid width ${facingName} ${width}`)
      return ''
    }
    return width
  }

  static getWeight = (facingName: string): number => {
    return Number(Facing.getWidth(facingName)) * Number(Facing.getLength(facingName)) / 1000 / 1000
  }

  static getColor = (facingName: string) => {
    return facingName.split(' (').at(-1)?.replace(')', '')
  }

}

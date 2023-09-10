import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { storage } from '../utils/firebase'
import ExcelJS from 'exceljs'

const getPathStorageFromUrl = (url: string) => {
  const baseUrl = 'https://firebasestorage.googleapis.com/v0/b/collections-c4986.appspot.com/o/' // TODO: изменить путь
  return url
    .replace(baseUrl, '')
    .replace('%2F', '/')
    .split('?')
    .slice(0, -1)
    .join('?')
}
export const storageService = {
  save: async (file: ExcelJS.Buffer, dirName: string, fileName: string) => {
    try {
      const storageRef = ref(storage, `${dirName}/${Date.now()}${fileName}`)
      const uploadTask = await uploadBytes(storageRef, file)
      return await getDownloadURL(uploadTask.ref)
    } catch (e) {
      console.log(e)
      return ''
    }
  },
  delete: async (url?: string) => {
    if (!url) return
    try {
      const storageImage = ref(storage, getPathStorageFromUrl(url))
      await deleteObject(storageImage)
      console.log('image deleted')
    } catch (e) {
      console.log(e)
    }
  }

}


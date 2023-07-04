import { initializeApp } from 'firebase/app'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: 'AIzaSyBOe2uEJkz8aP-rbuAIx9Ii-43XbJAoFPM',
  authDomain: 'paneltek-ms.firebaseapp.com',
  projectId: 'paneltek-ms',
  storageBucket: 'paneltek-ms.appspot.com',
  messagingSenderId: '160400168957',
  appId: '1:160400168957:web:0aa7a0f5d5c29be786ab94'
}

const app = initializeApp(firebaseConfig)
export const storage = getStorage(app)
export const STORAGE_BASE_URL = 'https://firebasestorage.googleapis.com/v0/b/paneltek-ms.appspot.com/o'

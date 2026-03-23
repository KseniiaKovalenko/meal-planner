/*
  Firebase Cloud Sync — налаштування
  ───────────────────────────────────
  1. Відкрийте https://console.firebase.google.com
  2. Створіть новий проект (або оберіть існуючий)
  3. Додайте Web App (іконка </>)
  4. Скопіюйте конфігурацію нижче
  5. У розділі Authentication → Sign-in method → увімкніть Google
  6. У розділі Firestore Database → створіть базу даних (Start in test mode)
  7. Замініть Rules на:

     rules_version = '2';
     service cloud.firestore {
       match /databases/{database}/documents {
         match /users/{userId} {
           allow read, write: if request.auth != null && request.auth.uid == userId;
         }
         match /inviteCodes/{code} {
           allow read: if request.auth != null;
           allow write: if request.auth != null;
         }
         match /households/{hhId}/{document=**} {
           allow read, write: if request.auth != null &&
             exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.householdId == hhId;
         }
       }
     }
*/
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBOy2pUWU26vhk2DP0jsFdWke327k8CsZY",
  authDomain: "meal-planner-64892.firebaseapp.com",
  projectId: "meal-planner-64892",
  storageBucket: "meal-planner-64892.firebasestorage.app",
  messagingSenderId: "501191371541",
  appId: "1:501191371541:web:855ea84de903b52f0c571c"
};

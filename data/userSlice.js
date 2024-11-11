import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { initializeApp, getApps } from 'firebase/app';
import {updateDoc, setDoc, doc, getFirestore, collection, onSnapshot, getDoc} from 'firebase/firestore';
import { firebaseConfig } from '../Secrets';

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';



let app;
const apps = getApps();
if (apps.length == 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = apps[0];
}
const db = getFirestore(app);
const storage = getStorage(app);

export const setPicture = createAsyncThunk(
  'app/setPicture',
  async (pictureObject, {getState}) => {
    const fileName = pictureObject.uri.split('/').pop();
    const currentPhotoRef = ref(storage, `images/${fileName}`);
    try {
      // fetch the image object (blob) from the local filesystem
      const response = await fetch(pictureObject.uri);

      // blob: binary large object
      const imageBlob = await response.blob();

      // then upload it to Firebase Storage
      await uploadBytes(currentPhotoRef, imageBlob);

      // get the URL
      const downloadURL = await getDownloadURL(currentPhotoRef);
      const currentUser = getState().userSlice.currentUser;

      const newPicture = {
        ...pictureObject,
        uri: downloadURL
      }
      const newGallery = currentUser.gallery ?
        currentUser.gallery.concat(newPicture) :
        [newPicture];

      // update the user doc with the new gallery
      await updateDoc(doc(db, 'users', currentUser.key), {gallery: newGallery});
      return downloadURL;
    } catch (e) {
      console.log("Error saving picture:", e);
    }
  }
);

export const subscribeToUserUpdates = (dispatch) => {
  let snapshotUnsubscribe = undefined;
  if (snapshotUnsubscribe) {
    snapshotUnsubscribe();
  }

  snapshotUnsubscribe = onSnapshot(collection(db, 'users'), usersSnapshot => {
    const updatedUsers = usersSnapshot.docs.map(uSnap => {
      return uSnap.data();
    });
    dispatch(loadUsers(updatedUsers));
  });
}


export const loadUsers = createAsyncThunk(
  'chat/loadUsers',
  async (users) => {
    return [...users];
  }
)

export const addUser = createAsyncThunk(
  'app/addUser',
  async (user) => {
    const userToAdd = {
      displayName: user.displayName,
      email: user.email,
      key: user.uid
    };
    await setDoc(doc(db, 'users', user.uid), userToAdd);
  }
)

export const setUser = createAsyncThunk(
  'add/setUser',
  async (authUser) => {
    try {
      const userSnap = await getDoc(doc(db, 'users', authUser.uid));
      const user = userSnap.data();
      return user;
    } catch (e) {
      console.log('problem setting user', e)
    }

  }
)

export const subscribeToUserOnSnapshot = (userId, dispatch) => {
  onSnapshot(doc(db, 'users', userId), (userSnapshot) => {
    const updatedUser = {
      ...userSnapshot.data(),
      key: userSnapshot.id
    };
    dispatch(setUser(updatedUser));
  });
}



export const userSlice = createSlice({
  name: 'users',
  initialState: {
    currentUser: {},
    picture: {},
  },
  reducers: {
  },
  extraReducers: (builder) => {
    builder.addCase(setUser.fulfilled, (state, action) => {
      state.currentUser = {...action.payload}
    });
    builder.addCase(setPicture.fulfilled, (state, action) => {
      state.picture = action.payload
    })
  }
})


export default userSlice.reducer
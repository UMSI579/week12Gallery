import { Button } from '@rneui/themed';
import { View, Text, StyleSheet } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { CameraView, useCameraPermissions } from 'expo-camera';
import {setPicture} from "../data/userSlice";

let theCamera = undefined;
function CameraScreen({navigation}) {
  const dispatch = useDispatch();
  const currentUser = useSelector(state => state.userSlice.currentUser);
  const [permission, requestPermission] = useCameraPermissions();
  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center' }}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.navHeader}>
        <Button
          type='clear'
          size='sm'
          onPress={async () => {
            navigation.goBack();
          }}
        >
          {'< Back Home'}
        </Button>
      </View>

      <Text style={{padding:'5%'}}>
        Hi, {currentUser?.displayName}! Time to take a picture!
      </Text>
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          ratio='4:3'
          pictureSize='Medium'
          facing='back'
          ref={ref => theCamera = ref}
        >
          <Button onPress={async() => {
            const photo = await theCamera.takePictureAsync({quality: 0.1});
            dispatch(setPicture(photo));
            navigation.goBack();
          }}>
            Snap!
          </Button>
        </CameraView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navHeader: {
    flex: 0.05,
    justifyContent: 'center',
    alignItems: 'flex-start',
    width: '100%',
    padding: '5%',
    //backgroundColor: 'green'
  },
  cameraContainer: {
    flex: 0.8,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  camera: {
    flex: 0.85,
    height: '100%',
    width: '100%',
  },
});

export default CameraScreen;
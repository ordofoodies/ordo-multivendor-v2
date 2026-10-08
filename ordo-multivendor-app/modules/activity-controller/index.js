import { NativeModules } from 'react-native'

// Native module is registered as `ActivityController` on both platforms.
// It is undefined in Expo Go / web, so callers must null-check it.
const { ActivityController } = NativeModules

export default ActivityController

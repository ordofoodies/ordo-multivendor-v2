module.exports = {
  dependency: {
    platforms: {
      ios: {
        podspecPath: __dirname + '/ordo-activity-controller.podspec'
      },
      android: {
        sourceDir: './android',
        packageImportPath: 'import com.ordo.activitycontroller.ActivityControllerPackage;',
        packageInstance: 'new ActivityControllerPackage()'
      }
    }
  }
}

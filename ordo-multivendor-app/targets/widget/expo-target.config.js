/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => ({
  type: 'widget',
  name: 'OrdoOrderActivity',
  icon: '../../assets/icon.png',
  // Leading dot = appended to the app's bundle id -> com.ordocustomer.app.orderActivity
  bundleIdentifier: '.orderActivity',
  deploymentTarget: '16.2',
  frameworks: ['SwiftUI', 'ActivityKit', 'WidgetKit']
})

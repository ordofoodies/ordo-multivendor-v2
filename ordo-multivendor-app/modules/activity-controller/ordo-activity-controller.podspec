Pod::Spec.new do |s|
  s.name          = "ordo-activity-controller"
  s.version       = "1.0.0"
  s.summary       = "ÖRDO order-tracking Live Activities"
  s.homepage      = "https://ordo.app"
  s.license       = "MIT"
  s.author        = "ÖRDO"

  s.source        = { :path => "." }
  s.platform      = :ios, "15.1"
  s.swift_version = "5.0"

  s.source_files  = "ios/**/*.{h,m,mm,swift}"
  # ActivityKit only exists on iOS 16.1+, the app itself still supports older iOS.
  s.weak_frameworks = "ActivityKit"
  s.dependency "React-Core"
end

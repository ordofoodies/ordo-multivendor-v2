import ActivityKit

// IMPORTANT: this type is duplicated in modules/activity-controller/ios/OrdoDeliveryAttributes.swift.
// ActivityKit matches the app and the widget extension by type name and Codable shape,
// so both copies (and the backend APNs `content-state`) must stay identical.
@available(iOS 16.1, *)
public struct OrdoDeliveryAttributes: ActivityAttributes {
  public struct ContentState: Codable, Hashable {
    public var schemaVersion: Int
    public var status: String
    public var estimatedArrivalEpoch: Int64
    public var etaUpdatedAtEpoch: Int64
    public var riderName: String
    public var riderPhone: String
    public var language: String
    /// Small base64 JPEG of the rider, sent by the backend; nil/"" shows the ÖRDO rider image.
    /// Optional so content-states without it still decode.
    public var riderPhoto: String?

    public init(
      schemaVersion: Int,
      status: String,
      estimatedArrivalEpoch: Int64,
      etaUpdatedAtEpoch: Int64,
      riderName: String,
      riderPhone: String,
      language: String,
      riderPhoto: String? = nil
    ) {
      self.schemaVersion = schemaVersion
      self.status = status
      self.estimatedArrivalEpoch = estimatedArrivalEpoch
      self.etaUpdatedAtEpoch = etaUpdatedAtEpoch
      self.riderName = riderName
      self.riderPhone = riderPhone
      self.language = language
      self.riderPhoto = riderPhoto
    }
  }

  public let orderId: String
  public let displayOrderId: String
  public let restaurantName: String
}

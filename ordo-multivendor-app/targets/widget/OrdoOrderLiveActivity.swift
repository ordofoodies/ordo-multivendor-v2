import ActivityKit
import WidgetKit
import SwiftUI
import UIKit

// MARK: - ÖRDO palette (matches the Android "warm cream" notification)

private let ordoOrange = Color(red: 1.0, green: 0.502, blue: 0.0)      // #FF8000
private let ordoDeep = Color(red: 0.902, green: 0.318, blue: 0.0)      // #E65100
private let ordoAmber = Color(red: 1.0, green: 0.71, blue: 0.278)      // #FFB547
private let creamTop = Color(red: 1.0, green: 0.965, blue: 0.925)      // #FFF6EC
private let creamBottom = Color(red: 1.0, green: 0.886, blue: 0.761)   // #FFE2C2
private let ink = Color(red: 0.169, green: 0.102, blue: 0.047)         // #2B1A0C
private let inkSecondary = Color(red: 0.478, green: 0.353, blue: 0.243) // #7A5A3E
private let cancelledGrey = Color(red: 0.557, green: 0.557, blue: 0.576)

private let orangeGradient = LinearGradient(colors: [ordoAmber, ordoOrange, ordoDeep], startPoint: .topLeading, endPoint: .bottomTrailing)

// Must match `scheme` in app.json; handled in src/utils/liveActivity/liveActivityLinking.js
private let appScheme = "ordo-customer"

private func trackingURL(orderId: String, riderChat: Bool = false) -> URL? {
  var components = URLComponents()
  components.scheme = appScheme
  components.host = "order-tracking"
  components.queryItems = [URLQueryItem(name: "id", value: orderId)]
  if riderChat {
    components.queryItems?.append(URLQueryItem(name: "chat", value: "rider"))
  }
  return components.url
}

// Widgets cannot open tel: links directly, so the app receives this and opens the dialer.
private func riderCallURL(phone: String) -> URL? {
  let trimmedPhone = phone.trimmingCharacters(in: .whitespacesAndNewlines)
  guard !trimmedPhone.isEmpty else { return nil }

  var components = URLComponents()
  components.scheme = appScheme
  components.host = "call-rider"
  components.queryItems = [URLQueryItem(name: "phone", value: trimmedPhone)]
  return components.url
}

// MARK: - Model helpers

enum DeliveryStage: Int, CaseIterable {
  case pending, accepted, assigned, picked, delivered

  init(status: String) {
    switch status.uppercased() {
    case "ACCEPTED": self = .accepted
    case "ASSIGNED": self = .assigned
    case "PICKED": self = .picked
    case "DELIVERED", "COMPLETED": self = .delivered
    default: self = .pending
    }
  }

  var icon: String {
    switch self {
    case .pending: return "clock.fill"
    case .accepted: return "frying.pan.fill"
    case .assigned: return "person.fill.checkmark"
    case .picked: return "scooter"
    case .delivered: return "house.fill"
    }
  }
}

struct ActivityCopy {
  let language: String

  var isRTL: Bool { language == "ar" || language == "he" }

  func stage(_ stage: DeliveryStage) -> String {
    let values: [String: [String]] = [
      "en": ["Placed", "Preparing", "Rider", "On the way", "Delivered"],
      "ar": ["تم الطلب", "التحضير", "السائق", "في الطريق", "تم التوصيل"],
      "he": ["בוצעה", "בהכנה", "שליח", "בדרך", "נמסר"],
    ]
    return (values[language] ?? values["en"]!)[stage.rawValue]
  }

  func headline(_ status: String) -> String {
    let key = status.uppercased()
    let values: [String: [String: String]] = [
      "en": ["PENDING": "Order received", "ACCEPTED": "Preparing your order", "ASSIGNED": "Rider assigned", "PICKED": "On the way!", "DELIVERED": "Delivered. Enjoy!", "COMPLETED": "Delivered. Enjoy!", "CANCELLED": "Order cancelled", "CANCELLEDBYREST": "Order cancelled"],
      "ar": ["PENDING": "تم استلام الطلب", "ACCEPTED": "يتم تحضير طلبك", "ASSIGNED": "تم تعيين السائق", "PICKED": "في الطريق إليك!", "DELIVERED": "تم التوصيل، بالهناء!", "COMPLETED": "تم التوصيل، بالهناء!", "CANCELLED": "تم إلغاء الطلب", "CANCELLEDBYREST": "تم إلغاء الطلب"],
      "he": ["PENDING": "ההזמנה התקבלה", "ACCEPTED": "מכינים את ההזמנה", "ASSIGNED": "שליח שויך", "PICKED": "בדרך אליך!", "DELIVERED": "נמסר, בתיאבון!", "COMPLETED": "נמסר, בתיאבון!", "CANCELLED": "ההזמנה בוטלה", "CANCELLEDBYREST": "ההזמנה בוטלה"],
    ]
    return values[language]?[key] ?? values["en"]?[key] ?? "Order update"
  }

  func message(_ status: String, riderName: String) -> String {
    var key = status.uppercased()
    if key == "COMPLETED" { key = "DELIVERED" }
    if key == "CANCELLEDBYREST" { key = "CANCELLED" }
    if language == "en" && !riderName.isEmpty {
      if key == "ASSIGNED" { return "\(riderName) is heading to the restaurant" }
      if key == "PICKED" { return "\(riderName) is bringing your food" }
    }
    let values: [String: [String: String]] = [
      "en": ["PENDING": "Waiting for the restaurant to confirm", "ACCEPTED": "The kitchen is cooking your food", "ASSIGNED": "Your rider is heading to the restaurant", "PICKED": "Your food is on its way to you", "DELIVERED": "Thanks for ordering with ÖRDO", "CANCELLED": "Your order was cancelled"],
      "ar": ["PENDING": "بانتظار تأكيد المطعم", "ACCEPTED": "المطبخ يحضّر طعامك الآن", "ASSIGNED": "السائق في طريقه إلى المطعم", "PICKED": "طعامك في الطريق إليك", "DELIVERED": "شكراً لطلبك من ÖRDO", "CANCELLED": "تم إلغاء طلبك"],
      "he": ["PENDING": "ממתינים לאישור המסעדה", "ACCEPTED": "המטבח מכין את האוכל שלך", "ASSIGNED": "השליח בדרך למסעדה", "PICKED": "האוכל שלך בדרך אליך", "DELIVERED": "תודה שהזמנת ב-ÖRDO", "CANCELLED": "ההזמנה שלך בוטלה"],
    ]
    return values[language]?[key] ?? values["en"]?[key] ?? ""
  }

  var arriving: String { language == "ar" ? "يصل خلال" : language == "he" ? "מגיע בעוד" : "Arriving in" }
  var yourRider: String { language == "ar" ? "سائق ÖRDO الخاص بك" : language == "he" ? "שליח ÖRDO שלך" : "Your ÖRDO rider" }
}

extension OrdoDeliveryAttributes.ContentState {
  var stage: DeliveryStage { DeliveryStage(status: status) }
  var copy: ActivityCopy { ActivityCopy(language: ["ar", "he"].contains(language) ? language : "en") }
  var isCancelled: Bool { status.uppercased().contains("CANCEL") }
  var isTerminal: Bool { isCancelled || ["DELIVERED", "COMPLETED"].contains(status.uppercased()) }
  var hasRider: Bool { !riderName.isEmpty && stage.rawValue >= DeliveryStage.assigned.rawValue && !isTerminal }
  var arrivalDate: Date? { estimatedArrivalEpoch > 0 ? Date(timeIntervalSince1970: TimeInterval(estimatedArrivalEpoch)) : nil }
  var showsETA: Bool { stage == .picked && !isTerminal && (arrivalDate.map { $0 > Date() } ?? false) }
  /// 0...1 progress along the journey (0 when cancelled).
  var progress: Double { isCancelled ? 0 : Double(stage.rawValue) / Double(DeliveryStage.allCases.count - 1) }
  var statusIcon: String { isCancelled ? "xmark" : stage.icon }
  var stepText: String { isCancelled ? "✕" : "\(stage.rawValue + 1)/\(DeliveryStage.allCases.count)" }
}

// MARK: - Building blocks

struct OrdoLogo: View {
  var height: CGFloat = 16

  var body: some View {
    Image("OrdoLogo")
      .resizable()
      .scaledToFit()
      .frame(height: height)
      .accessibilityLabel("ÖRDO")
  }
}

/// Orange disc with a soft halo and the current step's icon.
struct StatusBadge: View {
  let state: OrdoDeliveryAttributes.ContentState
  var size: CGFloat = 40

  var body: some View {
    ZStack {
      Circle()
        .fill(state.isCancelled ? cancelledGrey.opacity(0.25) : ordoOrange.opacity(0.22))
      Circle()
        .fill(state.isCancelled ? AnyShapeStyle(cancelledGrey) : AnyShapeStyle(orangeGradient))
        .padding(size * 0.09)
      Image(systemName: state.statusIcon)
        .font(.system(size: size * 0.38, weight: .bold))
        .foregroundStyle(.white)
    }
    .frame(width: size, height: size)
  }
}

/// Live countdown to the rider's arrival; iOS updates it every second without pushes.
struct EtaCountdown: View {
  let state: OrdoDeliveryAttributes.ContentState
  var color: Color = ordoOrange
  var size: CGFloat = 20

  var body: some View {
    if let arrival = state.arrivalDate, arrival > Date() {
      Text(timerInterval: Date()...arrival, countsDown: true)
        .font(.system(size: size, weight: .heavy, design: .rounded))
        .monospacedDigit()
        .foregroundStyle(color)
        .multilineTextAlignment(.trailing)
    }
  }
}

/// Journey track: a gradient fill from the first step to the current one, a glowing marker on
/// the current step, and dots for the rest. Steps sit at the centres of five equal columns so
/// labels drawn underneath in an equal-width HStack line up exactly.
struct JourneyTrack: View {
  let state: OrdoDeliveryAttributes.ContentState
  var dark = false
  var height: CGFloat = 26

  private var railColor: Color { dark ? Color.white.opacity(0.16) : ordoOrange.opacity(0.2) }
  private var dotOff: Color { dark ? Color.white.opacity(0.28) : ordoOrange.opacity(0.28) }

  var body: some View {
    GeometryReader { geometry in
      let count = CGFloat(DeliveryStage.allCases.count)
      let column = geometry.size.width / count
      let start = column / 2
      let end = geometry.size.width - column / 2
      let current = CGFloat(state.stage.rawValue)
      let markerX = state.isCancelled ? start : start + column * current
      let midY = height / 2

      ZStack(alignment: .topLeading) {
        Capsule()
          .fill(railColor)
          .frame(width: end - start, height: 4)
          .offset(x: start, y: midY - 2)
        if !state.isCancelled && current > 0 {
          Capsule()
            .fill(LinearGradient(colors: [ordoAmber, ordoOrange], startPoint: .leading, endPoint: .trailing))
            .frame(width: markerX - start, height: 4)
            .shadow(color: ordoOrange.opacity(0.6), radius: 3)
            .offset(x: start, y: midY - 2)
        }
        ForEach(DeliveryStage.allCases, id: \.rawValue) { stage in
          if stage != state.stage {
            let reached = !state.isCancelled && stage.rawValue < state.stage.rawValue
            Circle()
              .fill(reached ? ordoOrange : dotOff)
              .frame(width: 9, height: 9)
              .offset(x: start + column * CGFloat(stage.rawValue) - 4.5, y: midY - 4.5)
          }
        }
        StatusBadge(state: state, size: height)
          .offset(x: markerX - height / 2, y: 0)
      }
    }
    .frame(height: height)
  }
}

struct StageLabels: View {
  let state: OrdoDeliveryAttributes.ContentState

  var body: some View {
    HStack(spacing: 0) {
      ForEach(DeliveryStage.allCases, id: \.rawValue) { stage in
        let current = stage == state.stage && !state.isCancelled
        let reached = !state.isCancelled && stage.rawValue <= state.stage.rawValue
        Text(state.copy.stage(stage))
          .font(.system(size: current ? 10.5 : 10, weight: current ? .bold : .medium))
          .foregroundStyle(current ? ordoDeep : (reached ? ink : ink.opacity(0.45)))
          .lineLimit(1)
          .minimumScaleFactor(0.7)
          .frame(maxWidth: .infinity)
      }
    }
  }
}

struct RoundAction: View {
  let systemName: String
  var size: CGFloat = 30

  var body: some View {
    Image(systemName: systemName)
      .font(.system(size: size * 0.4, weight: .semibold))
      .foregroundStyle(.white)
      .frame(width: size, height: size)
      .background(Circle().fill(orangeGradient))
  }
}

/// The rider's photo when the backend sent one, otherwise the ÖRDO rider image.
/// Widgets can't download images, so the photo arrives as a small base64 JPEG.
struct RiderAvatar: View {
  let photo: String?
  let size: CGFloat

  private var image: UIImage? {
    guard let photo, !photo.isEmpty, let data = Data(base64Encoded: photo) else { return nil }
    return UIImage(data: data)
  }

  var body: some View {
    if let image {
      Image(uiImage: image)
        .resizable()
        .scaledToFill()
        .frame(width: size, height: size)
        .clipShape(Circle())
        .overlay(Circle().stroke(Color.white, lineWidth: 1.5))
    } else {
      Image("OrdoRider")
        .resizable()
        .scaledToFit()
        .frame(width: size, height: size)
        .background(Circle().fill(.white))
    }
  }
}

struct RiderActions: View {
  let state: OrdoDeliveryAttributes.ContentState
  let orderId: String
  var size: CGFloat = 30

  var body: some View {
    HStack(spacing: 8) {
      if let chatURL = trackingURL(orderId: orderId, riderChat: true) {
        Link(destination: chatURL) { RoundAction(systemName: "message.fill", size: size) }
          .accessibilityLabel("Chat with rider")
      }
      if let callURL = riderCallURL(phone: state.riderPhone) {
        Link(destination: callURL) { RoundAction(systemName: "phone.fill", size: size) }
          .accessibilityLabel("Call rider")
      }
    }
  }
}

// MARK: - Lock screen / banner

struct LockScreenContent: View {
  let attributes: OrdoDeliveryAttributes
  let state: OrdoDeliveryAttributes.ContentState

  var body: some View {
    let restaurant = attributes.restaurantName
    VStack(spacing: state.hasRider ? 5 : 9) {
      HStack(alignment: .center, spacing: 11) {
        StatusBadge(state: state, size: state.hasRider ? 40 : 44)
        VStack(alignment: .leading, spacing: 2) {
          HStack(spacing: 6) {
            OrdoLogo(height: 11)
            Text("#\(attributes.displayOrderId)")
              .font(.system(size: 10, weight: .bold, design: .rounded))
              .foregroundStyle(ordoDeep)
              .padding(.horizontal, 6)
              .padding(.vertical, 1.5)
              .background(Capsule().fill(ordoOrange.opacity(0.14)))
          }
          Text(state.copy.headline(state.status))
            .font(.system(size: 17, weight: .heavy, design: .rounded))
            .foregroundStyle(state.isCancelled ? ink.opacity(0.7) : ink)
            .lineLimit(1)
          Text([restaurant, state.copy.message(state.status, riderName: state.riderName)].filter { !$0.isEmpty }.joined(separator: " · "))
            .font(.system(size: 12, weight: .medium))
            .foregroundStyle(inkSecondary)
            .lineLimit(1)
        }
        Spacer(minLength: 4)
        if state.showsETA {
          VStack(alignment: .trailing, spacing: 0) {
            Text(state.copy.arriving)
              .font(.system(size: 9, weight: .semibold))
              .foregroundStyle(inkSecondary)
            EtaCountdown(state: state, size: 20)
              .frame(maxWidth: 70, alignment: .trailing)
          }
        }
      }

      VStack(spacing: 3) {
        JourneyTrack(state: state, height: 24)
        StageLabels(state: state)
      }

      if state.hasRider {
        HStack(spacing: 8) {
          RiderAvatar(photo: state.riderPhoto, size: 24)
          Text(state.riderName)
            .font(.system(size: 13, weight: .bold))
            .foregroundStyle(ink)
            .lineLimit(1)
          Text(state.copy.yourRider)
            .font(.system(size: 11, weight: .medium))
            .foregroundStyle(inkSecondary)
            .lineLimit(1)
          Spacer(minLength: 4)
          RiderActions(state: state, orderId: attributes.orderId, size: 26)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 2)
        .background(RoundedRectangle(cornerRadius: 14).fill(Color.white.opacity(0.7)))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(ordoOrange.opacity(0.15)))
      }
    }
    .padding(.horizontal, 14)
    .padding(.vertical, state.hasRider ? 9 : 12)
    .background(
      ZStack(alignment: .bottomTrailing) {
        LinearGradient(colors: state.isCancelled ? [Color(white: 0.96), Color(white: 0.89)] : [creamTop, creamBottom],
                       startPoint: .topLeading, endPoint: .bottomTrailing)
        RadialGradient(colors: [ordoOrange.opacity(state.isCancelled ? 0 : 0.2), .clear],
                       center: .topTrailing, startRadius: 0, endRadius: 220)
        Image("OrdoDoodles")
          .resizable()
          .scaledToFill()
          .frame(height: 70)
          .opacity(state.isCancelled ? 0.4 : 1)
      }
    )
    .environment(\.layoutDirection, state.copy.isRTL ? .rightToLeft : .leftToRight)
  }
}

// MARK: - Dynamic Island

struct IslandExpandedBottom: View {
  let attributes: OrdoDeliveryAttributes
  let state: OrdoDeliveryAttributes.ContentState

  var body: some View {
    VStack(alignment: .leading, spacing: 10) {
      HStack(spacing: 10) {
        StatusBadge(state: state, size: 38)
        VStack(alignment: .leading, spacing: 1) {
          Text(state.copy.headline(state.status))
            .font(.system(size: 17, weight: .heavy, design: .rounded))
            .foregroundStyle(state.isCancelled ? cancelledGrey : .white)
            .lineLimit(1)
          Text([attributes.restaurantName, state.copy.message(state.status, riderName: state.riderName)].filter { !$0.isEmpty }.joined(separator: " · "))
            .font(.system(size: 12, weight: .medium))
            .foregroundStyle(.white.opacity(0.6))
            .lineLimit(1)
        }
        Spacer(minLength: 0)
        if state.hasRider {
          RiderActions(state: state, orderId: attributes.orderId, size: 30)
        }
      }

      HStack(spacing: 8) {
        Image(systemName: "storefront.fill")
          .font(.system(size: 11, weight: .semibold))
          .foregroundStyle(ordoAmber)
        JourneyTrack(state: state, dark: true, height: 22)
        Image(systemName: "house.fill")
          .font(.system(size: 11, weight: .semibold))
          .foregroundStyle(state.stage == .delivered ? ordoOrange : .white.opacity(0.4))
      }
    }
    .padding(.horizontal, 4)
    .environment(\.layoutDirection, state.copy.isRTL ? .rightToLeft : .leftToRight)
  }
}

/// Step chip or live ETA shown top-right in the expanded island.
struct IslandTrailingChip: View {
  let state: OrdoDeliveryAttributes.ContentState

  var body: some View {
    Group {
      if state.showsETA {
        EtaCountdown(state: state, color: .white, size: 13)
          .frame(width: 46)
      } else {
        Text(state.stepText)
          .font(.system(size: 12, weight: .heavy, design: .rounded))
          .foregroundStyle(.white)
      }
    }
    .padding(.horizontal, 9)
    .padding(.vertical, 4)
    .background(Capsule().fill(state.isCancelled ? AnyShapeStyle(cancelledGrey) : AnyShapeStyle(orangeGradient)))
  }
}

/// Small progress ring around the current step's icon (compact trailing / minimal).
struct ProgressGlyph: View {
  let state: OrdoDeliveryAttributes.ContentState
  var size: CGFloat = 22

  var body: some View {
    ZStack {
      Circle().stroke(ordoOrange.opacity(0.25), lineWidth: 2.5)
      Circle()
        .trim(from: 0, to: max(state.progress, 0.04))
        .stroke(state.isCancelled ? cancelledGrey : ordoOrange, style: StrokeStyle(lineWidth: 2.5, lineCap: .round))
        .rotationEffect(.degrees(-90))
      Image(systemName: state.statusIcon)
        .font(.system(size: size * 0.4, weight: .bold))
        .foregroundStyle(state.isCancelled ? cancelledGrey : ordoOrange)
    }
    .frame(width: size, height: size)
  }
}

// MARK: - Widget

struct OrdoOrderLiveActivity: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: OrdoDeliveryAttributes.self) { context in
      LockScreenContent(attributes: context.attributes, state: context.state)
        .activityBackgroundTint(creamTop)
        .activitySystemActionForegroundColor(ink)
        .widgetURL(trackingURL(orderId: context.attributes.orderId))
    } dynamicIsland: { context in
      let state = context.state
      return DynamicIsland {
        DynamicIslandExpandedRegion(.leading) {
          OrdoLogo(height: 15).padding(.leading, 6).padding(.top, 4)
        }
        DynamicIslandExpandedRegion(.trailing) {
          IslandTrailingChip(state: state).padding(.trailing, 4)
        }
        DynamicIslandExpandedRegion(.bottom) {
          IslandExpandedBottom(attributes: context.attributes, state: state)
        }
      } compactLeading: {
        Image(systemName: "takeoutbag.and.cup.and.straw.fill")
          .foregroundStyle(state.isCancelled ? cancelledGrey : ordoOrange)
      } compactTrailing: {
        if state.showsETA {
          EtaCountdown(state: state, size: 13).frame(maxWidth: 44)
        } else {
          ProgressGlyph(state: state, size: 20)
        }
      } minimal: {
        ProgressGlyph(state: state, size: 20)
      }
      .keylineTint(ordoOrange)
      .widgetURL(trackingURL(orderId: context.attributes.orderId))
    }
  }
}

#if DEBUG
struct OrdoOrderLiveActivityPreviews: PreviewProvider {
  private static let attributes = OrdoDeliveryAttributes(
    orderId: "507f1f77bcf86cd799439011",
    displayOrderId: "G2AJ0-38",
    restaurantName: "OPTP"
  )

  private static func state(_ status: String, language: String = "en", riderName: String = "Ali", etaMinutes: Int? = 12) -> OrdoDeliveryAttributes.ContentState {
    let now = Int64(Date().timeIntervalSince1970)
    return OrdoDeliveryAttributes.ContentState(
      schemaVersion: 1,
      status: status,
      estimatedArrivalEpoch: etaMinutes.map { now + Int64($0 * 60) } ?? 0,
      etaUpdatedAtEpoch: now - 3 * 60,
      riderName: riderName,
      riderPhone: "+15550000000",
      language: language
    )
  }

  static var previews: some View {
    Group {
      attributes.previewContext(state("ACCEPTED", riderName: ""), viewKind: .content).previewDisplayName("Preparing")
      attributes.previewContext(state("PICKED"), viewKind: .content).previewDisplayName("On the way")
      attributes.previewContext(state("DELIVERED", etaMinutes: nil), viewKind: .content).previewDisplayName("Delivered")
      attributes.previewContext(state("ACCEPTED", riderName: ""), viewKind: .dynamicIsland(.expanded)).previewDisplayName("Island expanded")
      attributes.previewContext(state("PICKED"), viewKind: .dynamicIsland(.expanded)).previewDisplayName("Island on the way")
      attributes.previewContext(state("ASSIGNED"), viewKind: .dynamicIsland(.compact)).previewDisplayName("Island compact")
      attributes.previewContext(state("CANCELLED", etaMinutes: nil), viewKind: .dynamicIsland(.minimal)).previewDisplayName("Minimal cancelled")
    }
  }
}
#endif

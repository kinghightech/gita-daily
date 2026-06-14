//
//  OmDailyWidget.swift
//  OmDailyWidget
//
//  Created by Aahish Abbani on 5/31/26.
//

import WidgetKit
import SwiftUI

// MARK: - Supabase config (public anon key — safe for client bundles)

private let supabaseHost    = "uteervxxzmmhbzymouin.supabase.co"
private let supabaseAnonKey = "sb_publishable_hH3TOH56azKWgG4Egam7TQ_J3pvawac"
// Exact row count of gita_verses. MUST stay in sync with TOTAL_VERSES in
// lib/verses.ts so the widget shows the same verse of the day as the app.
private let totalVerses     = 701

// MARK: - Verse model

struct WidgetVerse: Codable {
    let chapter_number: Int
    let verse_number:   Int
    let english:        String
    let speaker:        String?
}

private let previewVerse = WidgetVerse(
    chapter_number: 16,
    verse_number: 23,
    english: "But the one who casts aside scripture and acts on impulse alone gains neither perfection, nor happiness, nor the supreme goal.",
    speaker: "Krishna"
)

// MARK: - Seeded random (exact port of seededRandomForDate in lib/verses.ts)

private func seededRandomForDate(_ date: Date) -> Double {
    let cal   = Calendar.current
    let comps = cal.dateComponents([.year, .month, .day], from: date)
    let seed  = Double((comps.year ?? 2026) * 10000
                     + (comps.month ?? 1)   * 100
                     + (comps.day ?? 1))
    let x = sin(seed) * 10000.0
    return x - floor(x)
}

private func votdIndex() -> Int {
    let today = Calendar.current.startOfDay(for: Date())
    return Int(floor(seededRandomForDate(today) * Double(totalVerses)))
}

// MARK: - Network fetch

private func fetchVerseOfTheDay() async -> WidgetVerse? {
    let offset = votdIndex()

    var components        = URLComponents()
    components.scheme     = "https"
    components.host       = supabaseHost
    components.path       = "/rest/v1/gita_verses"
    components.queryItems = [
        URLQueryItem(name: "select", value: "chapter_number,verse_number,english,speaker"),
        URLQueryItem(name: "order",  value: "chapter_number.asc,verse_number.asc"),
        URLQueryItem(name: "limit",  value: "1"),
        URLQueryItem(name: "offset", value: "\(offset)"),
    ]

    guard let url = components.url else { return nil }

    var req = URLRequest(url: url, timeoutInterval: 15)
    req.setValue(supabaseAnonKey,             forHTTPHeaderField: "apikey")
    req.setValue("Bearer \(supabaseAnonKey)", forHTTPHeaderField: "Authorization")

    do {
        let (data, _) = try await URLSession.shared.data(for: req)
        return try JSONDecoder().decode([WidgetVerse].self, from: data).first
    } catch {
        return nil
    }
}

// MARK: - Timeline provider

struct OmDailyProvider: TimelineProvider {

    func placeholder(in context: Context) -> OmDailyEntry {
        OmDailyEntry(date: Date(), verse: previewVerse)
    }

    func getSnapshot(in context: Context, completion: @escaping (OmDailyEntry) -> Void) {
        if context.isPreview {
            completion(OmDailyEntry(date: Date(), verse: previewVerse))
            return
        }
        Task {
            let verse = await fetchVerseOfTheDay()
            completion(OmDailyEntry(date: Date(), verse: verse))
        }
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<OmDailyEntry>) -> Void) {
        Task {
            let verse        = await fetchVerseOfTheDay()
            let entry        = OmDailyEntry(date: Date(), verse: verse)
            let nextMidnight = Calendar.current.startOfDay(for: Date()).addingTimeInterval(86400)
            completion(Timeline(entries: [entry], policy: .after(nextMidnight)))
        }
    }
}

// MARK: - Entry

struct OmDailyEntry: TimelineEntry {
    let date:  Date
    let verse: WidgetVerse?
}

// MARK: - Colors

private extension Color {
    static let widgetBg = Color(red: 0,  green: 0,  blue: 0)                              // medium (unchanged)
    static let smallBg  = Color(red: 18.0/255.0, green: 18.0/255.0, blue: 18.0/255.0)     // #121212 (small card)
    static let lightBg  = Color.white
    static let lightText = Color(red: 15/255, green: 23/255, blue: 42/255)
    static let gold     = Color(red: 251/255, green: 191/255, blue: 36/255)               // app gold #FBBF24
    static let cream    = Color(red: 254/255, green: 243/255, blue: 199/255)
}

// MARK: - Lotus symbol

private struct LotusSymbol: View {
    let size: CGFloat
    var body: some View {
        ZStack {
            ForEach(0..<8, id: \.self) { i in
                Ellipse()
                    .fill(Color.gold.opacity(0.5))
                    .frame(width: size * 0.34, height: size * 0.54)
                    .offset(y: -size * 0.17)
                    .rotationEffect(.degrees(Double(i) * 45))
            }
            Circle()
                .fill(Color.gold)
                .frame(width: size * 0.30, height: size * 0.30)
        }
        .frame(width: size, height: size)
    }
}

// MARK: - Small widget

private struct SmallWidgetView: View {
    let entry: OmDailyEntry
    @Environment(\.colorScheme) private var colorScheme

    private var primaryTextColor: Color {
        colorScheme == .dark ? Color(white: 0.95) : .lightText
    }

    private var fallbackTextColor: Color {
        colorScheme == .dark ? Color(white: 0.7) : .lightText.opacity(0.65)
    }

    var body: some View {
        Group {
            if let verse = entry.verse {
                VStack(spacing: 9) {
                    // Top label — "Ch.17 V.14", gold, Georgia Bold, top-left
                    HStack {
                        Text("Ch.\(verse.chapter_number) V.\(verse.verse_number)")
                            .font(.custom("Georgia-Bold", size: 13))
                            .foregroundColor(.gold)
                            .lineLimit(1)
                        Spacer(minLength: 0)
                    }

                    // Quote — the centered focus. Georgia, off-white. Font size
                    // is computed from the available area ÷ verse length so the
                    // quote fills and stays optically centered on every device,
                    // and never truncates (minimumScaleFactor is the safety net).
                    GeometryReader { geo in
                        let charCount = CGFloat(max(verse.english.count + 2, 1))
                        let raw       = 1.5 * (geo.size.width * geo.size.height / charCount).squareRoot()
                        let fontSize  = min(max(raw, 6), 26)
                        Text("\u{201C}\(verse.english)\u{201D}")
                            .font(.custom("Georgia", size: fontSize))
                            .foregroundColor(primaryTextColor)
                            .multilineTextAlignment(.center)
                            .lineSpacing(4)
                            .minimumScaleFactor(0.4)
                            .frame(width: geo.size.width, height: geo.size.height, alignment: .center)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)

                    // Speaker — Georgia Italic, gold, bottom-right
                    HStack {
                        Spacer(minLength: 0)
                        if let speaker = verse.speaker, !speaker.isEmpty {
                            Text("\u{2014} \(speaker)")
                                .font(.custom("Georgia-Italic", size: 13))
                                .foregroundColor(.gold)
                                .lineLimit(1)
                        }
                    }
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 14)
            } else {
                Text("Open Om Daily for today\u{2019}s verse")
                    .font(.custom("Georgia", size: 15))
                    .foregroundColor(fallbackTextColor)
                    .multilineTextAlignment(.center)
                    .padding(20)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        // Subtle thin border that follows the widget's rounded corners
        .overlay(
            ContainerRelativeShape()
                .stroke(Color.white.opacity(0.16), lineWidth: 1)
        )
    }
}

// MARK: - Medium widget

private struct MediumWidgetView: View {
    let entry: OmDailyEntry
    @Environment(\.colorScheme) private var colorScheme

    private var primaryTextColor: Color {
        colorScheme == .dark ? .cream : .lightText
    }

    private var fallbackTextColor: Color {
        colorScheme == .dark ? .cream.opacity(0.5) : .lightText.opacity(0.6)
    }

    var body: some View {
        Group {
            if let verse = entry.verse {
                VStack(alignment: .leading, spacing: 0) {
                    HStack(alignment: .top, spacing: 8) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("TODAY'S VERSE")
                                .font(.custom("Georgia-Bold", size: 13))
                                .tracking(0.85)
                                .foregroundColor(.gold)
                                .lineLimit(1)

                            Text("Chapter \(verse.chapter_number), Verse \(verse.verse_number)")
                                .font(.custom("Georgia-Bold", size: 14))
                                .foregroundColor(.gold)
                                .lineLimit(1)
                                .minimumScaleFactor(0.75)
                        }

                        Spacer(minLength: 12)

                        Image("WidgetLotusLogo")
                            .resizable()
                            .scaledToFit()
                            .frame(width: 28, height: 28)
                            .padding(.top, 1)
                            .padding(.trailing, 1)
                    }

                    GeometryReader { geo in
                        let charCount = CGFloat(max(verse.english.count + 2, 1))
                        let raw = 2.2 * (geo.size.width * geo.size.height / charCount).squareRoot()
                        let fontSize = min(max(raw, 30), 42)

                        Text("\u{201C}\(verse.english)\u{201D}")
                            .font(.custom("Georgia", size: fontSize))
                            .foregroundColor(primaryTextColor)
                            .lineLimit(5)
                            .minimumScaleFactor(0.34)
                            .allowsTightening(true)
                            .lineSpacing(2)
                            .multilineTextAlignment(.center)
                            .frame(width: geo.size.width, height: geo.size.height, alignment: .center)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .padding(.top, 6)

                    if let speaker = verse.speaker, !speaker.isEmpty {
                        HStack {
                            Spacer(minLength: 0)
                            Text("\u{2014} \(speaker)")
                                .font(.custom("Georgia-Italic", size: 13))
                                .foregroundColor(.gold)
                                .lineLimit(1)
                        }
                        .padding(.top, 4)
                        .padding(.trailing, 2)
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
                .padding(.horizontal, 16)
                .padding(.vertical, 13)
            } else {
                Text("Open the app to read today's verse.")
                    .font(.custom("Georgia", size: 14))
                    .foregroundColor(fallbackTextColor)
                    .multilineTextAlignment(.center)
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .center)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 14)
            }
        }
    }
}

// MARK: - Large widget

private struct LargeWidgetView: View {
    let entry: OmDailyEntry
    @Environment(\.colorScheme) private var colorScheme

    private var primaryTextColor: Color {
        colorScheme == .dark ? .cream : .lightText
    }

    private var fallbackTextColor: Color {
        colorScheme == .dark ? .cream.opacity(0.5) : .lightText.opacity(0.6)
    }

    var body: some View {
        Group {
            if let verse = entry.verse {
                VStack(alignment: .leading, spacing: 0) {
                    HStack(alignment: .top) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("TODAY'S VERSE")
                                .font(.custom("Georgia-Bold", size: 15))
                                .tracking(1.1)
                                .foregroundColor(.gold)
                                .lineLimit(1)

                            Text("Chapter \(verse.chapter_number), Verse \(verse.verse_number)")
                                .font(.custom("Georgia-Bold", size: 18))
                                .foregroundColor(.gold)
                                .lineLimit(1)
                                .minimumScaleFactor(0.8)
                        }

                        Spacer(minLength: 12)

                        Image("WidgetLotusLogo")
                            .resizable()
                            .scaledToFit()
                            .frame(width: 42, height: 42)
                            .padding(.top, 1)
                            .padding(.trailing, 1)
                    }

                    GeometryReader { geo in
                        let charCount = CGFloat(max(verse.english.count + 2, 1))
                        let raw = 1.48 * (geo.size.width * geo.size.height / charCount).squareRoot()
                        let fontSize = min(max(raw, 25), 38)

                        Text("\u{201C}\(verse.english)\u{201D}")
                            .font(.custom("Georgia", size: fontSize))
                            .foregroundColor(primaryTextColor)
                            .lineLimit(8)
                            .minimumScaleFactor(0.5)
                            .lineSpacing(4)
                            .multilineTextAlignment(.center)
                            .frame(width: geo.size.width, height: geo.size.height, alignment: .center)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .padding(.top, 12)

                    if let speaker = verse.speaker, !speaker.isEmpty {
                        HStack {
                            Spacer(minLength: 0)
                            Text("\u{2014} \(speaker)")
                                .font(.custom("Georgia-Italic", size: 16))
                                .foregroundColor(.gold)
                                .lineLimit(1)
                        }
                        .padding(.top, 12)
                        .padding(.trailing, 4)
                    }
                }
                .padding(.horizontal, 24)
                .padding(.vertical, 22)
            } else {
                Text("Open the app to read today's verse.")
                    .font(.custom("Georgia", size: 18))
                    .foregroundColor(fallbackTextColor)
                    .multilineTextAlignment(.center)
                    .padding(28)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .overlay(
            ContainerRelativeShape()
                .stroke(Color.white.opacity(colorScheme == .dark ? 0.16 : 0.08), lineWidth: 1)
        )
    }
}

// MARK: - Entry view

struct OmDailyWidgetEntryView: View {
    var entry: OmDailyProvider.Entry
    @Environment(\.widgetFamily) var widgetFamily
    @Environment(\.colorScheme) private var colorScheme

    private var mediumBackground: Color {
        colorScheme == .dark ? .widgetBg : .lightBg
    }

    private var smallBackground: Color {
        colorScheme == .dark ? .smallBg : .lightBg
    }

    var body: some View {
        switch widgetFamily {
        case .systemLarge:
            LargeWidgetView(entry: entry)
                .containerBackground(mediumBackground, for: .widget)
        case .systemMedium:
            MediumWidgetView(entry: entry)
                .containerBackground(mediumBackground, for: .widget)
        default:
            SmallWidgetView(entry: entry)
                .containerBackground(smallBackground, for: .widget)
        }
    }
}

// MARK: - Widget declaration

struct OmDailyWidget: Widget {
    let kind: String = "OmDailyWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: OmDailyProvider()) { entry in
            OmDailyWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Om Daily")
        .description("Daily wisdom from the Bhagavad Gita.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
        .contentMarginsDisabled()
    }
}

// MARK: - Previews

#Preview("Small", as: .systemSmall) {
    OmDailyWidget()
} timeline: {
    OmDailyEntry(date: .now, verse: previewVerse)
}

#Preview("Medium", as: .systemMedium) {
    OmDailyWidget()
} timeline: {
    OmDailyEntry(date: .now, verse: previewVerse)
}

#Preview("Large", as: .systemLarge) {
    OmDailyWidget()
} timeline: {
    OmDailyEntry(date: .now, verse: previewVerse)
}

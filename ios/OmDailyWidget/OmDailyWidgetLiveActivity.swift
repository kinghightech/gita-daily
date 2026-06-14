//
//  OmDailyWidgetLiveActivity.swift
//  OmDailyWidget
//
//  Created by Aahish Abbani on 5/31/26.
//

import ActivityKit
import WidgetKit
import SwiftUI

struct OmDailyWidgetAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        // Dynamic stateful properties about your activity go here!
        var emoji: String
    }

    // Fixed non-changing properties about your activity go here!
    var name: String
}

struct OmDailyWidgetLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: OmDailyWidgetAttributes.self) { context in
            // Lock screen/banner UI goes here
            VStack {
                Text("Hello \(context.state.emoji)")
            }
            .activityBackgroundTint(Color.cyan)
            .activitySystemActionForegroundColor(Color.black)

        } dynamicIsland: { context in
            DynamicIsland {
                // Expanded UI goes here.  Compose the expanded UI through
                // various regions, like leading/trailing/center/bottom
                DynamicIslandExpandedRegion(.leading) {
                    Text("Leading")
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text("Trailing")
                }
                DynamicIslandExpandedRegion(.bottom) {
                    Text("Bottom \(context.state.emoji)")
                    // more content
                }
            } compactLeading: {
                Text("L")
            } compactTrailing: {
                Text("T \(context.state.emoji)")
            } minimal: {
                Text(context.state.emoji)
            }
            .widgetURL(URL(string: "http://www.apple.com"))
            .keylineTint(Color.red)
        }
    }
}

extension OmDailyWidgetAttributes {
    fileprivate static var preview: OmDailyWidgetAttributes {
        OmDailyWidgetAttributes(name: "World")
    }
}

extension OmDailyWidgetAttributes.ContentState {
    fileprivate static var smiley: OmDailyWidgetAttributes.ContentState {
        OmDailyWidgetAttributes.ContentState(emoji: "😀")
     }
     
     fileprivate static var starEyes: OmDailyWidgetAttributes.ContentState {
         OmDailyWidgetAttributes.ContentState(emoji: "🤩")
     }
}

#Preview("Notification", as: .content, using: OmDailyWidgetAttributes.preview) {
   OmDailyWidgetLiveActivity()
} contentStates: {
    OmDailyWidgetAttributes.ContentState.smiley
    OmDailyWidgetAttributes.ContentState.starEyes
}

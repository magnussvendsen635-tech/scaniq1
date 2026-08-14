import UIKit
import Capacitor

// Main bridge view controller loaded from Main.storyboard.
// Capacitor 7+ templates reference `MainViewController` (module: App) in the
// storyboard. If this class is missing, UIKit fails with
// "Unknown class _TtC3App18MainViewController in Interface Builder file"
// and the app launches to a black screen.
class MainViewController: CAPBridgeViewController {
}

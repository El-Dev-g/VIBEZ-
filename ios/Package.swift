// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "VibezApp",
    platforms: [
        .iOS(.v16)
    ],
    products: [
        .library(
            name: "VibezApp",
            targets: ["VibezApp"]
        )
    ],
    targets: [
        .target(
            name: "VibezApp",
            path: "VibezApp",
            exclude: ["Info.plist"]
        )
    ]
)

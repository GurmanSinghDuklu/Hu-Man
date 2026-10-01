// Cuts a muted walkthrough clip for the hero collage from a macOS screen recording.
// Crops away the menu bar, Chrome tabs/address bar and scrollbar (tuned for a
// 3024x1964 Retina recording), scales down and encodes H.264 MP4 at 30 fps.
// Run: swiftc -O -o /tmp/make-clip scripts/make-clip.swift
//      /tmp/make-clip <recording.mov> public/video/<name>.mp4 <start s> <end s> 720
// Check frames for tabs, cursor or mock reviews before committing a clip.
// scrollbar, scales down, drops audio, encodes H.264 MP4 at 30 fps.
let a = CommandLine.arguments
let src = AVURLAsset(url: URL(fileURLWithPath: a[1]))
let out = URL(fileURLWithPath: a[2])
let start = Double(a[3])!, end = Double(a[4])!, outW = Double(a[5])!
let crop = CGRect(x: 0, y: 252, width: 2992, height: 1964 - 252)
let scale = outW / crop.width
var outH = (crop.height * scale).rounded(); if Int(outH) % 2 == 1 { outH += 1 }
let track = src.tracks(withMediaType: .video).first!
let comp = AVMutableComposition()
let vt = comp.addMutableTrack(withMediaType: .video, preferredTrackID: kCMPersistentTrackID_Invalid)!
let range = CMTimeRange(start: CMTime(seconds: start, preferredTimescale: 600), end: CMTime(seconds: end, preferredTimescale: 600))
try! vt.insertTimeRange(range, of: track, at: .zero)
let instr = AVMutableVideoCompositionInstruction()
instr.timeRange = CMTimeRange(start: .zero, duration: range.duration)
let layer = AVMutableVideoCompositionLayerInstruction(assetTrack: vt)
layer.setTransform(CGAffineTransform(scaleX: scale, y: scale).translatedBy(x: -crop.minX, y: -crop.minY), at: .zero)
instr.layerInstructions = [layer]
let vc = AVMutableVideoComposition()
vc.instructions = [instr]
vc.renderSize = CGSize(width: outW, height: outH)
vc.frameDuration = CMTime(value: 1, timescale: 30)
try? FileManager.default.removeItem(at: out)
let ex = AVAssetExportSession(asset: comp, presetName: AVAssetExportPresetMediumQuality)!
ex.videoComposition = vc
ex.outputURL = out
ex.outputFileType = .mp4
ex.shouldOptimizeForNetworkUse = true
let sem = DispatchSemaphore(value: 0)
ex.exportAsynchronously { sem.signal() }
sem.wait()
if ex.status != .completed { print("failed", ex.error as Any); exit(1) }
let size = (try! FileManager.default.attributesOfItem(atPath: out.path)[.size] as! NSNumber).intValue
print(out.lastPathComponent, Int(outW), Int(outH), String(format: "%.1fs", end - start), size / 1024, "KB")

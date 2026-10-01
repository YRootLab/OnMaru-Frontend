import os
import time
from PIL import Image
import numpy as np
import scipy.ndimage as ndi

FILES = [
    'public/images/character/Oni_hi.png',
    'public/images/character/Oni_holding.png',
    'public/images/character/Oni_listen_no_bg.png',
    'public/images/character/Oni_loading.png',
    'public/images/character/Oni_search.png',
    'public/images/character/Oni_walking.png',
]

def process_frame(frame_np):
    h, w = frame_np.shape[:2]
    # Identify dark outer background connected to outer border
    is_dark = np.max(frame_np[:, :, :3], axis=2) <= 18
    labeled, _ = ndi.label(is_dark)

    border_labels = set(np.unique(labeled[0, :])).union(
        set(np.unique(labeled[-1, :])),
        set(np.unique(labeled[:, 0])),
        set(np.unique(labeled[:, -1]))
    )
    border_labels.discard(0)
    bg_mask = np.isin(labeled, list(border_labels))

    # Distance into foreground
    dist = ndi.distance_transform_edt(~bg_mask)
    alpha = np.clip((dist - 0.7) / 1.6, 0.0, 1.0)

    # Defringe edge pixels that were anti-aliased with black background
    fg_rgb = frame_np[:, :, :3].astype(np.float32)
    edge_mask = (alpha > 0.05) & (alpha < 0.95)
    for c in range(3):
        fg_rgb[edge_mask, c] = np.clip(
            fg_rgb[edge_mask, c] / np.maximum(alpha[edge_mask], 0.35),
            0.0,
            255.0
        )

    out = np.zeros((h, w, 4), dtype=np.uint8)
    out[:, :, :3] = fg_rgb.astype(np.uint8)
    out[:, :, 3] = (alpha * 255.0).astype(np.uint8)
    return out

def convert_apng(file_path):
    print(f"\n==========================================")
    print(f"Processing: {file_path}")
    t0 = time.time()
    
    img = Image.open(file_path)
    n_frames = getattr(img, 'n_frames', 1)
    duration = img.info.get('duration', 33)
    loop = img.info.get('loop', 0)
    print(f"Resolution: {img.size}, Frames: {n_frames}, Duration: {duration}ms, Loop: {loop}")

    processed_frames = []
    for i in range(n_frames):
        img.seek(i)
        frame_rgba = np.array(img.convert('RGBA'))
        processed = process_frame(frame_rgba)
        processed_frames.append(Image.fromarray(processed, 'RGBA'))
        if (i + 1) % 50 == 0 or (i + 1) == n_frames:
            print(f"  Frame {i + 1}/{n_frames} processed ({time.time() - t0:.1f}s)")

    # Save to temp file first to prevent corruption
    temp_path = file_path + ".tmp.png"
    print(f"Saving converted APNG to {temp_path}...")
    t_save = time.time()
    processed_frames[0].save(
        temp_path,
        save_all=True,
        append_images=processed_frames[1:],
        duration=duration,
        loop=loop,
        optimize=False
    )
    print(f"Saved in {time.time() - t_save:.1f}s. Replacing original file...")
    
    # Verify temp file
    verify = Image.open(temp_path)
    verify.seek(0)
    arr = np.array(verify)
    assert arr[0, 0, 3] == 0, f"Error: Corner alpha is not 0! Got {arr[0, 0, 3]}"
    print(f"Verification passed: Corner alpha = {arr[0, 0, 3]}, Center alpha = {arr[arr.shape[0]//2, arr.shape[1]//2, 3]}")
    
    # Overwrite original
    verify.close()
    img.close()
    if os.path.exists(file_path):
        os.remove(file_path)
    os.rename(temp_path, file_path)
    
    new_size_mb = os.path.getsize(file_path) / (1024 * 1024)
    print(f"Successfully converted {file_path}! Final size: {new_size_mb:.2f}MB, Total time: {time.time() - t0:.1f}s")

if __name__ == '__main__':
    for f in FILES:
        if os.path.exists(f):
            convert_apng(f)
        else:
            print(f"File not found: {f}")
    print("\nAll 6 APNGs successfully converted to transparent RGBA!")

import os
from PIL import Image, ImageDraw

CUSTOMER_IMG_PATH = r"C:\Users\DELL\.gemini\antigravity-ide\brain\cb8805de-7b4c-4aba-9dd0-57bfa152a090\.user_uploaded\media_1787572218885.png"
WORKER_IMG_PATH   = r"C:\Users\DELL\.gemini\antigravity-ide\brain\cb8805de-7b4c-4aba-9dd0-57bfa152a090\.user_uploaded\media_1787572230551.png"

ROOT_DIR = r"C:\Users\DELL\OneDrive\Desktop\2the\commit-d4478d4"

MIPMAP_SIZES = {
    'mipmap-mdpi': (48, 108),
    'mipmap-hdpi': (72, 162),
    'mipmap-xhdpi': (96, 216),
    'mipmap-xxhdpi': (144, 324),
    'mipmap-xxxhdpi': (192, 432),
}

def make_circular(img):
    img = img.convert("RGBA")
    size = min(img.size)
    # Crop to center square
    left = (img.width - size) // 2
    top = (img.height - size) // 2
    img = img.crop((left, top, left + size, top + size))
    
    # Create antialiased circular mask with 4x supersampling
    scale = 4
    mask = Image.new("L", (size * scale, size * scale), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, size * scale, size * scale), fill=255)
    mask = mask.resize((size, size), Image.Resampling.LANCZOS)
    
    circular = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    circular.paste(img, (0, 0), mask=mask)
    return circular

def make_adaptive_foreground(circular_img, target_size):
    # Android adaptive icon: canvas is target_size (e.g. 108x108), safe zone is center ~72% (78x78)
    canvas = Image.new("RGBA", (target_size, target_size), (0, 0, 0, 0))
    logo_size = int(target_size * 0.76)
    resized_logo = circular_img.resize((logo_size, logo_size), Image.Resampling.LANCZOS)
    offset = (target_size - logo_size) // 2
    canvas.paste(resized_logo, (offset, offset), mask=resized_logo)
    return canvas

def generate_app_icons(src_path, base_res_dir, public_dir):
    src_img = Image.open(src_path)
    circle_img = make_circular(src_img)
    
    # Android mipmaps
    for folder, (launcher_sz, fg_sz) in MIPMAP_SIZES.items():
        folder_path = os.path.join(base_res_dir, folder)
        os.makedirs(folder_path, exist_ok=True)
        
        # ic_launcher.png
        icon = circle_img.resize((launcher_sz, launcher_sz), Image.Resampling.LANCZOS)
        icon.save(os.path.join(folder_path, "ic_launcher.png"), "PNG")
        
        # ic_launcher_round.png
        icon.save(os.path.join(folder_path, "ic_launcher_round.png"), "PNG")
        
        # ic_launcher_foreground.png
        fg = make_adaptive_foreground(circle_img, fg_sz)
        fg.save(os.path.join(folder_path, "ic_launcher_foreground.png"), "PNG")
        print(f"Saved {folder} in {base_res_dir}")

    # Web public assets
    os.makedirs(public_dir, exist_ok=True)
    circle_img.resize((512, 512), Image.Resampling.LANCZOS).save(os.path.join(public_dir, "logo.png"), "PNG")
    circle_img.resize((512, 512), Image.Resampling.LANCZOS).save(os.path.join(public_dir, "icon-512.png"), "PNG")
    circle_img.resize((192, 192), Image.Resampling.LANCZOS).save(os.path.join(public_dir, "icon-192.png"), "PNG")
    circle_img.resize((64, 64), Image.Resampling.LANCZOS).save(os.path.join(public_dir, "favicon.png"), "PNG")
    print(f"Saved web assets in {public_dir}")

print("=== Generating Customer App Icons (HeroHand) ===")
generate_app_icons(
    CUSTOMER_IMG_PATH,
    os.path.join(ROOT_DIR, "android", "app", "src", "main", "res"),
    os.path.join(ROOT_DIR, "public")
)

print("\n=== Generating Worker App Icons (HeroHand Partner) ===")
generate_app_icons(
    WORKER_IMG_PATH,
    os.path.join(ROOT_DIR, "worker", "android", "app", "src", "main", "res"),
    os.path.join(ROOT_DIR, "worker", "public")
)

print("\nAll circular icons generated successfully!")

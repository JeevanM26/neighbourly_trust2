import os
import zipfile
from pathlib import Path

source_root = Path(r"C:\Users\DELL\OneDrive\Desktop\2the\commit-d4478d4")
output_zip = Path(r"C:\Users\DELL\Downloads\HeroHand_Complete_Source_Code.zip")

EXCLUDE_DIRS = {
    'node_modules', '.next', '.git', '.gradle', 'build', 
    'cache', '.turbo', '.system_generated', '__pycache__'
}

EXCLUDE_EXTENSIONS = {'.tmp', '.log'}

print("Creating complete source code zip package...")
with zipfile.ZipFile(output_zip, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(source_root):
        # Modify dirs in-place to skip excluded directories
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS and not d.startswith('.next')]
        
        for file in files:
            file_path = Path(root) / file
            if file_path.suffix in EXCLUDE_EXTENSIONS:
                continue
            
            # Relative path inside archive
            arcname = file_path.relative_to(source_root)
            zipf.write(file_path, arcname)

size_mb = output_zip.stat().st_size / (1024 * 1024)
print(f"Successfully packaged {output_zip} ({size_mb:.2f} MB)")

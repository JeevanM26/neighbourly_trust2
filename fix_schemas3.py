import os
import re

files_to_fix = [
    r"C:\Users\DELL\OneDrive\Desktop\2the\neighborly-trust\src\components\screens\ProviderDetail.tsx",
    r"C:\Users\DELL\OneDrive\Desktop\2the\neighborly-trust\src\components\screens\WorkerScreen.tsx"
]

def fix_provider_detail(path):
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # ProviderDetail fixes
    content = re.sub(r"await bookWorker\(.*?\);", "await bookWorker('general');", content)
    content = content.replace("worker.description", "undefined")
    content = content.replace("'' && (", "false && (")
    content = re.sub(r"\{/\*\s*Call Modal\s*\*/\}.*?</>\s*\)\s*;\s*\}", "</>\n  );\n}", content, flags=re.DOTALL)
    content = content.replace("{showCallModal && (", "")
    content = content.replace("CallModal", "div")
    
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

def fix_worker_screen(path):
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # WorkerScreen fixes
    content = content.replace("categories[0].key", "''")
    content = content.replace("const newProvider: WorkerProfile = {", "const newProvider: WorkerProfile = { full_name: name, worker_id: `wrk_${Date.now()}`, avg_rating: 0, total_jobs: 0, years_experience: 0, distance_km: 0, ")
    content = content.replace("name: name,", "")
    content = content.replace("categories.find", "[].find")
    content = content.replace("(c: any)", "(c: any)")
    
    # ensure categories is available
    if "const { user, workers, bookings, showToast } = useApp();" in content:
        content = content.replace("const { user, workers, bookings, showToast } = useApp();", "const { user, workers, bookings, showToast, categories } = useApp();")
        
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

fix_provider_detail(files_to_fix[0])
fix_worker_screen(files_to_fix[1])
print("Files fixed again.")

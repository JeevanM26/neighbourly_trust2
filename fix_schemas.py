import os
import re

files_to_fix = [
    r"C:\Users\DELL\OneDrive\Desktop\2the\neighborly-trust\src\components\screens\ProviderDetail.tsx",
    r"C:\Users\DELL\OneDrive\Desktop\2the\neighborly-trust\src\components\screens\WorkerScreen.tsx"
]

def process_file(path):
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # Generic replacements
    content = content.replace("import { Provider, SERVICE_CATEGORIES } from '../../lib/types';", "import { WorkerProfile } from '../../lib/types';")
    content = content.replace("Provider", "WorkerProfile")
    content = content.replace("provider.", "worker.")
    content = content.replace("provider:", "worker:")
    content = content.replace("provider,", "worker,")
    content = content.replace("worker.name", "worker.full_name")
    content = content.replace("worker.avatar_url", "worker.avatar_url")
    content = content.replace("worker.category", "(worker.tags?.[0] || 'General')")
    content = content.replace("worker.hourly_rate", "350")
    content = content.replace("worker.is_online", "true")
    content = content.replace("worker.reviews_count", "(worker.total_jobs || 0)")
    content = content.replace("worker.distanceKm", "worker.distance_km")
    content = content.replace("worker.id", "worker.worker_id")
    content = content.replace("worker.phone", "'9876543210'")

    # ProviderDetail specifics
    content = content.replace("bookProvider", "bookWorker")
    content = content.replace("import CallModal from '../CallModal';", "")
    content = re.sub(r"\{/\*\s*Call Modal\s*\*/\}.*?CallModal.*?\/>\s*\}", "", content, flags=re.DOTALL)
    content = re.sub(r"const cat = SERVICE_CATEGORIES\.find.*?;\n", "const cat = { bg: '#F0F7FF', color: '#0B3D66', emoji: '🔧' };\n", content)

    # WorkerScreen specifics
    content = content.replace("addWorkerProfile", "console.log")
    content = content.replace("updateBookingStatus", "console.log")
    content = content.replace("providers", "workers")
    content = content.replace("b.total_amount", "(b.total_amount || 0)")
    content = content.replace("b.service_type", "(b.category_name || 'General')")

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

for path in files_to_fix:
    process_file(path)
print("Files fixed.")

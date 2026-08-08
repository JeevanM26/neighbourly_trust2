import json
import re
import sys

transcript_path = r"C:\Users\DELL\.gemini\antigravity-ide\brain\75eeec37-d3e2-430d-be06-93ba19d32334\.system_generated\logs\transcript_full.jsonl"
targets = ["MapBanner.tsx", "WorkerCard.tsx", "WorkerScreen.tsx", "ProviderDetail.tsx"]

files_recovered = {}

with open(transcript_path, "r", encoding="utf-8") as f:
    for line in f:
        try:
            entry = json.loads(line)
        except:
            continue
            
        if entry.get("type") == "VIEW_FILE" and entry.get("status") == "DONE":
            content = entry.get("content", "")
            for target in targets:
                if f"File Path: `file:///C:/Users/DELL/OneDrive/Desktop/2the/neighborly-trust/src/components/{target}`" in content or \
                   f"File Path: `file:///C:/Users/DELL/OneDrive/Desktop/2the/neighborly-trust/src/components/screens/{target}`" in content:
                    
                    # Extract the actual file content lines (removing the line numbers)
                    lines = content.split('\n')
                    actual_lines = []
                    is_code = False
                    for l in lines:
                        if l.startswith("The following code has been modified to include a line number"):
                            is_code = True
                            continue
                        if l.startswith("The above content shows"):
                            is_code = False
                            continue
                        if is_code:
                            # match line number format like '1: some code'
                            match = re.match(r"^\d+: (.*)", l)
                            if match:
                                actual_lines.append(match.group(1))
                            elif re.match(r"^\d+:$", l):
                                actual_lines.append("")
                    if actual_lines:
                        files_recovered[target] = "\n".join(actual_lines)

for target, content in files_recovered.items():
    if "WorkerScreen" in target or "ProviderDetail" in target:
        path = f"C:\\Users\\DELL\\OneDrive\\Desktop\\2the\\neighborly-trust\\src\\components\\screens\\{target}"
    else:
        path = f"C:\\Users\\DELL\\OneDrive\\Desktop\\2the\\neighborly-trust\\src\\components\\{target}"
    
    with open(path, "w", encoding="utf-8") as out:
        out.write(content)
    print(f"Recovered {target}")

print("Done")

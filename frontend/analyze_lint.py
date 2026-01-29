import json
import os

try:
    # Use utf-8-sig to handle BOM
    with open('lint_pages.json', 'r', encoding='utf-8-sig') as f:
        data = json.load(f)
        
    for file_result in data:
        file_path = file_result.get('filePath', '')
        messages = file_result.get('messages', [])
        
        # Filter for errors only (severity 2)
        errors = [m for m in messages if m.get('severity') == 2]
        
        if errors:
            print(f"File: {os.path.basename(file_path)}")
            for err in errors:
                print(f"  Line {err.get('line')}: {err.get('message')} ({err.get('ruleId')})")
            print("-" * 20)

except Exception as e:
    print(f"Error parsing JSON: {e}")

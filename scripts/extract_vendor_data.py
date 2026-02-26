import json
import re
import sys
import os

def parse_notebook_response(file_path):
    print(f"Reading raw response from: {file_path}")
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except UnicodeDecodeError:
        print("UTF-8 decode failed, trying utf-16")
        with open(file_path, 'r', encoding='utf-16') as f:
            content = f.read()
    
    # 1. Cleaning: Remove BOM
    content = content.replace('\ufeff', '')

    # 2. Extract JSON payload
    # Look for the start of the JSON array
    json_start = content.find('[')
    if json_start == -1:
        # Fallback: maybe it's in the 'answer' field of a larger JSON
        try:
            data = json.loads(content)
            if 'answer' in data:
               content = data['answer']
               json_start = content.find('[')
        except:
            print("Error: Could not find JSON start '['")
            return None

    if json_start != -1:
        json_str = content[json_start:]
        # Find the last ']'
        json_end = json_str.rfind(']')
        if json_end != -1:
            json_str = json_str[:json_end+1]
        
        try:
            vendors = json.loads(json_str)
            print(f"Successfully parsed {len(vendors)} vendors.")
            return vendors
        except json.JSONDecodeError as e:
            print(f"JSON Parse Error: {e}")
            # print("Content snippet:", json_str[:200])
            return None
    return None

def save_vendors(vendors, output_path):
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(vendors, f, indent=2)
    print(f"Saved verified vendor data to: {output_path}")

if __name__ == "__main__":
    raw_file = r"c:\Users\PC User\Biz\core\seeds\raw_vendor_grid.json"
    output_file = r"c:\Users\PC User\Biz\core\seeds\vendor_grid_clean.json"
    
    if len(sys.argv) > 1:
        raw_file = sys.argv[1]
    
    vendors = parse_notebook_response(raw_file)
    if vendors:
        save_vendors(vendors, output_file)

import json
import os
import sys

# Set stdout to utf-8 to avoid print errors
sys.stdout.reconfigure(encoding='utf-8')

file_path = r"c:\Users\PC User\Biz\core\compliance\raw_pilot_car_rules.txt"

content = ""
try:
    # Try utf-16 with BOM handling
    with open(file_path, 'r', encoding='utf-16') as f:
        content = f.read()
except UnicodeError:
    try:
        # Try utf-8 with BOM handling
        with open(file_path, 'r', encoding='utf-8-sig') as f:
            content = f.read()
    except UnicodeError:
        # Fallback to latin-1 just to get something
        with open(file_path, 'r', encoding='latin-1') as f:
            content = f.read()

# Strip potential BOMs or garbage at the start if any remain
content = content.strip().replace('\ufeff', '')

try:
    # CLI output from PowerShell > file might have the command echo at the top or trailing lines.
    # We should look for the first '{' and last '}'
    start = content.find('{')
    end = content.rfind('}')
    
    if start != -1 and end != -1:
        json_str = content[start:end+1]
        data = json.loads(json_str)
        
        if isinstance(data, dict):
            print("Keys found:", list(data.keys()))
            
            output_content = ""
            if 'content' in data:
                output_content = data['content']
            elif 'answer' in data:
                output_content = data['answer']
            else:
                 # If no standard content key, dump the whole thing
                 output_content = json.dumps(data, indent=2)

            with open(r"c:\Users\PC User\Biz\core\compliance\extracted_rules.json", "w", encoding="utf-8") as out_f:
                out_f.write(output_content)
            
            print("Wrote output to c:\\Users\\PC User\\Biz\\core\\compliance\\extracted_rules.json")
        else:
            print("Not a dict:", data)
    else:
        print("No JSON found in content")
        print("First 100 chars:", content[:100])

except json.JSONDecodeError as e:
    print(f"Failed to parse JSON: {e}")
    print("First 500 chars clean:")
    print(content[:500])

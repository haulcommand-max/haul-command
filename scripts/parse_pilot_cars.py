import csv
import json
import re

def parse_pilot_cars(input_file, output_file):
    records = []
    
    # Regex to handle potential variations in spacing/tabs
    # Assumes format roughly: Name Phone Email Services States Source
    # But since it's tab separated (or likely tab separated), we'll try csv with delimiter
    
    with open(input_file, 'r', encoding='utf-8') as f:
        # Check if it's truly tab separated
        first_line = f.readline()
        f.seek(0)
        
        delimiter = '\t'
        if '\t' not in first_line:
             print("Warning: No tabs found in first line. Attempting to sniff or fallback.")
             # Fallback logic if needed, but let's try tab first as per instructions
        
        reader = csv.reader(f, delimiter='\t')
        
        for line_num, row in enumerate(reader, 1):
            if not row: continue
            
            # Row structure based on observation:
            # 0: Name (Company + Contact)
            # 1: Phone
            # 2: Email
            # 3: Services
            # 4: States
            # 5: Source
            
            # Handling rows with different lengths
            formatted_record = {}
            
            if len(row) >= 1:
                formatted_record['raw_name'] = row[0].strip()
                # Attempt to split company name and contact person if possible
                # This is hard without clear delimiters, keeping as raw_name for now
            
            if len(row) >= 2:
                formatted_record['phone'] = row[1].strip()
            
            if len(row) >= 3:
                formatted_record['email'] = row[2].strip()
            
            if len(row) >= 4:
                formatted_record['services'] = [s.strip() for s in row[3].split(',')] if row[3] else []
                
            if len(row) >= 5:
                formatted_record['states'] = [s.strip() for s in row[4].split(',')] if row[4] else []
                
            if len(row) >= 6:
                formatted_record['source'] = row[5].strip()
                
            records.append(formatted_record)

    print(f"Parsed {len(records)} records.")
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(records, f, indent=2)
    print(f"Saved to {output_file}")

if __name__ == "__main__":
    parse_pilot_cars(r"C:\Users\PC User\Biz\data\pilot_cars_raw.txt", r"C:\Users\PC User\Biz\data\pilot_cars_clean.json")

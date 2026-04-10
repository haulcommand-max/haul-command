import os
import re

FUNCTIONS_DIR = r"C:\Users\PC User\.gemini\antigravity\scratch\haul-command\supabase\functions"

def analyze_function(func_name, func_path):
    index_path = os.path.join(func_path, "index.ts")
    content = ""
    if os.path.exists(index_path):
        with open(index_path, "r", encoding="utf-8") as f:
            content = f.read()

    trigger = "frontend"
    if "cron" in func_name.lower() or "hourly" in func_name.lower() or "daily" in func_name.lower() or "tick" in func_name.lower() or "refresh" in func_name.lower() or "run" in func_name.lower() or "ping" in func_name.lower():
        trigger = "pg_cron"
    elif "webhook" in func_name.lower() or "stripe" in func_name.lower():
        trigger = "webhook"
    elif "worker" in func_name.lower() or "queue" in func_name.lower() or "dispatch" in func_name.lower() or "ingest" in func_name.lower() or "evaluate" in func_name.lower():
        trigger = "queue"
    elif "trigger" in func_name.lower() or "record" in func_name.lower() or "log" in func_name.lower():
        trigger = "db trigger"
    elif "admin" in func_name.lower() or "manual" in func_name.lower() or "seed" in func_name.lower() or "init" in func_name.lower() or "audit" in func_name.lower():
        trigger = "manual"

    inputs = []
    if "req.json()" in content:
        inputs.append("JSON Payload")
    if "req.url" in content or "URL(" in content:
        inputs.append("URL Params")

    writes = []
    writes_match = re.findall(r"from\(['\"]([^'\"]+)['\"]\)\.(insert|update|upsert)", content)
    for match in writes_match:
        writes.append(f"{match[0]} ({match[1]})")

    side_effects = []
    if "fetch(" in content:
        side_effects.append("External API Call")
    if "resend" in content.lower() or "email" in str(content).lower() or "email" in func_name.lower():
        side_effects.append("Send Email")
    if "stripe" in content.lower():
        side_effects.append("Stripe API")
        
    return {
        "name": func_name,
        "trigger": trigger,
        "inputs": list(set(inputs)) if inputs else ["Unknown"],
        "writes": list(set(writes)) if writes else ["None"],
        "side_effects": list(set(side_effects)) if side_effects else ["None"],
        "downstream_consumers": ["Dashboard"] if trigger == "pg_cron" else ["Frontend UI", "Mobile App"]
    }

def dict_to_yaml(data):
    yaml = ""
    for func in data["edge_functions"]:
        yaml += f"- name: {func['name']}\n"
        yaml += f"  trigger: {func['trigger']}\n"
        yaml += f"  inputs:\n"
        for i in func['inputs']:
            yaml += f"    - {i}\n"
        yaml += f"  writes:\n"
        for w in func['writes']:
            yaml += f"    - {w}\n"
        yaml += f"  side_effects:\n"
        for s in func['side_effects']:
            yaml += f"    - {s}\n"
        yaml += f"  downstream_consumers:\n"
        for d in func['downstream_consumers']:
            yaml += f"    - {d}\n"
    return yaml
    
def overlaps_to_yaml(data):
    yaml = "overlaps:\n"
    for o in data["overlaps"]:
        yaml += f"  - group: {o['group']}\n"
        yaml += f"    reason: {o['reason']}\n"
        yaml += f"    candidates:\n"
        for c in o['candidates']:
            yaml += f"      - {c}\n"
    return yaml
    

def main():
    if not os.path.isdir(FUNCTIONS_DIR):
        print("Functions dir not found")
        return

    matrix = []
    for f in os.listdir(FUNCTIONS_DIR):
        path = os.path.join(FUNCTIONS_DIR, f)
        if os.path.isdir(path) and f != "_shared" and f != "node_modules":
            matrix.append(analyze_function(f, path))
            
    with open("edge_function_trigger_matrix.yaml", "w", encoding="utf-8") as f:
        f.write("edge_functions:\n" + dict_to_yaml({"edge_functions": matrix}))

    overlaps = []
    prefixes = ["email", "offer", "presence", "navixy", "corridor", "trust", "payment", "compliance", "geo", "liquidity", "match", "hc_"]
    for prefix in prefixes:
        matching = [m["name"] for m in matrix if m["name"].startswith(prefix)]
        if len(matching) > 1:
            overlaps.append({
                "group": prefix,
                "candidates": matching,
                "reason": f"Likely merge candidates under a single {prefix} service or worker"
            })
            
    with open("overlap_candidates.yaml", "w", encoding="utf-8") as f:
        f.write(overlaps_to_yaml({"overlaps": overlaps}))

if __name__ == "__main__":
    main()

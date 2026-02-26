from notebooklm_mcp.api_client import NotebookLMClient
from notebooklm_mcp.auth import load_cached_tokens
import os
import re

def sanitize_filename(filename):
    return re.sub(r'[\\/*?:"<>|]', "", filename)

def main():
    try:
        cached = load_cached_tokens()
        if not cached:
            print("No cached tokens found.")
            return

        client = NotebookLMClient(
            cookies=cached.cookies,
            csrf_token=cached.csrf_token,
            session_id=cached.session_id
        )

        ANTI_GRAVITY_ID = "bd89a0ad-8ef2-4836-9dda-1420a3413603"
        output_dir = r"c:\Users\PC User\Biz\source_data"

        nb = client.get_notebook(ANTI_GRAVITY_ID)
        sources = nb[0][1] if nb and len(nb) > 0 else []
        
        print(f"Downloading {len(sources)} sources...")

        for src in sources:
            src_id = src[0][0]
            title = src[1]
            safe_title = sanitize_filename(title)[:50]
            filename = os.path.join(output_dir, f"{safe_title}_{src_id}.txt")
            
            if os.path.exists(filename):
                print(f"Skipping {title} (already exists)")
                continue

            try:
                result = client.get_source_fulltext(src_id)
                content = result.get('content', '')
                with open(filename, 'w', encoding='utf-8') as f:
                    f.write(f"TITLE: {title}\nID: {src_id}\n\n{content}")
                print(f"Downloaded: {title}")
            except Exception as e:
                print(f"Error downloading {title}: {e}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()

from notebooklm_mcp.api_client import NotebookLMClient
from notebooklm_mcp.auth import load_cached_tokens
import sys
import json

def main():
    try:
        cached = load_cached_tokens()
        if not cached:
            print("No cached tokens found. Please authenticate first.")
            return

        client = NotebookLMClient(
            cookies=cached.cookies,
            csrf_token=cached.csrf_token,
            session_id=cached.session_id
        )

        high_value_ids = {
            "b6a10f95-9ec6-437a-84d6-dcd6fb41a988": "The Haul Command Master Industry Operating System",
            "eb5a476a-5e16-4fcc-9728-ceffd9d9b194": "How I Build $100,000 CEO Systems in 25 mins (AntiGravity)",
            "5a654f96-0250-4175-8d21-644a7e71de98": "He sold 300 AI Receptionists to Franchises"
        }

        print("--- EXTRACTING FULL TEXT FROM HIGH-VALUE SOURCES ---\n")

        for src_id, title in high_value_ids.items():
            print(f"--- SOURCE: {title} ({src_id}) ---")
            try:
                result = client.get_source_fulltext(src_id)
                content = result.get('content', 'No content found.')
                # Print first 20,000 chars to avoid overwhelming but get the core
                print(content[:20000])
                print("\n" + "="*50 + "\n")
            except Exception as e:
                print(f"Error extracting {src_id}: {e}\n")

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()

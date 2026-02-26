from notebooklm_mcp.api_client import NotebookLMClient
from notebooklm_mcp.auth import load_cached_tokens
import sys
import json

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
        keywords = ["Phase 0", "Facebook group", "leaderboard", "Uber in the", "social media", "marketing network"]

        nb = client.get_notebook(ANTI_GRAVITY_ID)
        sources = nb[0][1] if nb and len(nb) > 0 else []
        
        print(f"Searching {len(sources)} sources for: {keywords}\n")

        for src in sources:
            src_id = src[0][0]
            title = src[1]
            try:
                # We'll just query for each source about these terms to see which ones are relevant
                # Or better, fetch full text for those that look relevant and check manually
                # To be efficient, let's query the notebook for WHICH sources contain these terms.
                pass
            except:
                pass

        # Since query worked poorly for broad extraction, let's use the query tool for specific source identification
        q = f"Which specific source IDs or titles discuss 'Phase 0', 'killing leaderboards', or 'being Uber in the industry'? List them one by one."
        result = client.query(ANTI_GRAVITY_ID, q, timeout=120)
        print("--- SOURCE IDENTIFICATION QUERY ---")
        print(result.get('answer', 'No answer'))
        print("\n")

        # Also search for 'Social Media' specific plans
        q2 = "What are the specific requirements for the 'Social Media Marketing Network' mentioned in this notebook? How does it post to different channels?"
        result2 = client.query(ANTI_GRAVITY_ID, q2, timeout=120)
        print("--- SOCIAL MEDIA REQUIREMENTS QUERY ---")
        print(result2.get('answer', 'No answer'))

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()

from youtube_transcript_api import YouTubeTranscriptApi
import re

def extract_video_id(video_url: str) -> str:
    """
    Extracts YouTube video ID from various URL formats.
    """
    patterns = [
        r"youtu\.be/([^?&]+)",
        r"v=([^?&]+)",
        r"embed/([^?&]+)"
    ]
    for pattern in patterns:
        match = re.search(pattern, video_url)
        if match:
            return match.group(1)
    raise ValueError("Invalid YouTube URL format")

def clean_transcript(text: str) -> str:
    """
    Cleans transcript by removing filler noise.
    """
    text = re.sub(r"\[.*?\]", "", text)  # Remove [Music], etc.
    text = re.sub(r"\s+", " ", text)
    return text.strip()

def detect_geography(text: str):
    """
    Identifies North American states and provinces mentioned in the transcript.
    """
    us_states = [
        "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", 
        "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", 
        "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", 
        "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", 
        "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", 
        "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", 
        "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", 
        "Wisconsin", "Wyoming"
    ]
    ca_provinces = [
        "Alberta", "British Columbia", "Manitoba", "New Brunswick", "Newfoundland and Labrador", 
        "Nova Scotia", "Ontario", "Prince Edward Island", "Quebec", "Saskatchewan", 
        "Northwest Territories", "Nunavut", "Yukon"
    ]
    all_regions = us_states + ca_provinces
    return [region for region in all_regions if region.lower() in text.lower()]

def detect_keywords(text: str):
    """
    Identifies high-value operational keywords, including specific coordination types.
    """
    keywords = [
        "permit", "curfew", "escort", "deadhead", "insurance", "police", 
        "port authority", "utility coordination", "utility coord", "industrial escort",
        "superload", "overdimensional", "pilot car", "cbsa", "customs", "cross border",
        "transport canada", "mto", "ministry of transportation", "rcmp", "metric", "imperial",
        "frost restriction", "spring path", "bridge analysis"
    ]
    return [word for word in keywords if word in text.lower()]

def fetch_video_transcript(video_url: str) -> dict:
    try:
        video_id = extract_video_id(video_url)

        transcript_list = YouTubeTranscriptApi.get_transcript(video_id)
        full_transcript = " ".join([item["text"] for item in transcript_list])
        cleaned = clean_transcript(full_transcript)

        return {
            "status": "success",
            "video_id": video_id,
            "transcript_length": len(cleaned),
            "geography_mentions": detect_geography(cleaned),
            "keyword_flags": detect_keywords(cleaned),
            "transcript_preview": cleaned[:1000],  # preview for analytics
            "full_transcript": cleaned
        }

    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }

if __name__ == "__main__":
    import sys
    import json
    if len(sys.argv) > 1:
        url = sys.argv[1]
        print(json.dumps(fetch_video_transcript(url), indent=2))
    else:
        print("Usage: python youtube_transcript_retriever.py <youtube_url>")

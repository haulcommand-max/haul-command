"""
Photo AI for escort vehicle detection (reference implementation)

- Uses YOLO for object detection (vehicles + lightbars as custom classes if trained)
- Uses OCR for "OVERSIZE LOAD" / "WIDE LOAD" / "PILOT" / "ESCORT" text cues

NOTE: This is a template. Production requires:
  - a trained/finetuned detector OR a base model + custom head
  - a compliant image acquisition layer (claimed uploads / allowed sources)

Dependencies:
  pip install ultralytics easyocr pillow opencv-python

REMOVABLE: This entire module can be deleted safely if not desired.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Tuple, Any, Optional
import re
import json
import sys

# Optional dependencies — fail gracefully
try:
    from ultralytics import YOLO
except ImportError:
    YOLO = None  # type: ignore

try:
    import easyocr
except ImportError:
    easyocr = None  # type: ignore


# ═══════════════════════════════════════════════════════════════
# TYPES
# ═══════════════════════════════════════════════════════════════

@dataclass
class PhotoSignalResult:
    object_labels: List[Tuple[str, float]] = field(default_factory=list)
    ocr_hits: Dict[str, float] = field(default_factory=dict)
    score: float = 0.0
    evidence_level: str = "none"  # strong | medium | weak | none
    debug: Dict[str, Any] = field(default_factory=dict)


# ═══════════════════════════════════════════════════════════════
# CONSTANTS
# ═══════════════════════════════════════════════════════════════

OCR_KEYWORDS = [
    "OVERSIZE LOAD",
    "WIDE LOAD",
    "PILOT",
    "ESCORT",
    "DO NOT PASS",
]

RELEVANT_OBJECT_LABELS = {
    "pickup_truck",
    "suv",
    "amber_lightbar",
    "oversize_banner_front",
    "oversize_banner_rear",
    "pilot_car_sign",
    "traffic_cones",
    "escort_decals",
}

THRESHOLDS = {
    "strong": 0.78,
    "medium": 0.62,
    "weak": 0.48,
}


# ═══════════════════════════════════════════════════════════════
# OCR ENGINE
# ═══════════════════════════════════════════════════════════════

def _normalize_text(s: str) -> str:
    s = s.upper()
    s = re.sub(r"\s+", " ", s).strip()
    return s


def run_ocr(image_path: str) -> Dict[str, float]:
    """
    Returns keyword -> confidence hits.
    """
    hits: Dict[str, float] = {}

    if easyocr is None:
        print("[PhotoAI] easyocr not installed — skipping OCR", file=sys.stderr)
        return hits

    reader = easyocr.Reader(["en"], gpu=False)
    results = reader.readtext(image_path)  # [(bbox, text, conf), ...]

    for _, text, conf in results:
        t = _normalize_text(text)
        for kw in OCR_KEYWORDS:
            if kw in t:
                hits[kw] = max(hits.get(kw, 0.0), float(conf))

    return hits


# ═══════════════════════════════════════════════════════════════
# OBJECT DETECTION ENGINE
# ═══════════════════════════════════════════════════════════════

def run_object_detection(
    image_path: str, model_path: str
) -> List[Tuple[str, float]]:
    """
    Returns list of (label, confidence).
    model_path can be a YOLOv8 model; for best results, train on escort-specific classes.
    """
    if YOLO is None:
        print("[PhotoAI] ultralytics not installed — skipping detection", file=sys.stderr)
        return []

    model = YOLO(model_path)
    preds = model.predict(source=image_path, conf=0.25, verbose=False)
    labels: List[Tuple[str, float]] = []

    for p in preds:
        if p.boxes is None:
            continue
        for b in p.boxes:
            cls_id = int(b.cls[0])
            conf = float(b.conf[0])
            label = model.names.get(cls_id, str(cls_id))
            labels.append((label, conf))

    # Keep top labels by confidence
    labels.sort(key=lambda x: x[1], reverse=True)
    return labels[:12]


# ═══════════════════════════════════════════════════════════════
# SCORING
# ═══════════════════════════════════════════════════════════════

def compute_photo_signal(
    object_labels: List[Tuple[str, float]],
    ocr_hits: Dict[str, float],
) -> float:
    """
    Scoring formula:
      0.55 * object_detection_confidence
    + 0.30 * ocr_keyword_confidence
    + 0.15 * multi_signal_bonus (if 2+ distinct OCR keywords)
    """
    # Best relevant object confidence
    obj_conf = 0.0
    for label, conf in object_labels:
        if label in RELEVANT_OBJECT_LABELS:
            obj_conf = max(obj_conf, conf)

    # Best OCR confidence
    ocr_conf = max(ocr_hits.values()) if ocr_hits else 0.0

    # Multi-signal bonus
    multi_bonus = 0.0
    if len(ocr_hits) >= 2:
        multi_bonus = 0.10
    elif len(ocr_hits) >= 1 and obj_conf > 0.4:
        multi_bonus = 0.05

    score = (0.55 * obj_conf) + (0.30 * ocr_conf) + multi_bonus
    return max(0.0, min(1.0, score))


def get_evidence_level(score: float) -> str:
    if score >= THRESHOLDS["strong"]:
        return "strong"
    if score >= THRESHOLDS["medium"]:
        return "medium"
    if score >= THRESHOLDS["weak"]:
        return "weak"
    return "none"


# ═══════════════════════════════════════════════════════════════
# MAIN ENTRY POINT
# ═══════════════════════════════════════════════════════════════

def detect_escort_signals(
    image_path: str,
    yolo_model_path: Optional[str] = None,
) -> PhotoSignalResult:
    """
    Run full detection pipeline on a single image.

    Args:
        image_path: path to the image file
        yolo_model_path: path to YOLOv8 .pt weights (None = skip detection)
    
    Returns:
        PhotoSignalResult with labels, OCR hits, score, and evidence level
    """
    # Run detection
    object_labels = (
        run_object_detection(image_path, yolo_model_path)
        if yolo_model_path
        else []
    )

    # Run OCR
    ocr_hits = run_ocr(image_path)

    # Score
    score = compute_photo_signal(object_labels, ocr_hits)
    evidence_level = get_evidence_level(score)

    return PhotoSignalResult(
        object_labels=object_labels,
        ocr_hits=ocr_hits,
        score=score,
        evidence_level=evidence_level,
        debug={
            "image_path": image_path,
            "yolo_model": yolo_model_path,
            "object_count": len(object_labels),
            "ocr_keyword_count": len(ocr_hits),
        },
    )


def detect_batch(
    image_paths: List[str],
    yolo_model_path: Optional[str] = None,
) -> List[PhotoSignalResult]:
    """Run detection on multiple images."""
    return [detect_escort_signals(p, yolo_model_path) for p in image_paths]


# ═══════════════════════════════════════════════════════════════
# CLI ENTRY POINT (for testing)
# ═══════════════════════════════════════════════════════════════

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python detect_escort_signals.py <image_path> [yolo_model.pt]")
        sys.exit(1)

    img = sys.argv[1]
    model = sys.argv[2] if len(sys.argv) > 2 else None

    result = detect_escort_signals(img, model)
    print(json.dumps({
        "object_labels": result.object_labels,
        "ocr_hits": result.ocr_hits,
        "score": result.score,
        "evidence_level": result.evidence_level,
    }, indent=2))

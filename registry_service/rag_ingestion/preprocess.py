"""Utilities for cleaning and shaping raw FAQ/local data into documents."""

from __future__ import annotations

import re
from typing import Iterable, Dict, List


WHITESPACE_RE = re.compile(r"\s+")


def clean_text(text: str) -> str:
    """Normalize whitespace and trim surrounding spaces."""
    return WHITESPACE_RE.sub(" ", text).strip()


def build_docs(raw_items: Iterable[Dict[str, str]]) -> List[Dict[str, object]]:
    """Construct document payloads with metadata ready for embeddings."""
    docs: List[Dict[str, object]] = []
    for item in raw_items:
        question = clean_text(item.get("question", ""))
        answer = clean_text(item.get("answer", ""))
        text = clean_text(f"{question} {answer}").strip()
        if not text:
            continue

        metadata = {
            "source": item.get("source"),
            "type": item.get("type", "faq"),
            "domain": item.get("domain", "gov_services"),
            "language": item.get("language", "en"),
        }

        docs.append({
            "text": text,
            "metadata": metadata,
        })
    return docs

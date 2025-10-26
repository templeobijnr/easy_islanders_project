"""Near-duplicate detection for RAG documents."""

from __future__ import annotations

from typing import List, Dict

from datasketch import MinHash, MinHashLSH  # type: ignore


def dedupe_docs(docs: List[Dict[str, object]]) -> List[Dict[str, object]]:
    """Remove near-duplicate documents using MinHash LSH."""
    lsh = MinHashLSH(threshold=0.85, num_perm=128)
    unique: List[Dict[str, object]] = []

    for idx, doc in enumerate(docs):
        text = str(doc.get("text", ""))
        if not text:
            continue

        minhash = MinHash(num_perm=128)
        for word in text.split():
            minhash.update(word.encode("utf8"))

        if lsh.query(minhash):
            continue

        lsh.insert(f"doc-{idx}", minhash)
        unique.append(doc)

    return unique

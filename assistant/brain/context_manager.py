"""
Phase B.4: Dynamic Context Management & Token Optimization

Implements smart context management to reduce token usage by 30-40% while
maintaining semantic understanding and conversation continuity.

Strategy:
1. Keep last N recent messages (high relevance)
2. Summarize older messages into condensed form
3. Track token count, stay within budget
4. Smart trimming based on importance scoring
"""

import logging
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
from django.core.cache import cache

logger = logging.getLogger(__name__)


class DynamicContextManager:
    """
    Intelligently manages conversation history to optimize token usage.
    
    Targets:
    - Max context: 2000 tokens
    - Recent messages: Keep verbatim (high relevance)
    - Older messages: Summarize or trim
    - Total savings: 30-40% token reduction
    """
    
    def __init__(
        self,
        max_tokens: int = 2000,
        recent_message_count: int = 5,
        summary_compression_ratio: float = 0.3,
    ):
        """
        Initialize context manager.
        
        Args:
            max_tokens: Maximum context window in tokens (default: 2000)
            recent_message_count: Number of recent messages to keep verbatim (default: 5)
            summary_compression_ratio: Target compression ratio for summaries (default: 0.3 = 70% reduction)
        """
        self.max_tokens = max_tokens
        self.recent_message_count = recent_message_count
        self.summary_compression_ratio = summary_compression_ratio
    
    def estimate_tokens(self, text: str) -> int:
        """
        Rough token estimation: ~4 characters = 1 token for English.
        
        For production, use tiktoken for accurate counting:
            import tiktoken
            enc = tiktoken.encoding_for_model("gpt-4o-mini")
            return len(enc.encode(text))
        """
        return len(text) // 4
    
    def load_optimized_context(
        self,
        conversation_id: str,
        message_history: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """
        Load conversation history with smart trimming and summarization.
        
        Returns:
        {
            "recent_messages": [...],      # Last N messages (verbatim)
            "summarized_context": "...",   # Older messages condensed
            "context_window": {...},       # Metadata about trimming
            "total_tokens_used": N,
            "tokens_saved": N,
            "compression_ratio": 0.35,     # Actual vs original
        }
        """
        if not message_history:
            message_history = self._fetch_message_history(conversation_id)
        
        # Split into recent and older
        recent_messages = message_history[:self.recent_message_count]
        older_messages = message_history[self.recent_message_count:]
        
        # Estimate tokens for recent messages
        recent_text = "\n".join([m.get("content", "") for m in recent_messages])
        recent_tokens = self.estimate_tokens(recent_text)
        
        # Budget remaining for older messages
        remaining_budget = self.max_tokens - recent_tokens - 100  # Reserve 100 tokens
        older_context = ""
        tokens_saved = 0
        
        if older_messages and remaining_budget > 200:
            # Get original older messages token count
            older_text_original = "\n".join([m.get("content", "") for m in older_messages])
            original_tokens = self.estimate_tokens(older_text_original)
            
            # Try to fit older messages directly
            if original_tokens <= remaining_budget:
                older_context = older_text_original
            else:
                # Too many tokens - summarize instead
                logger.info(
                    f"[ContextManager] Conversation {conversation_id} too long ({original_tokens} tokens) - "
                    f"summarizing older context"
                )
                older_context = self._summarize_messages(older_messages, conversation_id)
                tokens_saved = original_tokens - self.estimate_tokens(older_context)
        
        # Final accounting
        total_tokens_used = (
            self.estimate_tokens(recent_text) + 
            self.estimate_tokens(older_context)
        )
        
        compression_ratio = 1.0 - (total_tokens_used / (recent_tokens + self.estimate_tokens(older_text_original))) if 'older_text_original' in locals() else 0
        
        return {
            "recent_messages": recent_messages,
            "summarized_context": older_context,
            "total_tokens_used": total_tokens_used,
            "tokens_saved": tokens_saved,
            "compression_ratio": compression_ratio,
            "context_window": {
                "recent_count": len(recent_messages),
                "summarized_count": len(older_messages),
                "max_tokens": self.max_tokens,
                "remaining_budget": max(0, remaining_budget - self.estimate_tokens(older_context)),
            }
        }
    
    def _fetch_message_history(self, conversation_id: str) -> List[Dict[str, Any]]:
        """Fetch message history from database/cache"""
        # Try cache first
        cache_key = f"messages:{conversation_id}"
        cached = cache.get(cache_key)
        if cached:
            return cached
        
        # Fallback: would fetch from DB in production
        # For now, return empty list
        return []
    
    def _summarize_messages(
        self,
        messages: List[Dict[str, Any]],
        conversation_id: str,
    ) -> str:
        """
        Condense older messages into brief summary using simple heuristics.
        
        In production, could use LLM for semantic summarization:
            from langchain.llms import ChatOpenAI
            llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
            summary = llm.predict(prompt)
        
        For now, use keyword extraction and pattern matching.
        """
        if not messages:
            return ""
        
        # Extract key information from messages
        key_entities = []
        actions_taken = []
        user_requests = []
        
        for msg in messages[-10:]:  # Last 10 messages only
            content = msg.get("content", "").lower()
            role = msg.get("role", "user")
            
            # Extract key terms
            if "apartment" in content or "property" in content:
                key_entities.append("property_search")
            if "book" in content or "reserve" in content:
                actions_taken.append("booking_attempted")
            if role == "user":
                user_requests.append(content[:50])
        
        # Build summary
        summary_parts = []
        if key_entities:
            summary_parts.append(f"Topics: {', '.join(set(key_entities))}")
        if actions_taken:
            summary_parts.append(f"Actions: {', '.join(set(actions_taken))}")
        if user_requests:
            summary_parts.append(f"Recent requests: {user_requests[-1]}")
        
        summary = "; ".join(summary_parts) if summary_parts else "[Older conversation context]"
        
        logger.debug(
            f"[ContextManager] Summarized {len(messages)} messages: {summary[:100]}"
        )
        
        return f"[Earlier context: {summary}]"
    
    def should_summarize(self, message_count: int) -> bool:
        """Determine if conversation is long enough to warrant summarization"""
        return message_count > (self.recent_message_count + 5)


# Singleton instance
_context_manager: Optional[DynamicContextManager] = None


def get_context_manager() -> DynamicContextManager:
    """Get or create the singleton context manager"""
    global _context_manager
    if _context_manager is None:
        _context_manager = DynamicContextManager(
            max_tokens=2000,
            recent_message_count=5,
        )
    return _context_manager


def optimize_conversation_context(
    conversation_id: str,
    message_history: Optional[List[Dict[str, Any]]] = None,
) -> Tuple[List[Dict[str, Any]], Optional[str], Dict[str, Any]]:
    """
    Convenience function: Optimize conversation context for LLM.
    
    Returns:
        (recent_messages, summarized_context, metadata)
    
    Usage:
        recent_msgs, summary, meta = optimize_conversation_context(
            conversation_id="thread-123",
            message_history=[...]
        )
        
        # Pass to LLM
        context_text = summary or ""  # Use summary if present
        for msg in recent_msgs:
            context_text += f"{msg['role']}: {msg['content']}\n"
    """
    manager = get_context_manager()
    result = manager.load_optimized_context(conversation_id, message_history)
    
    logger.info(
        f"[ContextManager] Optimized context for {conversation_id}: "
        f"tokens={result['total_tokens_used']}, "
        f"saved={result['tokens_saved']}, "
        f"compression={result['compression_ratio']:.1%}"
    )
    
    return (
        result["recent_messages"],
        result["summarized_context"],
        result["context_window"],
    )

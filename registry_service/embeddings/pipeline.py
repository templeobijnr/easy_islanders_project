#!/usr/bin/env python3
"""
Embedding Pipeline for Easy Islanders Registry Service
Safe to run during staging soak - doesn't interfere with telemetry
"""

import asyncio
import logging
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from datetime import datetime
import json

logger = logging.getLogger(__name__)

@dataclass
class EmbeddingTask:
    """Represents an embedding task for a service term"""
    term_id: int
    text: str
    market_id: str
    language: str
    priority: int = 1  # 1=high, 2=medium, 3=low
    retry_count: int = 0
    max_retries: int = 3
    created_at: datetime = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.utcnow()

@dataclass
class EmbeddingResult:
    """Result of an embedding operation"""
    task: EmbeddingTask
    embedding: Optional[List[float]] = None
    success: bool = False
    error: Optional[str] = None
    tokens_used: int = 0
    cost: float = 0.0
    processing_time: float = 0.0

class EmbeddingPipeline:
    """Manages embedding generation with retry logic and rate limiting"""
    
    def __init__(self, 
                 max_concurrent: int = 5,
                 rate_limit_per_minute: int = 60,
                 batch_size: int = 100):
        self.max_concurrent = max_concurrent
        self.rate_limit_per_minute = rate_limit_per_minute
        self.batch_size = batch_size
        self.semaphore = asyncio.Semaphore(max_concurrent)
        self.rate_limiter = asyncio.Semaphore(rate_limit_per_minute)
        
    async def process_batch(self, tasks: List[EmbeddingTask]) -> List[EmbeddingResult]:
        """Process a batch of embedding tasks"""
        logger.info(f"Processing batch of {len(tasks)} embedding tasks")
        
        results = []
        for i in range(0, len(tasks), self.batch_size):
            batch = tasks[i:i + self.batch_size]
            batch_results = await self._process_batch_chunk(batch)
            results.extend(batch_results)
            
        logger.info(f"Completed batch processing: {len(results)} results")
        return results
    
    async def _process_batch_chunk(self, tasks: List[EmbeddingTask]) -> List[EmbeddingResult]:
        """Process a chunk of tasks concurrently"""
        async def process_single_task(task: EmbeddingTask) -> EmbeddingResult:
            async with self.semaphore:
                async with self.rate_limiter:
                    return await self._embed_single_term(task)
        
        # Process tasks concurrently
        coroutines = [process_single_task(task) for task in tasks]
        results = await asyncio.gather(*coroutines, return_exceptions=True)
        
        # Handle exceptions
        processed_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                error_result = EmbeddingResult(
                    task=tasks[i],
                    success=False,
                    error=str(result)
                )
                processed_results.append(error_result)
            else:
                processed_results.append(result)
        
        return processed_results
    
    async def _embed_single_term(self, task: EmbeddingTask) -> EmbeddingResult:
        """Embed a single term with retry logic"""
        start_time = datetime.utcnow()
        
        for attempt in range(task.max_retries + 1):
            try:
                # Simulate embedding API call (replace with actual OpenAI call)
                embedding = await self._call_embedding_api(task.text)
                
                processing_time = (datetime.utcnow() - start_time).total_seconds()
                
                return EmbeddingResult(
                    task=task,
                    embedding=embedding,
                    success=True,
                    tokens_used=len(task.text.split()) * 2,  # Rough estimate
                    cost=0.0001,  # Rough estimate
                    processing_time=processing_time
                )
                
            except Exception as e:
                logger.warning(f"Embedding attempt {attempt + 1} failed for term {task.term_id}: {e}")
                
                if attempt < task.max_retries:
                    # Exponential backoff
                    await asyncio.sleep(2 ** attempt)
                else:
                    processing_time = (datetime.utcnow() - start_time).total_seconds()
                    return EmbeddingResult(
                        task=task,
                        success=False,
                        error=str(e),
                        processing_time=processing_time
                    )
    
    async def _call_embedding_api(self, text: str) -> List[float]:
        """Simulate embedding API call (replace with actual implementation)"""
        # This would be replaced with actual OpenAI API call
        await asyncio.sleep(0.1)  # Simulate API latency
        
        # Return mock embedding (1536 dimensions for text-embedding-3-small)
        import random
        random.seed(hash(text))  # Deterministic for same text
        return [random.random() for _ in range(1536)]

class EmbeddingScheduler:
    """Schedules embedding tasks based on priority and system load"""
    
    def __init__(self, pipeline: EmbeddingPipeline):
        self.pipeline = pipeline
        self.task_queue = asyncio.Queue()
        self.running = False
        
    async def start(self):
        """Start the embedding scheduler"""
        self.running = True
        logger.info("Embedding scheduler started")
        
        while self.running:
            try:
                # Process tasks from queue
                tasks = []
                while not self.task_queue.empty() and len(tasks) < self.pipeline.batch_size:
                    task = await self.task_queue.get()
                    tasks.append(task)
                
                if tasks:
                    results = await self.pipeline.process_batch(tasks)
                    await self._handle_results(results)
                
                # Wait before next batch
                await asyncio.sleep(10)
                
            except Exception as e:
                logger.error(f"Error in embedding scheduler: {e}")
                await asyncio.sleep(5)
    
    async def stop(self):
        """Stop the embedding scheduler"""
        self.running = False
        logger.info("Embedding scheduler stopped")
    
    async def add_task(self, task: EmbeddingTask):
        """Add a task to the queue"""
        await self.task_queue.put(task)
        logger.debug(f"Added embedding task for term {task.term_id}")
    
    async def _handle_results(self, results: List[EmbeddingResult]):
        """Handle embedding results"""
        for result in results:
            if result.success:
                logger.info(f"Successfully embedded term {result.task.term_id}")
                # Here you would update the database with the embedding
                # await self._update_term_embedding(result.task.term_id, result.embedding)
            else:
                logger.error(f"Failed to embed term {result.task.term_id}: {result.error}")
                # Here you would handle the failure (retry, alert, etc.)

# Example usage (safe to run during soak)
async def main():
    """Example of using the embedding pipeline"""
    logging.basicConfig(level=logging.INFO)
    
    # Create pipeline
    pipeline = EmbeddingPipeline(
        max_concurrent=3,
        rate_limit_per_minute=30,
        batch_size=10
    )
    
    # Create sample tasks
    tasks = [
        EmbeddingTask(
            term_id=1,
            text="immigration office",
            market_id="CY-NC",
            language="en",
            priority=1
        ),
        EmbeddingTask(
            term_id=2,
            text="pharmacy",
            market_id="CY-NC", 
            language="en",
            priority=2
        ),
        EmbeddingTask(
            term_id=3,
            text="hospital",
            market_id="CY-NC",
            language="en",
            priority=1
        )
    ]
    
    # Process tasks
    results = await pipeline.process_batch(tasks)
    
    # Print results
    for result in results:
        if result.success:
            print(f"✅ Term {result.task.term_id}: {len(result.embedding)} dimensions, {result.tokens_used} tokens, ${result.cost:.4f}")
        else:
            print(f"❌ Term {result.task.term_id}: {result.error}")

if __name__ == "__main__":
    asyncio.run(main())

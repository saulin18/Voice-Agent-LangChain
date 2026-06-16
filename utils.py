"""
Utility functions for the voice agent pipeline.

This module provides helper functions for working with async iterators
and other common operations across the voice agent system.
"""

import asyncio
from typing import Any, AsyncIterator, TypeVar

T = TypeVar("T")


async def merge_async_iters(*aiters: AsyncIterator[T]) -> AsyncIterator[T]:
    """
    Merge multiple async iterators into a single async iterator.

    Items are yielded as soon as any input iterator produces them.
    Producer tasks are cancelled cleanly when the consumer stops early.
    """
    if not aiters:
        return

    queue: asyncio.Queue[Any] = asyncio.Queue()
    sentinel = object()
    tasks: list[asyncio.Task[None]] = []

    async def producer(aiter: AsyncIterator[Any]) -> None:
        try:
            async for item in aiter:
                await queue.put(item)
        except asyncio.CancelledError:
            raise
        finally:
            await queue.put(sentinel)

    for aiter in aiters:
        tasks.append(asyncio.create_task(producer(aiter)))

    finished = 0
    try:
        while finished < len(aiters):
            item = await queue.get()
            if item is sentinel:
                finished += 1
            else:
                yield item
    finally:
        for task in tasks:
            task.cancel()
        await asyncio.gather(*tasks, return_exceptions=True)

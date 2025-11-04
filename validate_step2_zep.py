import time
from assistant.brain.zep_client import ZepClient

# Create a unique thread_id using timestamp
thread_id = f"thread_{int(time.time())}"

# Initialize ZepClient
client = ZepClient(base_url="http://zep:8000")

# Add three memories
# Memory 1: user wants apartment in Girne
client.add_memory(thread_id, "user", "I want an apartment in Girne")

# Memory 2: assistant response
client.add_memory(thread_id, "assistant", "Great, I can help you find apartments in Girne. What are your preferences?")

# Memory 3: user cheaper options
client.add_memory(thread_id, "user", "Do you have cheaper options?")

# Query for "cheaper apartment in Girne"
results = client.query_memory(thread_id, "cheaper apartment in Girne")

# Print results or error if no recall
if results:
    print("✅ Memories added.")
    print("✅ Retrieved 2 memories:")
    for result in results:
        print(result)
else:
    print("Error: No memories recalled")

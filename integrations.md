## Architecture Evolution: From Monolith to Microservices

This plan outlines the transition of your AI assistant from a self-contained Django application to a more robust, scalable, and intelligent microservices-based architecture.

### 1. Current Architecture (As-Is)

Your current system is a well-structured monolith with asynchronous capabilities.

*   **Application Server (Django + Uvicorn):** Handles all incoming HTTP requests, including user authentication and the initial chat message submission (`/api/chat/`).
*   **WebSocket Server (Django Channels):** Manages real-time communication back to the client. It's currently responsible for authenticating the connection and pushing messages from the backend.
*   **Task Queue (Celery + Redis):** Offloads the "thinking" part of the conversation (`process_chat_message` task) to a background worker, preventing the web server from blocking.
*   **Database (PostgreSQL):** The primary data store for users, messages, and other application data.
*   **Internal "Brain" Logic (`assistant/brain`):
    *   **Memory:** A simple, custom-built system (`memory.py`) that likely fetches recent messages from the PostgreSQL database.
    *   **Knowledge:** A local, file-based vector store (`ChromaDB`) for semantic search on listings.
    *   **NLU:** A rule-based, keyword-matching system (`_legacy_heuristic_intent_detection`) for understanding user intent.



### 2. The Staged Integration Plan

We will introduce Zep, Pinecone, and Rasa in three distinct, sequential stages. This minimizes risk, allows for isolated testing, and provides immediate value at each step.

---

### Stage 1: Integrate Zep for Advanced Memory

**Goal:** Replace the current, limited `memory.py` with Zep to provide robust, long-term conversational memory and summarization.

**Why do this first?** It directly addresses the "context window" limitation and provides the most immediate improvement to the user experience by making conversations more coherent and natural.

**Implementation Steps:**

1.  **Add Zep to `docker-compose.yml`:**
    *   Add a new service for the Zep server, connecting it to your existing PostgreSQL database. Zep uses Postgres for its own metadata storage.

    ```yaml
    # In docker-compose.yml
    services:
      # ... other services
      zep:
        image: getzep/zep-postgres:latest
        environment:
          POSTGRES_URL: postgresql://postgres:postgres@db:5432/easy_islanders
        ports:
          - "8000:8000" # Note: This will conflict with Django. Change Django to 8001.
        depends_on:
          - db
    ```
    **Action:** You will need to change the port mapping for your `web` service in `docker-compose.yml` from `"8000:8000"` to `"8001:8000"` to avoid a port conflict with Zep.

2.  **Create a Zep Client:**
    *   Create a new file, `assistant/brain/zep_client.py`, to manage the connection to the Zep server.

3.  **Modify the `process_chat_message` Task (`assistant/tasks.py`):**
    *   **At the beginning of the task:**
        *   Instantiate `ZepMemory` using the `thread_id` as the `session_id`.
        *   Use `memory.load_memory_variables({})` to get the conversation history (which will include summaries).
        *   Pass this history to the `run_supervisor_agent` function.
    *   **At the end of the task:**
        *   After the agent generates a response, use `memory.save_context()` to add the new user message and AI response to Zep's memory. This replaces the `save_assistant_turn` function.

4.  **Remove `memory.py`:**
    *   Once Zep is fully integrated and tested, you can safely remove the old `memory.py` file and all calls to `load_recent_messages`.

**Result of Stage 1:** Your agent will now have long-term memory. It can recall details from earlier in a conversation, leading to much more intelligent and context-aware interactions.

---

### Stage 2: Integrate Pinecone for Scalable Knowledge

**Goal:** Replace the local `ChromaDB` instance with a managed, cloud-native vector database for your real estate listings and other knowledge.

**Why do this second?** This decouples your core application from the data store, making it more scalable and easier to manage. It also unlocks more advanced search capabilities.

**Implementation Steps:**

1.  **Set up a Pinecone Account:**
    *   Create an account on [pinecone.io](https://www.pinecone.io/) and get an API key.
    *   Create a new index in the Pinecone console (e.g., `easy-islanders-kb`).

2.  **Create an Indexing Pipeline:**
    *   Create a new management command or a separate script (`scripts/index_data.py`).
    *   This script will:
        *   Connect to your PostgreSQL database and fetch all listings.
        *   For each listing, generate a text embedding using a sentence transformer model.
        *   "Upsert" (insert or update) the vector and its associated metadata (price, location, bedrooms, etc.) into your Pinecone index. 
    *   You can run this script manually initially, and later trigger it automatically whenever a listing is created or updated.

3.  **Update the Search Tool:**
    *   Modify the `InternalVectorStoreSearchTool` in `assistant/brain/tools.py`.
    *   Replace the `Chroma` client with the `pinecone-client`.
    *   The `_run` method will now query the Pinecone index instead of the local ChromaDB. The logic for building metadata filters will remain very similar.

**Result of Stage 2:** Your agent's knowledge base is now in a highly scalable, managed service. You can add millions of listings without impacting your application's performance, and the search will be faster and more reliable.

---

### Stage 3: Integrate Rasa NLU for Intent Recognition

**Goal:** Replace the brittle, keyword-based intent recognition with a powerful, machine learning-based NLU engine.

**Why do this third?** While important, the current heuristic-based system works for basic cases. It's better to first stabilize the memory and knowledge components before introducing a new ML model to the stack.

**Implementation Steps:**

1.  **Set up and Train a Rasa Model:**
    *   Follow the steps outlined in my previous response to create a `rasa` project, define your intents and entities in `nlu.yml`, and train a model.

2.  **Add Rasa to `docker-compose.yml`:**
    *   Add a `rasa` service to your `docker-compose.yml` file, as shown in the previous response.

3.  **Create a Rasa Client:**
    *   Create a `rasa_client.py` file in `assistant/brain/` to handle communication with the Rasa NLU server.

4.  **Update the Supervisor:**
    *   Modify the `route_request` method in `assistant/brain/supervisor.py`.
    *   Instead of calling the local `intent_parser`, it will now make an API call to the Rasa NLU service using the new client.
    *   The response from Rasa (which includes the intent and extracted entities) will then be used to populate the `routing_decision` in the state.

**Result of Stage 3:** Your agent's ability to understand natural language will be dramatically improved. It will be more robust to variations in user phrasing and can extract information more reliably, leading to fewer misunderstandings and a more fluid conversational experience.

### Final Architecture

After these three stages, your architecture will look like this:

```mermaid
graph TD
    User -->|HTTP/WS| Frontend
    Frontend -->|HTTP POST /api/chat/| DjangoApp
    DjangoApp -->|Enqueue Celery Task| RedisBroker
    RedisBroker -->|Process Task| CeleryWorker

    CeleryWorker -->|1. Get Conversation History| ZepServer
    CeleryWorker -->|2. NLU (Intent/Entities)| RasaNLUServer
    CeleryWorker -->|3. Knowledge Search| PineconeVectorDB
    CeleryWorker -->|4. LLM (Response Generation)| OpenAIAPI

    ZepServer -->|Store/Retrieve Memory| PostgreSQL
    PineconeVectorDB -->|Store/Retrieve Vectors| CloudStorage/ManagedService
    RasaNLUServer -->|Load Models| LocalFilesystem/CloudStorage

    CeleryWorker -->|Push to Channel Layer| RedisChannelLayer
    RedisChannelLayer -->|WS Message| WebSocketServer
    WebSocketServer -->|WS Message| Frontend
```

This is a modern, scalable, and highly capable architecture for a sophisticated AI assistant. Each component has a clear responsibility, and you are leveraging best-in-class services for the most complex parts of the system (memory, knowledge, and NLU). This will allow you to focus on what makes your application unique: the business logic of your real estate agent and other worker agents.

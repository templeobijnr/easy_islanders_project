# Project Roadmap: AI Agent MVP

This document outlines the step-by-step plan to develop the AI agent from its current state into a functional Minimum Viable Product (MVP). The roadmap is divided into three logical phases, each with specific goals and actionable steps.

---

## Phase 1: Solidify the Foundation (Backend & Core Logic)

**Goal**: Ensure the backend is robust, the database is efficient, and the agent's core logic is reliable and stateful.

**Steps**:

1.  **Refactor Agent's State Management**:
    *   **Task**: Enhance the LangGraph agent's memory (`assistant/brain/memory.py`) to accurately track user preferences, previously seen listings, and conversation context. **This must include tracking user actions taken via the UI, such as clicking "Contact Agent" or "Request Photos" on a specific listing.**
    *   **Files**: `assistant/brain/agent.py`, `assistant/brain/memory.py`.
    *   **Outcome**: A more context-aware agent that provides a smoother conversational experience.

2.  **Implement UI-Driven Agent Actions**:
    *   **Task**: Create dedicated backend API endpoints for UI button actions ("Contact Agent," "Request Photos"). These endpoints will trigger the appropriate agent tools and ensure that UI-driven events are logged as part of the conversation history, making the agent aware of them.
    *   **Files**: `assistant/views.py`, `assistant/urls.py`, `frontend/src/components/chat/ListingCard.jsx`, `frontend/src/api.js`.
    *   **Outcome**: Functional UI buttons that integrate seamlessly with the agent's conversational context.

3.  **Enhance Listing Search & Filtering**:
    *   **Task**: Augment the `search_internal_listings` tool with more sophisticated filtering capabilities, such as price range (`min_price`, `max_price`), number of bathrooms, and specific features (e.g., "pool," "sea view," "furnished"). Add database indexes to the `Listing` model for these new filterable fields to ensure fast queries.
    *   **Files**: `assistant/tools/__init__.py`, `assistant/models.py`.
    *   **Outcome**: The agent can perform more precise searches based on detailed user criteria.

4.  **Implement Robust User Profile Context**:
    *   **Task**: Actively use the `UserProfile` model to store long-term user preferences. The agent should be able to recall these preferences across different sessions to provide a personalized experience from the start.
    *   **Files**: `assistant/views.py` (to get or create profile), `assistant/brain/agent.py` (to use profile data).
    *   **Outcome**: A personalized experience for returning users.

5.  **Refine Outbound Messaging & Status Tracking**:
    *   **Task**: Improve the "Request Photos" and "Contact Agent" flows. Add a `status` field to the `Message` model (e.g., `pending`, `sent`, `delivered`, `failed`) to track the state of outbound messages sent via Twilio.
    *   **Files**: `assistant/views.py`, `assistant/models.py`, `assistant/tasks.py` (for async message sending), `assistant/twilio_client.py`.
    *   **Outcome**: A reliable and trackable outbound communication system.

6.  **Implement Inbound WhatsApp Image Processing**:
    *   **Task**: Create a dedicated webhook endpoint to receive incoming images from WhatsApp via Twilio. This endpoint will download the image, associate it with the correct listing (using the `RequestedImage` model as a link), save it to the listing's media directory, and update the listing's state to make the new photos visible to the user.
    *   **Files**: `assistant/views.py` (new webhook), `assistant/models.py` (`Listing`, `RequestedImage`), `assistant/urls.py` (new URL pattern).
    *   **Outcome**: A fully functional, end-to-end flow for requesting and displaying real-time photos from agents.

---

## Phase 2: Enhance the Frontend User Experience

**Goal**: Create a seamless, intuitive, and responsive user interface that is a pleasure to use.

**Steps**:

1.  **Centralize Frontend State Management**:
    *   **Task**: Introduce a lightweight state management library like Zustand to manage global UI state (e.g., conversation history, loading indicators, current user). This will simplify component logic and eliminate complex prop drilling.
    *   **Files**: `frontend/src/App.js`, create a new store at `frontend/src/store/chatStore.js`.
    *   **Outcome**: A more maintainable and performant frontend codebase.

2.  **Improve Real-time Chat Interaction**:
    *   **Task**: Replace the current HTTP polling mechanism for photos with a WebSocket connection (using Django Channels). This will provide instant, real-time updates in the UI when photos arrive. Also, add "Agent is typing..." indicators.
    *   **Files**: `frontend/src/components/chat/EasyIslanders.jsx`. Backend will require a new `assistant/consumers.py` and configuration in `easy_islanders/asgi.py`.
    *   **Outcome**: A modern, real-time chat experience that keeps the user engaged.

3.  **Create a Dedicated Listing Details Modal**:
    *   **Task**: Implement a "View Details" modal that opens when the user clicks the button. This modal will display all listing information, including a larger photo gallery, a map view, and a detailed description, without navigating the user away from the chat.
    *   **Files**: Create `frontend/src/components/chat/ListingDetailsModal.jsx`. Trigger it from `frontend/src/components/chat/ListingCard.jsx` and `EasyIslanders.jsx`.
    *   **Outcome**: An enriched user experience for exploring property details.

---

## Phase 3: Intelligence, Testing & Deployment

**Goal**: Make the agent smarter, ensure the application is bug-free, and prepare for a successful launch.

**Steps**:

1.  **Implement Proactive Agent Suggestions**:
    *   **Task**: Empower the agent to make proactive suggestions. For example, if a user shows interest in a 3-bedroom villa in Kyrenia, the agent could say, "I've noticed you like properties with a private pool. I found another one in a nearby area you might be interested in."
    *   **Files**: `assistant/brain/agent.py`, `assistant/brain/prompts.py`.
    *   **Outcome**: An agent that feels more like a helpful assistant than a simple search tool.

2.  **Improve Natural Language & Intent Understanding**:
    *   **Task**: Enhance the agent's ability to extract structured data from unstructured user messages (e.g., price ranges). **Crucially, unify intent detection so that the agent correctly maps both natural language commands (e.g., "contact the agent for that one") and UI button clicks to the appropriate tools without failure.**
    *   **Files**: `assistant/brain/agent.py`, `assistant/brain/prompts.py`.
    *   **Outcome**: A more reliable and forgiving conversational interface that correctly understands and acts on user intent from any source.

3.  **Comprehensive Testing**:
    *   **Task**: Write unit and integration tests for critical backend and frontend functionality. This includes testing the agent's decision-making logic, API endpoints, and React component interactions.
    *   **Files**: `assistant/tests.py`, `frontend/src/components/chat/tests/`.
    *   **Outcome**: A stable and reliable application ready for users.

4.  **MVP Deployment Preparation**:
    *   **Task**: Thoroughly review and finalize all deployment configurations. This includes updating `requirements.txt`, containerizing the application with a `Dockerfile`, and ensuring all environment variables are documented and securely managed.
    *   **Files**: `deploy.py`, `Procfile`, `railway.json`, `Dockerfile`, `env.example`.
    *   **Outcome**: A smooth and successful MVP launch.

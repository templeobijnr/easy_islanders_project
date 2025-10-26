import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from assistant.models import Message

User = get_user_model()

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def create_users():
    user1 = User.objects.create_user(username='user1', password='password123', email='user1@test.com')
    user2 = User.objects.create_user(username='user2', password='password123', email='user2@test.com')
    user3 = User.objects.create_user(username='user3', password='password123', email='user3@test.com')
    return user1, user2, user3

@pytest.mark.django_db
def test_get_threads_unauthenticated(api_client):
    """
    Ensure unauthenticated users cannot access the threads endpoint.
    """
    url = reverse('get-threads')
    response = api_client.get(url)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

@pytest.mark.django_db
def test_get_threads_authenticated_no_messages(api_client, create_users):
    """
    Ensure an authenticated user with no messages receives an empty list.
    """
    user1, _, _ = create_users
    api_client.force_authenticate(user=user1)
    
    url = reverse('get-threads')
    response = api_client.get(url)
    
    assert response.status_code == status.HTTP_200_OK
    assert response.data == []

@pytest.mark.django_db
def test_get_threads_single_thread_summary(api_client, create_users):
    """
    Test the summary of a single conversation thread.
    """
    user1, user2, _ = create_users
    
    # Create messages for one conversation
    Message.objects.create(conversation_id='thread1', sender=user1, recipient=user2, content='Hello')
    last_msg = Message.objects.create(conversation_id='thread1', sender=user2, recipient=user1, content='Hi back', is_unread=True)

    # Authenticate as user1 and fetch threads
    api_client.force_authenticate(user=user1)
    url = reverse('get-threads')
    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert len(response.data) == 1
    
    thread = response.data[0]
    assert thread['thread_id'] == 'thread1'
    assert thread['unread_count'] == 1
    assert thread['last_message']['content'] == 'Hi back'
    assert len(thread['participants']) == 2
    participant_names = {p['name'] for p in thread['participants']}
    assert participant_names == {'user1', 'user2'}

@pytest.mark.django_db
def test_get_threads_multiple_threads_ordering(api_client, create_users):
    """
    Test that threads are correctly ordered by the most recent message.
    """
    user1, user2, user3 = create_users

    # Thread 1 (should be second)
    Message.objects.create(conversation_id='thread1', sender=user1, recipient=user2, content='Hello T1')
    
    # Thread 2 (should be first)
    Message.objects.create(conversation_id='thread2', sender=user1, recipient=user3, content='Hello T2')
    Message.objects.create(conversation_id='thread2', sender=user3, recipient=user1, content='Reply T2')

    # Authenticate as user1 and fetch
    api_client.force_authenticate(user=user1)
    url = reverse('get-threads')
    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert len(response.data) == 2
    
    # Check order
    assert response.data[0]['thread_id'] == 'thread2'
    assert response.data[1]['thread_id'] == 'thread1'

@pytest.mark.django_db
def test_get_threads_unread_count_is_correct(api_client, create_users):
    """
    Ensure the unread count is specific to the authenticated user.
    """
    user1, user2, _ = create_users
    
    # user1 sends 2 messages to user2
    Message.objects.create(conversation_id='thread1', sender=user1, recipient=user2, content='Msg 1')
    Message.objects.create(conversation_id='thread1', sender=user1, recipient=user2, content='Msg 2')

    # user2 sends 3 messages to user1, 2 of which are unread
    Message.objects.create(conversation_id='thread1', sender=user2, recipient=user1, content='Reply 1', is_unread=False)
    Message.objects.create(conversation_id='thread1', sender=user2, recipient=user1, content='Reply 2', is_unread=True)
    Message.objects.create(conversation_id='thread1', sender=user2, recipient=user1, content='Reply 3', is_unread=True)

    # Authenticate as user1
    api_client.force_authenticate(user=user1)
    url = reverse('get-threads')
    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert len(response.data) == 1
    assert response.data[0]['unread_count'] == 2 # user1 has 2 unread messages

    # Authenticate as user2
    api_client.force_authenticate(user=user2)
    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert len(response.data) == 1
    assert response.data[0]['unread_count'] == 0 # user2 has no unread messages

from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from assistant.models import Message

User = get_user_model()

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def create_users():
    user1 = User.objects.create_user(username='user1', password='password123', email='user1@test.com')
    user2 = User.objects.create_user(username='user2', password='password123', email='user2@test.com')
    user3 = User.objects.create_user(username='user3', password='password123', email='user3@test.com')
    return user1, user2, user3

@pytest.mark.django_db
def test_get_threads_unauthenticated(api_client):
    """
    Ensure unauthenticated users cannot access the threads endpoint.
    """
    url = reverse('get-threads')
    response = api_client.get(url)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

@pytest.mark.django_db
def test_get_threads_authenticated_no_messages(api_client, create_users):
    """
    Ensure an authenticated user with no messages receives an empty list.
    """
    user1, _, _ = create_users
    api_client.force_authenticate(user=user1)
    
    url = reverse('get-threads')
    response = api_client.get(url)
    
    assert response.status_code == status.HTTP_200_OK
    assert response.data == []

@pytest.mark.django_db
def test_get_threads_single_thread_summary(api_client, create_users):
    """
    Test the summary of a single conversation thread.
    """
    user1, user2, _ = create_users
    
    # Create messages for one conversation
    Message.objects.create(conversation_id='thread1', sender=user1, recipient=user2, content='Hello')
    last_msg = Message.objects.create(conversation_id='thread1', sender=user2, recipient=user1, content='Hi back', is_unread=True)

    # Authenticate as user1 and fetch threads
    api_client.force_authenticate(user=user1)
    url = reverse('get-threads')
    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert len(response.data) == 1
    
    thread = response.data[0]
    assert thread['thread_id'] == 'thread1'
    assert thread['unread_count'] == 1
    assert thread['last_message']['content'] == 'Hi back'
    assert len(thread['participants']) == 2
    participant_names = {p['name'] for p in thread['participants']}
    assert participant_names == {'user1', 'user2'}

@pytest.mark.django_db
def test_get_threads_multiple_threads_ordering(api_client, create_users):
    """
    Test that threads are correctly ordered by the most recent message.
    """
    user1, user2, user3 = create_users

    # Thread 1 (should be second)
    Message.objects.create(conversation_id='thread1', sender=user1, recipient=user2, content='Hello T1')
    
    # Thread 2 (should be first)
    Message.objects.create(conversation_id='thread2', sender=user1, recipient=user3, content='Hello T2')
    Message.objects.create(conversation_id='thread2', sender=user3, recipient=user1, content='Reply T2')

    # Authenticate as user1 and fetch
    api_client.force_authenticate(user=user1)
    url = reverse('get-threads')
    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert len(response.data) == 2
    
    # Check order
    assert response.data[0]['thread_id'] == 'thread2'
    assert response.data[1]['thread_id'] == 'thread1'

@pytest.mark.django_db
def test_get_threads_unread_count_is_correct(api_client, create_users):
    """
    Ensure the unread count is specific to the authenticated user.
    """
    user1, user2, _ = create_users
    
    # user1 sends 2 messages to user2
    Message.objects.create(conversation_id='thread1', sender=user1, recipient=user2, content='Msg 1')
    Message.objects.create(conversation_id='thread1', sender=user1, recipient=user2, content='Msg 2')

    # user2 sends 3 messages to user1, 2 of which are unread
    Message.objects.create(conversation_id='thread1', sender=user2, recipient=user1, content='Reply 1', is_unread=False)
    Message.objects.create(conversation_id='thread1', sender=user2, recipient=user1, content='Reply 2', is_unread=True)
    Message.objects.create(conversation_id='thread1', sender=user2, recipient=user1, content='Reply 3', is_unread=True)

    # Authenticate as user1
    api_client.force_authenticate(user=user1)
    url = reverse('get-threads')
    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert len(response.data) == 1
    assert response.data[0]['unread_count'] == 2 # user1 has 2 unread messages

    # Authenticate as user2
    api_client.force_authenticate(user=user2)
    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert len(response.data) == 1
    assert response.data[0]['unread_count'] == 0 # user2 has no unread messages

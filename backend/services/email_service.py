# 7. services/email_service.py
"""Email service functionality."""
import os
import base64
import pickle
from typing import Optional
from email.message import EmailMessage

from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from database import postgre
import config


def get_credentials():
    creds = None
    if os.path.exists("token.pickle"):
        with open("token.pickle", "rb") as token:
            creds = pickle.load(token)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                "secret.json", config.SCOPES
            )
            creds = flow.run_local_server(port=0)
        with open("token.pickle", "wb") as token:
            pickle.dump(creds, token)
    return creds


def send_email(user_id: str, subject: str, body: str) -> str:
    """Sends an email to the user identified by user_id."""
    recipient_email = postgre.get_user_email(user_id)
    if not recipient_email:
        return f"Could not send email: No email address found for user_id {user_id}."

    try:
        creds = get_credentials()
        service = build("gmail", "v1", credentials=creds)
        message = EmailMessage()
        message.set_content(body)
        message["To"] = recipient_email
        message["Subject"] = subject
        message["From"] = config.SENDER_EMAIL
        raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
        sent_message = (
            service.users()
            .messages()
            .send(userId="me", body={"raw": raw_message})
            .execute()
        )
        return f"Confirmation sent to {recipient_email}: {subject}\nMessage Id: {sent_message['id']}"
    except HttpError as error:
        return f"Failed to send email: {error}"

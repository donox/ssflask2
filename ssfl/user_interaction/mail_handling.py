from flask_mail import Mail, Message
from typing import List, NoReturn

class ManageMail(object):
    def __init__(self):
        self.mail = Mail()
        self.recipients = []
        self.sender = None
        self.content = None
        self.title = None

    def add_recipients(self, recipients: List) -> NoReturn:
        for recipient in recipients:
            self.recipients.append(recipient)

    def add_content(self, content: str) -> NoReturn:
        self.content = content

    def add_title(self, title: str) -> NoReturn:
        self.title = title

    def add_sender(self, sender: str) -> NoReturn:
        self.sender = sender

    def send_message(self):
        if not self.recipients or not self.content or not self.title:
            raise ValueError(f'Attempt to send mail, but missing component.')
        try:
            msg = Message(self.title, self.recipients, self.content)
            if self.sender:             # Else use system default
                msg.sender = self.sender
            self.mail.send(msg)
        except Exception as e:
            raise e

